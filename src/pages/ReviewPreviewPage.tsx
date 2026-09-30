import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import topics from '../../content/topics.json'

type PreviewTopic = { id: string; subject: 'L21' | 'L23'; parent_id: string | null; title: string; guide_section: string | null }
const topicList = topics as PreviewTopic[]

export function ReviewPreviewPage() {
  const [selectedTopic, setSelectedTopic] = useState('L23-3.3')
  const activeTopic = topicList.find((topic) => topic.id === selectedTopic)
  const visibleTopics = useMemo(() => topicList.filter((topic) => topic.subject === 'L21' || topic.subject === 'L23'), [])
  const subjectTitle = activeTopic?.subject === 'L21' ? '人工智慧技術應用規劃' : '機器學習技術與應用'

  return <AppShell>
    <div className="catalog-preview-banner">桌面畫面預覽｜考點名稱取自學習指引；作答紀錄與題數尚未連接 Supabase，不會保存資料。</div>
    <div className="catalog-practice-page">
      <aside className="catalog-index" aria-label="依科目與學習指引章節瀏覽考點">
        <div className="catalog-index-intro"><h1>依考點查找題目</h1><p>選擇章節與考點，查看題目與來源。</p></div>
        <div className="catalog-topic-scroll">
          {(['L21', 'L23'] as const).map((code) => {
            const subjectTopics = visibleTopics.filter((topic) => topic.subject === code)
            const parents = subjectTopics.filter((topic) => !topic.parent_id)
            return <section className="catalog-subject" key={code}>
              <h2>{code}　{code === 'L21' ? '人工智慧技術應用規劃' : '機器學習技術與應用'}</h2>
              <div className="catalog-topic-list">{parents.flatMap((group) => [group, ...subjectTopics.filter((topic) => topic.parent_id === group.id)]).map((topic) => <button key={topic.id} className={`catalog-topic-row${selectedTopic === topic.id ? ' selected' : ''}${topic.parent_id ? ' child' : ''}`} onClick={() => setSelectedTopic(topic.id)}>
                <span className="catalog-topic-section">{topic.guide_section ?? topic.id}</span><strong>{topic.title}</strong><small>—</small>
              </button>)}</div>
            </section>
          })}
        </div>
      </aside>
      <section className="catalog-topic-detail">
        <div className="catalog-detail-heading">
          <div className="catalog-breadcrumb">{activeTopic ? `${activeTopic.subject}　›　${subjectTitle}　›　學習指引章節 ${activeTopic.guide_section ?? ''}` : '請從左側選擇考點'}</div>
          <h2>{activeTopic?.title ?? '選擇一個考點'}</h2>
          <a href="https://ipd.nat.gov.tw/ipas/certification/AIAP/learning-resources" target="_blank" rel="noreferrer" className="catalog-guide-link">學習指引 <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
        <section className="catalog-explanation"><h3>考點說明</h3><p>{activeTopic?.id === 'L23-3.3' ? '梯度下降透過反覆調整模型參數，逐步降低損失函數。學習率會影響每次更新的幅度。' : `此考點依學習指引 ${activeTopic?.guide_section ?? ''} 章節分類。開始練習後，可查看每題的來源與解釋。`}</p></section>
        <section className="catalog-related">
          <h3>相關題目</h3>
          <div className="catalog-related-empty"><strong>預覽不載入題目</strong><span>完成 Supabase 設定並登入後，這裡會顯示可練習的題目與作答紀錄。</span></div>
          <button className="catalog-practice-button" disabled>開始考點練習</button>
        </section>
      </section>
    </div>
  </AppShell>
}
