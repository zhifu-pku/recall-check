export interface Cloze {
  token: string;
  answer: string;
}
/** Extract only cloze delimiters; Markdown rendering remains Obsidian's responsibility. */
export function prepareCloze(source: string): {
  markdown: string;
  answers: Cloze[];
} {
  let prefix = 'RECALLCHECKANSWER';
  while (source.includes(prefix)) prefix += 'X';
  const answers: Cloze[] = [];
  let markdown = '',
    cursor = 0,
    start: number | null = null;
  for (let i = 0; i < source.length;) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (
      source[i] === '`' ||
      (source[i] === '~' && source.slice(i, i + 3) === '~~~')
    ) {
      const char = source[i];
      let end = i;
      while (source[end] === char) end++;
      const delimiter = source.slice(i, end),
        close = source.indexOf(delimiter, end);
      i = close < 0 ? end : close + delimiter.length;
      continue;
    }
    if (source.slice(i, i + 2) === '==') {
      if (start === null) start = i;
      else {
        const answer = source.slice(start + 2, i);
        if (answer.trim()) {
          const token = `${prefix}${answers.length}TOKEN`;
          markdown += source.slice(cursor, start) + token;
          cursor = i + 2;
          answers.push({ token, answer });
        }
        start = null;
      }
      i += 2;
      continue;
    }
    i++;
  }
  return { markdown: markdown + source.slice(cursor), answers };
}
