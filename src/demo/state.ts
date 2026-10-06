import { DEFAULT_TEMPLATE } from '../shared/brand';

export interface Donation {
  id: number;
  userId: string;
  name: string;
  amount: number;
  message: string;
  type: string;
  at: Date;
  read: boolean;
  mine?: boolean;
}

export interface AlertMode {
  id: number;
  title: string;
  min: number;
  max: number | null;
  enabled: boolean;
  image: string;
  template: string;
  effect: string;
  size: number;
  seconds: number;
}

export interface Plugin {
  id: string;
  name: string;
  author: string;
  summary: string;
  category: string;
  icon: string;
  installs: number;
  version: string;
}

// 套件為示意範例，不代表套件中心已上架的實際套件。
export const PLUGINS: Plugin[] = [
  { id: 'lightstick', name: '應援燈牌', author: 'HiveBee 示範', summary: '大額贊助時，畫面角落亮起觀眾的應援字。', category: '特效', icon: '✦', installs: 128, version: '1.2.0' },
  { id: 'beerain', name: '蜜蜂雨', author: '社群開發者', summary: '每一筆贊助都放出一隻小蜜蜂飛過畫面。', category: '特效', icon: '🐝', installs: 342, version: '2.0.1' },
  { id: 'wheel', name: '幸運轉盤', author: '社群開發者', summary: '贊助達門檻就轉一次，結果直接顯示在畫面上。', category: '遊戲', icon: '◎', installs: 87, version: '1.0.4' },
  { id: 'poll', name: '即時投票', author: 'HiveBee 示範', summary: '觀眾用贊助留言投票，票數即時更新。', category: '互動', icon: '▤', installs: 56, version: '0.9.0' },
];

const SEED: Array<[string, number, string, string, number]> = [
  ['夜貓子', 300, '今天的歌也太好聽了吧！', '文字贊助', 52],
  ['小熊軟糖', 75, '第一次來，好喜歡這個台', '文字贊助', 47],
  ['阿哲', 1500, '新麥克風衝一波！', '文字贊助', 39],
  ['Lulu', 150, '點一首〈晴天〉', '影音贊助', 31],
  ['路過的蜜蜂', 15, '晚安～', '文字贊助', 22],
  ['Kenji', 750, '猜 B！', '猜謎贊助', 14],
];

export const SAMPLE_FANS: Array<[string, string]> = [
  ['阿哲', '目標衝啊！'],
  ['夜貓子', '這首再唱一次！'],
  ['小熊軟糖', 'Mimi 加油～'],
  ['Kenji', '今天好可愛'],
];

let seq = 0;
const uid = () => `HB${(48213 + seq * 37).toString().padStart(6, '0')}`;

function make(name: string, amount: number, message: string, type: string, at: Date): Donation {
  seq++;
  return { id: seq, userId: uid(), name, amount, message, type, at, read: true };
}

export const GOAL_TITLE = '新麥克風基金';
export const GOAL_TARGET = 10000;
const GOAL_START = 6800;
const COUNTDOWN_START = 2 * 3600 + 15 * 60;

const defaultModes = (): AlertMode[] => [
  { id: 1, title: '一般感謝', min: 15, max: 299, enabled: true, image: 'hb/3d/bee-chill.webp', template: DEFAULT_TEMPLATE, effect: 'pulse', size: 35, seconds: 5 },
  { id: 2, title: '閃亮登場', min: 300, max: 1499, enabled: true, image: 'hb/3d/bee-laptop.webp', template: DEFAULT_TEMPLATE, effect: 'wiggle', size: 40, seconds: 5 },
  { id: 3, title: '超級金主', min: 1500, max: null, enabled: true, image: 'hb/3d/pot-crown.webp', template: '哇！${Name}　豪氣贊助　${Amount}！', effect: 'rubberBand', size: 40, seconds: 6 },
];

export const state = {
  events: [] as Donation[],
  goal: GOAL_START,
  countdown: COUNTDOWN_START,
  installed: new Set<string>(),
  modes: defaultModes(),
};

export const bus = new EventTarget();

export function reset() {
  seq = 0;
  state.events = SEED.map(([n, a, m, t, min]) => make(n, a, m, t, new Date(Date.now() - min * 60_000))).reverse();
  state.goal = GOAL_START;
  state.countdown = COUNTDOWN_START;
  state.installed.clear();
  state.modes = defaultModes();
  bus.dispatchEvent(new Event('reset'));
}

export function modeFor(amount: number) {
  return state.modes.find((m) => m.enabled && amount >= m.min && (m.max === null || amount <= m.max));
}

// 倒數計時的示意加時規則：每 5 元加 1 秒。
export const extraSeconds = (amount: number) => Math.floor(amount / 5);

export function donate(name: string, amount: number, message: string, mine = true, type = '文字贊助'): Donation {
  const d = make(name, amount, message, type, new Date());
  d.read = false;
  d.mine = mine;
  state.events.unshift(d);
  state.goal = Math.min(GOAL_TARGET, state.goal + amount);
  state.countdown += extraSeconds(amount);
  bus.dispatchEvent(new CustomEvent<Donation>('donate', { detail: d }));
  return d;
}

/** 只播放通知、不新增紀錄：後台「畫面預覽」與「通知重播」用 */
export function preview(name: string, amount: number, message: string) {
  const d = make(name, amount, message, '文字贊助', new Date());
  bus.dispatchEvent(new CustomEvent<Donation>('preview', { detail: d }));
}

export function install(id: string) {
  state.installed.add(id);
  bus.dispatchEvent(new CustomEvent<string>('install', { detail: id }));
}

export function rank() {
  const sum = new Map<string, number>();
  for (const e of state.events) sum.set(e.name, (sum.get(e.name) ?? 0) + e.amount);
  return [...sum].sort((a, b) => b[1] - a[1]);
}

reset();
