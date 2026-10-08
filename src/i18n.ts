import { Order, Status } from './types';
const en = {
  start: 'Start review',
  intro:
    'Choose the range and order for this note. All includes unchecked tasks only.',
  all: 'All (unchecked)',
  order: 'Review order',
  select: 'Select at least one review range.',
  remembered: 'Remembered',
  uncertain: 'Uncertain',
  familiar: 'Familiar',
  forgotten: 'Forgotten',
  untested: 'Untested',
  forward: 'Forward',
  reverse: 'Reverse',
  random: 'Random',
  reveal: 'Show answers',
  hide: 'Hide answers',
  previous: 'Previous',
  next: 'Next',
  finish: 'Finish review',
  done: 'Done',
  result: 'Review summary',
  hint: 'Space: show / hide answers · 0–3: rate · ← / →: navigate · Esc: exit',
  openNote: 'Please open a Markdown note first.',
  noCards: 'No reviewable cards found in the current note.',
  noMatch: 'No cards match the selected review filters.',
  renderError: 'Could not render this card.',
  conflict:
    'Questions or statuses changed during review. Restart the session to avoid updating the wrong question.',
  reviewed: 'Rated',
  skipped: 'Not rated',
  cards: 'cards',
  reviewCommand: 'Review current note',
  hideComments: 'Hide status comments in the editor',
  hideDesc:
    'Only RecallCheck comments above tasks are hidden. Move the cursor onto the comment to edit it. Markdown files stay unchanged.',
  toggleComments: 'Toggle status comment visibility',
  underlineAnswers: 'Underline revealed answers',
  underlineDesc:
    'Draw a line under each revealed answer to identify the blanks.',
  rangeStats:
    'Counts and percentages are based on all cards in this note, including checked tasks.',
  clearCommand: 'Clear status comments in current note',
  clearDesc: 'Remove RecallCheck status comments from the current note.',
  clearConfirm:
    'Remove the RecallCheck status comments from this note? Other comments and note content are preserved.',
  keepChecks: 'Checked tasks remain checked.',
  cancel: 'Cancel',
  clear: 'Clear comments',
  cleared: 'Status comments cleared.',
  noComments: 'No RecallCheck status comments found in the current note.',
  settings: 'Recall Check',
};
const zh: typeof en = {
  start: '开始复习',
  intro:
    '选择当前笔记的复习范围与顺序。“全部”仅包含未完成题，可单独选择已记住的题。',
  all: '全部（未完成）',
  order: '测试顺序',
  select: '请选择至少一个复习范围。',
  remembered: '已记住',
  uncertain: '不确定',
  familiar: '有印象',
  forgotten: '没记住',
  untested: '未测试',
  forward: '顺序',
  reverse: '逆序',
  random: '随机',
  reveal: '显示答案',
  hide: '隐藏答案',
  previous: '上一题',
  next: '下一题',
  finish: '结束复习',
  done: '完成',
  result: '本轮复习结束',
  hint: 'Space 显示 / 隐藏答案 · 0–3 评分 · ← / → 切题 · Esc 退出',
  openNote: '请先打开 Markdown 笔记。',
  noCards: '当前笔记没有可复习的任务。',
  noMatch: '没有符合所选筛选条件的卡片。',
  renderError: '无法渲染题目。',
  conflict:
    '题目或状态在复习期间发生了变化。为避免改错题，请退出并重新开始复习。',
  reviewed: '已评分',
  skipped: '未评分',
  cards: '张',
  reviewCommand: '复习当前笔记',
  hideComments: '在编辑器中隐藏状态注释',
  hideDesc:
    '只隐藏任务上方的 RecallCheck 注释。光标移到注释所在行时会显示，方便编辑；不会修改 Markdown 文件。',
  toggleComments: '切换状态注释显示 / 隐藏',
  underlineAnswers: '为显示的答案加下划线',
  underlineDesc: '显示答案时在答案下方划线，方便识别挖空位置。',
  rangeStats: '数量及占比以当前笔记的全部卡片为基数，包含已勾选的任务。',
  clearCommand: '清空当前笔记的状态注释',
  clearDesc: '删除当前笔记中的 RecallCheck 状态注释。',
  clearConfirm:
    '要删除这篇笔记中的 RecallCheck 状态注释吗？其他注释和笔记正文会保留。',
  keepChecks: '已勾选的任务保持勾选。',
  cancel: '取消',
  clear: '清空注释',
  cleared: '状态注释已清空。',
  noComments: '当前笔记没有 RecallCheck 状态注释。',
  settings: 'Recall Check',
};
export function createTranslator(language: string) {
  const dict = language.startsWith('zh') ? zh : en;
  const t = (key: keyof typeof en) => dict[key];
  const status = (value: Status) =>
    t(
      (
        {
          记住了: 'remembered',
          未测试: 'untested',
          不确定: 'uncertain',
          有印象: 'familiar',
          没记住: 'forgotten',
        } as const
      )[value],
    );
  const order = (value: Order) =>
    t(({ 顺序: 'forward', 逆序: 'reverse', 随机: 'random' } as const)[value]);
  return { t, status, order };
}
export let ui = createTranslator('en');
export function setUILanguage(language: string) {
  ui = createTranslator(language);
}
