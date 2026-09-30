import { useEffect, useState } from 'react'
import { ArrowRight, Clock3, FileQuestion, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createAttempt } from '../lib/attempts'
import { SUBJECTS, type SubjectCode } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  initialSubject?: SubjectCode
}

export function StartExamModal({ open, onClose, initialSubject = 'L21' }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subject, setSubject] = useState<SubjectCode>(initialSubject)
  const [paper, setPaper] = useState('random')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (open) setSubject(initialSubject)
  }, [initialSubject, open])
  if (!open) return null

  async function start() {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const historic = paper === '114-2' ? { year: 114, session: '2' } : paper === '115-1' ? { year: 115, session: '1' } : undefined
      const attempt = await createAttempt({ userId: user.id, subject, mode: 'mock', paper: historic })
      onClose()
      navigate(`/exam/${attempt.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法建立模考，請稍後重試。')
    } finally {
      setBusy(false)
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="exam-modal-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="關閉"><X size={18} /></button>
      <div className="modal-icon"><FileQuestion size={21} /></div>
      <p className="eyebrow">MOCK EXAM</p>
      <h2 id="exam-modal-title">設定這次模擬考</h2>
      <p className="modal-description">50 題 · 90 分鐘 · 交卷後查看逐題解析</p>
      <div className="form-section"><span className="form-label">選擇科目</span><div className="subject-choice-grid">{(['L21', 'L23'] as SubjectCode[]).map((code) => <button key={code} className={`subject-choice ${subject === code ? 'selected' : ''}`} onClick={() => setSubject(code)}><span className={`subject-badge badge-${code.toLowerCase()}`}>{code}</span><strong>{SUBJECTS[code].shortTitle}</strong><span className="choice-check">✓</span></button>)}</div></div>
      <div className="form-section"><span className="form-label">選擇試卷</span><div className="paper-options">
        <label className={`paper-option ${paper === 'random' ? 'selected' : ''}`}><input type="radio" name="paper" value="random" checked={paper === 'random'} onChange={() => setPaper('random')} /><span><strong>隨機全真模考</strong><small>跨年度題庫抽題，依考點平均分布</small></span><span className="radio-mark" /></label>
        <label className={`paper-option ${paper === '114-2' ? 'selected' : ''}`}><input type="radio" name="paper" value="114-2" checked={paper === '114-2'} onChange={() => setPaper('114-2')} /><span><strong>114 年第二梯次</strong><small>官方公告歷屆試卷</small></span><span className="radio-mark" /></label>
        <label className={`paper-option ${paper === '115-1' ? 'selected' : ''}`}><input type="radio" name="paper" value="115-1" checked={paper === '115-1'} onChange={() => setPaper('115-1')} /><span><strong>115 年第一次</strong><small>官方公告歷屆試卷</small></span><span className="radio-mark" /></label>
      </div></div>
      {error && <p className="form-alert form-error">{error}</p>}
      <div className="modal-footnote"><Clock3 size={14} /> 開始後即啟動 90 分鐘倒數，作答會自動保存。</div>
      <button className="button button-primary modal-submit" onClick={start} disabled={busy}>{busy ? '正在準備試卷…' : '開始模擬考'}<ArrowRight size={17} /></button>
    </section>
  </div>
}
