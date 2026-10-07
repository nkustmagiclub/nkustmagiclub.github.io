# 第 16 屆國際晚會：正式活動頁

正式網址：https://nkustmagiclub.tw/16th/

## 發布方式與舊版保存

GitHub Pages 從 `main` 根目錄發布，使用 GitHub 內建 Pages 流程。已核對 build log：checkout `ref: main`、upload-pages-artifact `path: .`。不是 `docs/`，也沒有另設 repository 內的 Pages workflow。

修改前的完整世界觀版與全部素材已保存在：

- 分支：`archive/16th-full-page`
- Commit：`522fc0871ab462cc126574f0508835b53940add0`
- 舊版檔案：該分支的 `16th/` 完整目錄

封存分支不會被目前 Pages 流程發布。請勿將舊版另存為 main 下的 HTML／資料夾，以免多出可公開瀏覽的舊頁。需要復原時，先比較封存分支的 `16th/` 與目前版本，再只還原活動頁檔案；不要重置全站。

## 頁面結構

1. Hero：活動名稱、日期、時間、地點、免費入場、立即報名與原版開門動畫。門板打開後退場，殿內顯示正式主海報及報名按鈕；活動資訊與直接報名不受動畫限制。
2. 表單中的一句話世界觀與簡短晚會介紹。
3. 嘉賓、主持及社內演出陣容。
4. 活動資訊、報名提醒及交通連結。
5. 三張贊助海報、名稱、人物介紹及經歷直接顯示。
6. 頁尾報名 CTA。

沿用既有靜態 HTML、CSS、JavaScript 及本機圖片，不需要建置工具。原始 17 張 JPEG 全數保留於 `assets/images/`，來源與 SHA-256 見 `assets/images/manifest.json`。頁面使用 480／760／950px 響應式 WebP；原始 JPEG 保留，點擊海報可開啟原圖。WebP 載入或解碼失敗時，會自動改用原始圖片。

## 維護

- `index.html`：活動內容、搜尋與社群 metadata、Event structured data。
- `style.css`：直向晚霞配色、深紫單色海報區域、字級、64px 導覽列及響應式排版。
- `script.js`：圖片載入失敗備援、原版開門互動與舊的 `#tickets` 錨點相容處理。門後按鈕直接開正式表單；鍵盤操作支援焦點移轉，減少動態效果偏好會關閉過場。
- `SOURCES.md`：內容來源與歷次更新範圍。
- 主要 CTA 直接開啟正式表單：https://forms.gle/djtMv83iiyGjRZ8K8 。
- 所有可見報名用語統一為「報名」。
- 活動英文名稱統一為 Abendrot，與正式海報一致。
- 更新 CSS／JS 後請同步調整 HTML 引用的版本參數，避免舊快取。

## 搜尋設定

依 2026-10-02 最新指示，活動頁正式公開：

- robots：`index, follow`
- canonical／og:url：https://nkustmagiclub.tw/16th/
- og:image：`https://nkustmagiclub.tw/16th/assets/images/main-poster.jpg`
- 根目錄 `sitemap.xml` 收錄正式活動網址。
- `robots.txt` 為 `Allow: /`，沒有阻擋活動頁。
- 首頁近期活動原有「活動介紹」與「直接報名」入口並列保留，不需更改全站 Navbar。


## 2026-10-03 調整

依使用者指示移除最後入場時間與改寫的長篇故事。只保留使用者提供的表單短句，完整舊版仍在封存分支。開門動畫恢復於 Hero，門板退場後顯示殿內主海報與報名按鈕；三張贊助海報與完整可見介紹保留。


## 2026-10-08 正式版更新

採用已確認的預覽二設計，發布至 `/16th/`。海報區域使用深紫單色底（#5D2345）與暖白文字，其他區塊保留直向漸層。預覽共用樣式已整併至 `style.css`，兩個 `design-preview` 預覽目錄及 `preview-shared.css` 已移除。歷史版本可由 Git 提交記錄復原；根目錄入口網站不受影響。
