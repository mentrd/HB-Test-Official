import '../shared/base.css';
import './demo.css';
import { FILM } from '../film-manifest';
import { LINKS, asset } from '../shared/brand';
import { dashboardView } from './dashboard';
import { donateView } from './donate';
import { GOAL_TARGET, reset, state } from './state';
import { h } from './stream';
import { loopView, streamView, type Ctx, type View } from './views';

const SCREENS = {
  loop: ['完整流程', (c: Ctx) => loopView(c, donateView)],
  donate: ['觀眾贊助頁', () => donateView()],
  stream: ['直播畫面', (c: Ctx) => streamView(c)],
  dashboard: ['創作者後台', (c: Ctx) => dashboardView(c)],
} as const satisfies Record<string, readonly [string, (c: Ctx) => View]>;
type Screen = keyof typeof SCREENS;

const query = new URLSearchParams(location.search);
const embed = query.has('embed');
const ctx: Ctx = { cam: `../${FILM.stills.cam ?? FILM.stills.poster}` };

document.body.classList.toggle('is-embed', embed);
const app = document.getElementById('app')!;
const stage = h('main', 'demo-stage');
let current: View | null = null;
let currentScreen: Screen = 'loop';
let currentParams = '';
const tabs: HTMLButtonElement[] = [];

if (!embed) {
  const bar = h('header', 'demo-bar');
  const brand = h('a', 'demo-brand');
  brand.href = '../';
  const logo = h('img');
  logo.src = asset('hb/logo.svg');
  logo.alt = 'HiveBee';
  brand.append(logo, h('span', '', '互動示範'));
  const nav = h('nav', 'demo-tabs');
  nav.setAttribute('aria-label', '示範畫面');
  for (const [key, [label]] of Object.entries(SCREENS)) {
    const b = h('button', 'pill', label);
    b.type = 'button';
    b.dataset.screen = key;
    b.addEventListener('click', () => show(key));
    tabs.push(b);
    nav.append(b);
  }
  const resetBtn = h('button', 'btn btn--outline-neutral btn--pill', '重設示範');
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    reset();
    show(currentScreen, currentParams);
  });
  const cta = h('a', 'btn btn--primary btn--pill', '開始使用 HiveBee');
  cta.href = LINKS.signup;
  cta.target = '_blank';
  cta.rel = 'noopener';
  bar.append(brand, nav, resetBtn, cta);
  app.append(bar);
}
app.append(stage, h('p', 'demo-flag', '互動示範，不會付款，也不會送到真實直播'));

function show(screen: string, params = '') {
  const key: Screen = screen in SCREENS ? (screen as Screen) : 'loop';
  const p = new URLSearchParams(params);
  current?.destroy?.();
  // 故事章節要演「目標衝滿」，先把進度推到差一筆就達標。
  if (p.has('fill')) state.goal = GOAL_TARGET - (Number(p.get('amount')) || 1000);
  currentScreen = key;
  currentParams = params;
  current = SCREENS[key][1](ctx);
  stage.replaceChildren(current.el);
  stage.dataset.screen = key;
  tabs.forEach((t) => t.classList.toggle('is-on', t.dataset.screen === key));
  current.open?.(p.get('page') ?? 'overview');
  if (p.has('auto')) current.auto?.(p);
}

declare global {
  interface Window {
    hbDemo?: { show: typeof show; reset: typeof reset };
  }
}
window.hbDemo = { show, reset };

show(query.get('screen') ?? 'loop', query.toString());
