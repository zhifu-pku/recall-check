import { App, Modal, Notice, Setting } from 'obsidian';
import { ui } from '../i18n';
export class ClearCommentsModal extends Modal {
  constructor(
    app: App,
    private noteName: string,
    private clear: () => Promise<void>,
  ) {
    super(app);
  }
  onOpen() {
    this.titleEl.setText(`${ui.t('clearCommand')} · ${this.noteName}`);
    this.contentEl.createEl('p', { text: ui.t('clearConfirm') });
    this.contentEl.createEl('p', { text: ui.t('keepChecks') });
    const actions = new Setting(this.contentEl);
    actions.addButton((button) =>
      button.setButtonText(ui.t('cancel')).onClick(() => this.close()),
    );
    actions.addButton((button) =>
      button
        .setButtonText(ui.t('clear'))
        .setWarning()
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.clear();
            this.close();
          } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error));
            button.setDisabled(false);
          }
        }),
    );
  }
  onClose() {
    this.contentEl.empty();
  }
}
