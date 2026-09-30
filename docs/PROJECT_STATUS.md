# 專案狀態與交接

> 記錄目前已完成內容與仍待處理的外部步驟，讓後續工作可直接接續。實作證據以本機程式、Supabase 專案和驗收結果為準；更新日期：2026-09-30。

## 已完成

- L21 與 L23 桌面網站功能已實作：登入、學習總覽、考點目錄、模擬考、計時與自動保存、交卷計分、逐題解析、主題練習、歷史紀錄、錯題本及觀念筆記。
- Supabase schema 已建立，400 題題庫與私有答案解析已匯入；每科包含 100 題歷屆題、50 題仿歷屆題型、50 題學習指引研究題。
- 題庫既有結構檢查記錄 28 個考點、四份歷屆卷各 50 題，沒有待人工補圖題；PDF 文字與解析品質另按下方的最新複核結果記錄。
- 驗收結果：`npm run build` 成功；Supabase 流程 19 項 smoke checks 通過；瀏覽器已完成登入、全真模擬考、交卷、檢討、收藏、歷史和主題練習流程。
- 修正首頁弱點清單只把實際作答且答錯的題目列為弱點，未作答題不會被算錯。
- `.env.local` 含本機 Supabase 設定，已由 `.gitignore` 排除。驗收建立的臨時帳號與作答資料已清除。
- `.env.local` 受 Git 忽略；先前掃描本機 `dist/assets` 的 2 個檔案，未發現本機 `SUPABASE_SECRET_KEY` 值。註冊驗證與密碼重設回呼使用目前網站 origin。使用者回報已設定正式網站的 Supabase Auth Site URL 與 Redirect URLs。
- 使用者已親自完成註冊、信箱驗證、登入及網站預覽；目前本機預覽網址回應 HTTP 200。
- GitHub 遠端有 `main` 分支，本機 `main` 追蹤 `origin/main`。此次文件狀態更新會建立本機 commit，但依使用者指示暫不推送。

## 個人資料管理

- 帳戶選單新增個人資料管理頁，可匯出作答紀錄、錯題收藏和觀念筆記為 JSON，也可在二次確認後清除目前登入帳號的三類資料。
- Auth 帳號刪除仍由使用者在 Supabase Dashboard 操作；外鍵會連帶刪除該帳號的個人資料。
- 使用者已在 Supabase SQL Editor 執行 migration `202609300004_account_data_management.sql`，回報 `Success. No rows returned`。唯讀 RPC 檢查確認匿名呼叫遭拒（HTTP 401），題庫仍有 28 個考點、400 題及 400 筆答案解析。
- 使用者確認這 4 筆作答都是一次性測試資料，其中 1 筆已提交模擬考，另 3 筆是進行中的主題練習；並回報在錯題本及觀念筆記中個別刪除後，畫面各顯示 0 筆。之後使用者在「個人資料管理」執行全部清除，畫面回報刪除 4 筆作答、0 題錯題收藏、0 筆觀念筆記。隨後依該測試帳號 UUID 唯讀回查確認 `exam_attempts`、`saved_questions`、`saved_concepts` 均為 0 筆，Auth 帳號仍存在；題庫仍為 28 個考點、400 題、400 筆答案解析。此為一次性測試資料的端對端驗收，未接觸真實學習紀錄。
- 本次 `npm run test:account-data` 通過 2/2 項匯出序列化測試，`npm run build` 成功。建置仍輸出 dynamic import 與 bundle chunk size 警告；這些警告未阻擋建置。

## 題庫來源複核與待釐清

- 本機 `content/questions/l21.json` 與 `content/questions/l23.json` 各有 200 題，共 400 題；`content/topics.json` 有 28 個不重複考點。
- 依根目錄的 [`114 年 L21 官方試題`](../114-人工智慧技術應用與規劃.pdf) 和 [`115 年 L21 官方試題`](../115-人工智慧技術應用與規劃.pdf) 複核本機 100 題歷屆題。官方答案鍵 100/100 相符：114 年 50 題由 PDF 文字擷取確認；115 年 49 題由文字擷取確認，第 50 題答案 D 由原頁影像確認。
- 題幹中 93 題可在正規化後直接對上 PDF 文字；其餘 7 題的 PDF 文字擷取受跨頁或版面影響，已查看對應原頁，題幹內容相符。5 個選項也因跨頁版面未能直接文字比對，已查看原頁確認接續內容。
- 快速文字檢查未找到 Unicode 替代字元、連續問號或常見頁尾標記；100 題都有主解析及四個選項解析，沒有空白解析或重複貼入完整題幹。逐題檢視 100 題主解析及 400 條選項解析後，99 題支持官方答案；115 年第 46 題的官方答案 C 符合「原始資料留院」，但聯邦學習是在院內本地訓練，無法同時滿足題幹要求的「使用公有雲 GPU 訓練」。保留官方題幹與答案鍵，已修正本機解說以揭露此歧義。另修正 115 年第 23 題一條錯誤選項解析，移除未經題目支持的「雲端 AutoML 推論必定經網路往返」斷言，改為要求依指定服務與硬體驗證。語意複核未發現其他明顯與題幹矛盾之處；這不代表 400 條解析已逐條依外部技術來源查證。
- 115 年第 46 題位於 115 年 L21 PDF 第 14 頁；原頁明列公有雲 GPU 訓練與資料不得離院，選項 C 則明列院內訓練、雲端聚合。McMahan 等人的 FedAvg 原始論文描述各用戶端在本地資料上執行訓練，再由中央伺服器聚合更新，支持本地解說對典型聯邦學習流程的區分；這是對技術流程的依據，不是法律合規判斷。見[原始論文](https://proceedings.mlr.press/v54/mcmahan17a.html)。
- 經使用者授權，已將 Supabase `question_answers` 第 46 題主解析及 C 選項解析、第 23 題 D 選項解析更新為本機版本。第 23 題更新後讀回確認 D 解析一致，答案鍵、主解析及 A／B／C 解析未變。第 46 題既有更新也已讀回確認主解析與 C 解析相符，答案鍵及 A／B／D 解析未變。題庫筆數一致不代表所有內容一致。
- 本次以唯讀方式查詢 Supabase：28 個考點、400 題、400 筆私有答案。題目分布為 L21 與 L23 各 100 題歷屆題、50 題仿題、50 題學習指引研究題，與本機來源檔相符。Node.js 預設憑證鏈查詢曾失敗（`SELF_SIGNED_CERT_IN_CHAIN`）；加上 `--use-system-ca` 後查詢成功。

可在 Supabase SQL Editor 重查雲端筆數：

```sql
select count(*) from public.topics;
select subject, origin, count(*) from public.questions group by subject, origin order by subject, origin;
select count(*) from public.question_answers;
```

## 公開部署與線上驗收

目前公開網站網址為 [`https://ipasai-helper.a0938692163.workers.dev/`](https://ipasai-helper.a0938692163.workers.dev/)，由 Cloudflare Workers 提供；這是已部署網站，不是本機 Vite 預覽。使用者回報已在 Cloudflare 設定 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`，重新建置後網站可載入登入／建立帳號頁；也已完成 Supabase Auth 網址設定。

正式環境尚待完成下列驗收：

1. 使用一次性測試帳號完成註冊與信箱驗證。
2. 登出後重新登入，並測試密碼重設回呼。
3. 完成一次主題練習或模擬考，確認記錄可寫入 Supabase。
4. 從另一個瀏覽器或裝置登入，確認同一帳號的個人紀錄同步。

Vite 會在建置時將 `VITE_` 環境變數寫入前端 bundle；若修改 Cloudflare 建置變數，必須重新建置部署才會生效。`SUPABASE_SECRET_KEY` 僅用於本機匯入，不能設定為前端變數或放進瀏覽器 bundle。

## 預覽連線

本機預覽網址為 `http://127.0.0.1:5173/`，只在本機 Vite 程序執行時可用。若無法連線，從專案目錄執行 `npm run dev -- --host 127.0.0.1`。公開網站則使用上方 Cloudflare Workers 網址，不依賴開發電腦持續開機。
