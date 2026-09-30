import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, LoaderCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AppShell } from '../components/AppShell'
import { createAttempt, getQuestions, getTopics } from '../lib/attempts'
import { getInitialTopic, getTopicQuestionScope } from '../lib/topic-routing'
import { SUBJECTS, type SubjectCode, type Topic } from '../types'

export function TopicCatalogPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      getTopics('L21'), getTopics('L23'),
      getQuestions({ subject: 'L21' }), getQuestions({ subject: 'L23' }),
    ]).then(([l21Topics, l23Topics, l21Questions, l23Questions]) => {
      if (!active) return
      const allTopics = [...l21Topics, ...l23Topics]
      const allQuestions = [...l21Questions, ...l23Questions]
      const nextCounts: Record<string, number> = {}
      for (const topic of allTopics) {
        const scope = getTopicQuestionScope(allTopics, topic.id)
        nextCounts[topic.id] = allQuestions.filter((question) => scope.some((topicId) => question.topic_ids.includes(topicId))).length
      }
      const requestedSubject = searchParams.get('subject') === 'L21' ? 'L21' : 'L23'
      const requestedTopic = searchParams.get('topic')
      const firstTopic = getInitialTopic(allTopics, requestedSubject, requestedTopic)
      setTopics(allTopics)
      setCounts(nextCounts)
      setSelectedTopic(firstTopic?.id ?? null)
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : '載入考點時發生錯誤。')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [searchParams])

  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics])
  const activeTopic = selectedTopic ? topicById.get(selectedTopic) ?? null : null
  const mainTopics = topics.filter((topic) => !topic.parent_id)
  const subtopics = topics.filter((topic) => topic.parent_id)

  async function startPractice() {
    if (!user || !activeTopic) return
    setBusy(true)
    setError('')
    try {
      const attempt = await createAttempt({
        userId: user.id,
        subject: activeTopic.subject,
        mode: 'practice',
        topicId: activeTopic.id,
        topicIds: getTopicQuestionScope(topics, activeTopic.id),
      })
      navigate(`/practice/${attempt.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法開始練習，請稍後再試。')
    } finally {
      setBusy(false)
    }
  }

  return <AppShell>
    <div className="catalog-practice-page">
      <aside className="catalog-index" aria-label="依科目與學習指引章節瀏覽考點">
        <div className="catalog-index-intro"><h1>依考點查找題目</h1><p>選擇章節與考點，查看題目與來源。</p></div>
        {error && <p className="catalog-error" role="alert">{error}</p>}
        {loading ? <div className="catalog-loading"><LoaderCircle className="spin" />載入考點</div> : <div className="catalog-topic-scroll">
          {(['L21', 'L23'] as SubjectCode[]).map((code) => <section className="catalog-subject" key={code}>
            <h2>{code}　{SUBJECTS[code].title}</h2>
            <div className="catalog-topic-list">{mainTopics.filter((topic) => topic.subject === code).flatMap((group) => [group, ...subtopics.filter((topic) => topic.parent_id === group.id)]).map((topic) => <button key={topic.id} className={`catalog-topic-row${selectedTopic === topic.id ? ' selected' : ''}${topic.parent_id ? ' child' : ''}`} onClick={() => setSelectedTopic(topic.id)}>
              <span className="catalog-topic-section">{topic.guide_section ?? topic.id}</span><strong>{topic.title}</strong><small>{counts[topic.id] ?? 0}</small>
            </button>)}</div>
          </section>)}
        </div>}
      </aside>
      <section className="catalog-topic-detail">
        <div className="catalog-detail-heading">
          <div className="catalog-breadcrumb">{activeTopic ? `${SUBJECTS[activeTopic.subject].shortTitle}　›　學習指引章節 ${activeTopic.guide_section ?? ''}` : '請從左側選擇考點'}</div>
          <h2>{activeTopic?.title ?? '選擇一個考點'}</h2>
          <a href="https://ipd.nat.gov.tw/ipas/certification/AIAP/learning-resources" target="_blank" rel="noreferrer" className="catalog-guide-link">學習指引 <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <section className="catalog-explanation"><h3>考點說明</h3><p>{activeTopic ? `此考點依學習指引 ${activeTopic.guide_section ?? ''} 章節分類。開始練習後，可查看每題的來源與解釋。` : '選擇章節後，查看考點題目與來源。'}</p></section>
        <section className="catalog-related">
          <h3>相關題目</h3>
          <div className="catalog-related-empty">{activeTopic && counts[activeTopic.id] > 0
            ? <><strong>{counts[activeTopic.id]} 題</strong><span>選擇考點後開始作答，完成後可查看解答與解析。</span></>
            : <><strong>此考點尚無題目。</strong><span>選擇其他章節，或稍後再查看題庫更新。</span></>}</div>
          <button className="catalog-practice-button" onClick={startPractice} disabled={busy || !activeTopic || !counts[activeTopic.id]}>{busy ? '準備題目中…' : '開始考點練習'}</button>
        </section>
      </section>
    </div>
  </AppShell>
}
