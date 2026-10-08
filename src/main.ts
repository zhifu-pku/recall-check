import {
  getLanguage,
  type SettingDefinitionItem,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  TFile,
} from 'obsidian';
import { Extension } from '@codemirror/state';
import { parseCards } from './parser';
import { ReviewSession } from './review-session';
import { StartModal } from './ui/start-modal';
import { ReviewModal } from './ui/review-modal';
import { ResultModal } from './ui/result-modal';
import { Preferences, readPreferences, optionsFrom } from './settings';
import { ui, setUILanguage } from './i18n';
import { hideStatusComments } from './comment-visibility';
export default class RecallCheckPlugin extends Plugin {
  private active: StartModal | ReviewModal | ResultModal | null = null;
  preferences: Preferences = readPreferences(null);
  private extensions: Extension[] = [];
  private saving: Promise<void> = Promise.resolve();
  async onload() {
    setUILanguage(getLanguage());
    this.preferences = readPreferences(await this.loadData());
    if (this.preferences.hideComments) this.extensions.push(hideStatusComments);
    this.registerEditorExtension(this.extensions);
    this.addCommand({
      id: 'review-current-note',
      name: ui.t('reviewCommand'),
      callback: () => void this.begin(),
    });
    this.addRibbonIcon(
      'brain',
      `Recall Check: ${ui.t('reviewCommand')}`,
      () => void this.begin(),
    );
    this.addCommand({
      id: 'toggle-status-comments',
      name: ui.t('toggleComments'),
      callback: () => this.setHideComments(!this.preferences.hideComments),
    });
    this.addSettingTab(new RecallCheckSettings(this));
  }
  persist() {
    const data = {
      ...this.preferences,
      statuses: [...this.preferences.statuses],
    };
    this.saving = this.saving
      .then(() => this.saveData(data))
      .catch((error) => {
        new Notice(String(error));
      });
    return this.saving;
  }
  setHideComments(value: boolean) {
    this.preferences.hideComments = value;
    this.extensions.splice(
      0,
      this.extensions.length,
      ...(value ? [hideStatusComments] : []),
    );
    this.app.workspace.updateOptions();
    return this.persist();
  }
  onunload() {
    this.active?.close();
  }
  private async begin() {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== 'md') {
      new Notice(ui.t('openNote'));
      return;
    }
    try {
      const source = await this.app.vault.read(file);
      if (!parseCards(source).length) {
        new Notice(ui.t('noCards'));
        return;
      }
      this.active?.close();
      this.active = new StartModal(
        this.app,
        optionsFrom(this.preferences),
        (options) => {
          this.preferences = {
            ...this.preferences,
            all: options.all,
            statuses: [...options.statuses],
            order: options.order,
          };
          void this.persist();
        },
        async (options) => {
          const session = new ReviewSession(
            await this.app.vault.read(file),
            options,
          );
          if (!session.queue.length) throw new Error(ui.t('noMatch'));
          this.active = new ReviewModal(
            this.app,
            file,
            session,
            (completed) => {
              this.active = new ResultModal(this.app, completed);
              this.active.open();
            },
          );
          this.active.open();
        },
      );
      this.active.open();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error));
    }
  }
}
class RecallCheckSettings extends PluginSettingTab {
  constructor(private plugin: RecallCheckPlugin) {
    super(plugin.app, plugin);
  }
  // New hosts index these definitions; older hosts still use display().
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: ui.t('hideComments'),
        desc: ui.t('hideDesc'),
        control: { type: 'toggle', key: 'hideComments' },
      },
    ];
  }
  getControlValue(key: string): unknown {
    if (key === 'hideComments') return this.plugin.preferences.hideComments;
    return undefined;
  }
  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === 'hideComments' && typeof value === 'boolean')
      await this.plugin.setHideComments(value);
  }
  display() {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName(ui.t('hideComments'))
      .setDesc(ui.t('hideDesc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.preferences.hideComments)
          .onChange((value) => this.plugin.setHideComments(value)),
      );
  }
}
