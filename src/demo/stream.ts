import { asset, dollars, tierColor } from '../shared/brand';
import { icon } from '../shared/icons';
import { GOAL_TARGET, GOAL_TITLE, bus, extraSeconds, modeFor, state, type AlertMode, type Donation } from './state';

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hms = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');

export interface StreamOptions {
  /** 鏡頭畫面；null 時改用棋盤格（套件預覽沙箱） */
  cam: string | null;
  /** 是否顯示卡片、互動目標、倒數計時 */
  widgets: boolean;
  /** 要回應的匯流排事件 */
  listen: Array<'donate' | 'preview'>;
  /** 是否播放 HiveBee 通知；套件沙箱只顯示套件效果 */
  alerts?: boolean;
}

/** 依回覆模板把每個字包成 span，變數段落用關鍵字顏色。 */
export function renderReply(mode: AlertMode, d: Pick<Donation, 'name' | 'amount' | 'message'>) {
  const box = h('div', `hb-reply fx-${mode.effect}`);
  const values: Record<string, string> = { Name: d.name, Amount: String(d.amount), Text: d.message, Title: d.message };
  let i = 0;
  for (const part of mode.template.split(/(\$\{\w+\})/)) {
    const key = part.match(/^\$\{(\w+)\}$/)?.[1];
    const text = key ? (values[key] ?? '') : part;
    // 變數整段不換行，避免金額或暱稱被拆成兩行。
    const target = key ? box.appendChild(h('span', 'kwg')) : box;
    for (const ch of text) {
      if (/\s/.test(ch)) {
        target.append(document.createTextNode(ch));
        continue;
      }
      const s = h('span', `l${key ? ' kw' : ''}`, ch);
      s.style.setProperty('--i', String(i++));
      target.append(s);
    }
  }
  return box;
}

export function createStream(host: HTMLElement, opts: StreamOptions) {
  const root = h('div', `stream${opts.cam ? '' : ' is-sandbox'}`);
  if (opts.cam) {
    const cam = h('img', 'stream-cam');
    cam.src = opts.cam;
    cam.alt = '';
    root.append(cam);
  }

  // 倒數計時
  const count = h('div', 'w w-count');
  const countPill = h('div', 'w-count-pill');
  const countText = h('span', 'w-count-t');
  countPill.innerHTML = icon('clock');
  countPill.append(countText);
  count.append(countPill);

  // 卡片
  const cards = h('div', 'w w-cards');

  // 互動目標（橫式）
  const goal = h('div', 'w w-goal');
  const goalDays = h('p', 'w-goal-days');
  goalDays.innerHTML = `${icon('clock')}<span>剩餘3天</span>`;
  const bar = h('div', 'w-goal-bar');
  const fill = h('i', 'w-goal-fill');
  const barMid = h('span', 'w-goal-mid');
  bar.append(fill, h('span', 'w-goal-l', '0'), barMid, h('span', 'w-goal-r', String(GOAL_TARGET)));
  goal.append(goalDays, bar, h('p', 'w-goal-title', GOAL_TITLE));

  const plugins = h('div', 'plugins');
  const alertLayer = h('div', 'alert-layer');
  const queueBadge = h('div', 'queue-badge');
  if (opts.widgets) root.append(count, cards, goal);
  root.append(plugins, alertLayer, queueBadge);
  host.append(root);

  let shownGoal = state.goal;
  let shownCount = state.countdown;
  let shown: Donation[] = state.events.slice(0, 3);
  const queue: Donation[] = [];
  let playing = false;
  let alive = true;

  function renderCards() {
    cards.replaceChildren(...shown.map((d) => card(d)));
  }
  function card(d: Donation) {
    const c = h('div', 'w-card');
    const head = h('div', 'w-card-h');
    head.style.background = tierColor(d.amount);
    head.append(h('b', '', d.name), h('b', '', dollars(d.amount)));
    c.append(head, h('p', 'w-card-m', d.message));
    return c;
  }
  function renderGoal() {
    const pct = Math.round((shownGoal / GOAL_TARGET) * 10000) / 100;
    fill.style.width = `${Math.min(100, pct)}%`;
    barMid.textContent = `${shownGoal}/${GOAL_TARGET} (${pct}%)`;
  }
  function renderCount() {
    countText.textContent = hms(shownCount);
  }

  function addTag(seconds: number) {
    const tag = h('span', 'w-count-tag', `+${seconds}s`);
    count.append(tag);
    setTimeout(() => tag.remove(), 1500);
  }

  function onPlay(d: Donation) {
    if (!opts.widgets) return;
    shownGoal = Math.min(GOAL_TARGET, shownGoal + d.amount);
    shown = [d, ...shown].slice(0, 3);
    renderCards();
    renderGoal();
    const add = extraSeconds(d.amount);
    if (add) {
      shownCount += add;
      addTag(add);
    }
  }

  async function pump() {
    if (playing) return;
    playing = true;
    while (queue.length && alive) {
      const d = queue.shift()!;
      updateBadge();
      const mode = modeFor(d.amount);
      runPlugins(d);
      onPlay(d);
      if (!mode || opts.alerts === false) continue;
      const a = h('div', 'hb-alert');
      a.setAttribute('role', 'status');
      const img = h('img', 'hb-alert-img');
      img.src = asset(mode.image);
      img.alt = '';
      const text = h('div', 'hb-alert-text');
      text.style.setProperty('--fs', String(mode.size));
      text.append(renderReply(mode, d));
      if (d.message) text.append(h('p', 'hb-msg', d.message));
      a.append(img, text);
      alertLayer.replaceChildren(a);
      await wait(mode.seconds * 1000);
      a.classList.add('is-out');
      await wait(400);
      a.remove();
    }
    playing = false;
  }

  function updateBadge() {
    queueBadge.textContent = queue.length ? `排隊中 ${queue.length} 則` : '';
    queueBadge.classList.toggle('is-on', queue.length > 0);
  }

  // 套件效果（示意）
  const pluginEls: Record<string, HTMLElement> = {};
  function showPlugin(id: string) {
    if (pluginEls[id]) return;
    let el: HTMLElement;
    if (id === 'lightstick') el = h('div', 'p-light', '♥ 謝謝大家');
    else if (id === 'wheel') {
      el = h('div', 'p-wheel');
      el.append(h('i', 'p-wheel-disc'), h('span', 'p-wheel-r', '轉盤待命'));
    } else if (id === 'poll') {
      el = h('div', 'p-poll');
      el.append(h('p', 'p-poll-t', '下一首？'));
      for (const [k, label] of [['a', 'A 晴天'], ['b', 'B 稻香']]) {
        const row = h('p', 'p-poll-row');
        row.dataset.k = k;
        row.dataset.v = '3';
        row.append(h('span', '', label), h('i'));
        el.append(row);
      }
    } else el = h('div', 'p-bee-lane');
    el.classList.add('plugin', 'is-new');
    plugins.append(el);
    pluginEls[id] = el;
    if (id === 'poll') vote();
    if (id === 'beerain') setTimeout(fly, 200);
  }
  function runPlugins(d: Donation) {
    if (pluginEls.beerain) fly();
    if (pluginEls.lightstick && d.amount >= 300) {
      const el = pluginEls.lightstick;
      el.textContent = `♥ ${d.name}`;
      el.classList.remove('is-hot');
      void el.offsetWidth;
      el.classList.add('is-hot');
    }
    if (pluginEls.wheel && d.amount >= 300) spin();
    if (pluginEls.poll) vote();
  }
  function fly() {
    const b = h('span', 'p-bee', '🐝');
    b.style.top = `${15 + Math.random() * 50}%`;
    pluginEls.beerain.append(b);
    setTimeout(() => b.remove(), 4200);
  }
  function spin() {
    const el = pluginEls.wheel;
    const disc = el.querySelector<HTMLElement>('.p-wheel-disc')!;
    const prizes = ['唱一首歌', '學貓叫', '加播 10 分鐘', '抽觀眾互動'];
    const turns = Number(disc.dataset.t ?? 0) + 1440 + Math.floor(Math.random() * 360);
    disc.dataset.t = String(turns);
    disc.style.transform = `rotate(${turns}deg)`;
    setTimeout(() => (el.querySelector('.p-wheel-r')!.textContent = prizes[turns % prizes.length]), 2200);
  }
  function vote() {
    const rows = [...pluginEls.poll.querySelectorAll<HTMLElement>('.p-poll-row')];
    const pick = rows[Math.random() < 0.6 ? 0 : 1];
    pick.dataset.v = String(Number(pick.dataset.v) + 1 + Math.floor(Math.random() * 3));
    const total = rows.reduce((s, r) => s + Number(r.dataset.v), 0);
    rows.forEach((r) => (r.querySelector('i')!.style.width = `${(Number(r.dataset.v) / total) * 100}%`));
  }

  const tick = setInterval(() => {
    if (shownCount > 0) shownCount--;
    renderCount();
  }, 1000);

  const onEvent = (e: Event) => api.fire((e as CustomEvent<Donation>).detail);
  const onInstall = (e: Event) => showPlugin((e as CustomEvent<string>).detail);
  const onReset = () => {
    queue.length = 0;
    updateBadge();
    alertLayer.replaceChildren();
    shownGoal = state.goal;
    shownCount = state.countdown;
    shown = state.events.slice(0, 3);
    plugins.replaceChildren();
    for (const k of Object.keys(pluginEls)) delete pluginEls[k];
    renderCards();
    renderGoal();
  };
  for (const ev of opts.listen) bus.addEventListener(ev, onEvent);
  bus.addEventListener('install', onInstall);
  bus.addEventListener('reset', onReset);

  state.installed.forEach(showPlugin);
  renderCards();
  renderGoal();
  renderCount();

  const api = {
    el: root,
    fire(d: Donation) {
      queue.push(d);
      updateBadge();
      pump();
    },
    showPlugin,
    async build() {
      const parts = [count, cards, goal];
      parts.forEach((p) => p.classList.add('is-hidden'));
      for (const p of parts) {
        await wait(600);
        p.classList.remove('is-hidden');
        p.classList.add('is-pop');
      }
    },
    destroy() {
      alive = false;
      clearInterval(tick);
      for (const ev of opts.listen) bus.removeEventListener(ev, onEvent);
      bus.removeEventListener('install', onInstall);
      bus.removeEventListener('reset', onReset);
      root.remove();
    },
  };
  return api;
}

export type Stream = ReturnType<typeof createStream>;
