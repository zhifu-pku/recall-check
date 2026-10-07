import { StateField, EditorState } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { parseCards } from './parser';
export function hiddenCommentRanges(
  source: string,
): { start: number; end: number }[] {
  return parseCards(source).flatMap((card) => card.comments);
}
function decorate(state: EditorState): DecorationSet {
  const ranges = hiddenCommentRanges(state.doc.toString());
  return Decoration.set(
    ranges
      .filter(
        (range) =>
          !state.selection.ranges.some((selection) =>
            selection.empty
              ? selection.head >= range.start && selection.head < range.end
              : selection.from < range.end && selection.to >= range.start,
          ),
      )
      .map((range) =>
        Decoration.replace({ block: true }).range(range.start, range.end),
      ),
    true,
  );
}
/** Direct state-field decorations can safely hide complete lines in both editor modes. */
export const hideStatusComments = StateField.define<DecorationSet>({
  create: decorate,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection
      ? decorate(transaction.state)
      : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});
