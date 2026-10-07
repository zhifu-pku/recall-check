# Maintaining screenshots

The English and Chinese READMEs share four PNG screenshots in `assets/screenshots/`. Keep these filenames when updating images so the README links remain valid:

| File                  | Capture                                      |
| --------------------- | -------------------------------------------- |
| `start-review.png`    | Range dialog with All and Forward selected   |
| `review-hidden.png`   | First card with both math answers hidden     |
| `review-revealed.png` | The same card after pressing Space           |
| `review-summary.png`  | Summary after rating all six unchecked cards |

Use the synthetic [demo note](../examples/Recall%20Check%20Demo.md) in a test vault. Select All → Forward, capture the first card before and after revealing, then grade the six cards with 0, 1, 2, 3, 0, 2 to reproduce the summary. Copy the original demo again for the next capture session.

Capture only the full dialog, at a consistent window size, with readable text. English UI is used in the current screenshots; Chinese captures can be added separately. Include no private notes or unrelated desktop content.

The hidden-answer screenshot is the README overview. The revealed-answer screenshot is shown in the Screenshots section; the range and summary images are in expandable sections. Root README image paths start with `assets/`; the Chinese README in `docs/` uses `../assets/`.

This guide is maintenance documentation and is not included in the installable release assets. See [RELEASING.md](RELEASING.md) for those assets.
