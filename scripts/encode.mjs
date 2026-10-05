// 把 video/raw/c01～c08 接成一支影片，輸出三種畫質、各鏡頭停格圖，並改寫 src/film-manifest.ts。
// 用法：npm run encode（需要 ffmpeg 與 ffprobe 在 PATH 上）
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SHOTS = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08'];
const FPS = 24;
const RAW = 'video/raw';
const TMP = 'video/.work';
const OUT = 'public/film';
// 拖曳播放要能快速跳格：關鍵影格間隔固定 12 格、不用 B 幀。
const SEEKABLE = ['-g', '12', '-keyint_min', '12', '-sc_threshold', '0', '-bf', '0'];
const VARIANTS = [
  { key: 'hd', width: 1920, crf: 23 },
  { key: 'sd', width: 1280, crf: 25 },
  { key: 'lo', width: 854, crf: 30 },
];

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const ff = (args) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(1);
const hash = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 10);

const files = readdirSync(RAW);
const sources = SHOTS.map((id) => [id, files.find((f) => f.toLowerCase().startsWith(id) && /\.(mp4|mov|webm|mkv)$/i.test(f))]);
const missing = sources.filter(([, f]) => !f).map(([id]) => id);
if (missing.length) {
  console.error(`缺少鏡頭：${missing.join('、')}。請把檔案命名為 c01.mp4～c08.mp4 放進 ${RAW}/`);
  process.exit(1);
}

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const clips = {};
let start = 0;
const list = [];
for (const [id, file] of sources) {
  const norm = join(TMP, `${id}.mp4`);
  ff([
    '-i', join(RAW, file),
    '-t', '8',
    '-vf', `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=${FPS},setsar=1`,
    '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-pix_fmt', 'yuv420p',
    norm,
  ]);
  const frames = Number(
    run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', norm]).trim(),
  );
  clips[id] = { start, frames };
  start += frames;
  list.push(`file '${id}.mp4'`);
  // 停格圖取最後一格，字卡顯示時畫面停在這裡。
  ff(['-sseof', '-0.2', '-i', norm, '-update', '1', '-vf', 'scale=1600:-2', '-q:v', '3', join(OUT, `still-${id}.jpg`)]);
  console.log(`${id}：${frames} 格`);
}
writeFileSync(join(TMP, 'list.txt'), list.join('\n'));
const master = join(TMP, 'master.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', join(TMP, 'list.txt'), '-c', 'copy', master]);

const video = {};
for (const v of VARIANTS) {
  const out = join(OUT, `film-${v.key}.mp4`);
  ff([
    '-i', master,
    '-vf', `scale=${v.width}:-2`,
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(v.crf), '-pix_fmt', 'yuv420p',
    ...SEEKABLE, '-movflags', '+faststart',
    out,
  ]);
  video[v.key] = `film/film-${v.key}.mp4?v=${hash(out)}`;
  console.log(`film-${v.key}.mp4：${mb(out)} MB`);
}

ff(['-i', join(TMP, 'c01.mp4'), '-frames:v', '1', '-vf', 'scale=1600:-2', '-q:v', '3', join(OUT, 'still-poster.jpg')]);
// 直播畫面裡的鏡頭用 c01 結尾：實況主正對鏡頭微笑。
ff(['-sseof', '-0.2', '-i', join(TMP, 'c01.mp4'), '-update', '1', '-vf', 'scale=1280:-2', '-q:v', '4', join(OUT, 'still-cam.jpg')]);

const stills = { poster: `film/still-poster.jpg?v=${hash(join(OUT, 'still-poster.jpg'))}` };
for (const id of [...SHOTS, 'cam']) stills[id] = `film/still-${id}.jpg?v=${hash(join(OUT, `still-${id}.jpg`))}`;

const manifest = readFileSync('src/film-manifest.ts', 'utf8');
const head = manifest.slice(0, manifest.indexOf('export const FILM'));
const body = JSON.stringify({ fps: FPS, count: start, clips, video, stills }, null, 2);
writeFileSync('src/film-manifest.ts', `${head}export const FILM: Film = ${body};\n`);
rmSync(TMP, { recursive: true, force: true });

const lo = join(OUT, 'film-lo.mp4');
if (statSync(lo).size > 6 * 1024 * 1024) console.warn(`注意：film-lo.mp4 有 ${mb(lo)} MB，首次載入會偏慢，可考慮縮短鏡頭。`);
console.log(`完成：共 ${start} 格（${(start / FPS).toFixed(1)} 秒），已更新 src/film-manifest.ts`);
