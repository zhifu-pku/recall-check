# Changelog

## 1.2.0

- Clear current-note RecallCheck status comments from the command palette or settings, with confirmation; preserve checkboxes, note content and other comments.
- Optionally underline revealed answers, including tall math and separate text lines, without changing layout.
- Show counts and percentages next to every review range, based on all cards in the current note.

## 1.1.3

- Explicitly mark queued preference persistence as asynchronous background work; failures are already handled by the save queue.

## 1.1.2

- Make the annotation preference searchable in Obsidian 1.13+ while keeping the settings UI compatible with 1.8.7+.
- Use Obsidian DOM helpers for cloze answers and masks.
- Remove CSS compatibility warnings without changing answer dimensions or mask geometry.
- Generate signed GitHub build provenance for release assets.

## 1.1.1

- Moved grading to the first row and answer/navigation controls to the second, with Finish aligned right.
- Automatically focus Start review so Enter reuses the previous filters/order.
- Preserve rendered answer dimensions when hidden, using per-line overlays of matching width; modest vertical padding leaves gaps between text lines and tall formulas remain covered.
- Refresh masks after resize, font loading and math size changes.

## 1.1.0

- Added the Remembered filter for checked tasks; All remains unchecked-only. Grades 1–3 reopen remembered tasks.
- Added Previous/Next controls and arrow shortcuts, with unique-card session counts and ungraded totals.
- Persisted last range/order, added Chinese/English UI following the official language API, and a brain ribbon icon.
- Replaced highlight-dependent masking with pre-render cloze extraction; compact fixed masks fully hide tall math.
- Added editor-only status comment hiding, a preference toggle and a visibility command; cursor reveals annotations for editing.
- Minimum Obsidian version is now 1.8.7 for `getLanguage()`.

## 1.0.0

- Current-note checkbox review with multiline Markdown and hidden cloze answers.
- Status filters, fixed shuffled order, keyboard grading and session totals.
- Readable local Markdown status comments and atomic conflict-checked updates.
- Duplicate-card protection, core tests and release automation.
