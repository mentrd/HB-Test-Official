import { TIERS, money, tierOf } from '../shared/brand';
import {
  DONATE_TYPES,
  GOAL_TARGET,
  PAY_METHODS,
  PLUGINS,
  SAMPLE_FANS,
  bus,
  donate,
  install,
  state,
  type Donation,
} from './state';
import { createStream, h, type Anim, type Layout, type Stream, type Theme } from './stream';

export interface View {
  el: HTMLElement;
  auto?: (p: URLSearchParams) => void;
  destroy?: () => void;
}

export interface Ctx {
  cam: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const time = (d: Date) => d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

function streamBox(ctx: Ctx, cls = '') {
  const box = h('div', `stream-box ${cls}`);
  const stream = createStream(box, ctx.cam);
  return { box, stream };
}

/* ---------------------------------------------------------------- 觀眾贊助頁 */
export function donateView(): View {
  const el = h('form', 'v-donate');
  el.noValidate = true;

  const head = h('div', 'dn-head');
  const avatar = h('div', 'dn-avatar', 'M');
  const who = h('div', 'dn-who');
  who.append(h('p', 'dn-name', 'Mimi 蜜蜜'), h('p', 'dn-live', '● 正在直播・唱歌聊天台'));
  head.append(avatar, who);

  const types = h('div', 'dn-types');
  types.setAttribute('role', 'group');
  types.setAttribute('aria-label', '贊助類型');
  DONATE_TYPES.forEach((t, i) => {
    const b = h('button', `chip${i === 0 ? ' is-on' : ''}`, t);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(i === 0));
    if (i > 0) {
      b.disabled = true;
      b.title = '示範只開放文字贊助';
    }
    types.append(b);
  });

  const nameLab = h('label', 'field');
  const nameIn = h('input');
  nameIn.maxLength = 25;
  nameIn.placeholder = '示範觀眾';
  nameIn.autocomplete = 'off';
  nameLab.append(h('span', '', '暱稱（選填）'), nameIn);

  const amounts = h('div', 'dn-amounts');
  amounts.setAttribute('role', 'radiogroup');
  amounts.setAttribute('aria-label', '示意金額');
  let amount = TIERS[1].amount;
  const amountBtns = TIERS.map((t) => {
    const b = h('button', `dn-amount t${t.level}`);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.append(h('b', '', money(t.amount)), h('small', '', `${t.name}通知`));
    b.addEventListener('click', () => pick(t.amount));
    amounts.append(b);
    return b;
  });
  const pick = (a: number) => {
    amount = a;
    amountBtns.forEach((b, i) => {
      const on = TIERS[i].amount === a;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    });
  };
  pick(amount);

  const msgLab = h('label', 'field');
  const msg = h('textarea');
  msg.maxLength = 150;
  msg.rows = 3;
  msg.placeholder = '想對實況主說的話';
  const count = h('small', 'field-count', '0 / 150');
  msg.addEventListener('input', () => (count.textContent = `${msg.value.length} / 150`));
  msgLab.append(h('span', '', '留言'), msg, count);

  const pay = h('div', 'dn-pay');
  pay.append(h('span', 'dn-pay-l', '付款方式'));
  PAY_METHODS.forEach((m) => pay.append(h('span', 'chip is-ghost', m)));

  const submit = h('button', 'btn btn--honey dn-submit', '模擬贊助');
  submit.type = 'submit';
  const toast = h('p', 'dn-toast');
  toast.setAttribute('aria-live', 'polite');
  const note = h('p', 'dn-note', '互動示範，不會付款，也不會送到真實直播。');

  el.append(head, types, nameLab, amounts, msgLab, pay, submit, toast, note);
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = donate(nameIn.value.trim() || '示範觀眾', amount, msg.value.trim());
    toast.textContent = `已送出 ${money(d.amount)} 的示範贊助，看看直播畫面！`;
    toast.classList.remove('is-on');
    void toast.offsetWidth;
    toast.classList.add('is-on');
  });

  return {
    el,
    // 故事模式：自動填寫並按下送出，示範觀眾端操作。
    async auto() {
      const [name, text] = SAMPLE_FANS[0];
      nameIn.value = '';
      msg.value = '';
      await wait(500);
      for (const ch of name) {
        nameIn.value += ch;
        await wait(110);
      }
      pick(TIERS[1].amount);
      await wait(350);
      for (const ch of text) {
        msg.value += ch;
        msg.dispatchEvent(new Event('input'));
        await wait(90);
      }
      await wait(400);
      submit.classList.add('is-press');
      await wait(250);
      submit.classList.remove('is-press');
      el.requestSubmit();
    },
  };
}

/* ---------------------------------------------------------------- 直播畫面 */
export function streamView(ctx: Ctx): View {
  const el = h('div', 'v-stream');
  const { box, stream } = streamBox(ctx);
  el.append(box);
  return {
    el,
    async auto(p) {
      if (p.has('build')) await stream.build();
      const tier = Number(p.get('tier'));
      if (tier) {
        await wait(p.has('build') ? 300 : 700);
        const [name, text] = SAMPLE_FANS[tier - 1] ?? SAMPLE_FANS[0];
        donate(name, TIERS[tier - 1].amount, text, false);
      }
    },
    destroy: stream.destroy,
  };
}

/* ---------------------------------------------------------------- 樣式設定 */
const LAYOUTS: Array<[Layout, string]> = [
  ['stack', '上圖下文'],
  ['side', '左圖右文'],
  ['overlay', '文字疊圖'],
  ['text', '只有文字'],
];
const THEMES: Array<[Theme, string]> = [
  ['honey', '蜂蜜金'],
  ['violet', '霓虹紫'],
  ['ocean', '海洋藍'],
  ['sakura', '櫻花粉'],
];
const ANIMS: Array<[Anim, string]> = [
  ['pop', '彈跳'],
  ['slide', '滑入'],
  ['zoom', '放大'],
];

export function stylesView(ctx: Ctx): View {
  const el = h('div', 'v-styles');
  const panel = h('div', 'panel st-panel');
  const { box, stream } = streamBox(ctx);
  const groups: Record<string, HTMLButtonElement[]> = {};

  function group<T extends string>(key: 'layout' | 'theme' | 'anim', title: string, items: Array<[T, string]>) {
    const g = h('fieldset', 'st-group');
    g.append(h('legend', '', title));
    groups[key] = items.map(([v, label], i) => {
      const b = h('button', `chip${i === 0 ? ' is-on' : ''}`, label);
      b.type = 'button';
      b.dataset.v = v;
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => set(key, v));
      g.append(b);
      return b;
    });
    panel.append(g);
  }
  function set(key: 'layout' | 'theme' | 'anim', v: string) {
    stream.setStyle({ [key]: v });
    groups[key].forEach((b) => {
      b.classList.toggle('is-on', b.dataset.v === v);
      b.setAttribute('aria-pressed', String(b.dataset.v === v));
    });
  }

  panel.append(h('p', 'panel-t', '通知樣式'));
  group('layout', '版面', LAYOUTS);
  group('theme', '配色', THEMES);
  group('anim', '進場動畫', ANIMS);
  const tiers = h('div', 'st-tiers');
  tiers.append(h('p', 'st-label', '依金額分級'));
  TIERS.forEach((t) => {
    const row = h('p', `st-tier t${t.level}`);
    row.append(h('b', '', `${t.name}通知`), h('span', '', `${money(t.amount)} 起`));
    tiers.append(row);
  });
  const test = h('button', 'btn btn--honey', '試播通知');
  test.type = 'button';
  let n = 0;
  test.addEventListener('click', () => {
    const t = TIERS[n++ % TIERS.length];
    const [name, text] = SAMPLE_FANS[n % SAMPLE_FANS.length];
    donate(name, t.amount, text, false);
  });
  panel.append(tiers, test, h('p', 'dn-note', '正式產品還能換字型、音效、圖片與顯示秒數。'));
  el.append(panel, box);

  let stop = false;
  return {
    el,
    async auto() {
      const seq: Array<[Layout, Theme, Anim]> = [
        ['stack', 'honey', 'pop'],
        ['side', 'violet', 'slide'],
        ['overlay', 'ocean', 'zoom'],
        ['text', 'sakura', 'pop'],
      ];
      for (let i = 0; !stop; i = (i + 1) % seq.length) {
        const [l, th, an] = seq[i];
        set('layout', l);
        set('theme', th);
        set('anim', an);
        const [name, text] = SAMPLE_FANS[i];
        donate(name, TIERS[i % 2].amount, text, false);
        await wait(3900);
      }
    },
    destroy() {
      stop = true;
      stream.destroy();
    },
  };
}

/* ---------------------------------------------------------------- 套件中心 */
export function pluginsView(ctx: Ctx): View {
  const el = h('div', 'v-plugins');
  const store = h('div', 'panel pl-store');
  store.append(h('p', 'panel-t', '套件商店'), h('p', 'panel-s', '挑一個新玩法，一鍵裝到直播畫面。'));
  const grid = h('div', 'pl-grid');
  const btns: Record<string, HTMLButtonElement> = {};
  PLUGINS.forEach((p) => {
    const card = h('article', 'pl-card');
    const icon = h('div', 'pl-icon', p.icon);
    const body = h('div', 'pl-body');
    body.append(h('p', 'pl-name', p.name), h('p', 'pl-author', p.author), h('p', 'pl-desc', p.desc));
    const b = h('button', 'btn btn--line pl-btn', '安裝');
    b.type = 'button';
    b.addEventListener('click', () => doInstall(p.id));
    btns[p.id] = b;
    card.append(icon, body, b);
    grid.append(card);
  });
  const dev = h('div', 'pl-dev');
  dev.append(
    h('p', 'pl-dev-t', '開發者：用 AI 做一個自己的套件'),
    h('p', 'pl-dev-s', '把 AI 助手連上 HiveBee 開發者服務，描述想要的效果，就能產生套件並上傳。'),
  );
  store.append(grid, dev);
  const { box, stream } = streamBox(ctx, 'pl-preview');
  el.append(store, box);

  function sync() {
    for (const p of PLUGINS) {
      const on = state.installed.has(p.id);
      btns[p.id].textContent = on ? '已安裝' : '安裝';
      btns[p.id].disabled = on;
    }
  }
  async function doInstall(id: string) {
    const b = btns[id];
    if (state.installed.has(id) || b.classList.contains('is-busy')) return;
    b.classList.add('is-busy');
    b.textContent = '安裝中…';
    await wait(900);
    b.classList.remove('is-busy');
    install(id);
    sync();
    await wait(500);
    const [name, text] = SAMPLE_FANS[1];
    donate(name, TIERS[1].amount, text, false);
  }
  sync();
  const onReset = () => sync();
  bus.addEventListener('reset', onReset);

  return {
    el,
    async auto() {
      await wait(900);
      await doInstall('lightstick');
      await wait(2600);
      await doInstall('beerain');
    },
    destroy() {
      bus.removeEventListener('reset', onReset);
      stream.destroy();
    },
  };
}

/* ---------------------------------------------------------------- 創作者後台 */
export function dashboardView(): View {
  const el = h('div', 'v-dash');
  const side = h('aside', 'ds-side');
  const logo = h('img', 'ds-logo');
  logo.src = '../brand/logo-dark.svg';
  logo.alt = 'HiveBee';
  side.append(logo);
  ['總覽', '贊助紀錄', '互動工具', '套件中心', '對帳中心'].forEach((t, i) =>
    side.append(h('p', `ds-nav${i === 1 ? ' is-on' : ''}`, t)),
  );

  const main = h('div', 'ds-main');
  const stats = h('div', 'ds-stats');
  const chart = h('div', 'panel ds-chart');
  const table = h('div', 'panel ds-table');
  main.append(h('p', 'ds-h', '贊助紀錄・今晚'), stats, chart, table);
  el.append(side, main);

  function stat(label: string, value: string, sub = '') {
    const s = h('div', 'panel ds-stat');
    s.append(h('p', 'ds-stat-l', label), h('p', 'ds-stat-v', value), h('p', 'ds-stat-s', sub));
    return s;
  }

  function render(fresh?: Donation) {
    const total = state.events.reduce((s, e) => s + e.amount, 0);
    const best = state.events.reduce((m, e) => (e.amount > m.amount ? e : m), state.events[0]);
    stats.replaceChildren(
      stat('今晚贊助', money(total), '示意數據'),
      stat('贊助筆數', `${state.events.length} 筆`),
      stat('目標進度', `${Math.round((state.goal / GOAL_TARGET) * 100)}%`, money(state.goal)),
      stat('最高單筆', money(best.amount), best.name),
    );

    const buckets = new Array(8).fill(0) as number[];
    const now = Date.now();
    for (const e of state.events) {
      const idx = 7 - Math.min(7, Math.floor((now - e.at.getTime()) / 600_000));
      buckets[idx] += e.amount;
    }
    const max = Math.max(...buckets, 1);
    chart.replaceChildren(h('p', 'panel-t', '每 10 分鐘贊助金額'));
    const bars = h('div', 'ds-bars');
    buckets.forEach((v, i) => {
      const bar = h('i', i === 7 ? 'is-now' : '');
      bar.style.height = `${Math.max(4, (v / max) * 100)}%`;
      bar.title = money(v);
      bars.append(bar);
    });
    chart.append(bars);

    table.replaceChildren();
    const th = h('div', 'ds-head');
    th.append(h('p', 'panel-t', '即時事件'));
    const exp = h('button', 'btn btn--line btn--sm', '匯出');
    exp.type = 'button';
    exp.title = '示範不提供匯出';
    exp.disabled = true;
    th.append(exp);
    table.append(th);
    for (const e of state.events.slice(0, 8)) {
      const row = h('div', `ds-row${fresh && e.id === fresh.id ? ' is-new' : ''}`);
      row.append(
        h('span', 'ds-time', time(e.at)),
        h('b', '', e.name),
        h('span', 'ds-type', e.type),
        h('em', `t${tierOf(e.amount).level}`, money(e.amount)),
        h('span', 'ds-msg', e.message || '—'),
      );
      table.append(row);
    }
  }

  const onDonate = (e: Event) => render((e as CustomEvent<Donation>).detail);
  const onReset = () => render();
  bus.addEventListener('donate', onDonate);
  bus.addEventListener('reset', onReset);
  render();

  let stop = false;
  return {
    el,
    async auto() {
      await wait(1100);
      for (let i = 0; i < 3 && !stop; i++) {
        const [name, text] = SAMPLE_FANS[(i + 2) % SAMPLE_FANS.length];
        donate(name, TIERS[i % 3].amount, text, false);
        await wait(1500);
      }
    },
    destroy() {
      stop = true;
      bus.removeEventListener('donate', onDonate);
      bus.removeEventListener('reset', onReset);
    },
  };
}

/* ---------------------------------------------------------------- 完整流程 */
export function loopView(ctx: Ctx): View {
  const el = h('div', 'v-loop');
  const left = h('div', 'loop-viewer');
  left.append(h('p', 'loop-tag', '觀眾手機'));
  const dv = donateView();
  left.append(dv.el);

  const right = h('div', 'loop-creator');
  right.append(h('p', 'loop-tag', '實況主的直播畫面'));
  const { box, stream } = streamBox(ctx);
  const feed = h('div', 'panel loop-feed');
  right.append(box, feed);
  el.append(left, right);

  function renderFeed() {
    feed.replaceChildren(h('p', 'panel-t', '事件列表'));
    for (const e of state.events.slice(0, 4)) {
      const row = h('p', `loop-row${e.mine ? ' is-mine' : ''}`);
      row.append(h('span', 'ds-time', time(e.at)), h('b', '', e.name), h('em', `t${e.tier.level}`, money(e.amount)));
      feed.append(row);
    }
  }
  bus.addEventListener('donate', renderFeed);
  bus.addEventListener('reset', renderFeed);
  renderFeed();

  return {
    el,
    destroy() {
      bus.removeEventListener('donate', renderFeed);
      bus.removeEventListener('reset', renderFeed);
      stream.destroy();
    },
  };
}

export type { Stream };
