export const LINKS = {
  signup: 'https://www.hivebee.com.tw/login?tab=creator',
  manual: 'https://www.hivebee.com.tw/manual',
  home: 'https://www.hivebee.com.tw/',
};

/** 素材根目錄：故事頁在站台根目錄、示範頁在 demo/ 底下 */
export const asset = (p: string) => `${location.pathname.includes('/demo/') ? '../' : ''}${p}`;

export interface DonateType {
  key: string;
  name: string;
  icon: string;
  clip: string;
  enabled: boolean;
  desc: string;
}

// 名稱、icon、預覽圖對齊前台 donateTypes.ts；示範只開放文字贊助。
export const DONATE_TYPES: DonateType[] = [
  { key: 'text', name: '文字贊助', icon: 'H', clip: 'alert', enabled: true, desc: '輸入暱稱、金額與留言，付款完成後立即在直播畫面跳出通知與卡片。' },
  { key: 'guess', name: '猜獎贊助', icon: 'Bee', clip: 'guess', enabled: false, desc: '透過贊助者發送的「幸運寶箱」，在直播中與彼此互動，一同享受開盲盒的刺激時光。' },
  { key: 'challenge', name: '任務贊助', icon: 'Nest', clip: 'challenge', enabled: false, desc: '迎接挑戰！接受贊助者發起的任務，在有限時間內完成，爭取豐富獎勵，一起玩得開心！' },
  { key: 'qa', name: '猜謎贊助', icon: 'Flower', clip: 'qa', enabled: false, desc: '參與由贊助者發起的猜謎活動，一邊在直播中猜對正確答案，一邊與粉絲互動，打造有趣的觀看體驗！' },
  { key: 'paint', name: '塗鴉贊助', icon: 'Lollipop', clip: 'paint', enabled: false, desc: '接受贊助者的塗鴉，即時在直播中展示！豐富您的直播空間，拉近與贊助者和觀眾之間的互動距離！' },
  { key: 'media', name: '影音贊助', icon: 'Drop2', clip: 'media', enabled: false, desc: '接受贊助者的影片，即時在直播中展示！依影片秒數計價，主播可設定審核後才播放。' },
];

// 贊助頁金額滑桿刻度與最低金額，對齊前台 MoneyList。
export const SLIDER_TICKS = [15, 75, 150, 300, 750, 1500, 3000];
export const MIN_AMOUNT = 15;

// 卡片依金額級距換色，對齊後端 CardSettingService 的預設值。
export const CARD_TIERS: Array<[number, string]> = [
  [3000, '#D50000'],
  [1500, '#E91E63'],
  [750, '#F57C00'],
  [300, '#EAA700'],
  [150, '#00C853'],
  [75, '#00ACC1'],
  [0, '#1E88E5'],
];
export const tierColor = (amount: number) => CARD_TIERS.find(([min]) => amount >= min)![1];

export const EFFECTS: Array<[string, string]> = [
  ['wiggle', '扭動'],
  ['pulse', '脈衝'],
  ['wave', '波浪'],
  ['wobble', '搖擺'],
  ['rubberBand', '彈性伸縮'],
  ['ml2', '舞動'],
];

export const DEFAULT_TEMPLATE = '謝謝　${Name}　的　${Amount}！';

export const TOOLS = [
  { key: 'card', name: '卡片', icon: 'Card2', clip: 'event', desc: '根據贊助者不同金額等級的贊助，在直播中跳出不同顏色的留言小卡。' },
  { key: 'alert', name: '通知', icon: 'Alert2', clip: 'alert', desc: '根據贊助者不同金額等級的贊助，在直播中跳出不同的感謝畫面。' },
  { key: 'goal', name: '互動目標', icon: 'Target', clip: 'goal', desc: '設定贊助目標，在直播畫面上顯示達成進度條，與粉絲一同享受達成目標的樂趣。' },
  { key: 'count', name: '倒數計時', icon: 'Clock', clip: 'count', desc: '透過贊助者的贊助增加直播時間，並在直播畫面上顯示剩餘時間。' },
  { key: 'drop', name: '斗內掉落', icon: 'Drop', clip: 'drop', desc: '搭配 VTube Studio，依贊助金額向直播主丟出各式各樣的物品。' },
  { key: 'train', name: '發燒列車', icon: 'H', clip: 'train', desc: '透過贊助者們的協力贊助，觸發直播主各種不同的反應。' },
];
export const GAMES = [
  { key: 'guess', name: '猜獎贊助', icon: 'Bee', clip: 'guess', desc: '透過贊助者發送的「幸運寶箱」，在直播中一同享受開盲盒的刺激時光。' },
  { key: 'challenge', name: '任務贊助', icon: 'Nest', clip: 'challenge', desc: '接受贊助者發起的任務，在有限時間內完成，一起玩得開心！' },
  { key: 'qa', name: '猜謎贊助', icon: 'Flower', clip: 'qa', desc: '參與由贊助者發起的猜謎活動，一邊猜答案一邊與粉絲互動。' },
  { key: 'paint', name: '塗鴉贊助', icon: 'Lollipop', clip: 'paint', desc: '接受贊助者的塗鴉，即時在直播中展示！' },
  { key: 'media', name: '影音贊助', icon: 'Drop2', clip: 'media', desc: '接受贊助者的影片，即時在直播中展示！' },
];

export const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;
export const twd = (n: number) => `${n.toLocaleString('en-US')} TWD`;
