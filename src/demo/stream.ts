import { money } from '../shared/brand';
import { createCoins } from './coins';
import { GOAL_TARGET, GOAL_TITLE, bus, state, top3, type Donation } from './state';

export type Layout = 'stack' | 'side' | 'overlay' | 'text';
export type Theme = 'honey' | 'violet' | 'ocean' | 'sakura';
export type Anim = 'pop' | 'slide' | 'zoom';

export interface StreamStyle {
  layout: Layout;
  theme: Theme;
  anim: Anim;
}

const MARK = './brand/mark.svg';

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createStream(host: HTMLElement, cam: string) {
  const root = h('div', 'stream');
  const camImg = h('img', 'stream-cam');
  camImg.src = cam;
  camImg.alt = '';
  root.append(camImg);

  const live = h('div', 'w w-live');
  const viewers = h('span', 'w-live-n');
  live.append(h('b', '', 'LIVE'), viewers);

  const rank = h('div', 'w w-rank');
  const cards = h('div', 'w w-cards');
  const goal = h('div', 'w w-goal');
  const goalFill = h('i', 'w-goal-fill');
  const goalText = h('span', 'w-goal-n');
  const goalBar = h('div', 'w-goal-bar');
  goalBar.append(goalFill);
  const goalHead = h('div', 'w-goal-head');
  goalHead.append(h('span', '', `🎯 ${GOAL_TITLE}`), goalText);
  goal.append(goalHead, goalBar);

  const plugins = h('div', 'plugins');
  const alertLayer = h('div', 'alert-layer');
  const queueBadge = h('div', 'queue-badge');
  root.append(live, rank, cards, goal, plugins, alertLayer, queueBadge);
  host.append(root);
  const coins = createCoins(root);

  let style: StreamStyle = { layout: 'stack', theme: 'honey', anim: 'pop' };
  let shownGoal = state.goal;
  let shown: Donation[] = state.events.slice(0, 3);
  const queue: Donation[] = [];
  let playing = false;
  let alive = true;

  function renderSide() {
    rank.replaceChildren(h('p', 'w-title', '今晚排行'));
    top3().forEach(([name, sum], i) => {
      const row = h('p', 'w-rank-row');
      row.append(h('b', '', ['🥇', '🥈', '🥉'][i]), h('span', '', name), h('em', '', money(sum)));
      rank.append(row);
    });
    cards.replaceChildren(
      ...shown.map((d) => {
        const c = h('div', `w-card t${d.tier.level}`);
        const head = h('p', 'w-card-h');
        head.append(h('b', '', d.name), h('em', '', money(d.amount)));
        c.append(head, h('p', 'w-card-m', d.message || '（沒有留言）'));
        return c;
      }),
    );
    const pct = Math.round((shownGoal / GOAL_TARGET) * 100);
    goalFill.style.width = `${pct}%`;
    goalText.textContent = `${money(shownGoal)} / ${money(GOAL_TARGET)}・${pct}%`;
    goal.classList.toggle('is-full', pct >= 100);
  }

  function renderAlert(d: Donation) {
    const a = h('div', `alert t${d.tier.level} l-${style.layout} th-${style.theme} an-${style.anim}`);
    a.setAttribute('role', 'status');
    if (d.tier.level === 3) a.append(h('div', 'alert-rays'));
    if (style.layout !== 'text') {
      const art = h('div', 'alert-art');
      const img = h('img');
      img.src = MARK;
      img.alt = '';
      art.append(img);
      a.append(art);
    }
    const body = h('div', 'alert-body');
    const title = h('p', 'alert-title');
    title.append(h('b', '', d.name), document.createTextNode(' 贊助了 '), h('em', '', money(d.amount)));
    body.append(title);
    if (d.message) body.append(h('p', 'alert-msg', d.message));
    if (d.tier.level === 3) body.prepend(h('p', 'alert-kicker', '超級支持！'));
    a.append(body);
    return a;
  }

  function onPlay(d: Donation) {
    shownGoal = Math.min(GOAL_TARGET, shownGoal + d.amount);
    shown = [d, ...shown].slice(0, 3);
    renderSide();
    if (state.installed.has('beerain')) fly();
    if (state.installed.has('lightstick') && d.tier.level >= 2) light(d.name);
    if (state.installed.has('wheel') && d.tier.level >= 2) spin();
    if (state.installed.has('poll')) vote();
  }

  async function pump() {
    if (playing) return;
    playing = true;
    while (queue.length && alive) {
      const d = queue.shift()!;
      updateBadge();
      const el = renderAlert(d);
      alertLayer.replaceChildren(el);
      onPlay(d);
      const lv = d.tier.level;
      if (lv === 3) {
        root.classList.remove('flash');
        void root.offsetWidth;
        root.classList.add('flash');
        coins.drop(70);
      } else coins.drop(lv === 2 ? 22 : 8, { x: 0.5, y: 0.3 });
      await wait(d.tier.duration);
      el.classList.add('is-out');
      await wait(420);
      el.remove();
    }
    playing = false;
  }

  function updateBadge() {
    queueBadge.textContent = queue.length ? `排隊中 ${queue.length} 則` : '';
    queueBadge.classList.toggle('is-on', queue.length > 0);
  }

  // 套件效果
  const pluginEls: Record<string, HTMLElement> = {};
  function showPlugin(id: string) {
    if (pluginEls[id]) return;
    let el: HTMLElement;
    if (id === 'lightstick') {
      el = h('div', 'p-light', '♥ 謝謝大家');
    } else if (id === 'wheel') {
      el = h('div', 'p-wheel');
      el.append(h('i', 'p-wheel-disc'), h('span', 'p-wheel-r', '轉盤待命'));
    } else if (id === 'poll') {
      el = h('div', 'p-poll');
      el.append(h('p', 'w-title', '下一首？'));
      for (const [k, label] of [['a', 'A 晴天'], ['b', 'B 稻香']]) {
        const row = h('p', 'p-poll-row');
        row.dataset.k = k;
        row.dataset.v = '3';
        row.append(h('span', '', label), h('i'));
        el.append(row);
      }
      setTimeout(vote, 30);
    } else {
      el = h('div', 'p-bee-lane');
      setTimeout(fly, 200);
    }
    el.classList.add('plugin', 'is-new');
    plugins.append(el);
    pluginEls[id] = el;
  }
  function fly() {
    const lane = pluginEls.beerain;
    if (!lane) return;
    const b = h('span', 'p-bee', '🐝');
    b.style.top = `${15 + Math.random() * 50}%`;
    lane.append(b);
    setTimeout(() => b.remove(), 4200);
  }
  function light(name: string) {
    const el = pluginEls.lightstick;
    if (!el) return;
    el.textContent = `♥ ${name}`;
    el.classList.remove('is-hot');
    void el.offsetWidth;
    el.classList.add('is-hot');
  }
  function spin() {
    const el = pluginEls.wheel;
    if (!el) return;
    const disc = el.querySelector<HTMLElement>('.p-wheel-disc')!;
    const prizes = ['唱一首歌', '學貓叫', '加播 10 分鐘', '抽觀眾互動'];
    const turns = Number(disc.dataset.t ?? 0) + 1440 + Math.floor(Math.random() * 360);
    disc.dataset.t = String(turns);
    disc.style.transform = `rotate(${turns}deg)`;
    setTimeout(() => (el.querySelector('.p-wheel-r')!.textContent = prizes[turns % prizes.length]), 2200);
  }
  function vote() {
    const el = pluginEls.poll;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>('.p-poll-row')];
    const pick = rows[Math.random() < 0.6 ? 0 : 1];
    pick.dataset.v = String(Number(pick.dataset.v) + 1 + Math.floor(Math.random() * 3));
    const total = rows.reduce((s, r) => s + Number(r.dataset.v), 0);
    rows.forEach((r) => (r.querySelector('i')!.style.width = `${(Number(r.dataset.v) / total) * 100}%`));
  }

  let viewerN = 1284;
  const tickViewers = () => {
    viewerN += Math.round((Math.random() - 0.4) * 12);
    viewers.textContent = `${viewerN.toLocaleString('zh-TW')} 人觀看`;
  };
  tickViewers();
  const viewerTimer = setInterval(tickViewers, 2600);

  const onDonate = (e: Event) => api.fire((e as CustomEvent<Donation>).detail);
  const onInstall = (e: Event) => showPlugin((e as CustomEvent<string>).detail);
  const onReset = () => {
    queue.length = 0;
    updateBadge();
    alertLayer.replaceChildren();
    coins.clear();
    shownGoal = state.goal;
    shown = state.events.slice(0, 3);
    plugins.replaceChildren();
    for (const k of Object.keys(pluginEls)) delete pluginEls[k];
    renderSide();
  };
  bus.addEventListener('donate', onDonate);
  bus.addEventListener('install', onInstall);
  bus.addEventListener('reset', onReset);

  state.installed.forEach(showPlugin);
  renderSide();

  const api = {
    el: root,
    fire(d: Donation) {
      queue.push(d);
      updateBadge();
      pump();
    },
    setStyle(s: Partial<StreamStyle>) {
      style = { ...style, ...s };
    },
    showPlugin,
    async build() {
      const parts = [live, cards, rank, goal];
      parts.forEach((p) => p.classList.add('is-hidden'));
      for (const p of parts) {
        await wait(520);
        p.classList.remove('is-hidden');
        p.classList.add('is-pop');
      }
    },
    destroy() {
      alive = false;
      clearInterval(viewerTimer);
      bus.removeEventListener('donate', onDonate);
      bus.removeEventListener('install', onInstall);
      bus.removeEventListener('reset', onReset);
      root.remove();
    },
  };
  return api;
}

export type Stream = ReturnType<typeof createStream>;
