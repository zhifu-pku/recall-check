import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { hideStatusComments } from '../src/comment-visibility';
import { renderCard } from '../src/ui/render-card';
import { maskRects, updateMasks } from '../src/ui/answer-mask';
function environment() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body class="recall-check-modal"><div class="recall-check-card"></div></body></html>',
  );
  // Obsidian's DOM helpers are installed on each window's HTMLElement prototype.
  dom.window.HTMLElement.prototype.createSpan = function () {
    const span = this.ownerDocument.createElement('span');
    this.append(span);
    return span;
  };
  const style = dom.window.document.createElement('style');
  style.textContent = readFileSync(
    new URL('../styles.css', import.meta.url),
    'utf8',
  );
  dom.window.document.head.append(style);
  const mathStyle = dom.window.document.createElement('style');
  mathStyle.textContent = '.math { visibility: visible; }';
  dom.window.document.head.append(mathStyle);
  return { dom, body: dom.window.document.querySelector('div')! };
}
test('tall math stays in layout, explicit child visibility cannot expose hidden answers, masks preserve width', async () => {
  const { dom, body } = environment();
  let formula = 0;
  await renderCard(
    'If $x$ ==then $\\int \\frac{x}{y}$== and ==$$x^2$$==',
    body,
    async (markdown, target) => {
      const p = target.ownerDocument.createElement('p');
      if (target.classList.contains('recall-check-answer')) {
        const math = target.ownerDocument.createElement('span');
        math.className = 'math';
        math.style.height = '100px';
        math.textContent = markdown;
        const y = 40 + formula++ * 140;
        math.getBoundingClientRect = () =>
          new dom.window.DOMRect(20, y, 160, 100);
        p.append(math);
      } else p.textContent = markdown;
      target.append(p);
    },
    'Show answers',
  );
  updateMasks(body);
  const answers = body.querySelectorAll('.recall-check-answer');
  assert.equal(answers.length, 2);
  assert.equal(body.querySelectorAll('.recall-check-mask').length, 2);
  assert.equal(body.textContent?.includes('RECALLCHECKANSWER'), false);
  assert.equal(body.querySelector('.recall-check-answer p'), null);
  for (const answer of answers) {
    assert.equal(dom.window.getComputedStyle(answer).visibility, 'hidden');
    assert.notEqual(dom.window.getComputedStyle(answer).display, 'none');
  }
  for (const mask of body.querySelectorAll<HTMLElement>('.recall-check-mask')) {
    assert.equal(mask.style.width, '160px');
    assert.ok(parseFloat(mask.style.height) > 100);
  }
  // Math renderers can force child visibility; ancestor opacity still hides it.
  for (const answer of answers)
    assert.equal(dom.window.getComputedStyle(answer).opacity, '0');
  body.classList.add('recall-check-revealed');
  for (const answer of answers) {
    assert.notEqual(dom.window.getComputedStyle(answer).visibility, 'hidden');
    assert.notEqual(dom.window.getComputedStyle(answer).opacity, '0');
  }
  assert.equal(
    dom.window.getComputedStyle(body.querySelector('.recall-check-mask-layer')!)
      .visibility,
    'hidden',
  );
  for (const mask of body.querySelectorAll<HTMLElement>('.recall-check-mask'))
    assert.equal(mask.style.width, '160px');
  body.classList.remove('recall-check-revealed');
  for (const answer of answers) {
    assert.equal(dom.window.getComputedStyle(answer).visibility, 'hidden');
    assert.notEqual(dom.window.getComputedStyle(answer).display, 'none');
  }
  dom.window.close();
});
test('multiple tokens in one text node replace correctly and text stays literal', async () => {
  const { dom, body } = environment();
  await renderCard(
    '==<script>bad()</script>== and ==two==',
    body,
    async (markdown, target) => {
      target.textContent = markdown;
    },
    'Show',
  );
  assert.equal(body.querySelectorAll('.recall-check-answer').length, 2);
  assert.equal(body.querySelector('script'), null);
  assert.match(body.textContent ?? '', /and/);
  dom.window.close();
});
test('no cloze and stale render cancellation are safe', async () => {
  const { dom, body } = environment();
  await renderCard(
    'Question without a cloze',
    body,
    async (markdown, target) => {
      target.textContent = markdown;
    },
    'Show',
  );
  assert.equal(body.querySelectorAll('.recall-check-cloze').length, 0);
  let renders = 0;
  await renderCard(
    '==a==',
    body,
    async (markdown, target) => {
      renders++;
      target.textContent = markdown;
    },
    'Show',
    () => false,
  );
  assert.equal(renders, 1);
  dom.window.close();
});

test('CodeMirror renders hidden annotation lines without changing editor text', async () => {
  const dom = new JSDOM('<!DOCTYPE html><div id="editor"></div>', {
    pretendToBeVisual: true,
  });
  const descriptors = new Map<string, PropertyDescriptor | undefined>();
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    MutationObserver: dom.window.MutationObserver,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    navigator: dom.window.navigator,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  };
  for (const [key, value] of Object.entries(globals)) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  let view: InstanceType<typeof EditorView> | undefined;
  try {
    const source =
      '<!--SR:keep-->\n<!-- RecallCheck: 有印象 -->\n- [ ] question';
    const state = EditorState.create({
      doc: source,
      selection: { anchor: source.length },
      extensions: [hideStatusComments],
    });
    view = new EditorView({
      state,
      parent: dom.window.document.querySelector('#editor')!,
    });
    assert.equal(view.state.doc.toString(), source);
    assert.equal(view.contentDOM.textContent?.includes('RecallCheck:'), false);
    assert.equal(view.dom.textContent?.includes('SR:keep'), true);
    view.dispatch({ selection: { anchor: source.indexOf('RecallCheck') } });
    assert.equal(view.dom.textContent?.includes('RecallCheck:'), true);
  } finally {
    view?.destroy();
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test('text mask lengths match glyphs, height grows modestly, separate lines keep a gap', () => {
  const rects = maskRects(
    [
      { left: 10, top: 10, right: 100, bottom: 30 },
      { left: 100, top: 10, right: 150, bottom: 30 },
      { left: 10, top: 40, right: 80, bottom: 60 },
    ],
    2.6,
  );
  assert.equal(rects.length, 2);
  assert.equal(rects[0].right - rects[0].left, 140);
  assert.equal(rects[1].right - rects[1].left, 70);
  assert.ok(rects[0].bottom - rects[0].top > 20);
  assert.ok(rects[0].bottom < rects[1].top);
  const close = maskRects(
    [
      { left: 0, top: 0, right: 10, bottom: 20 },
      { left: 0, top: 22, right: 10, bottom: 42 },
    ],
    3,
  );
  assert.ok(close[0].bottom < close[1].top);
});
test('mask geometry refreshes after formula dimensions change without duplicate layers', async () => {
  const { dom, body } = environment();
  await renderCard(
    '==formula==',
    body,
    async (source, target) => {
      target.textContent = source;
    },
    'Show',
  );
  const answer = body.querySelector('.recall-check-answer')!;
  const math = dom.window.document.createElement('span');
  math.className = 'math';
  answer.replaceChildren(math);
  let width = 120;
  math.getBoundingClientRect = () => new dom.window.DOMRect(20, 40, width, 50);
  updateMasks(body);
  assert.equal(
    body.querySelector<HTMLElement>('.recall-check-mask')?.style.width,
    '120px',
  );
  width = 240;
  updateMasks(body);
  assert.equal(
    body.querySelector<HTMLElement>('.recall-check-mask')?.style.width,
    '240px',
  );
  assert.equal(body.querySelectorAll('.recall-check-mask-layer').length, 1);
  dom.window.close();
});
