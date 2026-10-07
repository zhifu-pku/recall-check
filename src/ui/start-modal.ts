import { App, Modal, Setting, Notice } from 'obsidian';
import { Options, Status, Order } from '../types';
import { ui } from '../i18n';
export class StartModal extends Modal {
  constructor(
    app: App,
    private initial: Options,
    private remember: (options: Options) => void,
    private start: (options: Options) => Promise<void>,
  ) {
    super(app);
  }
  onOpen() {
    this.titleEl.setText(`${ui.t('start')} · Recall Check`);
    const options: Options = {
      ...this.initial,
      statuses: new Set(this.initial.statuses),
    };
    this.contentEl.createEl('p', { text: ui.t('intro') });
    const toggles = new Map<
      string,
      { setValue: (value: boolean) => unknown }
    >();
    new Setting(this.contentEl).setName(ui.t('all')).addToggle((t) => {
      toggles.set('all', t);
      t.setValue(options.all).onChange((v) => {
        options.all = v;
        if (v) {
          options.statuses.clear();
          for (const [key, toggle] of toggles)
            if (key !== 'all') toggle.setValue(false);
        }
        this.remember(options);
      });
    });
    for (const status of [
      '未测试',
      '不确定',
      '有印象',
      '没记住',
      '记住了',
    ] as Status[])
      new Setting(this.contentEl).setName(ui.status(status)).addToggle((t) => {
        toggles.set(status, t);
        t.setValue(options.statuses.has(status)).onChange((v) => {
          if (v) {
            options.all = false;
            toggles.get('all')?.setValue(false);
            options.statuses.add(status);
          } else options.statuses.delete(status);
          this.remember(options);
        });
      });
    new Setting(this.contentEl).setName(ui.t('order')).addDropdown((d) =>
      d
        .addOptions(
          Object.fromEntries(
            (['顺序', '逆序', '随机'] as Order[]).map((o) => [o, ui.order(o)]),
          ),
        )
        .setValue(options.order)
        .onChange((v) => {
          options.order = v as Order;
          this.remember(options);
        }),
    );
    new Setting(this.contentEl).addButton((b) => {
      b.buttonEl.setAttribute('autofocus', '');
      queueMicrotask(() => {
        if (this.modalEl.isConnected) b.buttonEl.focus();
      });
      b.setButtonText(ui.t('start'))
        .setCta()
        .onClick(async () => {
          if (!options.all && !options.statuses.size) {
            new Notice(ui.t('select'));
            return;
          }
          b.setDisabled(true);
          try {
            await this.start(options);
            this.close();
          } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error));
            b.setDisabled(false);
          }
        });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
}
