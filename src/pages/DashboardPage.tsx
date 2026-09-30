import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpenCheck, Check, ChevronRight, Clock3, FileQuestion, LoaderCircle, Play } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { StartExamModal } from '../components/StartExamModal'
import { getAttemptReview, getInProgressAttempt, getRecentAttempts, getTopics } from '../lib/attempts'
import { SUBJECTS, type Attempt, type SubjectCode, type Topic } from '../types'

interface TopicAccuracy {
  topic: Topic
  total: number
  incorrect: number
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [chosenSubject, setChosenSubject] = useState<SubjectCode>('L21')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [weakTopics, setWeakTopics] = useState<TopicAccuracy[]>([])
  const [resume, setResume] = useState<Attempt | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams.get('startExam') !== '1') return
    setChosenSubject(searchParams.get('subject') === 'L23' ? 'L23' : 'L21')
    setModalOpen(true)
    setSearchParams((current) => {
      current.delete('startExam')
      return current
    }, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    let active = true
    Promise.all([getRecentAttempts(), getTopics(), getInProgressAttempt()])
      .then(async ([recent, topicRows, inProgress]) => {
        if (!active) return
        setAttempts(recent)
        setTopics(topicRows)
        setResume(inProgress)

        const submittedMocks = recent.filter((attempt) => attempt.kind === 'mock' && attempt.state === 'submitted').slice(0, 5)
        const reviews = await Promise.all(submittedMocks.map(async (attempt) => ({ attempt, questions: await getAttemptReview(attempt.id) })))
        const topicMap = new Map(topicRows.map((topic) => [topic.id, topic]))
        const totals = new Map<string, { total: number; incorrect: number }>()
        for (const { attempt, questions } of reviews) {
          for (const question of questions) {
            const answer = attempt.answers?.[question.id]
            if (!answer) continue
            for (const topicId of question.topic_ids) {
              if (!topicMap.has(topicId) || topicMap.get(topicId)?.parent_id === null) continue
              const count = totals.get(topicId) ?? { total: 0, incorrect: 0 }
              count.total += 1
              if (answer !== question.correct_option) count.incorrect += 1
              totals.set(topicId, count)
            }
          }
        }
        const ranked = [...totals.entries()]
          .map(([topicId, count]) => ({ topic: topicMap.get(topicId)!, ...count }))
          .filter((item) => item.incorrect > 0)
          .sort((a, b) => (b.incorrect / b.total) - (a.incorrect / a.total) || b.incorrect - a.incorrect)
          .slice(0, 4)
        if (active) setWeakTopics(ranked)
      })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : '讀取學習資料時發生問題。') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submittedAttempts = attempts.filter((attempt) => attempt.kind === 'mock' && attempt.state === 'submitted')
  const recent = attempts.filter((attempt) => attempt.state === 'submitted').slice(0, 4)
  const subjectTopics = useMemo(() => (['L21', 'L23'] as SubjectCode[]).map((subject) => ({
    subject,
    topics: topics.filter((topic) => topic.subject === subject && topic.parent_id !== null),
  })), [topics])

  function openExam(subject: SubjectCode) {
    setChosenSubject(subject)
    setModalOpen(true)
  }

  return <AppShell>
    <div className="study-home">
      <header className="study-home-heading">
        <div>
          <h1>從薄弱處開始複習<span>。</span></h1>
          <p>根據已完成的模擬考，找出值得再練一次的考點。</p>
        </div>
        <Link to="/practice" className="study-text-link">瀏覽全部考點 <ArrowRight size={16} /></Link>
      </header>

      {resume && <button className="study-resume" onClick={() => navigate(`/exam/${resume.id}`)}>
        <span className="study-resume-icon"><Play size={16} fill="currentColor" /></span>
        <span><strong>繼續未完成的模擬考</strong><small>{SUBJECTS[resume.subject].title} · 上次作答 {Object.keys(resume.answers ?? {}).length} 題</small></span>
        <span className="study-resume-action">繼續作答 <ArrowRight size={16} /></span>
      </button>}

      {loadError && <div className="inline-alert" role="alert"><span>{loadError}</span></div>}

      <div className="study-home-grid">
        <section className="study-focus-section" aria-labelledby="study-focus-title">
          <div className="study-section-heading">
            <div><span className="study-section-kicker">依作答紀錄整理</span><h2 id="study-focus-title">建議加強的考點</h2></div>
            <span className="study-section-count">{loading ? <LoaderCircle className="spin" size={17} /> : `${weakTopics.length} 個考點`}</span>
          </div>
          {loading ? <div className="study-empty"><LoaderCircle className="spin" /><span>正在整理你的作答紀錄…</span></div>
            : weakTopics.length ? <div className="study-weak-list">{weakTopics.map(({ topic, total, incorrect }, index) => <Link className="study-weak-row" to={`/practice?subject=${topic.subject}&topic=${topic.id}`} key={topic.id}>
              <span className="study-weak-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="study-weak-main"><span className="study-weak-meta">{topic.subject} <i>·</i> 學習指引 {topic.guide_section}</span><strong>{topic.title}</strong><small>作答 {total} 題，答錯 {incorrect} 題</small></span>
              <span className="study-weak-action">開始練習 <ArrowUpRight size={17} /></span>
            </Link>)}</div>
            : <div className="study-empty"><BookOpenCheck size={22} /><div><strong>{submittedAttempts.length ? '目前沒有需要優先複習的考點' : '完成一場模擬考，開始掌握弱點'}</strong><p>{submittedAttempts.length ? '作答結果會持續更新這份清單。你也可以直接選擇科目開始練習。' : '完成後會依逐題作答結果整理建議考點。'}</p></div></div>}
        </section>

        <aside className="study-subject-section" aria-labelledby="study-subject-title">
          <div className="study-section-heading"><div><span className="study-section-kicker">兩科皆可練習</span><h2 id="study-subject-title">選擇考科</h2></div></div>
          {subjectTopics.map(({ subject, topics: rows }) => <article className="study-subject-row" key={subject}>
            <div className="study-subject-meta"><span>{subject}</span><small>{rows.length} 個考點</small></div>
            <h3>{SUBJECTS[subject].title}</h3>
            <p>{SUBJECTS[subject].subtitle}</p>
            <Link to={`/practice?subject=${subject}`} className="study-subject-link">查看考點並練習 <ArrowRight size={15} /></Link>
          </article>)}
          <button className="study-mock-link" onClick={() => openExam('L21')}><Clock3 size={17} /><span><strong>開始正式模擬考</strong><small>50 題 · 90 分鐘</small></span><ArrowUpRight size={17} /></button>
        </aside>
      </div>

      <section className="study-recent-section">
        <div className="study-section-heading"><div><span className="study-section-kicker">作答歷程</span><h2>最近的模擬考</h2></div><Link to="/history" className="study-text-link">查看全部 <ArrowRight size={16} /></Link></div>
        {recent.length ? <div className="study-recent-list">{recent.map((attempt) => <button className="study-recent-row" key={attempt.id} onClick={() => navigate(`/results/${attempt.id}`)}>
          <span className={`study-recent-subject ${attempt.subject.toLowerCase()}`}>{attempt.subject}</span>
          <span className="study-recent-title"><strong>{attempt.title}</strong><small>{SUBJECTS[attempt.subject].shortTitle} · {new Date(attempt.submitted_at ?? attempt.started_at).toLocaleDateString('zh-TW')}</small></span>
          <span className="study-recent-score">{attempt.score ?? 0}<small> / 100</small></span>
          <span className="study-recent-result">{attempt.passed ? <><Check size={15} /> 模擬達標</> : '繼續複習'}</span><ChevronRight size={17} />
        </button>)}</div> : <div className="study-recent-empty"><FileQuestion size={20} /><span>完成的模擬考會列在這裡，方便回看分數與逐題解析。</span></div>}
      </section>

      <StartExamModal open={modalOpen} onClose={() => setModalOpen(false)} initialSubject={chosenSubject} />
    </div>
  </AppShell>
}
