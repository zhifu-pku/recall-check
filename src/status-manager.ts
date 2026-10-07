import { parseCards, signature } from './parser';
import { Rating } from './types';
export class CardConflictError extends Error {}
export function updateCard(
  latest: string,
  snapshot: string,
  ordinal: number,
  rating: Rating,
): string {
  const before = signature(snapshot),
    now = signature(latest);
  if (before.length !== now.length || before.some((s, i) => s !== now[i]))
    throw new CardConflictError(
      '题目或状态在复习期间发生了变化。为避免改错题，请退出并重新开始复习。',
    );
  const card = parseCards(latest)[ordinal];
  if (!card) throw new CardConflictError('当前题目已改变，请重新开始复习。');
  const newline = latest.includes('\r\n')
    ? '\r\n'
    : latest.includes('\r')
      ? '\r'
      : '\n';
  const edits = [
    {
      start: card.checkbox,
      end: card.checkbox + 1,
      text: rating === '记住了' ? 'x' : ' ',
    },
    ...card.comments.map((c) => ({ ...c, text: '' })),
    {
      start: card.start,
      end: card.start,
      text: `<!-- RecallCheck: ${rating} -->${newline}`,
    },
  ];
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let result = latest;
  for (const edit of edits)
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return result;
}
