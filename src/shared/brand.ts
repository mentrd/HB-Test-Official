export const LINKS = {
  signup: 'https://www.hivebee.com.tw/login?tab=creator',
  manual: 'https://www.hivebee.com.tw/manual',
  home: 'https://www.hivebee.com.tw/',
};

export interface Tier {
  level: 1 | 2 | 3;
  amount: number;
  name: string;
  duration: number;
}

// 示意金額三檔，對應正式產品「依金額區間分組的通知」。
export const TIERS: Tier[] = [
  { level: 1, amount: 50, name: '一般', duration: 3200 },
  { level: 2, amount: 300, name: '閃亮', duration: 4600 },
  { level: 3, amount: 1000, name: '超級', duration: 6400 },
];

export const tierOf = (amount: number): Tier =>
  [...TIERS].reverse().find((t) => amount >= t.amount) ?? TIERS[0];

export const money = (n: number) => `NT$${n.toLocaleString('zh-TW')}`;
