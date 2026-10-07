import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import {
  hideStatusComments,
  hiddenCommentRanges,
} from '../src/comment-visibility';
import { makeQueue, ReviewSession } from '../src/review-session';
import { updateCard } from '../src/status-manager';
import { parseCards } from '../src/parser';
import { prepareCloze } from '../src/cloze';
import { readPreferences, optionsFrom } from '../src/settings';
import { createTranslator } from '../src/i18n';
const all = { all: true, statuses: new Set<never>(), order: '顺序' as const };
test('remembered filter selects both x/X even without comment; All excludes both', () => {
  const source = '- [ ] a\n\n- [x] b\n\n- [X] c';
  assert.deepEqual(makeQueue(source, all), [0]);
  assert.deepEqual(
    makeQueue(source, { ...all, all: false, statuses: new Set(['记住了']) }),
    [1, 2],
  );
  assert.deepEqual(
    makeQueue(source, {
      ...all,
      all: false,
      statuses: new Set(['记住了', '未测试']),
    }),
    [0, 1, 2],
  );
});
test('all four scores supported on completed questions; 1–3 reopen checkbox', () => {
  const source = '<!--SR:keep-->\n<!-- RecallCheck: 记住了 -->\n- [X] ==a==';
  for (const rating of ['记住了', '不确定', '有印象', '没记住'] as const) {
    const updated = updateCard(source, source, 0, rating);
    const card = parseCards(updated)[0];
    assert.equal(card.checked, rating === '记住了');
    assert.equal(card.status, rating);
    assert.match(updated, /<!--SR:keep-->/);
    assert.equal(card.comments.length, 1);
  }
});
test('navigation does not grade; regrading replaces totals instead of counting twice', () => {
  const session = new ReviewSession('- [ ] a\n\n- [ ] b\n\n- [ ] c', all);
  const original = session.snapshot;
  assert.equal(session.move(-1), false);
  assert.equal(session.move(1), true);
  assert.equal(session.rated, 0);
  assert.equal(session.snapshot, original);
  session.record(
    updateCard(session.snapshot, session.snapshot, 1, '不确定'),
    '不确定',
  );
  assert.equal(session.index, 2);
  assert.equal(session.move(1), false);
  session.move(-1);
  session.record(
    updateCard(session.snapshot, session.snapshot, 1, '记住了'),
    '记住了',
  );
  assert.equal(session.rated, 1);
  assert.equal(session.skipped, 2);
  assert.equal(session.counts['不确定'], 0);
  assert.equal(session.counts['记住了'], 1);
});
test('cloze extraction covers formulas, multiple/multiline answers, protects code and escapes', () => {
  const source =
    'If $x$ ==then $\\int_a^b \\frac{u}{v}$== and ==$$x^2$$==\n`==literal==` \\==escaped\\==\n==line\nsecond==';
  const prepared = prepareCloze(source);
  assert.deepEqual(
    prepared.answers.map((a) => a.answer),
    ['then $\\int_a^b \\frac{u}{v}$', '$$x^2$$', 'line\nsecond'],
  );
  assert.match(prepared.markdown, /`==literal==`/);
  assert.match(prepared.markdown, /\\==escaped\\==/);
  assert.equal(
    prepareCloze('```md\n==code==\n```\n==real==').answers.length,
    1,
  );
  assert.equal(prepareCloze('no ==unfinished').markdown, 'no ==unfinished');
  assert.equal(
    prepareCloze('RECALLCHECKANSWER ==a==').answers[0].token.startsWith(
      'RECALLCHECKANSWERX',
    ),
    true,
  );
});
test('preferences persist round trip, remembered selection and visibility; corrupt values safe', () => {
  const saved = {
    all: false,
    statuses: ['记住了', '不确定'],
    order: '逆序',
    hideComments: false,
  };
  assert.deepEqual(readPreferences(JSON.parse(JSON.stringify(saved))), saved);
  assert.deepEqual(
    [...optionsFrom(readPreferences(saved)).statuses],
    saved.statuses,
  );
  assert.equal(
    readPreferences({ order: 'bad', statuses: 'bad' }).order,
    '随机',
  );
  assert.equal(readPreferences(null).all, true);
  assert.equal(readPreferences(null).hideComments, true);
});
test('status decorations preserve Markdown and other comments; cursor reveals owned comment', () => {
  const source =
    '<!--SR:keep-->\n<!-- other -->\n<!-- RecallCheck: 有印象 -->\n- [x] a\n\n- [ ] b';
  const ranges = hiddenCommentRanges(source);
  assert.equal(ranges.length, 1);
  let state = EditorState.create({
    doc: source,
    selection: { anchor: source.length },
    extensions: [hideStatusComments],
  });
  assert.equal(state.field(hideStatusComments).size, 1);
  assert.equal(state.doc.toString(), source);
  state = state.update({ selection: { anchor: ranges[0].start + 4 } }).state;
  assert.equal(state.field(hideStatusComments).size, 0);
  assert.equal(state.doc.toString(), source);
  state = state.update({ selection: { anchor: source.length } }).state;
  assert.equal(state.field(hideStatusComments).size, 1);
  assert.equal(
    hiddenCommentRanges('```\n<!-- RecallCheck: 有印象 -->\n- [ ] a\n```')
      .length,
    0,
  );
});
test('English and Chinese UI packs cover statuses and orders; other languages fall back to English', () => {
  assert.equal(createTranslator('en').status('记住了'), 'Remembered');
  assert.equal(createTranslator('zh').t('previous'), '上一题');
  assert.equal(createTranslator('zh-TW').order('随机'), '随机');
  assert.equal(createTranslator('fr').t('next'), 'Next');
});
