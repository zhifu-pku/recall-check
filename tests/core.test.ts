import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCards } from '../src/parser';
import { updateCard } from '../src/status-manager';
import { makeQueue, ReviewSession } from '../src/review-session';
const all = { all: true, statuses: new Set<never>(), order: '顺序' as const };
test('single/multiline, multiple cloze, Chinese, completed tasks and no cloze', () => {
  const cards = parseCards(
    '- [ ] 中文==一==\n  **第二行**==二==\n\n- [x] done\n\n- [X] done\n\n- [ ] question',
  );
  assert.equal(cards.length, 4);
  assert.match(cards[0].body, /第二行/);
  assert.deepEqual(makeQueue(cards.map((c) => c.raw).join('\n'), all), [0, 3]);
  assert.equal(cards[0].status, '未测试');
});
test('status replacement deduplicates only own comments', () => {
  const s =
    '<!--SR:keep-->\n<!-- other -->\n<!-- RecallCheck: 没记住 -->\n<!-- RecallCheck: 不确定 -->\n- [ ] ==a==\n';
  const result = updateCard(s, s, 0, '有印象');
  assert.equal((result.match(/RecallCheck/g) || []).length, 1);
  assert.match(
    result,
    /<!--SR:keep-->\n<!-- other -->\n<!-- RecallCheck: 有印象 -->\n- \[ \]/,
  );
});
test('identical cards stay distinct through comment insertions', () => {
  let s = '- [ ] ==相同答案==相同题干。\n\n- [ ] ==相同答案==相同题干。\n';
  s = updateCard(s, s, 1, '有印象');
  assert.equal(parseCards(s)[0].status, '未测试');
  assert.equal(parseCards(s)[1].status, '有印象');
  s = updateCard(s, s, 0, '记住了');
  assert.equal(parseCards(s)[0].checked, true);
  assert.equal(parseCards(s)[1].checked, false);
});
test('unrelated edits survive, changed tasks fail closed', () => {
  const s = '# title\n\n- [ ] ==a==\n\n- [ ] b\n';
  const latest = s.replace('title', 'new title') + '\nnew paragraph';
  assert.match(updateCard(latest, s, 1, '不确定'), /new title/);
  assert.match(updateCard(latest, s, 1, '不确定'), /new paragraph$/);
  for (const changed of [
    s.replace('==a==', '==z=='),
    s + '\n- [ ] new',
    s.replace('- [ ] b', '- [x] b'),
  ])
    assert.throws(() => updateCard(changed, s, 0, '记住了'));
});
test('CRLF, unknown own state, other inline comments remain', () => {
  const s = '<!-- RecallCheck: old -->\r\n- [ ] text <!-- custom -->\r\n';
  const r = updateCard(s, s, 0, '记住了');
  assert.equal(
    r,
    '<!-- RecallCheck: 记住了 -->\r\n- [x] text <!-- custom -->\r\n',
  );
});
test('fenced code and frontmatter do not create cards', () => {
  assert.equal(
    parseCards('---\n- [ ] YAML\n---\n```md\n- [ ] code\n```\n\n- [ ] real')
      .length,
    1,
  );
});
test('all filters, reverse, deterministic shuffle, empty result', () => {
  const s =
    '- [ ] a\n\n<!-- RecallCheck: 不确定 -->\n- [ ] b\n\n<!-- RecallCheck: 有印象 -->\n- [ ] c\n\n<!-- RecallCheck: 没记住 -->\n- [ ] d\n\n- [x] done';
  assert.deepEqual(makeQueue(s, all), [0, 1, 2, 3]);
  assert.deepEqual(makeQueue(s, { ...all, order: '逆序' }), [3, 2, 1, 0]);
  assert.deepEqual(
    makeQueue(s, {
      ...all,
      all: false,
      statuses: new Set(['不确定', '没记住']),
    }),
    [1, 3],
  );
  assert.deepEqual(
    makeQueue(s, { ...all, all: false, statuses: new Set() }),
    [],
  );
  assert.deepEqual(makeQueue('', all), []);
  assert.deepEqual(
    makeQueue(s, { ...all, order: '随机' }, () => 0),
    [1, 2, 3, 0],
  );
});
test('session counts only committed scores', () => {
  const session = new ReviewSession('- [ ] a\n\n- [ ] b', all);
  session.record(
    updateCard(session.snapshot, session.snapshot, 0, '记住了'),
    '记住了',
  );
  assert.equal(session.index, 1);
  assert.equal(session.counts['记住了'], 1);
  assert.equal(session.counts['没记住'], 0);
  assert.equal(session.card.body, 'b');
});
test('every rating writes expected checkbox and final totals', () => {
  const session = new ReviewSession(
    '- [ ] a\n\n- [ ] b\n\n- [ ] c\n\n- [ ] d',
    all,
  );
  for (const rating of ['记住了', '不确定', '有印象', '没记住'] as const) {
    const ordinal = session.queue[session.index];
    session.record(
      updateCard(session.snapshot, session.snapshot, ordinal, rating),
      rating,
    );
  }
  assert.deepEqual(session.counts, {
    记住了: 1,
    不确定: 1,
    有印象: 1,
    没记住: 1,
  });
  assert.equal(session.index, 4);
  assert.deepEqual(
    parseCards(session.snapshot).map((c) => c.checked),
    [true, false, false, false],
  );
});
test('reordered distinct tasks and changed state abort', () => {
  const s = '- [ ] a\n\n- [ ] b';
  assert.throws(() => updateCard('- [ ] b\n\n- [ ] a', s, 0, '记住了'));
  assert.throws(() =>
    updateCard('<!-- RecallCheck: 有印象 -->\n' + s, s, 0, '记住了'),
  );
});
