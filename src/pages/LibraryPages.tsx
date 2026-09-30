import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpenCheck, Bookmark, ChevronRight, Clock3, FileQuestion, LoaderCircle, RotateCcw, Search, Sparkles, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AppShell } from '../components/AppShell'
import { getSavedQuestionReviews, getTopics } from '../lib/attempts'
import { SUBJECTS, type Attempt, type QuestionReview, type SavedConcept, type SubjectCode, type Topic } from '../types'
import { requireSupabase } from '../lib/supabase'

export function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data, error: queryError } = await requireSupabase().from('exam_attempts').select('*').order('created_at', { ascending: false }).limit(100)
        if (!active) return
        if (queryError) throw queryError
        setAttempts((data ?? []) as Attempt[])
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : '無法載入模考紀錄。')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const mocks = attempts.filter((attempt) => attempt.kind === 'mock')
  const submitted = mocks.filter((attempt) => attempt.state === 'submitted')
  return <AppShell><div className="library-page">
    <div className="page-heading-row"><div><div className="eyebrow"><span className="live-dot" /> ATTEMPT HISTORY</div><h1>每一次練習<span className="heading-period">，</span><br className="mobile-break" />都算數<span className="heading-period">。</span></h1><p>回顧成績變化，找出下一個值得加強的考點。</p></div><div className="heading-stat"><span className="heading-stat-icon"><FileQuestion size={18} /></span><span><strong>{submitted.length}</strong><small>次完成模考</small></span></div></div>
    {error && <div className="inline-alert"><span>{error}</span></div>}
    <section className="panel history-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR EXAM LOG</span><h2>模考紀錄</h2></div><span className="history-total">{mocks.length} 份試卷</span></div>
      {loading ? <div className="page-loading"><LoaderCircle className="spin" />載入紀錄…</div> : mocks.length ? <div className="history-table"><div className="history-table-head"><span>考試內容</span><span>日期</span><span>狀態</span><span>成績</span><span /></div>{mocks.map((attempt) => <button className="history-row" key={attempt.id} onClick={() => navigate(attempt.state === 'submitted' ? `/results/${attempt.id}` : `/exam/${attempt.id}`)}><span className="history-exam-name"><span className={`recent-subject-code ${attempt.subject.toLowerCase()}`}>{attempt.subject}</span><span><strong>{attempt.title}</strong><small>{SUBJECTS[attempt.subject].shortTitle}</small></span></span><span className="history-date">{new Date(attempt.submitted_at ?? attempt.started_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span><span>{attempt.state === 'submitted' ? <span className="table-state state-done">已完成</span> : <span className="table-state state-doing"><i />進行中</span>}</span><span className={attempt.state === 'submitted' ? `history-score ${attempt.passed ? 'score-pass-text' : ''}` : 'history-score'}>{attempt.score === null ? '—' : `${attempt.score} 分`}</span><ChevronRight size={16} /></button>)}</div> : <div className="empty-row"><span className="empty-icon"><Clock3 size={18} /></span><span>你還沒有完成模考。準備好時，從總覽開始第一場。</span><Link className="inline-link" to="/">前往總覽 <ArrowRight size={15} /></Link></div>}
    </section>
    <div className="history-note"><Sparkles size={15} /><span>每科 70 分為模擬及格線。實際授證以 iPAS 正式成績為準。</span></div>
  </div></AppShell>
}

export function WrongBookPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<QuestionReview[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [concepts, setConcepts] = useState<SavedConcept[]>([])
  const [subject, setSubject] = useState<'all' | SubjectCode>('all')
  const [tab, setTab] = useState<'questions' | 'concepts'>('questions')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const client = requireSupabase()
      const [{ data: savedQuestionRows, error: questionError }, { data: conceptRows, error: conceptError }, topicRows] = await Promise.all([
        client.from('saved_questions').select('question_id,note,created_at').order('created_at', { ascending: false }),
        client.from('saved_concepts').select('id,topic_id,note,created_at').order('created_at', { ascending: false }),
        getTopics(),
      ])
      if (questionError) throw questionError
      if (conceptError) throw conceptError
      const questionRows = await getSavedQuestionReviews((savedQuestionRows ?? []).map((row) => row.question_id))
      setQuestions(questionRows)
      setConcepts((conceptRows ?? []) as SavedConcept[])
      setTopics(topicRows)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法載入錯題本。')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [user])

  async function removeQuestion(id: string) {
    if (!user) return
    const { error: deleteError } = await requireSupabase().from('saved_questions').delete().eq('user_id', user.id).eq('question_id', id)
    if (deleteError) { setError(deleteError.message); return }
    setQuestions((current) => current.filter((question) => question.id !== id))
  }

  async function removeConcept(topicId: string) {
    if (!user) return
    const { error: deleteError } = await requireSupabase().from('saved_concepts').delete().eq('user_id', user.id).eq('topic_id', topicId)
    if (deleteError) { setError(deleteError.message); return }
    setConcepts((current) => current.filter((concept) => concept.topic_id !== topicId))
  }

  const topicById = new Map(topics.map((topic) => [topic.id, topic]))
  const visibleQuestions = questions.filter((question) => (subject === 'all' || question.subject === subject) && `${question.stem} ${question.source_label} ${question.topic_ids.join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const visibleConcepts = concepts.filter((concept) => {
    const topic = topicById.get(concept.topic_id)
    return (subject === 'all' || topic?.subject === subject) && `${topic?.title ?? ''} ${concept.note ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  })

  return <AppShell><div className="library-page wrongbook-page">
    <div className="page-heading-row"><div><div className="eyebrow"><span className="live-dot" /> YOUR REVIEW LIST</div><h1>留住重要觀念<span className="heading-period">。</span></h1><p>把容易混淆的題目和考點收在一起，留給下一次複習。</p></div><div className="heading-stat"><span className="heading-stat-icon"><Bookmark size={18} /></span><span><strong>{questions.length + concepts.length}</strong><small>收藏項目</small></span></div></div>
    {error && <div className="inline-alert"><span>{error}</span><button onClick={() => void load()}>重新載入</button></div>}
    <section className="panel wrongbook-panel"><div className="wrongbook-toolbar"><div className="segmented-tabs"><button className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>錯題 <span>{questions.length}</span></button><button className={tab === 'concepts' ? 'active' : ''} onClick={() => setTab('concepts')}>觀念筆記 <span>{concepts.length}</span></button></div><div className="wrongbook-filters"><select aria-label="選擇科目" value={subject} onChange={(event) => setSubject(event.target.value as 'all' | SubjectCode)}><option value="all">全部科目</option><option value="L21">L21 · AI 應用規劃</option><option value="L23">L23 · 機器學習</option></select><label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋題目或考點" /></label></div></div>
      {loading ? <div className="page-loading"><LoaderCircle className="spin" />載入收藏…</div> : tab === 'questions' ? visibleQuestions.length ? <div className="saved-list">{visibleQuestions.map((question, index) => <article className="saved-row" key={question.id}><div className="saved-number">{String(index + 1).padStart(2, '0')}</div><div className="saved-main"><div><span className={`subject-badge badge-${question.subject.toLowerCase()}`}>{question.subject}</span><span className="question-chip">{question.origin === 'official' ? `${question.exam_year} 年第${question.exam_session}梯次` : question.origin === 'exam_style' ? '仿歷屆題型' : '依考點新編'}</span></div><h3>{question.stem}</h3><p>{question.explanation}</p><Link to="/practice" className="saved-source">{question.topic_ids.join(' · ')} <ArrowUpRight size={12} /></Link></div><button className="icon-button remove-saved" aria-label="移除錯題" title="移除錯題" onClick={() => void removeQuestion(question.id)}><Trash2 size={16} /></button></article>)}</div> : <div className="empty-row"><span className="empty-icon"><Bookmark size={18} /></span><span>目前沒有符合條件的錯題。作答檢討時可將題目加入這裡。</span></div> : visibleConcepts.length ? <div className="saved-list">{visibleConcepts.map((concept) => { const topic = topicById.get(concept.topic_id); return <article className="saved-row concept-saved-row" key={concept.id}><div className="saved-number"><BookOpenCheck size={17} /></div><div className="saved-main"><div><span className={`subject-badge badge-${topic?.subject.toLowerCase() ?? 'l21'}`}>{topic?.subject ?? 'AI'}</span><span className="question-chip">{topic?.guide_section ?? concept.topic_id}</span></div><h3>{topic?.title ?? concept.topic_id}</h3><p>{concept.note || '從錯題檢討中收藏的考點，開始主題練習以重新複習。'}</p><Link to={`/practice?subject=${topic?.subject ?? 'L21'}`} className="saved-source">前往主題練習 <ArrowUpRight size={12} /></Link></div><button className="icon-button remove-saved" aria-label="移除觀念" title="移除觀念" onClick={() => void removeConcept(concept.topic_id)}><Trash2 size={16} /></button></article> })}</div> : <div className="empty-row"><span className="empty-icon"><Sparkles size={18} /></span><span>目前沒有收藏的觀念。檢討題目時可將考點加入觀念筆記。</span></div>}
    </section>
    <div className="history-note"><RotateCcw size={15} /><span>錯題和觀念收藏只會顯示在你的個人帳號中。</span></div>
  </div></AppShell>
}

export function SetupHelpPage() {
  return <AppShell><div className="library-page"><div className="page-heading-row"><div><div className="eyebrow">GETTING STARTED</div><h1>把備考室準備好<span className="heading-period">。</span></h1><p>每位使用者各自建立一份部署，資料保存在自己的 Supabase 專案。</p></div></div><section className="panel setup-help-panel"><div className="help-step"><span>01</span><div><h2>建立 Supabase 專案</h2><p>建立免費專案。網站帳號使用的信箱需與 Supabase 專案團隊成員信箱相同，免費預設郵件服務才能寄送註冊驗證和密碼重設信。</p><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">前往 Supabase <ArrowUpRight size={14} /></a></div></div><div className="help-step"><span>02</span><div><h2>填入網站環境變數</h2><p>複製 <code>.env.example</code> 為 <code>.env.local</code>，填入 Supabase Project URL 和 publishable key。題庫匯入時另需本機 <code>SUPABASE_SECRET_KEY</code>，不可加上 <code>VITE_</code> 前綴。本機設定檔不會上傳；部署網站只設定前兩個值。</p></div></div><div className="help-step"><span>03</span><div><h2>建立資料表與匯入題庫</h2><p>在 Supabase SQL Editor 執行專案的 <code>supabase/manual_setup.sql</code>，再依 <code>docs/SUPABASE_SETUP.md</code> 匯入題庫。首次註冊自己的帳號後，到 Supabase Auth 關閉後續公開註冊。</p></div></div><div className="help-step"><span>04</span><div><h2>部署到網路</h2><p>將前端部署至靜態網站主機，並把正式網址加入 Supabase Auth 的允許網址。從不同電腦瀏覽器登入同一份部署即可同步進度；手機版不在目前驗收範圍。</p></div></div></section><Link to="/" className="button button-secondary">回到學習總覽 <ArrowRight size={15} /></Link></div></AppShell>
}
