# 真人影片分鏡與生成指引

宣傳站的背景是一支由 8 個鏡頭接成的影片，捲動到哪就播到哪。
畫面上的通知、手機、後台都是網頁疊上去的，**影片只負責拍真人**。

素材有兩種來源，可以混用：

- **A. 寫實 AI 生成**：Kling、Veo、Higgsfield 等，以下附英文提示詞
- **B. 實際拍攝**：找演員或真實實況主，依同一份分鏡拍攝

## 交付規格

| 項目 | 規格 |
|---|---|
| 比例與解析度 | 16:9，至少 1920×1080 |
| 每個鏡頭長度 | 4～6 秒 |
| 影格率 | 24 fps 以上（轉檔時統一成 24） |
| 聲音 | 不需要，網站播放時是靜音 |
| 檔名 | `c01.mp4` ～ `c08.mp4`，放進 `video/raw/` |

## 構圖規則（每個鏡頭都要遵守）

網頁會在畫面上疊東西，人物要避開這些區域：

```
┌──────────────────────────────────────────┐
│                       │                  │
│     人物放這裡          │  右側 45%：       │
│     （臉在畫面 35～45%  │  網頁會疊上手機   │
│       的水平位置、      │  或瀏覽器視窗，    │
│       上半部）          │  背景保持單純      │
│                       │                  │
│ 左下角：章節字卡        │                  │
└──────────────────────────────────────────┘
```

- 人物的臉放在水平 35～45% 的位置：手機版只會裁出中間約 26% 的寬度
- **畫面中不能出現任何可讀的螢幕、文字、Logo**：螢幕背對鏡頭或在畫面外，手機螢幕不要朝向鏡頭
- **最後一格要好看**：網站會停在每個鏡頭的最後一格顯示字卡，結尾避免眨眼、晃動、動作模糊
- 不要生成金幣、彩帶、特效：這些由網頁疊加，才能和通知同步
- 8 個鏡頭的燈光、服裝、房間保持一致

## 角色設定

**實況主 Mimi**

- 20 多歲的台灣女性，黑色長直髮及胸，自然淡妝，笑容親切、表情豐富
- 服裝：芥末黃（接近 HiveBee 品牌色 #FFB805）寬鬆帽 T
- 配件：頭戴式耳機、桌上電容式麥克風（懸臂支架）
- 房間：夜晚的直播房，背後有紫色與粉色 LED 燈條、層架上有公仔和植物，人物前方有環形燈造成的眼神光

**觀眾 阿哲**（只出現在 c02）

- 20 多歲的台灣男性，短髮，居家 T 恤
- 晚上窩在客廳沙發，暖色檯燈

**寫實 AI 生成**：人物必須是虛構的，提示詞不可指定或模仿任何真實主播、藝人；生成後比對確認不像特定真人。

**實際拍攝**：每位入鏡者都要簽肖像授權書，範圍需包含網路宣傳、使用期間與地區。

## 分鏡

| 鏡頭 | 對應章節 | 動作 | 運鏡 | 結尾停格 |
|---|---|---|---|---|
| c01 | 開播前 | Mimi 坐下、戴上耳機，伸手按下鍵盤，環形燈亮起，對鏡頭微笑 | 緩慢推近 | 對鏡頭微笑 |
| c02 | 觀眾支持 | 阿哲在沙發上看手機，笑出來，打字後按下送出，期待地抬頭 | 固定，淺景深 | 拿著手機、期待的表情 |
| c03 | 互動出現 | Mimi 看向畫面右側的螢幕，眼睛睜大、摀嘴，接著開心大笑，雙手合十道謝 | 固定 | 雙手合十、笑著看鏡頭 |
| c04 | 目標達成 | Mimi 從椅子上跳起來歡呼，雙手高舉，興奮地跳動 | 稍微拉遠 | 雙手比愛心或比讚 |
| c05 | 你的風格 | Mimi 專心看螢幕、操作滑鼠，螢幕光映在臉上，滿意地點頭 | 側面 3/4 角度 | 滿意的微笑 |
| c06 | 套件中心 | Mimi 瀏覽螢幕、點一下，驚喜地指著螢幕，轉頭對鏡頭眨眼 | 固定 | 俏皮地看著鏡頭 |
| c07 | 回到後台 | 下播後的 Mimi，耳機掛在脖子上、捧著馬克杯，輕鬆地滑著滑鼠看紀錄 | 緩慢推近 | 放鬆滿足的微笑 |
| c08 | 換你了 | Mimi 看著鏡頭溫暖地笑，伸手做出「換你了」的邀請手勢 | 緩慢推近 | 手勢停住、看著鏡頭 |

## AI 生成流程

1. **先做定裝照**：用 Higgsfield Soul、Midjourney 或 Flux 生成 Mimi 的寫實照片，挑一張當作角色參考
2. **每個鏡頭用「圖生影片」**：以定裝照（或上一個鏡頭的最後一格）當首格，確保長相一致
3. 每個鏡頭生成 3～4 個版本，挑長相最一致、結尾最穩的那個
4. 輸出最高畫質，依檔名放進 `video/raw/`
5. 執行 `npm run encode`，網站會自動改用真人影片

### 共用提示詞（加在每個鏡頭前面）

```
Photorealistic live-action footage, shot on a cinema camera, 35mm lens, shallow depth of field,
natural skin texture, no CGI look. A Taiwanese woman in her mid-20s with long straight black hair
reaching her chest, natural light makeup, warm friendly expression, wearing an oversized mustard-yellow
hoodie and over-ear headphones. Cozy streaming room at night: purple and pink LED strips on the back wall,
shelves with small figurines and a plant, a ring light in front of her creating catchlights in her eyes,
a condenser microphone on a boom arm. She is framed slightly left of center, face in the upper half of the
frame. Her monitor is off-camera to the right. No visible screens, no text, no logos, no subtitles.
```

### 各鏡頭提示詞

**c01**
```
She sits down in her gaming chair, puts on her headphones, reaches forward and presses a key;
the ring light switches on and brightens her face. She looks into the camera and smiles.
Slow push-in. Ends on a steady smile at the camera.
```

**c02**（觀眾，不用共用提示詞）
```
Photorealistic live-action footage, 35mm lens, shallow depth of field. A Taiwanese man in his mid-20s
with short hair and a casual t-shirt relaxes on a living-room sofa at night, lit by a warm table lamp.
He watches his phone (screen facing away from camera), laughs, types quickly and taps to send, then looks up
with an expectant smile. He is framed slightly left of center. No visible screen content, no text, no logos.
Static shot. Ends holding the phone with an expectant smile.
```

**c03**
```
She glances at the monitor off-camera to the right, her eyes widen in surprise, she covers her mouth
with both hands, then bursts into happy laughter and presses her palms together to say thank you,
looking into the camera. Static shot. Ends with palms together, smiling at the camera.
```

**c04**
```
She jumps up from her chair cheering with both arms raised high, bouncing with excitement,
then makes a heart shape with her hands toward the camera. Slight pull-back to fit her whole upper body.
Ends holding the heart gesture.
```

**c05**
```
Three-quarter side view. She concentrates on the monitor off-camera, clicking the mouse,
the screen glow lighting her face, then nods with a satisfied smile. Ends on the satisfied smile.
```

**c06**
```
She browses on the monitor off-camera, clicks once, then points at the screen in delighted surprise,
turns to the camera and gives a playful wink. Static shot. Ends looking at the camera playfully.
```

**c07**
```
After the stream: the LED strips are dimmer, her headphones rest around her neck, she holds a warm mug
and scrolls the mouse with a relaxed, content smile. Slow push-in. Ends on a calm, content smile.
```

**c08**
```
She looks straight into the camera with a warm smile and extends one open hand toward the viewer
in an inviting "your turn" gesture. Slow push-in. Ends holding the gesture, eyes on the camera.
```

## 實際拍攝注意事項

- 用同一套燈光一次拍完 8 個鏡頭；c02 另找場地拍觀眾
- 每個鏡頭拍完動作後，**多停 2 秒不動**，剪輯時才有穩定的結尾停格
- 螢幕擺在鏡頭右側畫面外；手機螢幕朝向演員，不朝向鏡頭
- 交付未調色或已調色皆可，但 8 個鏡頭的色調要一致
