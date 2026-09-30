import { ArrowUpRight, CircleAlert, Copy, ExternalLink, ShieldCheck } from 'lucide-react'

export function SetupPage() {
  const rows = [
    ['VITE_SUPABASE_URL', 'Supabase 專案 URL'],
    ['VITE_SUPABASE_PUBLISHABLE_KEY', 'Supabase publishable key'],
    ['SUPABASE_SECRET_KEY', '僅本機匯入題庫使用'],
  ]
  return <main className="setup-page">
    <div className="setup-top"><span className="brand-mark">ip</span><span>備考室</span><span className="setup-tag">首次設定</span></div>
    <div className="setup-card">
      <div className="setup-icon"><CircleAlert size={22} /></div>
      <p className="eyebrow">CONNECT YOUR STUDY SPACE</p>
      <h1>先連接你的<br />Supabase 專案</h1>
      <p className="setup-copy">這個網站會把帳號、模考紀錄和錯題本保存在你自己的雲端資料庫。完成下方設定後，重新啟動網站即可建立帳號。</p>
      <div className="setup-steps">
        <div className="setup-step"><span>01</span><div><strong>建立 Supabase 專案</strong><p>前往 Supabase 建立免費專案，再從 Connect 面板複製 API URL 和 publishable key。</p><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">開啟 Supabase <ExternalLink size={13} /></a></div></div>
        <div className="setup-step"><span>02</span><div><strong>複製環境變數範本</strong><p>將專案根目錄的 <code>.env.example</code> 複製為 <code>.env.local</code>，填入 URL、publishable key，以及本機匯入題庫用的 secret key。</p></div></div>
        <div className="setup-step"><span>03</span><div><strong>建立資料庫並匯入題庫</strong><p>在 Supabase SQL Editor 執行 <code>supabase/manual_setup.sql</code>，再依專案設定文件載入題庫。</p></div></div>
      </div>
      <div className="env-preview"><div><span className="env-dot" /> .env.local <Copy size={14} /></div>{rows.map(([name, label]) => <code key={name}><b>{name}</b>=<span>{label}</span></code>)}</div>
      <div className="setup-security"><ShieldCheck size={17} /><span>只有 URL 與 publishable key 會供網站使用。secret key 只在本機匯入題庫時使用；不要加上 VITE_ 前綴，也不可提交到 Git。</span><a href="https://supabase.com/docs/guides/getting-started/api-keys" target="_blank" rel="noreferrer"><ArrowUpRight size={14} /></a></div>
      <p className="setup-help">完成後，重啟開發伺服器或重新部署網站。完整步驟請查看專案中的 <code>docs/SUPABASE_SETUP.md</code>。</p>
    </div>
    <p className="setup-footer">IPAS AI PLANNER · PERSONAL STUDY SPACE</p>
  </main>
}
