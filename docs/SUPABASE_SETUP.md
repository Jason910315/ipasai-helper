# Supabase 設定與題庫匯入

本文件說明如何為這個個人備考網站建立自己的 Supabase 專案、套用資料庫結構並匯入題庫。正式網站前端只使用 publishable key；題庫匯入時才會在本機使用 secret key。

## 目錄

1. [設定本機環境變數](#1-設定本機環境變數)
2. [建立資料庫結構](#2-建立資料庫結構)
3. [匯入題庫](#3-匯入題庫)
4. [本機啟動網站](#4-本機啟動網站)
5. [部署至 Cloudflare Workers](#5-部署至-cloudflare-workers)
6. [匯出或刪除個人資料](#6-匯出或刪除個人資料)

## 1. 設定本機環境變數

複製 `.env.example` 為 `.env.local`，填入自己的 Supabase 專案網址、publishable key，以及匯入題庫時使用的 secret key：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

前兩個變數供 Vite 前端登入和讀取資料。`SUPABASE_SECRET_KEY` 只給本機匯入指令使用；不要在變數名稱前加 `VITE_`，也不要提交 `.env.local`。Supabase 說明 publishable key 可用於瀏覽器；secret key 具備高權限，必須只留在自己控制的環境。[Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## 2. 建立資料庫結構

若要直接使用 Supabase Dashboard：打開 SQL Editor，將 [`supabase/manual_setup.sql`](../supabase/manual_setup.sql) 的完整內容貼到新查詢並執行一次。這份檔案依序包含目前全部四個版本遷移，適用於尚未建立本網站資料表的專案；不要再另外執行 migration 檔。

Dashboard 手動執行不會建立 Supabase CLI 的 migration history。已用 `manual_setup.sql` 初始化的專案，之後不要直接執行 `supabase db push`，以免 CLI 把同一批遷移再套用一次。後續結構變更請在 SQL Editor 執行新的遷移檔。

已經初始化本網站的專案，請只在 SQL Editor 執行尚未套用的新 migration，例如 `supabase/migrations/202609300004_account_data_management.sql`；不要重跑完整 `manual_setup.sql`。

也可以使用 Supabase CLI 維護遷移歷史。此方式需先登入並連結專案，再執行：

先安裝並登入 [Supabase CLI](https://supabase.com/docs/guides/cli)，在專案目錄執行：

```sh
supabase login
supabase link
supabase db push
```

`supabase link` 會讓 CLI 連到你選定的雲端專案；`supabase db push` 會套用 `supabase/migrations/` 中尚未執行的遷移。Supabase 建議用 CLI 維護遷移歷史；直接在 Dashboard SQL Editor 修改結構不會同步遷移紀錄。[Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)

若這個 Supabase 專案已有手動建立的資料表或遷移紀錄，先檢查 Dashboard 的 migration history，再決定是否套用本專案的遷移。

## 3. 匯入題庫

確認資料庫遷移已完成後，在專案目錄執行：

```sh
npm run question-bank:import
```

匯入指令使用 Node.js 系統憑證庫，以支援 Windows 上由作業系統信任的 TLS 憑證鏈。

匯入指令會先檢查兩科題庫的題數、來源、題號、答案、解析、主題連結和占位文字，再以可重複執行的 upsert 寫入 `topics`、`question_groups`、`questions` 與私有的 `question_answers`。它也會產生 `supabase/seed_questions.sql`，供需要以 SQL 工具匯入的人使用。

匯入前會確認官方試題所需的圖表、表格或程式碼已轉成題目可讀內容。只有 `needs_manual_media_review = false` 的題目會進入練習與模擬考；若新增題目仍依賴未整理的圖片或程式碼，應先補齊內容並重新執行驗證，再匯入資料庫。

## 4. 本機啟動網站

```sh
npm install
npm run dev
```

如要從其他裝置或電腦使用同一份作答紀錄，將網站部署到可從那些裝置連線的網址，並為該部署設定 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。每位使用者以自己的 Supabase 專案和登入帳號儲存資料；不同 Supabase 專案之間不會共用作答紀錄。

## 5. 部署至 Cloudflare Workers

本專案使用 Vite。若以 Cloudflare Workers Builds 連接 GitHub 部署，請在 Cloudflare 專案的 **Settings → Build → Build variables and secrets**，為 production build 設定 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。前者填 Supabase Project URL，後者填 publishable key。Vite 會在建置時把這兩個值寫入前端檔案；設定後需重新執行 production build／deployment。只設定 Worker 的執行期 **Environment variables** 不會改變已建置的 Vite 前端。

接著在 Supabase **Authentication → URL Configuration** 設定：

- **Site URL**：你的 Worker production URL，例如 `https://<worker-name>.<account-subdomain>.workers.dev/`。
- **Redirect URLs**：加入同一網址的根路徑，以及 `/reset-password`，例如 `https://<worker-name>.<account-subdomain>.workers.dev/` 和 `https://<worker-name>.<account-subdomain>.workers.dev/reset-password`。

公開網站的網址、目前部署狀態及尚待驗收流程，記錄於 [`docs/PROJECT_STATUS.md`](PROJECT_STATUS.md#公開部署與線上驗收)。

參考：[Cloudflare Workers Builds 設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Vite 環境變數](https://vite.dev/guide/env-and-mode)、[Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)。

## 6. 匯出或刪除個人資料

登入網站後，從右上角帳戶選單開啟「個人資料管理」。匯出會下載 JSON，內容包含帳號識別資料、作答紀錄、錯題收藏與觀念筆記。清除學習資料會先要求確認，並只刪除目前登入帳號的作答及收藏；題庫和登入帳號會保留。

若要連同登入帳號一起刪除，請到 Supabase Dashboard 的 Authentication → Users 移除該使用者。`exam_attempts`、`saved_questions` 與 `saved_concepts` 都以 `auth.users` 外鍵級聯刪除個人資料。刪除前請先匯出需要保留的資料；帳號刪除無法復原。
