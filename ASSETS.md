# 素材來源與授權

每新增一個素材都要記錄在這裡。公開 repo 內不得放入來源或授權不明的素材。

## HiveBee 品牌素材

以下都是 HiveBee 自有素材，取自前台（Hivebee-Frontstage-Frontend）已公開提供的檔案。

| 檔案 | 來源 |
|---|---|
| `public/hb/logo.svg`、`logo-dark.svg`、`mark.svg` | `public/images/logo_hivebee2.svg`、`logo_hivebee2_dark.svg`、`logo_hivebee1.svg` |
| `public/hb/3d/*.webp` | HiveBee 2.0 設計稿（Figma「HiveBee 2.0」0923 新提案風格・蜜蜂元素），自公開檢視畫面截圖去背；正式上線前應改用設計師原檔匯出 |
| `public/hb/icons/*.svg` | `app/assets/icons/`（工具與贊助類型 icon） |
| `public/hb/img/alert-bee.webp` | `public/images/loading.gif`，轉成 WebP |
| `public/hb/img/happy.png`、`work.png` | `public/images/notification-bees/` |
| `public/hb/img/nothing.png`、`default_head.png`、`creditcard.png` | `public/images/` |
| `public/hb/img/treasure*.png` | `public/images/train/` |
| `public/hb/tool/*.mp4` | `public/images/toolbox/*.gif`，截取前 6 秒轉成 MP4 |

## 圖示

`src/shared/icons.ts` 由 `scripts/fetch-icons.mjs` 從 Iconify 下載後內嵌，與 HiveBee 後台使用的圖示相同。

| 圖示集 | 授權 |
|---|---|
| Material Design Icons（mdi） | Apache 2.0 |
| MingCute | Apache 2.0 |
| Material Symbols | Apache 2.0 |
| Google Material Icons（ic） | Apache 2.0 |
| IconPark | Apache 2.0 |
| Entypo+ | CC BY-SA 4.0（© Daniel Bruce） |
| Heroicons | MIT |
| Tabler Icons | MIT |
| Majesticons | MIT |

## 字型

| 字型 | 來源 | 授權 |
|---|---|---|
| Noto Sans TC | Google Fonts | SIL Open Font License 1.1 |
| Open Sans | Google Fonts | SIL Open Font License 1.1 |

## 影片

| 檔案 | 來源 | 工具／拍攝者 | 生成日期或拍攝日期 | 授權 |
|---|---|---|---|---|
| `public/film/placeholder/*.svg` | 本專案 `scripts/make-placeholders.mjs` 產生 | — | — | 自製 |
| `public/film/film-*.mp4` | 待填 | 待填 | 待填 | 待填（AI 工具的商用條款，或演員肖像授權書） |

## 示範內容

- 實況主「Mimi 蜜蜜」、觀眾暱稱、金額與後台數據皆為虛構示意
- 套件中心內的套件（應援燈牌、蜜蜂雨、幸運轉盤、即時投票）為示意範例，不代表已上架的實際套件
- 版面、色票、文案與預設值參照 HiveBee 前後台的規格重新實作，未使用 HiveBee 正式產品的程式碼
