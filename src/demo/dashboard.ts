import { EFFECTS, GAMES, TOOLS, asset, tierColor, twd } from '../shared/brand';
import { icon, type IconName } from '../shared/icons';
import { PLUGINS, SAMPLE_FANS, bus, donate, install, preview, rank, state, type AlertMode, type Donation } from './state';
import { createStream, h, renderReply } from './stream';
import type { Ctx, View } from './views';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const timeOf = (d: Date) => d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  return m < 1 ? '剛剛' : m < 60 ? `${m} 分鐘前` : `${Math.round(m / 60)} 小時前`;
};
const typeIconOf = (type: string) =>
  ({ 文字贊助: 'H', 影音贊助: 'Drop2', 猜謎贊助: 'Flower', 猜獎贊助: 'Bee', 任務贊助: 'Nest', 塗鴉贊助: 'Lollipop' })[type] ?? 'H';

function img(src: string, cls = '', alt = '') {
  const i = h('img', cls);
  i.src = asset(src);
  i.alt = alt;
  return i;
}
function clip(name: string) {
  const v = h('video', 'clip');
  v.src = asset(`hb/tool/${name}.mp4`);
  v.muted = v.loop = v.autoplay = v.playsInline = true;
  v.setAttribute('aria-hidden', 'true');
  return v;
}
function amountPill(n: number) {
  const p = h('span', 'amt-pill', `TWD ${n.toLocaleString('en-US')}`);
  p.style.background = tierColor(n);
  return p;
}
function pageHead(title: string, desc: string) {
  const w = h('div', 'pg-head');
  w.append(h('h1', 'pg-t', title), h('p', 'pg-d', desc));
  return w;
}
function box(title: string, cls = '') {
  const b = h('section', `box ${cls}`);
  b.append(h('h2', 'box-t', title));
  return b;
}

type Page = 'overview' | 'missions' | 'toolbox' | 'alert' | 'plugins' | 'plugin' | 'installed';

interface NavItem {
  label: string;
  ic: IconName;
  page?: Page;
  children?: Array<[string, Page?]>;
}

// 選單名稱、順序、icon 對齊前台 DashboardSidebar；未實作的項目點了只提示。
const NAV: NavItem[] = [
  { label: '總覽', ic: 'overview', page: 'overview' },
  { label: '即時事件', ic: 'event', page: 'missions' },
  { label: '創作者頁面', ic: 'page' },
  { label: 'OBS 設定說明', ic: 'obs' },
  { label: '直播互動箱', ic: 'tool', page: 'toolbox' },
  { label: '彈幕遊戲', ic: 'game' },
  { label: '創作者賣場', ic: 'shop', children: [['我的賣場'], ['商品櫥窗']] },
  { label: '賞金牆', ic: 'bounty' },
  { label: '套件中心', ic: 'puzzle', children: [['瀏覽套件', 'plugins'], ['我的套件', 'installed'], ['開發者中心']] },
  { label: '金主空投', ic: 'celebrate', children: [['粉絲的空投'], ['活動設定'], ['聊天機器人']] },
  { label: '關鍵字過濾', ic: 'keyword' },
  { label: '黑名單', ic: 'blacklist' },
  { label: 'VIP 訂閱', ic: 'vip', children: [['內容管理'], ['方案管理']] },
  { label: '訂單資訊', ic: 'order', children: [['賣場銷售歷史清單'], ['贊助歷史清單'], ['訂閱會員清單']] },
  { label: '財務中心', ic: 'payment', children: [['提領設定'], ['對帳中心']] },
  { label: '常見問題', ic: 'faq' },
];

export function dashboardView(ctx: Ctx): View {
  const el = h('div', 'db');
  const header = h('header', 'db-head');
  const logo = img('hb/logo.svg', 'db-logo', 'HiveBee');
  const bell = h('span', 'db-bell');
  bell.innerHTML = icon('bell');
  const unread = h('b', 'db-bell-n');
  bell.append(unread);
  const userPill = h('span', 'db-user');
  userPill.append(img('hb/img/default_head.png', 'db-user-av'), h('b', '', 'Mimi 蜜蜜'));
  userPill.insertAdjacentHTML('beforeend', icon('menuRight'));
  const headRight = h('div', 'db-head-r');
  headRight.append(bell, userPill);
  header.append(logo, headRight);

  const side = h('nav', 'db-side');
  side.setAttribute('aria-label', '後台選單');
  const content = h('main', 'db-content');
  const toast = h('p', 'db-toast');
  toast.setAttribute('aria-live', 'polite');
  const body = h('div', 'db-body');
  body.append(side, content);
  el.append(header, body, toast);

  let page: Page = 'overview';
  let pluginId = PLUGINS[0].id;
  let cleanup: Array<() => void> = [];
  let stop = false;

  function say(text: string) {
    toast.textContent = text;
    toast.classList.remove('is-on');
    void toast.offsetWidth;
    toast.classList.add('is-on');
  }

  function renderNav() {
    side.replaceChildren();
    for (const item of NAV) {
      const activeGroup = item.children?.some(([, p]) => p && (p === page || (p === 'plugins' && page === 'plugin')));
      const b = h('button', `db-nav${item.page === page || (item.page === 'toolbox' && page === 'alert') ? ' is-on' : ''}`);
      b.type = 'button';
      b.innerHTML = icon(item.ic);
      b.append(h('span', '', item.label));
      if (item.children) b.insertAdjacentHTML('beforeend', icon('arrowDown', activeGroup ? 'is-open' : ''));
      b.addEventListener('click', () => (item.page ? go(item.page) : item.children ? undefined : say(`示範未開放「${item.label}」`)));
      side.append(b);
      if (item.children && activeGroup) {
        for (const [label, p] of item.children) {
          const c = h('button', `db-sub${p === page || (p === 'plugins' && page === 'plugin') ? ' is-on' : ''}`, label);
          c.type = 'button';
          c.addEventListener('click', () => (p ? go(p) : say(`示範未開放「${label}」`)));
          side.append(c);
        }
      }
    }
  }

  function renderUnread() {
    const n = state.events.filter((e) => !e.read).length;
    unread.textContent = n ? String(n) : '';
    unread.hidden = !n;
  }

  function go(p: Page) {
    cleanup.forEach((f) => f());
    cleanup = [];
    page = p;
    content.scrollTop = 0;
    renderNav();
    const render = { overview, missions, toolbox, alert: alertPage, plugins: store, plugin: detail, installed }[p];
    content.replaceChildren(render());
  }

  /* ---------------------------------------------------------------- 總覽 */
  function overview() {
    const w = h('div', 'pg');
    w.append(pageHead('👋🏻 您好，歡迎回來！', '在這裡掌握直播互動與收入概況。'));

    const infoBox = box('我的創作者頁面');
    const link = h('div', 'url-row');
    link.append(h('span', 'url-text', 'https://www.hivebee.com.tw/mimi/donate'));
    link.insertAdjacentHTML('beforeend', `<span class="url-ic">${icon('copy')}</span><span class="url-ic">${icon('open')}</span>`);
    infoBox.append(link);

    const events = box('即時事件', 'ov-events');
    const more = h('button', 'btn btn--outline-neutral btn--pill btn--sm ov-more', '查看全部事件 ›');
    more.type = 'button';
    more.addEventListener('click', () => go('missions'));
    events.append(more);
    const list = h('div', 'ev-list');
    events.append(list);

    const count = box('收入統計');
    const stats = h('div', 'ov-stats');
    count.append(h('p', 'box-d', '依篩選條件計算（示意數據）'), stats);

    const chart = box('贊助金額趨勢');
    const chartArea = h('div', 'ov-chart');
    chart.append(chartArea);

    const rankBox = box('打賞排名');
    const rankList = h('div', 'rk-list');
    rankBox.append(rankList);

    const two = h('div', 'ov-two');
    two.append(chart, rankBox);
    w.append(infoBox, events, count, two);

    function render(fresh?: Donation) {
      list.replaceChildren(...state.events.slice(0, 4).map((e) => eventRow(e, fresh)));
      const total = state.events.reduce((s, e) => s + e.amount, 0);
      const people = new Set(state.events.map((e) => e.name)).size;
      const stat = (label: string, value: string, ic: string) => {
        const s = h('div', 'ov-stat');
        const i = h('span', 'ov-stat-ic');
        i.append(img(`hb/icons/${ic}.svg`));
        const t = h('div');
        t.append(h('p', 'ov-stat-l', label), h('p', 'ov-stat-v', value));
        s.append(i, t);
        return s;
      };
      stats.replaceChildren(
        stat('總贊助數量', `${state.events.length}`, 'Number'),
        stat('贊助金額', total.toLocaleString('en-US'), 'Money'),
        stat('贊助者人數', `${people}`, 'People'),
        stat('收入金額', Math.round(total * 0.95).toLocaleString('en-US'), 'Money2'),
      );
      chartArea.innerHTML = lineChart(total);
      rankList.replaceChildren(
        ...rank()
          .slice(0, 5)
          .map(([name, sum], i) => {
            const r = h('div', `rk-row r${i + 1}`);
            const left = h('span', 'rk-l');
            if (i < 3) left.innerHTML = icon('medal');
            left.append(`${i + 1}　${name}`);
            r.append(left, h('span', 'rk-r', `贊助總計 ${sum.toLocaleString('en-US')} 元`));
            return r;
          }),
      );
    }
    const onDonate = (e: Event) => render((e as CustomEvent<Donation>).detail);
    bus.addEventListener('donate', onDonate);
    cleanup.push(() => bus.removeEventListener('donate', onDonate));
    render();
    return w;
  }

  function eventRow(e: Donation, fresh?: Donation) {
    const r = h('div', `ev-row${e.read ? ' is-read' : ''}${fresh?.id === e.id ? ' is-new' : ''}`);
    const pf = h('span', 'ev-pf');
    pf.append(img('hb/mark.svg'));
    const t = h('p', 'ev-t');
    t.append('您有一個來自 ', h('b', '', e.name), ` 的 TWD ${e.amount.toLocaleString('en-US')} 元 `);
    t.append(img(`hb/icons/${typeIconOf(e.type)}.svg`, 'ev-type-ic'), h('b', '', e.type));
    r.append(pf, t);
    return r;
  }

  function lineChart(total: number) {
    const pts = [1200, 900, 2100, 1600, 2800, 2300, Math.max(800, total / 2)];
    const max = Math.max(...pts) * 1.15;
    const W = 600;
    const H = 200;
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - (v / max) * H]);
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const grid = [0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="#E9E9E9"/>`).join('');
    return `<svg viewBox="0 -10 ${W} ${H + 40}" role="img" aria-label="本週贊助金額趨勢（示意）">
      ${grid}
      <path d="${line} L${W} ${H} L0 ${H} Z" fill="rgba(227,207,251,.46)"/>
      <path d="${line}" fill="none" stroke="#BA87F4" stroke-width="3"/>
      ${xy.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#BA87F4"/>`).join('')}
      ${days.map((d, i) => `<text x="${(i / 6) * W}" y="${H + 26}" font-size="13" fill="#8C8C8C" text-anchor="${i === 0 ? 'start' : i === 6 ? 'end' : 'middle'}">週${d}</text>`).join('')}
    </svg>`;
  }

  /* ---------------------------------------------------------------- 即時事件 */
  function missions() {
    const w = h('div', 'pg');
    w.append(pageHead('即時事件', '在這裡，你可以即時追蹤每筆粉絲贊助項目，並對於贊助互動效果進行即時播放調整。'));
    const filter = box('篩選條件');
    const fr = h('div', 'flt');
    for (const [label, ph] of [['釘選狀態', '全部'], ['贊助類型', '全部'], ['篩選時間', '2026/10/06 ～ 2026/10/06'], ['暱稱搜尋', '請輸入暱稱']]) {
      const f = h('label', 'flt-f');
      const i = h('input', 'field-input');
      i.placeholder = ph;
      i.disabled = true;
      f.append(h('span', '', label), i);
      fr.append(f);
    }
    const q = h('button', 'btn btn--primary', '查詢');
    const c = h('button', 'btn btn--secondary', '清除');
    q.disabled = c.disabled = true;
    fr.append(q, c);
    filter.append(fr);

    const table = box('即時事件');
    const tw = h('div', 'tbl-wrap');
    const t = h('table', 'tbl');
    t.innerHTML = '<thead><tr><th>用戶ID</th><th>粉絲暱稱</th><th>贊助金額</th><th>留言內容</th><th>贊助時間</th><th>贊助類型</th><th>卡片釘選</th><th>操作</th></tr></thead>';
    const tb = h('tbody');
    t.append(tb);
    tw.append(t);
    table.append(tw);
    w.append(filter, table);

    function render(fresh?: Donation) {
      tb.replaceChildren(
        ...state.events.map((e) => {
          const tr = h('tr', `${e.read ? 'is-read' : ''}${fresh?.id === e.id ? ' is-new' : ''}`);
          const td = (...n: Array<Node | string>) => {
            const c = h('td');
            c.append(...n);
            tr.append(c);
            return c;
          };
          const idCell = td(e.userId);
          idCell.insertAdjacentHTML('beforeend', ` <span class="tbl-ic">${icon('copy')}</span>`);
          td(e.name);
          td(amountPill(e.amount));
          td(e.message || '—');
          const time = td(ago(e.at));
          time.title = timeOf(e.at);
          const type = td(img(`hb/icons/${typeIconOf(e.type)}.svg`, 'tbl-type-ic'), e.type);
          type.className = 'tbl-type';
          const pin = h('span', 'tbl-pin');
          pin.innerHTML = icon('pin');
          td(pin);
          const ops = td();
          ops.className = 'tbl-ops';
          ops.innerHTML = [
            ['replay', '#FBBF24', '通知重播'],
            ['cardRemove', '#F65F54', '卡片取消'],
            ['warning', '#FF383C', '加入黑名單'],
          ]
            .map(([ic, c, t]) => `<button type="button" class="op" style="background:${c}" title="${t}" data-op="${t}">${icon(ic as IconName)}</button>`)
            .join('');
          ops.querySelector('[data-op="通知重播"]')!.addEventListener('click', () => {
            preview(e.name, e.amount, e.message);
            say(`已重播 ${e.name} 的通知（示範會在直播畫面頁播放）`);
          });
          ops.querySelectorAll('[data-op="卡片取消"],[data-op="加入黑名單"]').forEach((b) =>
            b.addEventListener('click', () => say(`示範未開放「${(b as HTMLElement).dataset.op}」`)),
          );
          tr.addEventListener('click', () => {
            e.read = true;
            tr.classList.add('is-read');
            renderUnread();
          });
          return tr;
        }),
      );
    }
    const onDonate = (e: Event) => render((e as CustomEvent<Donation>).detail);
    bus.addEventListener('donate', onDonate);
    cleanup.push(() => bus.removeEventListener('donate', onDonate));
    render();
    return w;
  }

  /* ---------------------------------------------------------------- 互動工具箱 */
  function toolbox() {
    const w = h('div', 'pg');
    w.append(pageHead('互動工具箱', '在這裡，您可以制定與粉絲在直播中的互動視窗樣式，為您的直播打造獨一無二的體驗。'));
    const section = (title: string, desc: string, items: typeof TOOLS) => {
      const s = h('section', 'tb-sec');
      s.append(h('h2', 'tb-t', title), h('p', 'pg-d', desc));
      const grid = h('div', 'tb-grid');
      for (const t of items) {
        const c = h('button', 'tb-card');
        c.type = 'button';
        const pic = h('div', 'tb-pic');
        pic.append(clip(t.clip));
        const ic = h('span', 'tb-ic');
        ic.append(img(`hb/icons/${t.icon}.svg`));
        const tt = h('p', 'tb-name', t.name);
        c.append(pic, ic, tt, h('p', 'tb-desc', t.desc));
        c.addEventListener('click', () => (t.key === 'alert' ? go('alert') : say(`示範只開放「通知」的設定頁`)));
        grid.append(c);
      }
      s.append(grid);
      return s;
    };
    w.append(
      section('互動工具箱', '依金額跳出通知、卡片、目標與倒數，讓直播畫面跟著支持動起來。', TOOLS),
      section('互動遊戲箱', '在這裡，您可以添加給粉絲贊助玩法，為您的直播新增更多趣味的互動。', GAMES),
    );
    return w;
  }

  /* ---------------------------------------------------------------- 通知設定 */
  let editing: number | null = null;
  let tab = 0;
  function alertPage() {
    const w = h('div', 'pg');
    w.append(pageHead('通知', '根據贊助者不同金額等級的贊助，在直播中跳出不同的感謝畫面。'));

    const url = box('通知網址');
    const ur = h('div', 'url-row');
    const ui = h('input', 'field-input');
    ui.value = 'https://www.hivebee.com.tw/widget/alert/••••••••';
    ui.readOnly = true;
    const cp = h('button', 'btn btn--outline-primary', '複製');
    const op = h('button', 'btn btn--outline-primary', '開啟');
    cp.disabled = op.disabled = true;
    ur.append(h('span', 'url-l', '正式網址'), ui, cp, op);
    url.append(ur);

    const prev = h('section', 'box al-prev');
    prev.append(h('h2', 'box-t', '畫面預覽'));
    const pv = h('div', 'al-pv');
    const pl = h('div', 'al-pv-l');
    const tpills = h('div', 'al-types');
    ['文字贊助', '彈幕遊戲', 'VIP 訂閱', '影音贊助', '魔儲購買'].forEach((t, i) => {
      const b = h('button', `pill${i === 0 ? ' is-on' : ''}`, t);
      b.type = 'button';
      b.disabled = i > 0;
      tpills.append(b);
    });
    const test = (label: string, value: string) => {
      const f = h('label', 'al-test');
      const i = h('input', 'field-input');
      i.value = value;
      f.append(h('span', '', label), i);
      return [f, i] as const;
    };
    const [tn, tni] = test('暱稱', 'Anne');
    const [ta, tai] = test('金額', '15');
    const [tm, tmi] = test('留言', '123');
    const fire = h('button', 'btn btn--primary', '畫面預覽');
    fire.type = 'button';
    fire.addEventListener('click', () => preview(tni.value || 'Anne', Number(tai.value) || 15, tmi.value));
    pl.append(tpills, h('p', 'al-test-t', '互動測試'), tn, ta, tm, fire);
    const pr = h('div', 'al-pv-r');
    const s = createStream(pr, { cam: ctx.cam, widgets: false, listen: ['preview'] });
    cleanup.push(s.destroy);
    pv.append(pl, pr);
    prev.append(pv);

    const set = box('互動設定');
    const stabs = h('div', 'al-types');
    ['文字贊助', '彈幕遊戲', 'VIP 訂閱', '影音贊助', '魔儲購買'].forEach((t, i) => {
      const b = h('button', `pill${i === 0 ? ' is-on' : ''}`, t);
      b.type = 'button';
      b.disabled = i > 0;
      stabs.append(b);
    });
    const modesBox = h('div', 'al-modes');
    const add = h('button', 'btn btn--action');
    add.type = 'button';
    add.innerHTML = `${icon('plusCircle')}<span>新增模式</span>`;
    add.addEventListener('click', () => say('示範只能編輯現有模式'));
    const list = h('div', 'al-list');
    modesBox.append(add, list);
    set.append(stabs, modesBox);
    w.append(url, prev, set);

    function renderModes() {
      list.replaceChildren();
      for (const m of state.modes) {
        const r = h('div', 'al-mode');
        const head = h('div', 'al-mode-h');
        const title = h('p', 'al-mode-t');
        title.append(h('i', 'al-dot'), h('b', '', m.title), h('span', '', `${m.min} ～ ${m.max ?? '以上'}${m.max ? ' 元' : ''}`));
        const tg = h('button', `switch${m.enabled ? ' is-on' : ''}`);
        tg.type = 'button';
        tg.setAttribute('aria-label', `啟用 ${m.title}`);
        tg.addEventListener('click', () => {
          m.enabled = !m.enabled;
          renderModes();
        });
        const ed = h('button', 'al-act');
        ed.type = 'button';
        ed.innerHTML = `${icon('edit')}<span>編輯</span>`;
        ed.addEventListener('click', () => {
          editing = editing === m.id ? null : m.id;
          tab = 0;
          renderModes();
        });
        const del = h('button', 'al-act');
        del.type = 'button';
        del.innerHTML = `${icon('delete')}<span>刪除</span>`;
        del.addEventListener('click', () => say('示範不提供刪除'));
        const acts = h('div', 'al-acts');
        acts.append(tg, ed, del);
        head.append(title, acts);
        r.append(head);
        if (editing === m.id) r.append(editForm(m));
        list.append(r);
      }
    }

    function editForm(m: AlertMode) {
      const f = h('div', 'al-edit');
      f.append(h('p', 'al-edit-t', '互動項目設定'));
      const tabs = h('div', 'al-tabs');
      const pane = h('div', 'al-pane');
      ['通知設定', '系統回覆設定', '贊助內容設定'].forEach((t, i) => {
        const b = h('button', `al-tab${i === tab ? ' is-on' : ''}`, t);
        b.type = 'button';
        b.addEventListener('click', () => {
          tab = i;
          renderModes();
        });
        tabs.append(b);
      });
      const field = (label: string, ...n: HTMLElement[]) => {
        const r = h('div', 'al-f');
        r.append(h('span', 'al-f-l', label));
        const c = h('div', 'al-f-c');
        c.append(...n);
        r.append(c);
        pane.append(r);
      };
      if (tab === 0) {
        const mn = h('input', 'field-input al-num');
        mn.value = String(m.min);
        const mx = h('input', 'field-input al-num');
        mx.value = m.max === null ? '' : String(m.max);
        mx.placeholder = '以上';
        mn.disabled = mx.disabled = true;
        field('贊助區間', mn, h('span', '', '～'), mx);
        const pic = h('div', 'al-img');
        pic.append(img(m.image));
        field('互動圖片', pic);
        field('互動音訊', h('span', 'al-note', '預設音效・音量 20'));
      } else if (tab === 1) {
        const tpl = h('input', 'field-input');
        tpl.value = m.template;
        tpl.addEventListener('input', () => (m.template = tpl.value));
        field('回覆模板', tpl, h('span', 'al-note', '可用變數：${Name} 暱稱、${Amount} 金額'));
        const fx = h('select', 'field-input al-sel');
        for (const [k, label] of EFFECTS) {
          const o = h('option', '', label);
          o.value = k;
          o.selected = k === m.effect;
          fx.append(o);
        }
        fx.addEventListener('change', () => {
          m.effect = fx.value;
          sample.replaceChildren(renderReply(m, { name: 'Anne', amount: m.min, message: '' }));
        });
        const size = h('select', 'field-input al-sel');
        for (const n of [24, 30, 32, 35, 40, 48, 64]) {
          const o = h('option', '', `${n}`);
          o.selected = n === m.size;
          size.append(o);
        }
        size.addEventListener('change', () => (m.size = Number(size.value)));
        field('回覆文字樣式', h('span', 'al-note', '字型 Open Sans'), size, fx);
        const sec = h('input', 'field-input al-num');
        sec.type = 'number';
        sec.value = String(m.seconds);
        sec.addEventListener('input', () => (m.seconds = Math.max(2, Math.min(15, Number(sec.value) || 5))));
        field('回覆停留時間', sec, h('span', 'al-note', '秒'));
        const sample = h('div', 'al-sample');
        sample.append(renderReply(m, { name: 'Anne', amount: m.min, message: '' }));
        pane.append(sample);
      } else {
        field('留言樣式', h('span', 'al-note', '字型 Open Sans・尺寸 35・顏色 #FFFFFF'));
        const tts = h('span', 'switch is-on');
        field('文字轉語音', tts, h('span', 'al-note', '音量 100（示範不發出聲音）'));
      }
      const save = h('button', 'btn btn--action btn--3xl al-save', '儲存變更');
      save.type = 'button';
      save.addEventListener('click', () => {
        say('已套用到預覽（示範不會儲存）');
        const [name, text] = SAMPLE_FANS[(m.id - 1) % SAMPLE_FANS.length];
        preview(name, m.min, text);
      });
      f.append(tabs, pane, save);
      return f;
    }
    renderModes();
    return w;
  }

  /* ---------------------------------------------------------------- 套件中心 */
  function pluginIcon(p: (typeof PLUGINS)[number], cls: string) {
    return h('span', `pl-ic ${cls}`, p.icon);
  }
  function store() {
    const w = h('div', 'pg');
    const head = h('div', 'pg-head pl-head');
    const mine = h('button', 'btn btn--primary', '我的套件');
    mine.type = 'button';
    mine.addEventListener('click', () => go('installed'));
    head.append(h('h1', 'pg-t', '套件中心'), mine);
    const bar = h('div', 'pl-bar');
    const search = h('input', 'field-input pl-search');
    search.placeholder = '搜尋套件名稱或簡介';
    const cat = h('select', 'field-input pl-cat');
    for (const c of ['全部分類', '特效', '遊戲', '互動']) cat.append(h('option', '', c));
    bar.append(search, cat);
    const grid = h('div', 'pl-grid');
    const render = () => {
      const q = search.value.trim();
      const c = cat.value;
      grid.replaceChildren(
        ...PLUGINS.filter((p) => (!q || p.name.includes(q) || p.summary.includes(q)) && (c === '全部分類' || p.category === c)).map((p) => {
          const card = h('button', 'pl-card');
          card.type = 'button';
          card.dataset.id = p.id;
          const cover = h('div', 'pl-cover');
          cover.append(pluginIcon(p, 'is-lg'));
          const meta = h('div', 'pl-meta');
          meta.append(pluginIcon(p, ''), h('div'));
          meta.lastElementChild!.append(h('p', 'pl-name', p.name), h('p', 'pl-dev', p.author));
          const foot = h('div', 'pl-foot');
          foot.append(h('span', 'pl-tag', p.category), h('span', '', `${p.installs} 次安裝 · v${p.version}`));
          card.append(cover, meta, h('p', 'pl-sum', p.summary), foot);
          card.addEventListener('click', () => {
            pluginId = p.id;
            go('plugin');
          });
          return card;
        }),
      );
      if (!grid.children.length) grid.append(h('p', 'pg-d', '目前沒有符合條件的套件'));
    };
    search.addEventListener('input', render);
    cat.addEventListener('change', render);
    render();
    w.append(head, bar, grid, h('p', 'pl-note', '套件為示意範例。'));
    return w;
  }

  function detail() {
    const p = PLUGINS.find((x) => x.id === pluginId)!;
    const w = h('div', 'pg');
    const back = h('button', 'pl-back');
    back.type = 'button';
    back.innerHTML = `${icon('back')}<span>返回套件中心</span>`;
    back.addEventListener('click', () => go('plugins'));
    const head = h('div', 'box pd-head');
    const left = h('div', 'pd-l');
    const info = h('div');
    info.append(h('p', 'pd-name', p.name), h('p', 'pg-d', `${p.author} · v${p.version} · ${p.installs} 次安裝`), h('span', 'pl-tag', p.category));
    left.append(pluginIcon(p, 'is-md'), info);
    const btn = h('button', 'btn btn--primary btn--3xl pd-install');
    btn.type = 'button';
    const sync = () => {
      const on = state.installed.has(p.id);
      btn.textContent = on ? '已安裝 · 前往設定' : '安裝';
      btn.className = `btn ${on ? 'btn--outline-primary' : 'btn--primary'} btn--3xl pd-install`;
    };
    sync();
    btn.addEventListener('click', async () => {
      if (state.installed.has(p.id)) return go('installed');
      btn.textContent = '安裝中…';
      btn.disabled = true;
      await wait(900);
      btn.disabled = false;
      install(p.id);
      sync();
      say(`已安裝「${p.name}」`);
    });
    head.append(left, btn);
    const shots = box('玩法截圖');
    const shot = h('div', 'pd-shot');
    shot.append(pluginIcon(p, 'is-lg'));
    shots.append(shot);
    const intro = box('套件介紹');
    intro.append(h('p', '', p.summary));
    const spec = box('規格');
    spec.innerHTML += '<dl class="pd-spec"><dt>播放模式</dt><dd>疊加層</dd><dt>觸發事件</dt><dd>所有斗內（依金額觸發）</dd><dt>建議尺寸</dt><dd>1920 × 1080</dd><dt>最後更新</dt><dd>2026/09/30</dd></dl>';
    w.append(back, head, shots, intro, spec);
    return w;
  }

  function installed() {
    const w = h('div', 'pg');
    const head = h('div', 'pg-head pl-head');
    const toStore = h('button', 'btn btn--outline-primary', '前往套件中心');
    toStore.type = 'button';
    toStore.addEventListener('click', () => go('plugins'));
    head.append(h('h1', 'pg-t', '我的套件'), toStore);
    w.append(head);
    const mine = PLUGINS.filter((p) => state.installed.has(p.id));
    if (!mine.length) {
      const empty = h('div', 'box ins-empty');
      empty.append(img('hb/img/nothing.png'), h('p', 'pg-d', '還沒有安裝任何套件，到套件中心逛逛吧！'));
      w.append(empty);
      return w;
    }
    for (const p of mine) {
      const c = h('section', 'box ins');
      const row = h('div', 'ins-row');
      const name = h('div', 'pd-l');
      const t = h('div');
      t.append(h('p', 'pd-name', p.name), h('p', 'pg-d', `v${p.version}`));
      name.append(pluginIcon(p, ''), t);
      const sw = h('span', 'switch is-on');
      row.append(name, sw);
      c.append(row);
      if (p.id === mine[mine.length - 1].id) {
        const ur = h('div', 'url-row');
        const ui = h('input', 'field-input');
        ui.value = 'https://www.hivebee.com.tw/widget/plugin/••••••••';
        ui.readOnly = true;
        ur.append(h('span', 'url-l', 'OBS 瀏覽器來源網址（建議尺寸 1920 × 1080）'), ui);
        const grid = h('div', 'ins-grid');
        const left = h('div', 'ins-test');
        left.append(h('p', 'box-t', '測試事件'));
        const [nameF, nameI] = testField('暱稱', 'Anne');
        const [amtF, amtI] = testField('金額', '300');
        const [msgF, msgI] = testField('留言', '好可愛！');
        const send = h('button', 'btn btn--primary', '發送事件');
        send.type = 'button';
        left.append(nameF, amtF, msgF, send);
        const right = h('div', 'ins-prev');
        const st = h('p', 'ins-prev-t');
        st.append('畫面預覽（與 OBS 相同沙箱）', h('span', 'ins-badge', '已就緒'));
        const stage = h('div', 'ins-stage');
        right.append(st, stage);
        const s = createStream(stage, { cam: null, widgets: false, listen: [], alerts: false });
        s.showPlugin(p.id);
        cleanup.push(s.destroy);
        send.addEventListener('click', () => {
          const amount = Number(amtI.value) || 15;
          s.fire({ id: Date.now(), userId: '', name: nameI.value || 'Anne', amount, message: msgI.value, type: '文字贊助', at: new Date(), read: true });
        });
        grid.append(left, right);
        c.append(ur, grid);
        (c as HTMLElement & { send?: () => void }).send = () => send.click();
      }
      w.append(c);
    }
    return w;
  }
  function testField(label: string, value: string) {
    const f = h('label', 'al-test');
    const i = h('input', 'field-input');
    i.value = value;
    f.append(h('span', '', label), i);
    return [f, i] as const;
  }

  const onDonate = () => renderUnread();
  bus.addEventListener('donate', onDonate);
  bus.addEventListener('reset', onDonate);
  renderUnread();

  return {
    el,
    open(p: string) {
      go((['overview', 'missions', 'toolbox', 'alert', 'plugins', 'installed'].includes(p) ? p : 'overview') as Page);
    },
    async auto(params) {
      if (page === 'overview' || page === 'missions') {
        await wait(1200);
        for (let i = 0; i < 3 && !stop; i++) {
          const [name, text] = SAMPLE_FANS[(i + 1) % SAMPLE_FANS.length];
          donate(name, [75, 300, 1500][i], text, false);
          await wait(1600);
        }
      } else if (page === 'alert') {
        await wait(700);
        editing = 2;
        tab = 1;
        go('alert');
        const m = state.modes[1];
        for (const [fx] of EFFECTS.slice(0, 4)) {
          if (stop) return;
          m.effect = fx;
          go('alert');
          const [name, text] = SAMPLE_FANS[EFFECTS.findIndex(([k]) => k === fx) % SAMPLE_FANS.length];
          preview(name, 300, text);
          await wait(3400);
        }
      } else if (page === 'plugins') {
        await wait(1200);
        if (stop) return;
        pluginId = 'lightstick';
        go('plugin');
        await wait(1400);
        content.querySelector<HTMLButtonElement>('.pd-install')?.click();
        await wait(2000);
        if (stop) return;
        go('installed');
        for (let i = 0; i < 3 && !stop; i++) {
          await wait(1500);
          content.querySelector<HTMLButtonElement>('.ins-test .btn')?.click();
        }
      }
      void params;
    },
    destroy() {
      stop = true;
      cleanup.forEach((f) => f());
      bus.removeEventListener('donate', onDonate);
      bus.removeEventListener('reset', onDonate);
    },
  };
}
