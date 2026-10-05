// 真人影片到位前的鏡頭佔位：只畫直播房間的光線，不畫人物，避免被誤認成定稿素材。
import { mkdirSync, writeFileSync } from 'node:fs';

const SHOTS = {
  c01: '實況主開播',
  c02: '觀眾用手機贊助',
  c03: '實況主收到贊助',
  c04: '目標達成歡呼',
  c05: '調整通知樣式',
  c06: '安裝新套件',
  c07: '下播看後台',
  c08: '對鏡頭邀請',
};

function frame(id, label, withText = true) {
  const bokeh = [
    [220, 180, 90, '#8b5cf6', 0.35],
    [1380, 210, 120, '#ffb805', 0.28],
    [1180, 640, 70, '#ff5fa2', 0.22],
    [380, 700, 110, '#058aff', 0.18],
    [820, 120, 60, '#ffd34d', 0.2],
  ]
    .map(([x, y, r, c, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}" filter="url(#b)"/>`)
    .join('');
  const text = withText
    ? `<g font-family="system-ui, sans-serif" text-anchor="middle" fill="#fff">
<text x="640" y="430" font-size="40" font-weight="700" opacity=".9">真人影片待放入</text>
<text x="640" y="486" font-size="28" opacity=".6">${id}・${label}</text>
</g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#120c22"/><stop offset="1" stop-color="#2a1840"/></linearGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#bg)"/>
${bokeh}
<rect x="40" y="40" width="1520" height="820" rx="24" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3" stroke-dasharray="14 12"/>
<g stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none">
<path d="M80 130 V80 H130 M1470 80 H1520 V130 M1520 770 V820 H1470 M130 820 H80 V770"/>
</g>
${text}
</svg>
`;
}

mkdirSync('public/film/placeholder', { recursive: true });
for (const [id, label] of Object.entries(SHOTS)) writeFileSync(`public/film/placeholder/${id}.svg`, frame(id, label));
writeFileSync('public/film/placeholder/cam.svg', frame('cam', '', false));
console.log(`已產生 ${Object.keys(SHOTS).length + 1} 張鏡頭佔位圖`);
