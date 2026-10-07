import { Card, ratings, Status } from './types';
interface Line {
  text: string;
  start: number;
  end: number;
}
const own = /^\s*<!--\s*RecallCheck:\s*(.*?)\s*-->\s*$/;
const comment = /^\s*<!--.*-->\s*$/;
export function parseCards(source: string): Card[] {
  const lines: Line[] = [];
  const re = /[^\r\n]*(?:\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) && match[0]) {
    lines.push({
      text: match[0].replace(/[\r\n]+$/, ''),
      start: match.index,
      end: re.lastIndex,
    });
  }
  const cards: Card[] = [];
  let fence: string | null = null;
  let frontmatter = lines[0]?.text === '---';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (frontmatter) {
      if (i > 0 && /^(---|\.\.\.)$/.test(line.text)) frontmatter = false;
      continue;
    }
    const f = /^\s{0,3}(`{3,}|~{3,})/.exec(line.text);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length)
        fence = null;
      continue;
    }
    if (fence) continue;
    const task = /^([ \t]*- \[)([ xX])(\])(?:[ \t]|$)/.exec(line.text);
    if (!task) continue;
    let j = i + 1;
    while (
      j < lines.length &&
      lines[j].text.trim() !== '' &&
      !/^[ \t]*- \[[ xX]\]/.test(lines[j].text)
    )
      j++;
    // A comment block belonging to a following task is never part of this card.
    let endLine = j;
    if (j < lines.length && /^[ \t]*- \[[ xX]\]/.test(lines[j].text))
      while (endLine > i + 1 && comment.test(lines[endLine - 1].text))
        endLine--;
    const comments: Card['comments'] = [];
    let status: Status = '未测试';
    for (let k = i - 1; k >= 0 && comment.test(lines[k].text); k--) {
      const m = own.exec(lines[k].text);
      if (m) {
        comments.unshift({ start: lines[k].start, end: lines[k].end });
        if (
          status === '未测试' &&
          ratings.includes(m[1] as (typeof ratings)[number])
        )
          status = m[1] as Status;
      }
    }
    const end = lines[endLine - 1].end;
    const raw = source.slice(line.start, end);
    cards.push({
      start: line.start,
      end,
      checkbox: line.start + task[1].length,
      raw,
      body: raw.replace(/^[ \t]*- \[[ xX]\][ \t]?/, ''),
      checked: task[2] !== ' ',
      status,
      comments,
    });
    i = endLine - 1;
  }
  return cards;
}
export function signature(source: string): string[] {
  return parseCards(source).map((c) =>
    JSON.stringify([
      c.raw,
      c.comments.map((r) => source.slice(r.start, r.end)),
    ]),
  );
}
