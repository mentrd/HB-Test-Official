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

export const BEATS: Beat[] = [
  { id: 'hero', card: 'hero', hold: 1.1 },
  {
    id: 'c01',
    play: 1.4,
    hold: 1.3,
    nav: '開播',
    kicker: '01・開播前',
    title: '你專心創作，讓支持自然發生',
    sub: '通知、留言卡片、排行榜、目標進度條，複製網址貼進 OBS 就上線。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&build' },
  },
  {
    id: 'c02',
    play: 1.4,
    hold: 1.4,
    nav: '觀眾支持',
    kicker: '02・觀眾支持',
    title: '一句留言，一份支持',
    sub: '觀眾打開你的贊助頁，選文字、影音、塗鴉或猜謎，用信用卡、ATM、超商代碼或 PayPal 完成支持。',
    scene: { device: 'phone', screen: 'donate', params: 'auto' },
  },
  {
    id: 'c03',
    play: 1.4,
    hold: 1.3,
    nav: '互動出現',
    kicker: '03・互動出現',
    title: '支持，不只停在付款完成',
    sub: '付款一完成，通知立刻跳上直播畫面：暱稱、金額、留言，還有你設定的動畫與音效。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&tier=2' },
    chip: ['新贊助', 'NT$300'],
  },
  {
    id: 'c04',
    play: 1.4,
    hold: 1.4,
    nav: '目標達成',
    kicker: '04・目標達成',
    title: '進度條衝滿的那一刻，全場一起歡呼',
    sub: '通知依金額分級，大額支持配上斗內掉落與更大的舞台，目標進度條同步更新。',
    scene: { device: 'browser', screen: 'stream', params: 'auto&tier=3&fill' },
    chip: ['今晚目標', '100%'],
  },
  {
    id: 'c05',
    play: 1.4,
    hold: 1.4,
    nav: '你的風格',
    kicker: '05・你的風格',
    title: '讓互動，融入你的直播風格',
    sub: '版面、配色、動畫、音效與金額門檻都能自訂，留言卡片、倒數計時、發燒列車也能一起換裝。',
    scene: { device: 'browser', screen: 'styles', params: 'auto' },
  },
  {
    id: 'c06',
    play: 1.4,
    hold: 1.5,
    nav: '套件中心',
    kicker: '06・套件中心',
    title: '想要新玩法？到套件中心裝一個',
    sub: '在套件商店挑選互動套件，一鍵裝到直播畫面；開發者也能用 AI 做出自己的套件並上架。',
    scene: { device: 'browser', screen: 'plugins', params: 'auto' },
  },
  {
    id: 'c07',
    play: 1.4,
    hold: 1.4,
    nav: '回到後台',
    kicker: '07・回到後台',
    title: '精彩留在畫面，紀錄清楚掌握',
    sub: '下播後打開後台，每筆贊助、留言與統計都在這裡，還能匯出對帳。',
    scene: { device: 'browser', screen: 'dashboard', params: 'auto' },
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
