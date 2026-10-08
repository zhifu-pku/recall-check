import {
  App,
  Component,
  MarkdownRenderer,
  Modal,
  Notice,
  TFile,
} from 'obsidian';
import { ReviewSession } from '../review-session';
import { Rating, ratings } from '../types';
import { CardConflictError, updateCard } from '../status-manager';
import { renderCard } from './render-card';
import { updateMasks } from './answer-mask';
import { ui } from '../i18n';
export class ReviewModal extends Modal {
  private renderer: Component | null = null;
  private revealed = false;
  private busy = false;
  private closed = false;
  private generation = 0;
  private body!: HTMLElement;
  private revealButton!: HTMLButtonElement;
  private previousButton!: HTMLButtonElement;
  private nextButton!: HTMLButtonElement;
  constructor(
    app: App,
    private file: TFile,
    private session: ReviewSession,
    private underlineAnswers: boolean,
    private openResult: (session: ReviewSession) => void,
  ) {
    super(app);
  }
  onOpen() {
    this.modalEl.addClass('recall-check-modal');
    for (const key of [' ', '0', '1', '2', '3', 'ArrowLeft', 'ArrowRight'])
      this.scope.register([], key, (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('input,textarea,select,[contenteditable="true"]'))
          return true;
        event.preventDefault();
        if (event.repeat || this.busy) return false;
        if (key === ' ') this.toggle();
        else if (key === 'ArrowLeft' || key === 'ArrowRight')
          void this.navigate(key === 'ArrowLeft' ? -1 : 1);
        else void this.rate(ratings[Number(key)]);
        return false;
      });
    void this.showCard().catch(() => {
      new Notice(ui.t('renderError'));
      this.close();
    });
  }
  private async showCard() {
    this.busy = true;
    const generation = ++this.generation;
    this.renderer?.unload();
    const renderer = new Component();
    this.renderer = renderer;
    renderer.load();
    this.revealed = false;
    this.contentEl.empty();
    this.titleEl.setText(
      `${this.session.index + 1} / ${this.session.queue.length} · ${this.file.basename}`,
    );
    this.contentEl.createDiv({
      cls: 'recall-check-meta',
      text: `${ui.order(this.session.options.order)} · ${this.session.options.all ? ui.t('all') : [...this.session.options.statuses].map(ui.status).join(' / ')}`,
    });
    const body = this.contentEl.createDiv({
      cls: 'recall-check-card recall-check-loading markdown-rendered',
    });
    this.body = body;
    body.toggleClass('recall-check-underline-answers', this.underlineAnswers);
    const scores = this.contentEl.createDiv({ cls: 'recall-check-scores' });
    ratings.forEach((rating, i) => {
      const b = scores.createEl('button', {
        text: `${i} · ${ui.status(rating)}`,
      });
      b.onclick = () => void this.rate(rating);
    });
    const controls = this.contentEl.createDiv({ cls: 'recall-check-controls' });
    const navigation = controls.createDiv({ cls: 'recall-check-navigation' });
    this.revealButton = navigation.createEl('button', {
      text: `${ui.t('reveal')} · Space`,
    });
    this.revealButton.onclick = () => this.toggle();
    this.previousButton = navigation.createEl('button', {
      text: `${ui.t('previous')} · ←`,
    });
    this.previousButton.onclick = () => void this.navigate(-1);
    this.nextButton = navigation.createEl('button', {
      text: `${ui.t('next')} · →`,
    });
    this.nextButton.onclick = () => void this.navigate(1);
    const exit = controls.createEl('button', {
      text: ui.t('finish'),
      cls: 'recall-check-exit',
    });
    exit.onclick = () => this.finish();
    this.contentEl.createEl('p', {
      cls: 'recall-check-hint',
      text: ui.t('hint'),
    });
    this.setDisabled(true);
    try {
      await renderCard(
        this.session.card.body,
        body,
        (markdown, target) =>
          MarkdownRenderer.render(
            this.app,
            markdown,
            target,
            this.file.path,
            renderer,
          ),
        ui.t('reveal'),
        () => !this.closed && generation === this.generation,
      );
      if (this.closed || generation !== this.generation) return;
      const refresh = () => updateMasks(body);
      refresh();
      void body.ownerDocument.fonts?.ready.then(() => {
        if (!this.closed && generation === this.generation) refresh();
      });
      const window = body.ownerDocument.defaultView;
      if (window) renderer.registerDomEvent(window, 'resize', refresh);
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(refresh);
        observer.observe(body);
        body
          .querySelectorAll('.recall-check-answer, .math, mjx-container, img')
          .forEach((element) => observer.observe(element));
        renderer.register(() => observer.disconnect());
      }
      body.removeClass('recall-check-loading');
    } finally {
      if (!this.closed && generation === this.generation) {
        this.busy = false;
        this.setDisabled(false);
      }
    }
  }
  private setDisabled(disabled: boolean) {
    this.contentEl
      .querySelectorAll('button')
      .forEach((button) => (button.disabled = disabled));
    if (!disabled) {
      this.previousButton.disabled = this.session.index === 0;
      this.nextButton.disabled =
        this.session.index === this.session.queue.length - 1;
    }
  }
  private async navigate(delta: number) {
    if (this.busy || this.closed || !this.session.move(delta)) return;
    try {
      await this.showCard();
    } catch {
      new Notice(ui.t('renderError'));
      this.close();
    }
  }
  private toggle() {
    if (this.busy || this.closed) return;
    this.revealed = !this.revealed;
    this.body.toggleClass('recall-check-revealed', this.revealed);
    this.body
      .querySelectorAll('.recall-check-answer')
      .forEach((el) => el.setAttribute('aria-hidden', String(!this.revealed)));
    this.revealButton.setText(
      `${ui.t(this.revealed ? 'hide' : 'reveal')} · Space`,
    );
  }
  private finish() {
    this.close();
    this.openResult(this.session);
  }
  private async rate(rating: Rating) {
    if (this.busy || this.closed) return;
    this.busy = true;
    this.setDisabled(true);
    try {
      const updated = await this.app.vault.process(this.file, (latest) =>
        updateCard(
          latest,
          this.session.snapshot,
          this.session.queue[this.session.index],
          rating,
        ),
      );
      this.session.record(updated, rating);
      if (this.closed) return;
      if (this.session.index === this.session.queue.length) this.finish();
      else await this.showCard();
    } catch (error) {
      new Notice(
        error instanceof CardConflictError
          ? ui.t('conflict')
          : error instanceof Error
            ? error.message
            : String(error),
        10000,
      );
    } finally {
      this.busy = false;
      if (!this.closed) this.setDisabled(false);
    }
  }
  onClose() {
    this.closed = true;
    this.generation++;
    this.renderer?.unload();
    this.contentEl.empty();
  }
}
