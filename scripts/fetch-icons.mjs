// 從 Iconify 下載後台用到的開源圖示，產生 src/shared/icons.ts（離線內嵌，不在執行期打外部 API）。
import { writeFileSync } from 'node:fs';

const ICONS = {
  overview: 'mingcute:grid-2-fill',
  event: 'mdi:event',
  page: 'material-symbols:featured-play-list',
  obs: 'mdi:chat-alert',
  tool: 'mingcute:tool-fill',
  game: 'mingcute:game-2-fill',
  shop: 'entypo:shop',
  bounty: 'heroicons:currency-dollar-solid',
  puzzle: 'mdi:puzzle',
  celebrate: 'mingcute:celebrate-fill',
  keyword: 'mdi:gamepad',
  blacklist: 'mdi:face-sad',
  vip: 'material-symbols:assignment',
  order: 'material-symbols:home',
  payment: 'mdi:payment',
  faq: 'mdi:question-mark-box',
  bell: 'tabler:bell-filled',
  arrowDown: 'material-symbols:keyboard-arrow-down-rounded',
  menuRight: 'mdi:menu-right',
  clock: 'mdi:clock-time-five',
  eye: 'mdi:eye',
  copy: 'ic:outline-content-copy',
  open: 'majesticons:open-line',
  replay: 'mdi:replay',
  play: 'mdi:play',
  cardRemove: 'mdi:card-remove',
  warning: 'mdi:warning',
  plusCircle: 'mdi:plus-circle',
  edit: 'icon-park-outline:edit-two',
  delete: 'mdi:delete',
  email: 'mdi:email-outline',
  check: 'ic:round-check-circle',
  checkOff: 'ic:outline-circle',
  back: 'mdi:chevron-left',
  medal: 'material-symbols:military-tech',
  gift: 'mdi:gift',
  vipBook: 'mdi:book',
  user: 'mdi:account-circle',
  wallet: 'mdi:wallet',
  help: 'mdi:help-circle',
  brush: 'mdi:brush',
  heart: 'mdi:cards-heart',
  pin: 'mdi:pin',
};

const out = {};
for (const [key, id] of Object.entries(ICONS)) {
  const [set, name] = id.split(':');
  const res = await fetch(`https://api.iconify.design/${set}/${name}.svg?height=1em`);
  if (!res.ok) throw new Error(`${id}: ${res.status}`);
  out[key] = (await res.text()).replace(/\s+/g, ' ').trim();
}

const body = Object.entries(out)
  .map(([k, svg]) => `  ${k}: '${svg.replace(/'/g, "\\'")}',`)
  .join('\n');
writeFileSync(
  'src/shared/icons.ts',
  `// 由 scripts/fetch-icons.mjs 產生，來源與授權見 ASSETS.md。\nexport const ICON = {\n${body}\n} as const;\n\nexport type IconName = keyof typeof ICON;\n\nexport const icon = (name: IconName, cls = '') => \`<i class="ico \${cls}" aria-hidden="true">\${ICON[name]}</i>\`;\n`,
);
console.log(`已產生 ${Object.keys(out).length} 個圖示`);
