// 由 scripts/encode.mjs 產生。video 為 null 代表影片尚未生成，頁面改用逐章靜態圖。
export interface FilmClip {
  start: number;
  frames: number;
}

export interface Film {
  fps: number;
  count: number;
  clips: Record<string, FilmClip>;
  video: { lo: string; sd: string; hd: string } | null;
  stills: Record<string, string>;
}

export const FILM: Film = {
  fps: 24,
  count: 0,
  clips: {},
  video: null,
  stills: {
    poster: 'film/placeholder/c01.svg',
    c01: 'film/placeholder/c01.svg',
    c02: 'film/placeholder/c02.svg',
    c03: 'film/placeholder/c03.svg',
    c04: 'film/placeholder/c04.svg',
    c05: 'film/placeholder/c05.svg',
    c06: 'film/placeholder/c06.svg',
    c07: 'film/placeholder/c07.svg',
    c08: 'film/placeholder/c08.svg',
    cam: 'film/placeholder/cam.svg',
  },
};
