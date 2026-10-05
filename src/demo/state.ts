import { tierOf, type Tier } from '../shared/brand';

export interface Donation {
  id: number;
  name: string;
  amount: number;
  message: string;
  type: string;
  at: Date;
  tier: Tier;
  mine?: boolean;
}

export interface Plugin {
  id: string;
  name: string;
  author: string;
  desc: string;
  icon: string;
}

export const DONATE_TYPES = ['文字', '影音', '塗鴉', '猜謎', '猜獎', '任務', '彈幕遊戲', '群心遊戲'];
export const PAY_METHODS = ['信用卡', 'ATM 轉帳', '超商代碼', 'PayPal'];

// 套件為示意範例，不代表套件中心已上架的實際套件。
export const PLUGINS: Plugin[] = [
  { id: 'lightstick', name: '應援燈牌', author: 'HiveBee 示範', desc: '大額贊助時，畫面角落亮起觀眾的應援字。', icon: '✦' },
  { id: 'beerain', name: '蜜蜂雨', author: '社群開發者', desc: '每一筆贊助都放出一隻小蜜蜂飛過畫面。', icon: '🐝' },
  { id: 'wheel', name: '幸運轉盤', author: '社群開發者', desc: '贊助達門檻就轉一次，結果直接顯示在畫面上。', icon: '◎' },
  { id: 'poll', name: '即時投票', author: 'HiveBee 示範', desc: '觀眾用贊助留言投票，票數即時更新。', icon: '▤' },
];

const SEED: Array<[string, number, string, string, number]> = [
  ['夜貓子', 300, '今天的歌也太好聽了吧！', '文字', 52],
  ['小熊軟糖', 50, '第一次來，好喜歡這個台', '文字', 47],
  ['阿哲', 1000, '新麥克風衝一波！', '文字', 39],
  ['Lulu', 120, '點一首〈晴天〉', '影音', 31],
  ['路過的蜜蜂', 50, '晚安～', '文字', 22],
  ['Kenji', 500, '猜 B！', '猜謎', 14],
];

let seq = 0;
const ago = (min: number) => new Date(Date.now() - min * 60_000);

function make(name: string, amount: number, message: string, type = '文字', at = new Date()): Donation {
  return { id: ++seq, name, amount, message, type, at, tier: tierOf(amount) };
}

export const GOAL_TITLE = '新麥克風基金';
export const GOAL_TARGET = 10000;
const GOAL_START = 6800;

export const state = {
  events: [] as Donation[],
  goal: GOAL_START,
  installed: new Set<string>(),
};

export const bus = new EventTarget();

export function reset() {
  seq = 0;
  state.events = SEED.map(([n, a, m, t, min]) => make(n, a, m, t, ago(min))).reverse();
  state.goal = GOAL_START;
  state.installed.clear();
  bus.dispatchEvent(new Event('reset'));
}

export function donate(name: string, amount: number, message: string, mine = true): Donation {
  const d = make(name, amount, message);
  d.mine = mine;
  state.events.unshift(d);
  state.goal = Math.min(GOAL_TARGET, state.goal + amount);
  bus.dispatchEvent(new CustomEvent<Donation>('donate', { detail: d }));
  return d;
}

export function install(id: string) {
  state.installed.add(id);
  bus.dispatchEvent(new CustomEvent<string>('install', { detail: id }));
}

export const top3 = () => {
  const sum = new Map<string, number>();
  for (const e of state.events) sum.set(e.name, (sum.get(e.name) ?? 0) + e.amount);
  return [...sum].sort((a, b) => b[1] - a[1]).slice(0, 3);
};

export const SAMPLE_FANS: Array<[string, string]> = [
  ['阿哲', '目標衝啊！'],
  ['夜貓子', '這首再唱一次！'],
  ['小熊軟糖', 'Mimi 加油～'],
  ['Kenji', '今天好可愛'],
];

reset();
