# UI verification

Use a disposable note, not study notes, for UI grading tests:

```markdown
- [ ] 中文 **粗体** _斜体_ `code` [link](https://example.com) [[Recall Check UI test]] ==答案一==，==答案二==。
      多行 English text.

<!--SR:keep-->
<!-- other comment -->
<!-- RecallCheck: 不确定 -->
- [ ] ==相同答案==相同题干。

- [ ] ==相同答案==相同题干。

- [ ] 无填空问答。

- [x] 不应进入复习。

- [x] 同样跳过。
```

1. Run the current-note command. Check all/status mutual exclusion and multiselect; empty selections give a notice. Test forward, reverse and random order. A session's random order must stay fixed.
2. Verify Markdown, wikilinks, multiple masks, Chinese and multiline text. Space twice reveals then hides all answers. No-cloze cards remain usable.
3. Grade with each button and with keys 0–3, both before and after revealing. Confirm new-card answers are hidden and Space never grades a focused button or scrolls the note.
4. Finish a round; compare counts and percentages with saved ratings. Escape midway retains only previous ratings.
5. Repeat on light and dark themes. Check visual contrast, narrow windows, and linked text inside a hidden answer.
6. Edit a heading outside the cards while reviewing; grading must preserve that edit. Edit a task or insert/remove a task; grading must show a conflict and leave the note unchanged.
7. Grade the second identical question first (reverse order); only its checkbox/comment should change. Verify SR and other comments remain exact.
8. Test no active note, a note with no incomplete tasks, and filters with no matching cards.

Automated coverage: run `npm test`; production and type verification: `npm run build`. No UI result should be treated as verified until exercised in Obsidian.

## 1.1.0 checks

- Select Remembered alone and combined with other statuses; All must exclude checked tasks. Include `[x]` and `[X]` with no state comment. Rate 0, 1, 2, 3; the latter three reopen the checkbox. Space works on every card.
- Click Previous/Next and press left/right arrows; skipping must not touch Markdown. Revisit and rerate a card; counts must replace its prior rating, not count twice. Summary reports rated and ungraded cards, with no division-by-zero on a skipped-only session.
- Start again or reload Obsidian; chosen order/range must persist. Switch Obsidian language and reload; Chinese and English UI should follow it while saved status values remain stable.
- Test `==then $\int \frac{u}{v}$==` and `==$$x^2$$==`; hidden formulas must have no visible descendants and must restore on reveal. Answer dimensions stay unchanged; each line’s mask matches its rendered width, with gaps between normal text lines.
- Toggle annotation visibility through settings and command, in Source and Live Preview. Only RecallCheck comment lines above tasks should disappear. Move the cursor to the hidden line to edit. Check stored Markdown and other comments remain unchanged.
- The left brain icon opens range/order selection immediately for the active note.

Automated tests additionally cover all the above core behavior and DOM masking; actual Obsidian MathJax, theme appearance and keyboard integration require in-app verification.

## 1.1.1 checks

- Grades 0–3 appear in the first row. Show answers / Previous / Next appear left on the second row; Finish stays aligned to its right edge.
- Open the range modal from the command or ribbon. The Start button is focused; Enter immediately starts with the saved choices. Tab navigation and typing in controls still work.
- Reveal/hide long Chinese answers that wrap onto several lines and tall formulas. Text positions, wrapping and card height remain unchanged; gray text masks are slightly taller than the glyphs without joining between lines.
- Resize the modal window and verify overlay geometry follows the newly wrapped text.
