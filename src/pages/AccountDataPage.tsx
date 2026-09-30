import { useState } from 'react'
import { AlertTriangle, ArrowUpRight, Download, LoaderCircle, Trash2 } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { clearAccountStudyData, downloadAccountData } from '../lib/account-data-service'
import { useAuth } from '../auth/AuthProvider'

export function AccountDataPage() {
  const { user } = useAuth()
  const [busy, setBusy] = useState<'export' | 'clear' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function exportData() {
    if (!user) return
    setBusy('export')
    setMessage('')
    setError('')
    try {
      await downloadAccountData(user)
      setMessage('個人資料已下載。')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法匯出個人資料。')
    } finally {
      setBusy(null)
    }
  }

  async function clearData() {
    if (!window.confirm('確定清除這個帳號的所有作答紀錄、錯題收藏和觀念筆記嗎？這項操作無法復原。')) return
    setBusy('clear')
    setMessage('')
    setError('')
    try {
      const counts = await clearAccountStudyData()
      setMessage(`已清除 ${counts.attempts} 筆作答紀錄、${counts.saved_questions} 題錯題收藏和 ${counts.saved_concepts} 筆觀念筆記。`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法清除個人資料。')
    } finally {
      setBusy(null)
    }
  }

  return <AppShell><div className="library-page account-data-page">
    <div className="page-heading-row"><div><div className="eyebrow">ACCOUNT DATA</div><h1>個人資料管理<span className="heading-period">。</span></h1><p>匯出或清除儲存在這個 Supabase 專案中的學習資料。</p></div></div>
    {error && <div className="inline-alert"><AlertTriangle size={16} /><span>{error}</span></div>}
    {message && <div className="inline-alert account-data-success" role="status"><span>{message}</span></div>}
    <section className="panel account-data-panel">
      <div className="account-data-section"><div><h2>匯出個人資料</h2><p>下載包含作答紀錄、答案、錯題收藏和觀念筆記的 JSON 檔案。匯出只會讀取目前登入帳號的資料。</p></div><button className="button button-primary" onClick={() => void exportData()} disabled={busy !== null}>{busy === 'export' ? <LoaderCircle className="spin" size={16} /> : <Download size={16} />}{busy === 'export' ? '準備下載…' : '下載資料'}</button></div>
      <div className="account-data-section account-data-danger"><div><h2>清除學習資料</h2><p>清除這個帳號的所有作答紀錄、錯題收藏和觀念筆記。題庫與登入帳號不會被刪除，操作前會再次確認。</p></div><button className="button button-secondary" onClick={() => void clearData()} disabled={busy !== null}>{busy === 'clear' ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}{busy === 'clear' ? '清除中…' : '清除學習資料'}</button></div>
      <div className="account-data-section"><div><h2>刪除登入帳號</h2><p>如要連同登入帳號一起刪除，請到 Supabase Dashboard 的 Authentication → Users 移除使用者。資料庫會依帳號關聯規則刪除該帳號的個人學習資料。</p></div><a className="button button-quiet" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">開啟 Supabase Dashboard <ArrowUpRight size={15} /></a></div>
    </section>
  </div></AppShell>
}
