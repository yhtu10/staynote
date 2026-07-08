# StayNote 圖片架構規則

## 旅宿封面圖（properties.cover_image_url）

- **來源**：HafH 旅宿頁 `https://www.hafh.com/zh-tw/properties/{id}`，從 `__NEXT_DATA__` 解析 `hafh-prod-property_image` 路徑
- **必須存在**：旅宿封面圖不可能空白，每間旅宿都應有一張
- **HafH 下架（HTTP 404）**：改用 Google 圖片搜尋（`{name_en} hotel`），取第一筆相關圖片
- **禁止**：不可用 travel_stories 的圖片來替補旅宿主圖

## 旅行故事圖片（travel_stories.cover_image_url / stay_image_url）

- `cover_image_url`：story 的縮圖（thumbnail），來自 HafH travel-stories 頁的 `thumbnail_url`
- `stay_image_url`：住宿體驗區塊的代表圖，來自 `stays[0].thumbnail_url`
- **用途**：作為評論內容的可點擊圖片（gallery），不作為旅宿主圖的替代來源
- **禁止**：不可 fallback 到 `topStory.cover_image_url` 作為旅宿卡片主圖

## 搜尋結果卡片圖片優先順序

1. `property.cover_image_url`（旅宿封面，唯一合法來源）
2. 空白色塊 + 🏨 emoji（旅宿圖尚未補全時的過渡狀態）

## 爬蟲策略

- 優先：爬 HafH 旅宿頁取 `hafh-prod-property_image`
- 備援（404）：Google Custom Search API 搜尋 `{name_en} {prefecture} hotel`，取第一張圖
- story 圖與旅宿圖分開爬，互不干擾
