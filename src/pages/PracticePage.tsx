import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpenCheck, Check, ChevronLeft, ChevronRight, CircleHelp, LoaderCircle, Sparkles, Target } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AppShell } from '../components/AppShell'
import { checkPracticeAnswer, createAttempt, getQuestions, getTopics, getAttempt, getQuestionSet, submitAttempt } from '../lib/attempts'
import { SUBJECTS, type AnswerMap, type Attempt, type Choice, type PracticeAnswerFeedback, type Question, type SubjectCode, type Topic } from '../types'

export function PracticePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('subject') === 'L23' ? 'L23' : 'L21'
  const [subject, setSubject] = useState<SubjectCode>(initial)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSubject(searchParams.get('subject') === 'L23' ? 'L23' : 'L21')
  }, [searchParams])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getTopics(subject), getQuestions({ subject })])
      .then(([topicRows, questions]) => {
        if (!active) return
        setTopics(topicRows)
        const next: Record<string, number> = {}
        for (const topic of topicRows) next[topic.id] = questions.filter((question) => question.topic_ids.includes(topic.id)).length
        setCounts(next)
        setSelectedTopic(null)
      })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : '無法載入考點。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [subject])

  const mainTopics = topics.filter((topic) => !topic.parent_id)
  const subtopics = topics.filter((topic) => topic.parent_id)

  async function startPractice() {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const attempt = await createAttempt({ userId: user.id, subject, mode: 'practice', topicId: selectedTopic ?? undefined })
      navigate(`/practice/${attempt.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法開始練習。')
    } finally {
      setBusy(false)
    }
  }

  return <AppShell>
    <div className="practice-page">
      <div className="page-heading-row"><div><div className="eyebrow"><span className="live-dot" /> STUDY BY TOPIC</div><h1>把觀念練熟<span className="heading-period">。</span></h1><p>挑一個考點開始練習，作答後立即查看解析和來源。</p></div><div className="heading-stat"><span className="heading-stat-icon"><Target size={18} /></span><span><strong>{topics.length}</strong><small>個考點</small></span></div></div>
      <div className="practice-subject-toggle" role="tablist" aria-label="選擇考科">{(['L21', 'L23'] as SubjectCode[]).map((code) => <button key={code} role="tab" aria-selected={subject === code} className={subject === code ? 'selected' : ''} onClick={() => setSubject(code)}><span className={`subject-badge badge-${code.toLowerCase()}`}>{code}</span><span>{SUBJECTS[code].title}</span></button>)}</div>
      {error && <div className="inline-alert"><span>{error}</span></div>}
      {loading ? <div className="page-loading"><LoaderCircle className="spin" />正在整理考點…</div> : <>
        <div className="topic-filter-row"><button className={`topic-filter ${selectedTopic === null ? 'selected' : ''}`} onClick={() => setSelectedTopic(null)}>全部考點 <span>{topics.reduce((total, topic) => total + (counts[topic.id] ?? 0), 0)}</span></button>{mainTopics.map((topic) => <button key={topic.id} className={`topic-filter ${selectedTopic === topic.id ? 'selected' : ''}`} onClick={() => setSelectedTopic(topic.id)}>{topic.title}<span>{counts[topic.id] ?? 0}</span></button>)}</div>
        <div className="practice-layout"><section className="topic-list-card"><div className="topic-list-heading"><div><span className="eyebrow">{subject} LEARNING MAP</span><h2>{SUBJECTS[subject].shortTitle}</h2></div><span className="topic-count-pill">{subtopics.length} 個子考點</span></div>
          <div className="topic-list">{(selectedTopic ? topics.filter((topic) => topic.id === selectedTopic || topic.parent_id === selectedTopic) : topics).map((topic) => <button key={topic.id} className={`topic-row ${selectedTopic === topic.id ? 'selected' : ''}`} onClick={() => setSelectedTopic(topic.id)}><span className={`topic-row-index ${topic.parent_id ? 'child' : ''}`}>{topic.guide_section ?? topic.id}</span><span className="topic-row-main"><strong>{topic.title}</strong><small>{topic.guide_page ? `學習指引第 ${topic.guide_page} 頁` : topic.parent_id ? '子考點' : '核心考點'}</small></span><span className="topic-question-count">{counts[topic.id] ?? 0}<small> 題</small></span><ChevronRight size={16} /></button>)}</div>
        </section><aside className="practice-side-card"><span className="practice-side-icon"><BookOpenCheck size={19} /></span><span className="eyebrow">QUICK PRACTICE</span><h2>{selectedTopic ? topics.find((topic) => topic.id === selectedTopic)?.title : '綜合考點練習'}</h2><p>不限時作答。每題完成後立即顯示正確答案、觀念解析與來源。</p><div className="practice-side-meta"><span><CircleHelp size={15} />最多 10 題</span><span><Sparkles size={15} />即時解析</span></div><button className="button button-primary practice-start" onClick={startPractice} disabled={busy || !counts[selectedTopic ?? ''] && Boolean(selectedTopic)}>{busy ? '正在準備題目…' : '開始練習'}<ArrowRight size={16} /></button><small className="practice-side-help">題目依學習指引範圍隨機抽選</small></aside></div>
      </>}
    </div>
  </AppShell>
}

export function PracticeRunPage() {
  const { attemptId = '' } = useParams()
  return <PracticeRunContent attemptId={attemptId} />
}

function PracticeRunContent({ attemptId }: { attemptId: string }) {
  const resolvedId = attemptId
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [feedback, setFeedback] = useState<PracticeAnswerFeedback | null>(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getAttempt(resolvedId).then(async (row) => ({ row, questions: await getQuestionSet(row.question_ids) }))
      .then(({ row, questions: rows }) => { if (active) { setAttempt(row); setQuestions(rows); setAnswers(row.answers ?? {}) } })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : '無法載入練習題。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [resolvedId])

  const question = questions[index]
  const selected = question ? answers[question.id] : undefined

  useEffect(() => {
    if (!attempt || !question || !selected) {
      setFeedback(null)
      return
    }
    let active = true
    checkPracticeAnswer(attempt.id, question.id, selected)
      .then((result) => { if (active) setFeedback(result) })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : '無法取得作答解析。') })
    return () => { active = false }
  }, [attempt, question, selected])

  function choose(choice: Choice) {
    if (!question) return
    setAnswers((current) => ({ ...current, [question.id]: choice }))
  }

  async function finish() {
    if (!attempt) return
    setBusy(true)
    try {
      await submitAttempt(attempt, answers)
      navigate(`/results/${attempt.id}`)
    } catch (caught) { setError(caught instanceof Error ? caught.message : '無法完成練習。') }
    finally { setBusy(false) }
  }

  if (loading) return <AppShell><div className="page-loading"><LoaderCircle className="spin" />載入練習題…</div></AppShell>
  if (!attempt || !question) return <AppShell><div className="empty-state"><h2>無法載入練習</h2><p>{error}</p><Link to="/practice" className="button button-secondary">返回考點</Link></div></AppShell>

  const isCorrect = feedback?.is_correct ?? false
  return <AppShell><div className="practice-run-page">
    <div className="exam-topline"><Link to="/practice" className="exam-exit"><ArrowLeft size={16} />離開練習</Link><div className="exam-mode-label"><span />主題練習</div><div className="practice-count">第 {index + 1} / {questions.length} 題</div></div>
    {error && <div className="inline-alert"><span>{error}</span></div>}
    <div className="practice-run-heading"><span className={`subject-badge badge-${attempt.subject.toLowerCase()}`}>{attempt.subject}</span><div><div className="eyebrow">PRACTICE · {question.topic_ids.join(' / ')}</div><h1>{attempt.title}</h1></div></div>
    <section className="question-card practice-question-card"><div className="question-card-head"><span className="question-count">QUESTION <b>{String(index + 1).padStart(2, '0')}</b><i> / {String(questions.length).padStart(2, '0')}</i></span><span className="question-chip">{question.origin === 'official' ? `${question.exam_year} 年第${question.exam_session}梯次` : question.origin === 'exam_style' ? '仿歷屆題型' : '依考點新編'}</span></div>{question.shared_stem && <div className="question-context"><span>情境題組</span><p>{question.shared_stem}</p></div>}<div className="question-source-line">{question.source_label}{question.source_url && <a href={question.source_url} target="_blank" rel="noreferrer">查看來源</a>}</div><h2 className="question-stem">{question.stem}</h2><div className="answer-options" role="radiogroup">{(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => <button key={choice} className={`answer-option ${selected === choice ? 'selected' : ''} ${feedback && choice === feedback.correct_option ? 'answer-correct' : ''} ${selected === choice && feedback && !isCorrect ? 'answer-incorrect' : ''}`} role="radio" aria-checked={selected === choice} onClick={() => choose(choice)}><span className="option-letter">{choice}</span><span className="option-text">{question.options[choice]}</span>{feedback && choice === feedback.correct_option ? <Check size={17} /> : <span className="option-radio" />}</button>)}</div>
      {selected && feedback && <div className={`instant-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}><div className="feedback-title"><span>{isCorrect ? <Check size={16} /> : <CircleHelp size={16} />}</span><strong>{isCorrect ? '答對了' : `正確答案是 ${feedback.correct_option}`}</strong></div><p>{feedback.explanation}</p><div className="option-rationales">{(['A', 'B', 'C', 'D'] as Choice[]).map((choice) => <p key={choice}><b>{choice}</b>{feedback.option_explanations[choice]}</p>)}</div><div className="feedback-source">來源：{question.source_label}{question.theory_sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowUpRight size={13} /></a>)}</div></div>}
      <div className="question-card-footer"><button className="button button-quiet" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}><ChevronLeft size={16} />上一題</button><span>{selected ? '答案已保存' : '選擇答案後查看解析'}</span>{index === questions.length - 1 ? <button className="button button-primary" onClick={() => void finish()} disabled={busy}>{busy ? '整理紀錄…' : '完成練習'}<Check size={16} /></button> : <button className="button button-secondary" onClick={() => setIndex(index + 1)}>下一題<ChevronRight size={16} /></button>}</div>
    </section>
  </div></AppShell>
}
