import { App, Modal, Setting } from 'obsidian';
import { ReviewSession } from '../review-session';
import { ratings } from '../types';
import { ui } from '../i18n';
export class ResultModal extends Modal {
  constructor(
    app: App,
    private session: ReviewSession,
  ) {
    super(app);
  }
  onOpen() {
    this.titleEl.setText(ui.t('result'));
    this.contentEl.createEl('p', {
      text: `${ui.t('reviewed')}: ${this.session.rated} / ${this.session.queue.length} ${ui.t('cards')} · ${ui.t('skipped')}: ${this.session.skipped}`,
    });
    for (const rating of ratings)
      new Setting(this.contentEl)
        .setName(ui.status(rating))
        .setDesc(
          `${this.session.counts[rating]}（${(this.session.rated ? (100 * this.session.counts[rating]) / this.session.rated : 0).toFixed(1)}%）`,
        );
    new Setting(this.contentEl).addButton((b) =>
      b
        .setButtonText(ui.t('done'))
        .setCta()
        .onClick(() => this.close()),
    );
  }
  onClose() {
    this.contentEl.empty();
  }
}
