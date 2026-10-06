import { asset } from '../shared/brand';
import { bus, donate, state, type Donation } from './state';
import { createStream, h } from './stream';

export interface View {
  el: HTMLElement;
  open?: (page: string) => void;
  auto?: (p: URLSearchParams) => void;
  destroy?: () => void;
}

export interface Ctx {
  cam: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- 直播畫面（OBS 輸出） */
export function streamView(ctx: Ctx): View {
  const el = h('div', 'v-stream');
  const box = h('div', 'stream-box');
  const stream = createStream(box, { cam: ctx.cam, widgets: true, listen: ['donate', 'preview'] });
  el.append(box);
  return {
    el,
    async auto(p) {
      if (p.has('build')) await stream.build();
      const amount = Number(p.get('amount'));
      if (amount) {
        await wait(p.has('build') ? 300 : 700);
        donate(amount >= 1500 ? '阿哲' : '夜貓子', amount, amount >= 1500 ? '新麥克風衝一波！' : '這首再唱一次！', false);
      }
    },
    destroy: stream.destroy,
  };
}

/* ---------------------------------------------------------------- 完整流程：觀眾贊助頁＋直播畫面＋即時事件 */
export function loopView(ctx: Ctx, donateView: () => View): View {
  const el = h('div', 'v-loop');
  const left = h('div', 'loop-viewer');
  left.append(h('p', 'loop-tag', '觀眾的贊助頁'));
  const dv = donateView();
  const phone = h('div', 'loop-phone');
  phone.append(dv.el);
  left.append(phone);

  const right = h('div', 'loop-creator');
  right.append(h('p', 'loop-tag', '實況主的直播畫面（OBS）'));
  const box = h('div', 'stream-box');
  const stream = createStream(box, { cam: ctx.cam, widgets: true, listen: ['donate'] });
  const feed = h('section', 'box loop-feed');
  right.append(box, feed);
  el.append(left, right);

  function renderFeed(fresh?: Donation) {
    feed.replaceChildren(h('h2', 'box-t', '即時事件'));
    for (const e of state.events.slice(0, 3)) {
      const r = h('div', `ev-row${e.read ? ' is-read' : ''}${fresh?.id === e.id ? ' is-new' : ''}`);
      const pf = h('span', 'ev-pf');
      const mark = h('img');
      mark.src = asset('hb/mark.svg');
      mark.alt = '';
      pf.append(mark);
      const t = h('p', 'ev-t');
      t.append('您有一個來自 ', h('b', '', e.name), ` 的 TWD ${e.amount.toLocaleString('en-US')} 元 `, h('b', '', e.type));
      r.append(pf, t);
      feed.append(r);
    }
  }
  const onDonate = (e: Event) => renderFeed((e as CustomEvent<Donation>).detail);
  const onReset = () => renderFeed();
  bus.addEventListener('donate', onDonate);
  bus.addEventListener('reset', onReset);
  renderFeed();

  return {
    el,
    destroy() {
      dv.destroy?.();
      bus.removeEventListener('donate', onDonate);
      bus.removeEventListener('reset', onReset);
      stream.destroy();
    },
  };
}
