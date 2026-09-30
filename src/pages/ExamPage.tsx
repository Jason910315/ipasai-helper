import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpenCheck, BookmarkPlus, Check, ChevronLeft, ChevronRight, Flag, LoaderCircle, Send, Timer, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AppShell } from '../components/AppShell'
import { getAttempt, getAttemptReview, getQuestionSet, saveAttempt, submitAttempt } from '../lib/attempts'
import { SUBJECTS, type AnswerMap, type Attempt, type Choice, type Question } from '../types'

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const rest = safe % 60
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':')
}

export function ExamPage() {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [flags, setFlags] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(90 * 60)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  useEffect(() => {
    let active = true
    Promise.all([getAttempt(attemptId), getAttempt(attemptId).then((row) => getQuestionSet(row.question_ids))])
      .then(([row, loadedQuestions]) => {
        if (!active) return
        setAttempt(row)
        setQuestions(loadedQuestions)
        setAnswers(row.answers ?? {})
        setFlags(row.flagged_question_ids ?? [])
        if (row.state === 'submitted') navigate(`/results/${attemptId}`, { replace: true })
      })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : '無法讀取模考。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attemptId, navigate])

  useEffect(() => {
    if (!attempt?.expires_at || attempt.state !== 'in_progress') return
    const updateClock = () => setSeconds(Math.ceil((new Date(attempt.expires_at!).getTime() - Date.now()) / 1000))
    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [attempt])

  useEffect(() => {
    if (!attempt || attempt.state !== 'in_progress' || loading) return
    setSaving(true)
    const timeout = window.setTimeout(() => {
      saveAttempt(attempt, answers, flags)
        .catch((caught: unknown) => setError(caught instanceof Error ? `作答儲存失敗：${caught.message}` : '作答儲存失敗。'))
        .finally(() => setSaving(false))
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [attempt, answers, flags, loading])

  const finish = useCallback(async () => {
    if (!attempt || submitting.current || !questions.length) return
    submitting.current = true
    setSaving(true)
    try {
      const deadline = attempt.expires_at ? new Date(attempt.expires_at).getTime() : Number.POSITIVE_INFINITY
      if (Date.now() < deadline) await saveAttempt(attempt, answers, flags)
      await submitAttempt(attempt, answers)
      navigate(`/results/${attempt.id}`, { replace: true })
    } catch (caught) {
      submitting.current = false
      setError(caught instanceof Error ? caught.message : '交卷失敗，請確認網路連線後再試。')
    } finally {
      setSaving(false)
    }
  }, [attempt, answers, flags, navigate, questions.length])

  useEffect(() => {
    if (seconds <= 0 && attempt?.state === 'in_progress' && !loading) void finish()
  }, [attempt?.state, finish, loading, seconds])

  const question = questions[index]
  const answered = Object.keys(answers).length
  const answeredInSet = new Set(Object.keys(answers))
  const currentFlagged = question ? flags.includes(question.id) : false

  if (loading) return <AppShell><div className="page-loading"><LoaderCircle className="spin" />正在載入試卷…</div></AppShell>
  if (error && !attempt) return <AppShell><div className="empty-state"><AlertTriangle size={24} /><h2>無法載入模考</h2><p>{error}</p><Link to="/" className="button button-secondary">回到總覽</Link></div></AppShell>
  if (!attempt || !question) return <AppShell><div className="empty-state"><h2>找不到這份試卷</h2><Link to="/" className="button button-secondary">回到總覽</Link></div></AppShell>

  return <AppShell>
    <div className="exam-page">
      <div className="exam-topline"><Link to="/" className="exam-exit"><ArrowLeft size={16} />離開考試</Link><div className="exam-mode-label"><span />{attempt.kind === 'mock' ? '正式模擬模式' : '主題練習'}</div>{attempt.kind === 'mock' && <div className={`exam-timer ${seconds < 300 ? 'timer-warning' : ''}`}><Timer size={17} /><span>{formatClock(seconds)}</span><small>剩餘時間</small></div>}</div>
      <div className="exam-heading"><div><div className="eyebrow">{attempt.subject} · {questions.length} 題</div><h1>{SUBJECTS[attempt.subject].title}</h1><p>{attempt.title} <span>·</span> 單選題{attempt.kind === 'mock' ? '，每題 2 分' : ''}</p></div><div className="exam-save-state"><span className={saving ? 'save-dot saving' : 'save-dot'} />{saving ? '儲存中' : '作答已保存'}</div></div>
      {error && <div className="inline-alert"><span>{error}</span></div>}
      <div className="exam-layout">
        <section className="question-card">
          <div className="question-card-head"><div><span className="question-count">QUESTION <b>{String(index + 1).padStart(2, '0')}</b><i> / {String(questions.length).padStart(2, '0')}</i></span><span className="question-chip">{question.origin === 'official' ? `${question.exam_year} 年第${question.exam_session}梯次` : question.origin === 'exam_style' ? '仿歷屆題型' : '依考點新編'}</span></div><button className={`flag-question ${currentFlagged ? 'flagged' : ''}`} onClick={() => setFlags((current) => currentFlagged ? current.filter((id) => id !== question.id) : [...current, question.id])}><Flag size={15} />{currentFlagged ? '已標記' : '稍後檢查'}</button></div>
          {question.shared_stem && <div className="question-context"><span>情境題組</span><p>{question.shared_stem}</p></div>}
          <h2 className="question-stem">{question.stem}</h2>
          {question.media?.map((media) => <figure className="question-media" key={media.src}><img src={media.src} alt={media.alt} /><figcaption>{media.alt}</figcaption></figure>)}
          <div className="answer-options" role="radiogroup" aria-label="選擇答案">{(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => <button key={choice} className={`answer-option ${answers[question.id] === choice ? 'selected' : ''}`} role="radio" aria-checked={answers[question.id] === choice} onClick={() => setAnswers((current) => ({ ...current, [question.id]: choice }))}><span className="option-letter">{choice}</span><span className="option-text">{question.options[choice]}</span><span className="option-radio" /></button>)}</div>
          <details className="question-meta"><summary>題目來源與考點</summary><div className="question-source-line"><span className={`source-dot source-${question.origin}`} />{question.source_label}{question.source_question_number && <span> · 原卷第 {question.source_question_number} 題</span>}{question.source_url && <a href={question.source_url} target="_blank" rel="noreferrer">查看來源</a>}</div>{question.topic_ids?.length > 0 && <div className="question-topic-line"><span>考點</span>{question.topic_ids.map((topic) => <span className="topic-tag" key={topic}>{topic}</span>)}</div>}</details>
          <div className="question-card-footer"><button className="button button-quiet" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}><ChevronLeft size={16} />上一題</button><span>{answered} / {questions.length} 已作答</span><button className="button button-secondary" onClick={() => setIndex(Math.min(questions.length - 1, index + 1))} disabled={index === questions.length - 1}>下一題<ChevronRight size={16} /></button></div>
        </section>
        <aside className="exam-rail"><div className="rail-card"><div className="rail-heading"><strong>試題導覽</strong><span>{answered} 已答</span></div><div className="question-grid">{questions.map((item, itemIndex) => <button key={item.id} className={`${itemIndex === index ? 'current' : ''} ${answeredInSet.has(item.id) ? 'answered' : ''} ${flags.includes(item.id) ? 'marked' : ''}`} onClick={() => setIndex(itemIndex)} aria-label={`第 ${itemIndex + 1} 題${answeredInSet.has(item.id) ? '已作答' : '未作答'}${flags.includes(item.id) ? '，已標記' : ''}`}>{itemIndex + 1}</button>)}</div><div className="rail-legend"><span><i className="legend-unanswered" />未作答</span><span><i className="legend-answered" />已作答</span><span><i className="legend-marked" />待檢查</span></div></div>
          <div className="rail-note"><span><BookmarkPlus size={16} /></span><div><strong>作答小提醒</strong><p>可先完成有把握的題目，再回來檢查標記的題目。</p></div></div>
          <button className="button button-primary submit-exam" onClick={() => setShowSubmit(true)}><Send size={16} />檢查並交卷</button>
          <div className="submit-hint"><span className="save-dot" />作答會自動保存</div>
        </aside>
      </div>
      {showSubmit && <div className="modal-backdrop"><section className="modal-card submit-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title"><button className="icon-button modal-close" onClick={() => setShowSubmit(false)} aria-label="關閉"><X size={18} /></button><div className="modal-icon"><Send size={20} /></div><p className="eyebrow">SUBMIT EXAM</p><h2 id="submit-title">確認交卷？</h2><p className="modal-description">已作答 {answered} 題，還有 {questions.length - answered} 題尚未作答。交卷後將顯示成績和逐題解析。</p><div className="submit-summary"><span><Check size={16} />已作答 <strong>{answered}</strong> 題</span><span><Flag size={16} />待檢查 <strong>{flags.length}</strong> 題</span></div><div className="submit-actions"><button className="button button-secondary" onClick={() => setShowSubmit(false)}>繼續作答</button><button className="button button-primary" onClick={() => void finish()} disabled={saving}>{saving ? '正在交卷…' : '確認交卷'}<ArrowRight size={16} /></button></div></section></div>}
    </div>
  </AppShell>
}

export function ResultsPage() {
  const { attemptId = '' } = useParams()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedTopics, setSavedTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    let active = true
    getAttempt(attemptId)
      .then(async (row) => ({ row, questions: await getAttemptReview(attemptId) }))
      .then(({ row, questions: qs }) => { if (active) { setAttempt(row); setQuestions(qs) } })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : '無法載入檢討內容。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attemptId])

  useEffect(() => {
    if (!user) return
    let active = true
    import('../lib/supabase').then(({ requireSupabase }) => requireSupabase().from('saved_questions').select('question_id'))
      .then(({ data }) => { if (active) setSavedIds((data ?? []).map((row: { question_id: string }) => row.question_id)) })
      .catch(() => undefined)
    import('../lib/supabase').then(({ requireSupabase }) => requireSupabase().from('saved_concepts').select('topic_id'))
      .then(({ data }) => { if (active) setSavedTopics((data ?? []).map((row: { topic_id: string }) => row.topic_id)) })
      .catch(() => undefined)
    return () => { active = false }
  }, [user])

  if (loading) return <AppShell><div className="page-loading">載入檢討結果…</div></AppShell>
  if (error || !attempt) return <AppShell><div className="empty-state"><h2>無法載入檢討結果</h2><p>{error}</p><Link to="/history" className="button button-secondary">回到模考紀錄</Link></div></AppShell>

  const answerMap = attempt.answers ?? {}
  const score = attempt.score ?? 0
  const isPractice = attempt.kind === 'practice'
  return <AppShell>
    <div className="results-page">
      <div className="results-back"><Link to="/history"><ArrowLeft size={15} />回到模考紀錄</Link><span>考後檢討</span></div>
      <section className={`result-hero ${!isPractice && attempt.passed ? 'result-hero-pass' : ''}`}><div className="result-main"><div className="eyebrow eyebrow-light">{isPractice ? 'PRACTICE COMPLETE' : attempt.passed ? 'MOCK EXAM · PASSED' : 'MOCK EXAM · KEEP GOING'}</div><h1>{isPractice ? '練習完成。' : attempt.passed ? '這次達到目標。' : '再複習一次。'}</h1><p>{SUBJECTS[attempt.subject].title} <span>·</span> {attempt.title}</p></div><div className="result-score"><span>本次得分</span><strong>{score}<small> / 100</small></strong><div className={`result-status ${isPractice ? '' : attempt.passed ? 'passed' : 'not-passed'}`}>{isPractice ? '主題練習' : attempt.passed ? '模擬及格 · 70 分' : '尚未達 70 分'}</div></div></section>
      <div className="result-stat-row"><div><span>答對題數</span><strong>{attempt.correct_count ?? 0}<small> / {questions.length}</small></strong></div><div><span>答錯題數</span><strong>{attempt.wrong_count ?? 0}</strong></div><div><span>未作答</span><strong>{attempt.unanswered_count ?? 0}</strong></div><div><span>作答時間</span><strong>{attempt.submitted_at ? `${Math.max(1, Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 60000))}<small> 分鐘</small>` : '—'}</strong></div></div>
      <div className="review-heading"><div><span className="eyebrow">LEARN FROM EVERY QUESTION</span><h2>逐題檢討 <span>{questions.length} 題</span></h2></div><Link to="/practice" className="button button-secondary">針對考點再練習<ArrowRight size={15} /></Link></div>
      <div className="review-list">{questions.map((question, qIndex) => {
        const answer = answerMap[question.id] as Choice | undefined
        const correct = answer === question.correct_option
        const saved = savedIds.includes(question.id)
        const topicId = question.topic_ids[0]
        const topicSaved = topicId ? savedTopics.includes(topicId) : false
        return <article className={`review-card ${correct ? 'review-correct' : answer ? 'review-wrong' : 'review-empty'}`} key={question.id}>
          <div className="review-card-top"><div className="review-question-number"><span>{String(qIndex + 1).padStart(2, '0')}</span><b>{correct ? '答對' : answer ? '答錯' : '未作答'}</b></div><span className={`question-chip`}>{question.origin === 'official' ? `${question.exam_year} 年第${question.exam_session}梯次` : question.origin === 'exam_style' ? '仿歷屆題型' : '依考點新編'}</span></div>
          {question.shared_stem && <div className="review-context">{question.shared_stem}</div>}
          <h3>{question.stem}</h3>
          <div className="review-choice-list">{(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => <div key={choice} className={`review-choice ${choice === question.correct_option ? 'is-correct' : choice === answer ? 'is-wrong' : ''}`}><span className="option-letter">{choice}</span><span>{question.options[choice]}</span>{choice === question.correct_option && <Check size={15} />}{choice === answer && !correct && <X size={15} />}</div>)}</div>
          <div className="explanation-box"><div className="explanation-heading"><span className="explanation-icon"><BookOpenCheck size={15} /></span><strong>觀念解析</strong><span>{question.topic_ids.join(' · ')}</span></div><p>{question.explanation}</p><div className="option-rationales">{(['A', 'B', 'C', 'D'] as Choice[]).filter((choice) => question.option_explanations?.[choice]).map((choice) => <p key={choice}><b>{choice}</b>{question.option_explanations?.[choice]}</p>)}</div>
            <div className="explanation-source"><span>來源：{question.source_label}</span>{question.source_url && <a href={question.source_url} target="_blank" rel="noreferrer">官方試題 <ArrowUpRight size={13} /></a>}{question.theory_sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowUpRight size={13} /></a>)}</div>
          </div>
          <div className="review-actions"><button className={`save-review-button ${saved ? 'saved' : ''}`} onClick={async () => { if (!user) return; try { const { toggleSavedQuestion } = await import('../lib/attempts'); await toggleSavedQuestion(user.id, question.id, saved); setSavedIds((current) => saved ? current.filter((id) => id !== question.id) : [...current, question.id]) } catch { setError('無法更新錯題本。') } }}><BookmarkPlus size={15} />{saved ? '已加入錯題本' : '加入錯題本'}</button>{topicId && <button className={`save-review-button ${topicSaved ? 'saved' : ''}`} onClick={async () => { if (!user) return; try { const { toggleSavedConcept } = await import('../lib/attempts'); await toggleSavedConcept(user.id, topicId, topicSaved); setSavedTopics((current) => topicSaved ? current.filter((id) => id !== topicId) : [...current, topicId]) } catch { setError('無法更新觀念筆記。') } }}><BookmarkPlus size={15} />{topicSaved ? '已加入觀念筆記' : '加入觀念筆記'}</button>}</div>
        </article>
      })}</div>
    </div>
  </AppShell>
}
