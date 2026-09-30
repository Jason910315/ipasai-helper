import { useState } from 'react'
import { ArrowRight, KeyRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    if (!supabase) { setError('尚未連接 Supabase。'); setBusy(false); return }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) { setError(updateError.message); return }
    setMessage('密碼已更新，準備返回登入頁面。')
    window.setTimeout(() => navigate('/sign-in'), 1000)
  }

  return <main className="reset-page"><Link to="/" className="brand"><span className="brand-mark">ip</span><span>備考室</span></Link><section className="reset-card"><span className="auth-icon"><KeyRound size={21} /></span><p className="eyebrow">ACCOUNT SECURITY</p><h1>設定新密碼</h1><p>請輸入至少 8 個字元的新密碼。</p><form className="auth-form" onSubmit={submit}><label htmlFor="new-password">新密碼</label><div className="input-wrap"><KeyRound size={16} /><input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <p className="form-alert form-error">{error}</p>}{message && <p className="form-alert form-success">{message}</p>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? '更新中…' : '更新密碼'}<ArrowRight size={16} /></button></form></section></main>
}
