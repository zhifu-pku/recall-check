import { prepareCloze } from '../cloze';
export async function renderCard(
  source: string,
  body: HTMLElement,
  render: (markdown: string, target: HTMLElement) => Promise<void>,
  maskLabel: string,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const prepared = prepareCloze(source);
  await render(prepared.markdown, body);
  if (!isCurrent()) return;
  for (const answer of prepared.answers) {
    const walker = body.ownerDocument.createTreeWalker(body, 4);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? '',
        position = text.indexOf(answer.token);
      if (position < 0) continue;
      const cloze = body.createSpan();
      cloze.className = 'recall-check-cloze';
      cloze.setAttribute('aria-label', maskLabel);
      const content = cloze.createSpan();
      content.className = 'recall-check-answer';
      content.setAttribute('aria-hidden', 'true');
      cloze.append(content);
      (node as Text).replaceWith(
        body.ownerDocument.createTextNode(text.slice(0, position)),
        cloze,
        body.ownerDocument.createTextNode(
          text.slice(position + answer.token.length),
        ),
      );
      await render(answer.answer, content);
      if (!isCurrent()) return;
      const paragraph =
        content.children.length === 1 &&
        content.firstElementChild?.tagName === 'P'
          ? content.firstElementChild
          : null;
      if (paragraph) paragraph.replaceWith(...Array.from(paragraph.childNodes));
      break;
    }
  }
}
