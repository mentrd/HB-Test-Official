# HiveBee 宣傳站（概念測試）

HiveBee 直播贊助工具的**概念示範站**，用來測試「捲動影片敘事＋免登入互動示範」的宣傳效果。
本站不是 HiveBee 正式服務頁面：不會付款、不呼叫任何 HiveBee API，也不會連到任何直播。

## 結構

| 路徑 | 內容 |
|---|---|
| `index.html`、`src/story/` | 故事頁：背景影片跟著捲動播放，前景的手機、瀏覽器框同步顯示示範畫面 |
| `demo/index.html`、`src/demo/` | 互動示範：觀眾贊助頁、直播畫面（OBS 工具）、創作者後台（總覽、即時事件、互動工具箱、通知設定、套件中心）。版面與預設值對齊 HiveBee 正式站 |
| `public/hb/` | HiveBee 品牌素材（Logo、icon、吉祥物、工具預覽），來源見 ASSETS.md |
| `src/story/beats.ts` | 各章節的文案、對應鏡頭與示範畫面 |
| `src/film-manifest.ts` | 影片設定，由 `npm run encode` 產生 |
| `video/SHOTLIST.md` | 真人影片的分鏡、構圖規則與 AI 生成提示詞 |
| `ASSETS.md` | 素材來源與授權紀錄 |

## 開發

```bash
npm install
npm run dev        # 本機開發
npm run build      # 建置到 dist/
npm run preview    # 預覽建置結果
node scripts/fetch-icons.mjs   # 重新下載後台圖示（需要網路）
```

## 放入真人影片

目前背景是「真人影片待放入」的鏡頭佔位圖。影片到位後：

1. 依 [video/SHOTLIST.md](video/SHOTLIST.md) 生成或拍攝 8 個鏡頭，命名為 `c01.mp4`～`c08.mp4`，放進 `video/raw/`
2. 執行 `npm run encode`（需要 ffmpeg），會產生 `public/film/` 下的影片與停格圖，並更新 `src/film-manifest.ts`
3. 到 `ASSETS.md` 記錄素材來源；若影片是 AI 生成，在 `index.html` 頁尾註明「影片為 AI 生成」
4. 提交並推上 `main`，GitHub Actions 會自動部署

原始影片（`video/raw/`）不進版控。

## 播放方式

- 桌機：整支影片跟著捲動逐格播放，先載入低畫質，再背景換成高畫質
- 手機：iOS 捲動中跳格不穩定，改成進入章節時播放該段影片
- 開啟「減少動態效果」時：只顯示每章的停格圖

## 部署

推上 `main` 後由 `.github/workflows/deploy.yml` 部署到 GitHub Pages。
第一次使用前，要在 repo 的 Settings → Pages 把 Source 設為 **GitHub Actions**。

本站設定為不被搜尋引擎收錄（`robots.txt` 與 `noindex`）。
