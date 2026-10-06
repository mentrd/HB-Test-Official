import { DONATE_TYPES, MIN_AMOUNT, SLIDER_TICKS, asset } from '../shared/brand';
import { icon } from '../shared/icons';
import { SAMPLE_FANS, donate } from './state';
import { h } from './stream';
import type { View } from './views';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function typeIcon(name: string, cls = '') {
  const img = h('img', `type-ico ${cls}`);
  img.src = asset(`hb/icons/${name}.svg`);
  img.alt = '';
  return img;
}

function clip(name: string) {
  const v = h('video', 'clip');
  v.src = asset(`hb/tool/${name}.mp4`);
  v.muted = true;
  v.loop = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('aria-hidden', 'true');
  return v;
}

// 觀眾贊助頁：版面與文案對齊前台 /{urlName}/donate，寬度不足時切成手機版。
export function donateView(): View {
  const el = h('div', 'dn-wrap');
  const dn = h('div', 'dn');

  /* 左側欄（寬版才顯示） */
  const side = h('aside', 'dn-side');
  const logo = h('img', 'dn-logo');
  logo.src = asset('hb/logo.svg');
  logo.alt = 'HiveBee';
  const login = h('button', 'btn btn--primary dn-login', '登入');
  login.type = 'button';
  login.disabled = true;
  login.title = '示範免登入';
  side.append(logo, login);
  const nav = (title: string, items: Array<[string, Parameters<typeof icon>[0], boolean?]>) => {
    side.append(h('p', 'dn-nav-t', title));
    for (const [label, ic, on] of items) {
      const p = h('p', `dn-nav${on ? ' is-on' : ''}`);
      p.innerHTML = icon(ic);
      p.append(label);
      side.append(p);
    }
  };
  nav('頻道贊助', [
    ['付費贊助', 'gift', true],
    ['VIP 訂閱', 'vipBook'],
  ]);
  nav('會員功能', [
    ['會員中心', 'user'],
    ['交易紀錄', 'wallet'],
    ['常見問題', 'help'],
    ['前往創作者後台', 'brush'],
  ]);

  /* 手機頂部列 */
  const mhead = h('header', 'dn-mhead');
  const mlogo = h('img');
  mlogo.src = asset('hb/mark.svg');
  mlogo.alt = 'HiveBee';
  mhead.append(mlogo, h('span', 'dn-mhead-l', '登入'));

  const main = h('main', 'dn-main');

  /* 創作者資訊 */
  const banner = h('div', 'dn-banner');
  const bannerBee = h('img');
  bannerBee.src = asset('hb/img/work.png');
  bannerBee.alt = '';
  banner.append(bannerBee);
  const user = h('div', 'dn-user');
  const avatar = h('img', 'dn-avatar');
  avatar.src = asset('hb/img/default_head.png');
  avatar.alt = '';
  const info = h('div', 'dn-info');
  info.append(h('p', 'dn-name', 'Mimi 蜜蜜'), h('p', 'dn-remark', '唱歌聊天台｜每晚九點開播，歡迎一起來聊天 🎤'));
  user.append(avatar, info);

  /* 贊助類型 */
  const types = h('section', 'card dn-types');
  types.append(h('p', 'dn-types-t', '請選擇贊助方式'));
  const typeList = h('div', 'dn-type-list');
  DONATE_TYPES.forEach((t, i) => {
    const b = h('button', `dn-type${i === 0 ? ' is-on' : ''}`);
    b.type = 'button';
    b.disabled = !t.enabled;
    if (!t.enabled) b.title = '示範只開放文字贊助';
    const pic = h('div', 'dn-type-pic');
    pic.append(clip(t.clip));
    b.append(pic, typeIcon(t.icon), h('span', 'dn-type-n', t.name));
    typeList.append(b);
  });
  types.append(typeList);

  /* 步驟條 */
  const steps = h('div', 'dn-steps');
  const step = (n: number, title: string, sub: string) => {
    const s = h('div', `dn-step${n === 1 ? ' is-on' : ''}`);
    s.append(h('b', 'dn-step-n', String(n)));
    const t = h('div');
    t.append(h('p', 'dn-step-t', title), h('p', 'dn-step-s', sub));
    s.append(t);
    return s;
  };
  const s1 = step(1, '填寫贊助資訊', '在這裡可以設定您本次贊助活動的內容。');
  const s2 = step(2, '確認付款', '這樣就完成贊助囉！');
  steps.append(s1, h('i', 'dn-step-line'), s2);

  /* 表單 */
  const form = h('form', 'card dn-form');
  form.noValidate = true;
  const row = (label: string, ...fields: HTMLElement[]) => {
    const r = h('div', 'dn-row');
    r.append(h('label', 'dn-label', label));
    const f = h('div', 'dn-field');
    f.append(...fields);
    r.append(f);
    form.append(r);
    return f;
  };
  const shop = h('span', 'dn-shop', 'Mimi 的小店');
  row('商店資訊', shop);
  const nameIn = h('input', 'field-input');
  nameIn.maxLength = 25;
  nameIn.placeholder = '怎麼稱呼你';
  const nameErr = h('p', 'dn-err');
  row('我的暱稱', nameIn, nameErr);

  const amountIn = h('input', 'field-input dn-amount');
  amountIn.type = 'number';
  amountIn.min = String(MIN_AMOUNT);
  amountIn.placeholder = '請輸入金額';
  amountIn.value = String(MIN_AMOUNT);
  const slider = h('div', 'dn-slider');
  slider.setAttribute('role', 'slider');
  slider.tabIndex = 0;
  slider.setAttribute('aria-label', '贊助金額');
  const track = h('i', 'dn-slider-fill');
  slider.append(track);
  const dots = SLIDER_TICKS.map((v, i) => {
    const d = h('button', 'dn-dot');
    d.type = 'button';
    d.tabIndex = -1;
    d.title = `${v} 元`;
    d.style.left = `${(i / (SLIDER_TICKS.length - 1)) * 100}%`;
    d.addEventListener('click', () => setAmount(v));
    slider.append(d);
    return d;
  });
  const amountWrap = h('div', 'dn-amount-row');
  amountWrap.append(amountIn, slider);
  const amountErr = h('p', 'dn-err');
  row('贊助金額', amountWrap, amountErr);

  const msg = h('textarea', 'field-input dn-msg');
  msg.maxLength = 150;
  msg.placeholder = '請輸入留言，最多150字...';
  row('贊助留言', msg);

  function nearest(v: number) {
    return SLIDER_TICKS.reduce((best, t, i) => (Math.abs(t - v) < Math.abs(SLIDER_TICKS[best] - v) ? i : best), 0);
  }
  function syncSlider() {
    const idx = nearest(Number(amountIn.value) || 0);
    track.style.width = `${(idx / (SLIDER_TICKS.length - 1)) * 100}%`;
    dots.forEach((d, i) => d.classList.toggle('is-on', i <= idx));
    slider.setAttribute('aria-valuenow', amountIn.value);
    sumAmount.textContent = `$ ${Number(amountIn.value) || 0} TWD`;
    subtotal.textContent = `$ ${Number(amountIn.value) || 0} TWD`;
  }
  function setAmount(v: number) {
    amountIn.value = String(v);
    syncSlider();
  }
  amountIn.addEventListener('input', syncSlider);
  slider.addEventListener('keydown', (e) => {
    const idx = nearest(Number(amountIn.value));
    if (e.key === 'ArrowRight') setAmount(SLIDER_TICKS[Math.min(SLIDER_TICKS.length - 1, idx + 1)]);
    if (e.key === 'ArrowLeft') setAmount(SLIDER_TICKS[Math.max(0, idx - 1)]);
  });

  /* 金額摘要與按鈕 */
  const summary = h('section', 'card dn-sum');
  const sumAmount = h('b');
  const subtotal = h('b', 'dn-subtotal');
  const r1 = h('p', 'dn-sum-row');
  r1.append(h('span', '', '贊助金額'), sumAmount);
  const r2 = h('p', 'dn-sum-row is-total');
  r2.append(h('span', '', '小計（手續費另計）'), subtotal);
  const go = h('button', 'btn btn--action dn-go', '立即贊助');
  go.type = 'button';
  const back = h('button', 'dn-back');
  back.type = 'button';
  back.innerHTML = `${icon('back')}<span>返回編輯</span>`;
  const payBtns = h('div', 'dn-pay-btns');
  const multi = h('button', 'btn btn--outline-primary', '多元贊助支付');
  const quick = h('button', 'btn btn--outline-secondary', '快速贊助付款');
  multi.type = quick.type = 'button';
  payBtns.append(multi, quick);
  summary.append(r1, r2, go, payBtns);

  /* 付款區 */
  const pay = h('section', 'card dn-pay');
  const mailRow = h('div', 'dn-mail');
  mailRow.innerHTML = `${icon('email')}<b>填寫交易通知信箱</b>`;
  const mail = h('input', 'field-input');
  mail.type = 'email';
  mail.placeholder = '請提供電子郵件以寄送發票';
  mail.value = 'demo@example.com';
  const terms = h('button', 'dn-terms');
  terms.type = 'button';
  terms.setAttribute('aria-pressed', 'false');
  const termsText = h('span', '', '當您勾選表示您同意接受本平臺「服務條款」，以及以下聲明。1. 同意接受記錄本次付款資訊，存取於第三方支付系統（統一金流）');
  const termsErr = h('p', 'dn-err');
  const setTerms = (on: boolean) => {
    terms.setAttribute('aria-pressed', String(on));
    terms.innerHTML = icon(on ? 'check' : 'checkOff', on ? 'is-ok' : '');
    terms.append(termsText);
  };
  setTerms(false);
  terms.addEventListener('click', () => setTerms(terms.getAttribute('aria-pressed') !== 'true'));
  const detail = h('div', 'dn-pay-detail');
  const confirm = h('button', 'btn btn--primary dn-confirm', '確認付款');
  confirm.type = 'button';
  pay.append(mailRow, mail, terms, termsErr, detail, confirm);

  const total = () => Number(amountIn.value) || 0;
  function renderQuick() {
    detail.replaceChildren();
    detail.append(h('p', 'dn-pay-t', '信用卡付款（一次付清）'));
    const due = h('p', 'dn-due');
    due.append(h('span', '', '應付總金額'), h('b', '', `$ ${total()} TWD`));
    const cardBox = h('div', 'dn-cc is-on');
    cardBox.style.backgroundImage = `url(${asset('hb/img/creditcard.png')})`;
    cardBox.append(h('span', 'dn-cc-brand', 'VISA'), h('span', 'dn-cc-no', '****  ****  ****  4242'), h('span', 'dn-cc-exp', '到期 12/28　安全碼 ***'));
    detail.append(due, h('p', 'dn-pay-sub', '我的卡片'), cardBox, h('p', 'dn-pay-sub', '付款方式　末碼為4242的VISA卡　到期：12/28'));
  }
  function renderMulti() {
    detail.replaceChildren();
    const list = h('div', 'dn-methods');
    ['信用卡付款（一次付清）', 'ATM', '超商代碼'].forEach((m, i) => {
      const l = h('label', `dn-method${i === 0 ? ' is-on' : ''}`);
      const r = h('input');
      r.type = 'radio';
      r.name = 'method';
      r.checked = i === 0;
      r.addEventListener('change', () => list.querySelectorAll('.dn-method').forEach((x) => x.classList.toggle('is-on', x === l)));
      l.append(r, h('span', '', m));
      list.append(l);
    });
    const due = h('p', 'dn-due');
    due.append(h('span', '', '應付總金額'), h('b', '', `$ ${total()} TWD`));
    detail.append(list, due, h('p', 'dn-pay-sub', '也可以使用 PayPal 付款（示範不顯示 PayPal 按鈕）'));
  }

  /* 成功視窗：正式站是瀏覽器原生提示，示範改成頁內視窗 */
  const done = h('div', 'dn-done');
  done.hidden = true;
  const doneBox = h('div', 'dn-done-box');
  const doneImg = h('img');
  doneImg.src = asset('hb/img/happy.png');
  doneImg.alt = '';
  const doneOk = h('button', 'btn btn--primary', '確定');
  doneOk.type = 'button';
  doneBox.append(doneImg, h('p', 'dn-done-t', '交易成功，感謝您的贊助!'), h('p', 'dn-done-s', '示範不會付款，看看直播畫面上的通知吧！'), doneOk);
  done.append(doneBox);

  const body = h('div', 'dn-body');
  const right = h('div', 'dn-right');
  right.append(steps, form, summary, back, pay);
  body.append(types, right);
  main.append(banner, user, body);
  dn.append(side, mhead, main);
  el.append(dn, done);

  /* 流程 */
  let stepNo = 1;
  let method: 'quick' | 'multi' | null = null;
  function setStep(n: number) {
    stepNo = n;
    dn.dataset.step = String(n);
    s2.classList.toggle('is-on', n === 2);
    if (n === 1) {
      method = null;
      multi.classList.remove('is-on');
      quick.classList.remove('is-on');
    }
    pay.hidden = n === 1 || !method;
  }
  function validate() {
    let ok = true;
    nameErr.textContent = nameIn.value.trim() ? '' : '我的暱稱為必填';
    if (nameErr.textContent) ok = false;
    const a = Number(amountIn.value);
    amountErr.textContent = !amountIn.value ? '贊助金額為必填' : a < MIN_AMOUNT ? `金額不可小於${MIN_AMOUNT}元` : '';
    if (amountErr.textContent) ok = false;
    return ok;
  }
  const reveal = (n: HTMLElement) => requestAnimationFrame(() => n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  go.addEventListener('click', () => {
    if (!validate()) return;
    setStep(2);
    reveal(summary);
  });
  back.addEventListener('click', () => setStep(1));
  const choose = (m: 'quick' | 'multi') => {
    method = m;
    quick.classList.toggle('is-on', m === 'quick');
    multi.classList.toggle('is-on', m === 'multi');
    if (m === 'quick') renderQuick();
    else renderMulti();
    pay.hidden = false;
    reveal(pay);
  };
  quick.addEventListener('click', () => choose('quick'));
  multi.addEventListener('click', () => choose('multi'));
  confirm.addEventListener('click', () => {
    if (terms.getAttribute('aria-pressed') !== 'true') {
      termsErr.textContent = '請同意服務條款';
      return;
    }
    termsErr.textContent = '';
    donate(nameIn.value.trim(), total(), msg.value.trim());
    done.hidden = false;
    doneOk.focus();
  });
  doneOk.addEventListener('click', () => {
    done.hidden = true;
    msg.value = '';
    setTerms(false);
    setStep(1);
  });

  syncSlider();
  setStep(1);

  return {
    el,
    // 故事模式：自動走一次贊助流程。
    async auto() {
      const [name, text] = SAMPLE_FANS[0];
      await wait(500);
      for (const ch of name) {
        nameIn.value += ch;
        await wait(110);
      }
      await wait(250);
      for (const v of [75, 150, 300]) {
        setAmount(v);
        await wait(220);
      }
      for (const ch of text) {
        msg.value += ch;
        await wait(90);
      }
      await wait(450);
      go.click();
      await wait(700);
      quick.click();
      await wait(700);
      setTerms(true);
      await wait(500);
      if (stepNo === 2) confirm.click();
    },
  };
}
