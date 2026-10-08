import { Options, Order, Status } from './types';
export interface Preferences {
  all: boolean;
  statuses: Status[];
  order: Order;
  hideComments: boolean;
  underlineAnswers: boolean;
}
export function readPreferences(value: unknown): Preferences {
  const data = (
    value && typeof value === 'object' ? value : {}
  ) as Partial<Preferences>;
  const statuses = (Array.isArray(data.statuses) ? data.statuses : []).filter(
    (s) => ['未测试', '不确定', '有印象', '没记住', '记住了'].includes(s),
  );
  const all = typeof data.all === 'boolean' ? data.all : true;
  return {
    all: all || !statuses.length,
    statuses: all ? [] : statuses,
    order: ['顺序', '逆序', '随机'].includes(data.order ?? '')
      ? data.order!
      : '随机',
    underlineAnswers: data.underlineAnswers === true,
    hideComments:
      typeof data.hideComments === 'boolean' ? data.hideComments : true,
  };
}
export function optionsFrom(preferences: Preferences): Options {
  return {
    all: preferences.all,
    statuses: new Set(preferences.statuses),
    order: preferences.order,
  };
}
