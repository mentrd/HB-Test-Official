import Lenis from 'lenis';
import '../shared/base.css';
import './story.css';
import { FILM } from '../film-manifest';
import { LINKS } from '../shared/brand';
import { BEATS, type Beat, type Scene } from './beats';

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none) and (pointer: coarse)').matches || innerWidth < 900;
const DEMO = 'demo/index.html';
const film = FILM.video && !reduced ? FILM : null;

document.querySelectorAll<HTMLAnchorElement>('[data-signup]').forEach((a) => (a.href = LINKS.signup));
document.querySelectorAll<HTMLAnchorElement>('[data-manual]').forEach((a) => (a.href = LINKS.manual));

/* ---------------------------------------------------------------- 穩定的畫面高度 */
// iOS 網址列伸縮會改變 innerHeight；只在寬度改變或高度跳動超過網址列時重新量測，避免影片跟著抖。
let VH = 0;
let VW = 0;
function measure() {
  const h = $('#vh-probe').offsetHeight || innerHeight;
  const w = innerWidth;
  if (w === VW && Math.abs(h - VH) < 160) return false;
  VH = h;
  VW = w;
  document.documentElement.style.setProperty('--vh', `${VH}px`);
  return true;
}
measure();

/* ---------------------------------------------------------------- 章節標記 */
function cardHTML(b: Beat) {
  if (b.card === 'hero')
    return `
      <div class="hcard hcard--hero">
        <p class="hero-tag">HiveBee｜創作者工具平台</p>
        <h1 class="hero-t">讓每一次支持，<br>都成為直播裡的<span>精彩時刻</span></h1>
        <p class="hero-s">跟著實況主 Mimi 開一場台，看一筆贊助怎麼變成全場的高潮。</p>
      </div>
      <p class="cue"><span id="cue-t">往下捲動開始</span><span class="cue-line"></span></p>`;
  if (b.card === 'finale')
    return `
      <div class="hcard hcard--finale">
        <h2 class="hero-t">先體驗，<br>再開始你的<span>下一場直播</span></h2>
        <div class="acts">
          <button class="btn btn--primary btn--3xl" type="button" data-goto="explore">自己玩一次</button>
          <a class="btn btn--outline-primary btn--3xl" href="${LINKS.signup}" target="_blank" rel="noopener">開始使用 HiveBee</a>
        </div>
        <button class="link-top" type="button" data-top>回到開頭</button>
      </div>`;
  return `
    <div class="caption">
      <p class="kicker">${esc(b.kicker!)}</p>
      <h2 class="cap-t">${esc(b.title!)}</h2>
      <p class="cap-s">${esc(b.sub!)}</p>
      ${b.scene ? '<button class="btn btn--outline-primary btn--pill btn--sm cap-see" type="button" data-see>看畫面</button>' : ''}
      ${b.id === 'c08' ? `<a class="btn btn--primary btn--pill cap-cta" href="${LINKS.signup}" target="_blank" rel="noopener">開始使用 HiveBee</a>` : ''}
    </div>`;
}

$('#story').innerHTML = BEATS.map(
  (b, i) => `<section class="beat${b.card ? ` beat--${b.card}` : ''}" data-i="${i}"><div class="hold">${cardHTML(b)}</div></section>`,
).join('');
const beatEls = $$('.beat');

const navIdx = BEATS.map((b, i) => (b.nav ? i : -1)).filter((i) => i >= 0);
$('#chapters').innerHTML =
  navIdx
    .map(
      (i) =>
        `<button class="ch" type="button" data-beat="${i}" aria-label="${esc(BEATS[i].kicker!)}"><span class="ch-dot"></span><span class="ch-t">${esc(BEATS[i].nav!)}</span></button>`,
    )
    .join('') +
  '<button class="ch" type="button" data-goto="explore" aria-label="自己玩一次"><span class="ch-dot"></span><span class="ch-t">自己玩</span></button>';
const navEls = $$('.ch[data-beat]');

/* ---------------------------------------------------------------- 版面（以穩定 VH 換算 px） */
let tops: number[] = [];
let storyEnd = 0;
function layout() {
  beatEls.forEach((el, i) => {
    const b = BEATS[i];
    el.style.height = `${((b.play ?? 0) + b.hold) * VH}px`;
    $('.hold', el).style.height = `${b.hold * VH}px`;
  });
  tops = beatEls.map((el) => el.getBoundingClientRect().top + scrollY);
  const last = beatEls[beatEls.length - 1];
  storyEnd = tops[tops.length - 1] + last.offsetHeight;
  const r = document.documentElement.style;
  r.setProperty('--ps', clamp((VH - 150) / 800, 0.45, 0.95).toFixed(4));
  r.setProperty('--bs', Math.min((VW * 0.46) / 1280, (VH - 190) / 800).toFixed(4));
}

/* ---------------------------------------------------------------- 影片 */
const video = $<HTMLVideoElement>('#film');
const stillA = $<HTMLImageElement>('#still-a');
const stillB = $<HTMLImageElement>('#still-b');
let frontStill = stillA;
let targetTime: number | null = null;
let segmentEnd = 0;

const clipOf = (b: Beat) => film?.clips[b.id];
const lastFrame = (id: string) => {
  const c = film?.clips[id];
  return c ? c.start + c.frames - 1 : 0;
};

let wantedStill = '';
function setStill(id: string) {
  const src = FILM.stills[id] ?? FILM.stills.poster;
  if (src === wantedStill) return;
  wantedStill = src;
  const back = frontStill === stillA ? stillB : stillA;
  const swap = () => {
    if (wantedStill !== src) return;
    back.classList.add('is-on');
    frontStill.classList.remove('is-on');
    frontStill = back;
  };
  back.onload = swap;
  back.src = src;
  if (back.complete && back.naturalWidth) swap();
}

function loader(p: number) {
  $('#loader span').style.transform = `scaleX(${p})`;
  const cue = document.getElementById('cue-t');
  if (cue) cue.textContent = p < 1 ? `影片準備中・${Math.round(p * 100)}%` : '往下捲動開始';
}

async function fetchBlob(url: string, onProgress?: (p: number) => void) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${res.status} ${url}`);
  const total = Number(res.headers.get('Content-Length')) || 0;
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    got += value.length;
    if (total && onProgress) onProgress(got / total);
  }
  return URL.createObjectURL(new Blob(parts as BlobPart[], { type: 'video/mp4' }));
}

const metaReady = (v: HTMLVideoElement) =>
  new Promise<void>((ok, fail) => {
    if (v.readyState >= 1) return ok();
    v.addEventListener('loadedmetadata', () => ok(), { once: true });
    v.addEventListener('error', () => fail(v.error), { once: true });
  });

async function loadFilm() {
  if (!film?.video) {
    document.body.classList.add('mode-still');
    setStill('poster');
    return;
  }
  setStill('poster');
  if (touch) {
    // 手機不拖曳進度：iOS 捲動中 seek 不穩定，改成進入章節時播放該段。
    document.body.classList.add('mode-segment');
    video.src = film.video.sd;
    video.preload = 'auto';
    return;
  }
  document.body.classList.add('mode-scrub');
  try {
    // 先載低畫質讓頁面可用，再背景換高畫質；整支轉成 blob，拖曳時 seek 才不會等網路。
    video.src = await fetchBlob(film.video.lo, loader);
    await metaReady(video);
    loader(1);
    document.body.classList.add('film-ready');
    const better = VW * devicePixelRatio > 1600 ? film.video.hd : film.video.sd;
    const url = await fetchBlob(better);
    const t = video.currentTime;
    video.src = url;
    await metaReady(video);
    video.currentTime = t;
  } catch {
    document.body.classList.remove('mode-scrub');
    document.body.classList.add('mode-still');
  }
}

function scrubLoop() {
  if (targetTime !== null && video.readyState >= 1 && !video.seeking) {
    if (Math.abs(video.currentTime - targetTime) > 0.5 / FILM.fps) video.currentTime = targetTime;
  }
  if (segmentEnd && video.currentTime >= segmentEnd) {
    video.pause();
    segmentEnd = 0;
  }
  requestAnimationFrame(scrubLoop);
}

function playSegment(b: Beat) {
  const c = clipOf(b);
  if (!c || !film) return;
  video.currentTime = c.start / film.fps;
  segmentEnd = (c.start + c.frames - 1) / film.fps;
  video.play().catch(() => {});
}

/* ---------------------------------------------------------------- 前景畫面（手機、瀏覽器） */
const phone = $('#phone');
const browser = $('#browser');
const chip = $('#chip');
const frames: Record<Scene['device'], HTMLIFrameElement> = {
  phone: $<HTMLIFrameElement>('#phone-frame'),
  browser: $<HTMLIFrameElement>('#browser-frame'),
};
const frameReady: Partial<Record<Scene['device'], Promise<void>>> = {};
let sceneKey = '';

function ensureFrame(device: Scene['device'], scene: Scene) {
  if (!frameReady[device]) {
    const f = frames[device];
    frameReady[device] = new Promise((ok) => f.addEventListener('load', () => ok(), { once: true }));
    f.src = `${DEMO}?embed&screen=${scene.screen}`;
  }
  return frameReady[device]!;
}

async function showScene(scene?: Scene, beat?: Beat) {
  const key = scene ? `${scene.device}:${scene.screen}:${scene.params}:${beat?.id}` : '';
  if (key === sceneKey) return;
  sceneKey = key;
  phone.classList.toggle('is-on', scene?.device === 'phone');
  browser.classList.toggle('is-on', scene?.device === 'browser');
  if (beat?.chip) chip.innerHTML = `<small>${esc(beat.chip[0])}</small><b>${esc(beat.chip[1])}</b>`;
  chip.classList.toggle('is-on', !!beat?.chip);
  if (scene?.device === 'browser') $('#browser .url').textContent = scene.screen === 'dashboard' ? 'www.hivebee.com.tw/dashboard' : 'OBS 預覽・直播畫面';
  if (!scene || touch) return;
  await ensureFrame(scene.device, scene);
  if (sceneKey !== key) return;
  frames[scene.device].contentWindow?.hbDemo?.show(scene.screen, scene.params ?? '');
}

/* ---------------------------------------------------------------- 捲動 */
let active = -1;
function update(y: number) {
  if (!tops.length) return;
  let i = 0;
  while (i + 1 < tops.length && tops[i + 1] <= y + VH * 0.5) i++;
  const past = y > storyEnd - VH * 0.6;
  document.body.classList.toggle('is-past', past);

  if (film && document.body.classList.contains('mode-scrub')) {
    let f = 0;
    while (f + 1 < tops.length && tops[f + 1] <= y) f++;
    const b = BEATS[f];
    const c = clipOf(b);
    let frame = 0;
    if (c) frame = c.start + clamp((y - tops[f]) / ((b.play ?? 1) * VH), 0, 1) * (c.frames - 1);
    else if (b.card === 'finale') frame = lastFrame('c08');
    targetTime = frame / FILM.fps;
  }

  if (i === active) return;
  active = i;
  const b = BEATS[i];
  beatEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
  navEls.forEach((el) => el.setAttribute('aria-current', String(Number(el.dataset.beat) === i)));
  if (!film || document.body.classList.contains('mode-still')) setStill(b.card === 'finale' ? 'c08' : b.card ? 'poster' : b.id);
  if (document.body.classList.contains('mode-segment')) {
    if (b.card === 'hero') video.currentTime = 0;
    else playSegment(b);
  }
  showScene(past ? undefined : b.scene, b);
}

let lenis: Lenis | null = null;
if (!reduced && !touch) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
  lenis.on('scroll', () => update(scrollY));
}
addEventListener('scroll', () => update(scrollY), { passive: true });

function scrollToY(top: number) {
  if (lenis) lenis.scrollTo(top, { duration: 1.4 });
  else scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-beat],[data-goto],[data-top],[data-see],[data-close]');
  if (!t) return;
  if (t.dataset.beat !== undefined) {
    const i = Number(t.dataset.beat);
    scrollToY(tops[i] + (BEATS[i].play ?? 0) * VH + 2);
  } else if (t.dataset.goto) scrollToY($(`#${t.dataset.goto}`).getBoundingClientRect().top + scrollY);
  else if (t.hasAttribute('data-top')) scrollToY(0);
  else if (t.hasAttribute('data-see')) openSheet(BEATS[Number(t.closest<HTMLElement>('.beat')!.dataset.i)]);
  else if (t.hasAttribute('data-close')) closeSheet();
});

/* ---------------------------------------------------------------- 手機：看畫面 */
const sheet = $('#sheet');
let sheetReturn: HTMLElement | null = null;
function openSheet(b: Beat) {
  if (!b.scene) return;
  sheetReturn = document.activeElement as HTMLElement;
  $('#sheet-t').textContent = b.title!;
  $<HTMLIFrameElement>('#sheet-frame').src = `${DEMO}?embed&screen=${b.scene.screen}&${b.scene.params ?? ''}`;
  sheet.hidden = false;
  sheet.classList.toggle('is-wide', b.scene.device === 'browser');
  document.body.classList.add('sheet-open');
  $<HTMLButtonElement>('.sheet-x').focus();
}
function closeSheet() {
  sheet.hidden = true;
  $<HTMLIFrameElement>('#sheet-frame').src = 'about:blank';
  document.body.classList.remove('sheet-open');
  sheetReturn?.focus();
}
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sheet.hidden) closeSheet();
});

/* ---------------------------------------------------------------- 自己玩一次 */
const xframe = $<HTMLIFrameElement>('#xframe');

// 完整流程與贊助頁依內容長高，避免 iframe 內外兩層捲動；直播畫面與後台維持固定高度。
xframe.addEventListener('load', () => {
  const doc = xframe.contentDocument;
  const stage = doc?.querySelector<HTMLElement>('.demo-stage');
  if (!stage) return;
  const fit = () => {
    const screen = stage.dataset.screen ?? '';
    const content = stage.firstElementChild as HTMLElement | null;
    const auto = content && (screen === 'loop' || screen === 'donate');
    const pad = screen === 'loop' ? 32 : 0;
    xframe.style.height = auto ? `${Math.ceil(content.getBoundingClientRect().height + pad)}px` : '';
  };
  const ro = new ResizeObserver(fit);
  const watch = () => {
    ro.disconnect();
    if (stage.firstElementChild) ro.observe(stage.firstElementChild);
    fit();
  };
  new MutationObserver(watch).observe(stage, { childList: true, attributes: true, attributeFilter: ['data-screen'] });
  watch();
});
const fullLink = $<HTMLAnchorElement>('#launch-fs');
$$<HTMLButtonElement>('.launch-b').forEach((b) =>
  b.addEventListener('click', () => {
    $$('.launch-b').forEach((x) => x.classList.toggle('is-on', x === b));
    const params = b.dataset.params ?? '';
    xframe.contentWindow?.hbDemo?.show(b.dataset.screen!, params);
    fullLink.href = `${DEMO}?screen=${b.dataset.screen}${params ? `&${params}` : ''}`;
  }),
);

/* ---------------------------------------------------------------- 啟動 */
function relayout() {
  layout();
  active = -1;
  update(scrollY);
}
addEventListener('resize', () => {
  if (measure()) relayout();
});
relayout();
loadFilm();
if (film) requestAnimationFrame(scrubLoop);
document.fonts?.ready.then(relayout);
