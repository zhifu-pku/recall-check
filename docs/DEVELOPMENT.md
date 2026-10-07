# Development

Recall Check uses TypeScript, the official Obsidian plugin API and CodeMirror editor extensions. The runtime bundle has no Node.js or Electron dependencies. Use Node.js 22 or newer for development.

## Commands

```sh
npm ci
npm run dev
```

Watch mode rebuilds `main.js`. Copy `main.js`, `manifest.json` and `styles.css` to a test vault’s `.obsidian/plugins/recall-check/`, then reload the plugin after changes.

```sh
npm run format       # Format source, configuration and documentation
npm run format:check # Check formatting without writing
npm run typecheck   # TypeScript, without emitting files
npm test            # Core, session, decoration and DOM tests
npm run build       # TypeScript + production bundle
npm run check:release # Validate metadata and the three installation artifacts
npm run verify      # All required pre-release checks
```

Prettier is a formatting check, not an ESLint configuration. Production output has no inline source map. Dependencies, local plugin data and generated `main.js` are ignored by Git; installable artifacts are attached to GitHub releases.

## Structure

| File                        | Responsibility                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `src/main.ts`               | Plugin lifecycle, commands, ribbon, settings and editor-extension registration             |
| `src/parser.ts`             | Task boundaries, checkbox state, comment ranges and comparison signatures                  |
| `src/status-manager.ts`     | Validate the latest task sequence and update only the selected checkbox and owned comments |
| `src/review-session.ts`     | Fixed queue, navigation and per-card session ratings                                       |
| `src/cloze.ts`              | Extract cloze answers while respecting code and escaped delimiters                         |
| `src/ui/render-card.ts`     | Use Obsidian rendering for question/answer fragments and replace opaque placeholders       |
| `src/ui/answer-mask.ts`     | Measure rendered text/math and create per-line overlays with stable layout                 |
| `src/ui/*-modal.ts`         | Start, review and summary dialogs                                                          |
| `src/comment-visibility.ts` | Hide attached status lines using CodeMirror decorations, with cursor reveal                |
| `src/settings.ts`           | Validate saved range, order and visibility preferences                                     |
| `src/i18n.ts`               | Chinese/English UI strings; stored status values stay stable                               |
| `styles.css`                | Theme-variable styling for controls, cards and overlays                                    |
| `tests/`                    | Synthetic core and DOM fixtures; no personal note data                                     |
| `examples/`                 | Public demo notes for trying the plugin and making screenshots                             |

## Safety model

A session retains its note snapshot and card ordinals in memory. Every rating calls `Vault.process()`, compares the latest ordered task text and owned state comments with the snapshot, then applies edits from right to left. A successful save becomes the next snapshot. This keeps duplicates distinct as plugin comments shift offsets and preserves unrelated prose edits.

An external task or state change, including a change to another task in the same file, rejects the write. Restart the session to reparse the latest note. Exchanging completely identical tasks with identical states leaves no observable difference; an ID-free format cannot detect that exchange. No persistent IDs are added to Markdown.

Selecting Remembered explicitly includes checked tasks. Ratings 1–3 reopen them. Navigating does not save. Regrading a visited card replaces its session score; statistics count unique rated cards.

The annotation extension only decorates the editor; it never deletes content. Review rendering components and resize observers are unloaded when their card or modal closes.

## Testing

Run `npm run verify` before proposing a change. Automated tests cover parsing, write safety, duplicate cards, filtering, session navigation, saved preferences, translations, editor decorations and mask geometry.

DOM tests use jsdom and simulated math dimensions. They do not replace testing Obsidian’s actual renderer and theme behavior. Follow [TESTING.md](../TESTING.md) for desktop UI checks. The project has no verified mobile test result yet.

## Contributions

Keep changes focused on current-note review and readable local state. Include a minimal synthetic example and describe validation. Store no vault content, API keys or machine-specific configuration in this repository. Bug reports should identify Obsidian version, platform, reproduction steps and the expected result.
