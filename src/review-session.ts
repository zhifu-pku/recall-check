import { parseCards } from './parser';
import { Options, Rating, ratings, Status } from './types';
export function makeQueue(
  source: string,
  options: Options,
  random: () => number = Math.random,
): number[] {
  const queue = parseCards(source).flatMap((card, i) => {
    const selected = options.all
      ? !card.checked
      : card.checked
        ? options.statuses.has('记住了')
        : card.status !== '记住了' && options.statuses.has(card.status);
    return selected ? [i] : [];
  });
  if (options.order === '逆序') queue.reverse();
  if (options.order === '随机')
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  return queue;
}
export class ReviewSession {
  index = 0;
  counts: Record<Rating, number> = Object.fromEntries(
    ratings.map((r) => [r, 0]),
  ) as Record<Rating, number>;
  readonly queue: number[];
  private scores = new Map<number, Rating>();
  constructor(
    public snapshot: string,
    public options: Options,
  ) {
    this.queue = makeQueue(snapshot, options);
  }
  get card() {
    return parseCards(this.snapshot)[this.queue[this.index]];
  }
  get rated() {
    return this.scores.size;
  }
  get skipped() {
    return this.queue.length - this.rated;
  }
  move(delta: number) {
    const next = this.index + delta;
    if (next < 0 || next >= this.queue.length) return false;
    this.index = next;
    return true;
  }
  record(snapshot: string, rating: Rating) {
    const ordinal = this.queue[this.index];
    const previous = this.scores.get(ordinal);
    if (previous) this.counts[previous]--;
    this.scores.set(ordinal, rating);
    this.counts[rating]++;
    this.snapshot = snapshot;
    this.index++;
  }
}

/** Use the same selection rules as review so displayed counts match the queue. */
export function reviewRangeCounts(source: string) {
  const total = parseCards(source).length;
  const base: Options = { all: true, statuses: new Set(), order: '顺序' };
  const all = makeQueue(source, base).length;
  const statuses = Object.fromEntries(
    (['未测试', ...ratings] as Status[]).map((status) => [
      status,
      makeQueue(source, { ...base, all: false, statuses: new Set([status]) })
        .length,
    ]),
  ) as Record<Status, number>;
  return { total, all, statuses };
}
