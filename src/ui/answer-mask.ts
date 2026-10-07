export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
/** Merge glyph rectangles on a line, leaving different lines as separate masks. */
export function maskRects(rectangles: Rect[], padding: number): Rect[] {
  const result: Rect[] = [];
  for (const rect of rectangles
    .filter((r) => r.right > r.left && r.bottom > r.top)
    .sort((a, b) => a.top - b.top || a.left - b.left)) {
    const matching = result.find(
      (r) =>
        Math.min(r.bottom, rect.bottom) - Math.max(r.top, rect.top) >
        Math.min(r.bottom - r.top, rect.bottom - rect.top) * 0.5,
    );
    if (matching) {
      matching.left = Math.min(matching.left, rect.left);
      matching.right = Math.max(matching.right, rect.right);
      matching.top = Math.min(matching.top, rect.top);
      matching.bottom = Math.max(matching.bottom, rect.bottom);
    } else
      result.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      });
  }
  return result.map((r, i) => {
    const upper = result
      .filter((_, j) => j !== i)
      .filter((other) => other.bottom <= r.top)
      .reduce((edge, other) => Math.max(edge, other.bottom), -Infinity);
    const lower = result
      .filter((_, j) => j !== i)
      .filter((other) => other.top >= r.bottom)
      .reduce((edge, other) => Math.min(edge, other.top), Infinity);
    return {
      ...r,
      top: r.top - Math.min(padding, Math.max(0, (r.top - upper) / 2 - 1)),
      bottom:
        r.bottom + Math.min(padding, Math.max(0, (lower - r.bottom) / 2 - 1)),
    };
  });
}
function contentRects(element: HTMLElement): Rect[] {
  const rectangles: Rect[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === 1) {
      const el = node as Element;
      if (
        el.matches(
          '.math, mjx-container, .MathJax, img, svg, canvas, iframe, video',
        )
      ) {
        rectangles.push(el.getBoundingClientRect());
        return;
      }
    }
    if (node.nodeType === 3 && node.textContent?.trim()) {
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(node);
      if (typeof range.getClientRects === 'function')
        rectangles.push(...Array.from(range.getClientRects()));
      return;
    }
    for (const child of Array.from(node.childNodes)) visit(child);
  };
  visit(element);
  return rectangles;
}
/** Invisible answers keep their exact layout; an independent overlay covers each line. */
export function updateMasks(body: HTMLElement): void {
  let layer = body.querySelector<HTMLElement>('.recall-check-mask-layer');
  if (!layer) {
    layer = body.ownerDocument.createElement('span');
    layer.className = 'recall-check-mask-layer';
    layer.setAttribute('aria-hidden', 'true');
    body.append(layer);
  }
  const origin = body.getBoundingClientRect();
  const fontSize =
    Number.parseFloat(
      body.ownerDocument.defaultView?.getComputedStyle(body).fontSize ?? '16',
    ) || 16;
  const rectangles = Array.from(
    body.querySelectorAll<HTMLElement>('.recall-check-answer'),
  ).flatMap((answer) => maskRects(contentRects(answer), fontSize * 0.13));
  const masks = rectangles.map((rect) => {
    const mask = body.ownerDocument.createElement('span');
    mask.className = 'recall-check-mask';
    mask.style.left = `${rect.left - origin.left - body.clientLeft + body.scrollLeft}px`;
    mask.style.top = `${rect.top - origin.top - body.clientTop + body.scrollTop}px`;
    mask.style.width = `${rect.right - rect.left}px`;
    mask.style.height = `${rect.bottom - rect.top}px`;
    return mask;
  });
  layer.replaceChildren(...masks);
}
