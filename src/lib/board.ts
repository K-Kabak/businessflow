export function calculateBoardPosition(
  before?: number | null,
  after?: number | null,
) {
  if (
    before !== null &&
    before !== undefined &&
    after !== null &&
    after !== undefined
  ) {
    if (after - before <= 1) return null;
    return Math.floor((before + after) / 2);
  }
  if (before !== null && before !== undefined) return before + 1000;
  if (after !== null && after !== undefined) return Math.max(0, after - 1000);
  return 1000;
}
