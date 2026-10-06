export interface Scene {
  device: 'phone' | 'browser';
  screen: string;
  params?: string;
}

export interface Beat {
  id: string;
  card?: 'hero' | 'finale';
  /** 播放這段影片佔幾個畫面高的捲動距離 */
  play?: number;
  /** 停在最後一格、顯示字卡佔幾個畫面高 */
  hold: number;
  nav?: string;
  kicker?: string;
  title?: string;
  sub?: string;
  scene?: Scene;
  chip?: [string, string];
}

// 文案只描述 HiveBee 現有功能；示範畫面對應 demo/ 的 screen 與參數。
export const BEATS: Beat[] = [
  { id: 'hero', card: 'hero', hold: 1.1 },
  {
    id: 'c01',
    play: 1.4,
    hold: 1.3,
    nav: '開播',
    kicker: '01・開播前',
    title: '你專心創作，讓支持自然發生',
    sub: '通知、卡片、互動目標、倒數計時，從直播互動箱複製網址貼進 OBS 就上線。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&build' },
  },
  {
    id: 'c02',
    play: 1.4,
    hold: 1.4,
    nav: '觀眾支持',
    kicker: '02・觀眾支持',
    title: '一句留言，一份支持',
    sub: '觀眾打開你的贊助頁，選擇文字、猜獎、任務、猜謎、塗鴉或影音贊助，用信用卡、ATM、超商代碼或 PayPal 完成支持。',
    scene: { device: 'phone', screen: 'donate', params: 'auto' },
  },
  {
    id: 'c03',
    play: 1.4,
    hold: 1.3,
    nav: '互動出現',
    kicker: '03・互動出現',
    title: '支持，不只停在付款完成',
    sub: '付款一完成，通知立刻跳上直播畫面：暱稱、金額、留言，加上你設定的圖片、音效與文字特效。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&amount=300' },
    chip: ['新贊助', 'TWD 300'],
  },
  {
    id: 'c04',
    play: 1.4,
    hold: 1.4,
    nav: '目標達成',
    kicker: '04・目標達成',
    title: '進度條衝滿的那一刻，全場一起歡呼',
    sub: '大額支持換上專屬的通知模式，卡片依金額變色，互動目標與倒數計時同步更新。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&amount=3000&fill' },
    chip: ['互動目標', '100%'],
  },
  {
    id: 'c05',
    play: 1.4,
    hold: 1.4,
    nav: '你的風格',
    kicker: '05・你的風格',
    title: '讓互動，融入你的直播風格',
    sub: '依金額區間設定不同的通知模式：圖片、音效、回覆文字、字型與文字特效都能自訂，還能用文字轉語音唸出留言。',
    scene: { device: 'browser', screen: 'dashboard', params: 'page=alert&auto' },
  },
  {
    id: 'c06',
    play: 1.4,
    hold: 1.5,
    nav: '套件中心',
    kicker: '06・套件中心',
    title: '想要新玩法？到套件中心裝一個',
    sub: '在套件中心挑選互動套件，安裝後取得 OBS 網址就能用；開發者也能用 AI 做出自己的套件並上架。',
    scene: { device: 'browser', screen: 'dashboard', params: 'page=plugins&auto' },
  },
  {
    id: 'c07',
    play: 1.4,
    hold: 1.4,
    nav: '回到後台',
    kicker: '07・回到後台',
    title: '精彩留在畫面，紀錄清楚掌握',
    sub: '下播後打開後台，即時事件、收入統計與贊助金額趨勢一目了然，贊助歷史還能匯出查詢結果。',
    scene: { device: 'browser', screen: 'dashboard', params: 'page=overview&auto' },
    chip: ['即時事件', '同步更新'],
  },
  {
    id: 'c08',
    play: 1.4,
    hold: 1.1,
    nav: '換你了',
    kicker: '08・換你了',
    title: '下一場精彩，由你開播',
    sub: '用 Google 或 Twitch 帳號就能註冊創作者帳號。',
  },
  { id: 'finale', card: 'finale', hold: 1.2 },
];
