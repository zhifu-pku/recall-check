export const ratings = ['记住了', '不确定', '有印象', '没记住'] as const;
export type Rating = (typeof ratings)[number];
export type Status = Rating | '未测试';
export type Order = '顺序' | '逆序' | '随机';
export interface Card {
  start: number;
  end: number;
  checkbox: number;
  raw: string;
  body: string;
  checked: boolean;
  status: Status;
  comments: { start: number; end: number }[];
}
export interface Options {
  all: boolean;
  statuses: Set<Status>;
  order: Order;
}
