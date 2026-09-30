import { useState } from 'react'
import { ArrowRight, BookOpenCheck, Check, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthMode = 'sign-in' | 'sign-up' | 'reset'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!supabase) return setError('尚未連接 Supabase，請先設定 .env.local。')
    setBusy(true)
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (signUpError) throw signUpError
        setMessage('確認信已寄出。請至信箱完成驗證後再登入。')
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (resetError) throw resetError
        setMessage('若信箱可接收驗證郵件，重設密碼連結將寄至該信箱。')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失敗，請稍後重試。')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'sign-in' ? '歡迎回到備考室' : mode === 'sign-up' ? '建立你的備考帳號' : '重設登入密碼'

  return (
    <main className="auth-shell">
      <section className="auth-aside">
        <div className="brand brand-light">
          <span className="brand-mark">ip</span><span>備考室</span>
        </div>
        <div className="auth-aside-content">
          <div className="eyebrow eyebrow-light"><span className="live-dot" /> 一起把準備變成實力</div>
          <h1>練習得更<br /><em>有方向。</em></h1>
          <p>為 iPAS AI 應用規劃師中級考試準備的個人學習空間。掌握節奏、看懂錯題，一步一步靠近目標。</p>
          <div className="auth-proof-list">
            <div><span><Check size={15} /></span>依官方範圍整理題庫</div>
            <div><span><Check size={15} /></span>科目一與機器學習科目</div>
            <div><span><Check size={15} /></span>跨裝置保存練習紀錄</div>
          </div>
        </div>
        <div className="aside-foot"><span>iPAS AI Planner · Level 2</span></div>
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
      </section>

      <section className="auth-main">
        <div className="auth-top-note"><ShieldCheck size={16} /> 你的作答資料只存放在自己的 Supabase 專案</div>
        <div className="auth-card">
          <div className="auth-icon"><BookOpenCheck size={22} /></div>
          <p className="eyebrow">PERSONAL STUDY SPACE</p>
          <h2>{title}</h2>
          <p className="auth-intro">
            {mode === 'sign-in' ? '登入後繼續上次的練習，進度會在裝置間同步。' : mode === 'sign-up' ? '這份部署僅供一位使用者使用，請使用 Supabase 團隊信箱。' : '輸入帳號信箱，我們會寄送密碼重設連結。'}
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="auth-email">電子郵件</label>
            <div className="input-wrap"><Mail size={17} /><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required autoComplete="email" /></div>
            {mode !== 'reset' && <>
              <label htmlFor="auth-password">密碼</label>
              <div className="input-wrap"><KeyRound size={17} /><input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 個字元" minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></div>
            </>}
            {error && <p className="form-alert form-error">{error}</p>}
            {message && <p className="form-alert form-success">{message}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? '處理中…' : mode === 'sign-in' ? '登入備考室' : mode === 'sign-up' ? '建立帳號' : '寄送重設連結'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <div className="auth-links">
            {mode === 'sign-in' ? <>
              <button type="button" className="text-button" onClick={() => { setMode('reset'); setError(''); setMessage('') }}>忘記密碼？</button>
              <button type="button" className="text-button" onClick={() => { setMode('sign-up'); setError(''); setMessage('') }}>首次使用，建立帳號 <ArrowRight size={14} /></button>
            </> : <button type="button" className="text-button" onClick={() => { setMode('sign-in'); setError(''); setMessage('') }}>返回登入</button>}
          </div>
        </div>
      </section>
    </main>
  )
}
