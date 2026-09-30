# iPAS AI 備考室

> 給 iPAS AI 應用規劃師中級考生使用的桌面網站，涵蓋 L21「人工智慧技術應用與規劃」及 L23「機器學習技術與應用」。每位使用者以自己的 Supabase 專案保存登入資料、作答紀錄、錯題和觀念筆記。題庫及解析事先整理，不會在使用時呼叫 AI 服務。

## 本機啟動

1. 安裝 Node.js 與 npm。
2. 複製 `.env.example` 為 `.env.local`，填入自己 Supabase 專案的 Project URL 和 publishable key。
3. 在 Supabase SQL Editor 執行 [`supabase/manual_setup.sql`](supabase/manual_setup.sql)。
4. 若要匯入題庫，將 Supabase secret key 暫存在 `.env.local` 的 `SUPABASE_SECRET_KEY`，在本機執行 `npm run question-bank:import`。匯入完成後，不要將 secret key 設成 `VITE_` 變數或提交至版本庫。
5. 執行 `npm install`，再執行 `npm run dev`，依終端機顯示的本機網址開啟網站。
6. 首次建立自己的帳號並登入後，可在 Supabase Auth 關閉公開註冊。

完整 Supabase 設定與匯入說明見 [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)。

## 功能

- 50 題、90 分鐘正式格式模擬考，可抽題或選擇 114 年第 2 梯次、115 年第 1 梯次歷屆卷。
- 交卷後顯示成績、是否達到 70 分模擬及格線與逐題解釋。
- 依學習指引考點進行練習，作答後立即查看正解與選項解析。
- 可選擇將題目加入錯題本，或將考點加入觀念筆記。
- 題數、章節與來源可在學習總覽及考點頁查看；登入同一部署後，個人紀錄會在電腦間同步。
- 可從帳戶選單匯出或清除個人學習資料；登入帳號刪除由 Supabase Dashboard 管理。

目前題庫為每科 100 題歷屆題、50 題仿歷屆題型及 50 題依學習指引與技術資料編寫的題目，合計 400 題。架構及資料流見 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 部署

生產網站需將 Vite 靜態輸出部署到支援單頁應用程式路由的網站主機，並在 Supabase Auth 設定網站網址及重新導向網址。部署平台與公開網址尚未設定；本機啟動不會讓其他電腦透過網際網路連線。
