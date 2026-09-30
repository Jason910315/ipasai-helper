export type SubjectCode = 'L21' | 'L23'
export type QuestionOrigin = 'official' | 'exam_style' | 'guide_research'
export type Choice = 'A' | 'B' | 'C' | 'D'
export type AnswerMap = Record<string, Choice>

export interface Question {
  id: string
  subject: SubjectCode
  origin: QuestionOrigin
  stem: string
  options: Record<Choice, string>
  correct_option?: Choice
  explanation?: string
  option_explanations?: Partial<Record<Choice, string>>
  topic_ids: string[]
  difficulty: 1 | 2 | 3
  tags: string[]
  group_id: string | null
  shared_stem?: string | null
  media?: Array<{ kind: 'image'; src: string; alt: string }>
  source_label: string
  source_url: string | null
  exam_year: number | null
  exam_session: string | null
  source_question_number: number | null
  source_pdf_page?: number | null
  style_reference: string | null
  theory_sources: Array<{ title: string; url: string; published?: string }>
  verified_at: string | null
  display_order: number
  needs_manual_media_review?: boolean
}

export interface QuestionReview extends Question {
  correct_option: Choice
  explanation: string
  option_explanations: Partial<Record<Choice, string>>
}

export interface PracticeAnswerFeedback {
  is_correct: boolean
  correct_option: Choice
  explanation: string
  option_explanations: Partial<Record<Choice, string>>
}

export interface Topic {
  id: string
  subject: SubjectCode
  parent_id: string | null
  title: string
  guide_section: string | null
  guide_page: string | null
  sort_order: number
}

export interface Attempt {
  id: string
  user_id: string
  subject: SubjectCode
  kind: 'mock' | 'practice'
  state: 'in_progress' | 'submitted'
  title: string
  question_ids: string[]
  answers: AnswerMap
  flagged_question_ids: string[]
  started_at: string
  expires_at: string | null
  submitted_at: string | null
  score: number | null
  correct_count: number | null
  wrong_count: number | null
  unanswered_count: number | null
  passed: boolean | null
}

export interface SavedQuestion {
  question_id: string
  note: string | null
  created_at: string
}

export interface SavedConcept {
  id: string
  topic_id: string
  note: string | null
  created_at: string
}

export const SUBJECTS: Record<SubjectCode, { title: string; shortTitle: string; subtitle: string }> = {
  L21: {
    title: '人工智慧技術應用與規劃',
    shortTitle: 'AI 技術應用與規劃',
    subtitle: 'NLP、電腦視覺、生成式 AI、導入評估與部署',
  },
  L23: {
    title: '機器學習技術與應用',
    shortTitle: '機器學習技術與應用',
    subtitle: '基礎數學、模型訓練、深度學習與治理',
  },
}

export const CHOICES: Choice[] = ['A', 'B', 'C', 'D']
