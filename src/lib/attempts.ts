import { requireSupabase } from './supabase'
import type { AnswerMap, Attempt, Choice, PracticeAnswerFeedback, Question, QuestionReview, SubjectCode, Topic } from '../types'

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function balanceByTopic(questions: Question[]): Question[] {
  const buckets = new Map<string, Question[]>()
  for (const question of shuffle(questions)) {
    const key = question.topic_ids[0] ?? 'untagged'
    const bucket = buckets.get(key) ?? []
    bucket.push(question)
    buckets.set(key, bucket)
  }
  const orderedBuckets = [...buckets.values()].map(shuffle)
  const balanced: Question[] = []
  while (orderedBuckets.some((bucket) => bucket.length > 0)) {
    for (const bucket of orderedBuckets) {
      const question = bucket.shift()
      if (question) balanced.push(question)
    }
  }
  return balanced
}

function mapQuestion(row: Record<string, unknown>): Question {
  const group = row.question_groups as { shared_stem?: string; media?: Question['media'] } | null
  return {
    ...(row as unknown as Question),
    shared_stem: group?.shared_stem ?? null,
    media: group?.media ?? [],
  }
}

export async function getTopics(subject?: SubjectCode): Promise<Topic[]> {
  let query = requireSupabase().from('topics').select('*').order('sort_order')
  if (subject) query = query.eq('subject', subject)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Topic[]
}

export async function getQuestions(filters: {
  subject?: SubjectCode
  topicId?: string
  origin?: Question['origin']
  examYear?: number
  examSession?: string
} = {}): Promise<Question[]> {
  let query = requireSupabase()
    .from('questions')
    .select('*, question_groups(shared_stem, media)')
    .order('display_order')
  if (filters.subject) query = query.eq('subject', filters.subject)
  if (filters.origin) query = query.eq('origin', filters.origin)
  if (filters.examYear) query = query.eq('exam_year', filters.examYear)
  if (filters.examSession) query = query.eq('exam_session', filters.examSession)
  if (filters.topicId) query = query.contains('topic_ids', [filters.topicId])
  query = query.eq('needs_manual_media_review', false)
  const { data, error } = await query.limit(1000)
  if (error) throw error
  return (data ?? []).map((row) => mapQuestion(row as Record<string, unknown>))
}

export async function getQuestionSet(ids: string[]): Promise<Question[]> {
  if (!ids.length) return []
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('*, question_groups(shared_stem, media)')
    .in('id', ids)
  if (error) throw error
  const questionMap = new Map((data ?? []).map((row) => {
    const question = mapQuestion(row as Record<string, unknown>)
    return [question.id, question]
  }))
  return ids.map((id) => questionMap.get(id)).filter((item): item is Question => Boolean(item))
}

export async function getRecentAttempts(): Promise<Attempt[]> {
  const { data, error } = await requireSupabase()
    .from('exam_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return (data ?? []) as Attempt[]
}

export async function getInProgressAttempt(): Promise<Attempt | null> {
  const { data, error } = await requireSupabase()
    .from('exam_attempts')
    .select('*')
    .eq('state', 'in_progress')
    .eq('kind', 'mock')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as Attempt | null
}

export async function getAttempt(id: string): Promise<Attempt> {
  const { data, error } = await requireSupabase().from('exam_attempts').select('*').eq('id', id).single()
  if (error) throw error
  return data as Attempt
}

export async function createAttempt(input: {
  userId: string
  subject: SubjectCode
  mode: 'mock' | 'practice'
  topicId?: string
  paper?: { year: number; session: string }
}): Promise<Attempt> {
  const isPaper = Boolean(input.paper)
  const pool = await getQuestions({
    subject: input.subject,
    origin: isPaper ? 'official' : undefined,
    examYear: input.paper?.year,
    examSession: input.paper?.session,
    topicId: input.topicId,
  })
  if (pool.length < (input.mode === 'mock' ? 50 : 1)) {
    throw new Error('目前題庫題數不足，請先完成題庫初始化或改選其他考點。')
  }
  const ordered = isPaper ? pool : balanceByTopic(pool)
  const selected = input.mode === 'mock' ? ordered.slice(0, 50) : ordered.slice(0, 10)
  const title = isPaper
    ? `${input.paper!.year} 年${input.paper!.session} 歷屆試卷`
    : input.mode === 'mock'
      ? '隨機全真模擬考'
      : input.topicId ?? '主題練習'
  const { data, error } = await requireSupabase().rpc('create_attempt', {
    p_subject: input.subject,
    p_kind: input.mode,
    p_title: title,
    p_question_ids: selected.map((question) => question.id),
  })
  if (error) throw error
  return data as Attempt
}

export async function saveAttempt(attempt: Attempt, answers: AnswerMap, flaggedQuestionIds: string[]) {
  const { error } = await requireSupabase().rpc('save_attempt', {
    p_attempt_id: attempt.id,
    p_answers: answers,
    p_flagged_question_ids: flaggedQuestionIds,
  })
  if (error) throw error
}

export async function submitAttempt(attempt: Attempt, answers: AnswerMap): Promise<Attempt> {
  const { data, error } = await requireSupabase().rpc('submit_attempt', {
    p_attempt_id: attempt.id,
    p_answers: answers,
  })
  if (error) throw error
  return data as Attempt
}

export async function checkPracticeAnswer(
  attemptId: string,
  questionId: string,
  choice: Choice,
): Promise<PracticeAnswerFeedback> {
  const { data, error } = await requireSupabase().rpc('check_practice_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_choice: choice,
  })
  if (error) throw error
  return data as PracticeAnswerFeedback
}

export async function getAttemptReview(attemptId: string): Promise<QuestionReview[]> {
  const { data, error } = await requireSupabase().rpc('get_attempt_review', {
    p_attempt_id: attemptId,
  })
  if (error) throw error
  return (data ?? []) as QuestionReview[]
}

export async function getSavedQuestionReviews(questionIds: string[]): Promise<QuestionReview[]> {
  if (!questionIds.length) return []
  const { data, error } = await requireSupabase().rpc('get_saved_question_reviews', {
    p_question_ids: questionIds,
  })
  if (error) throw error
  return (data ?? []) as QuestionReview[]
}

export async function toggleSavedQuestion(userId: string, questionId: string, isSaved: boolean) {
  const client = requireSupabase()
  if (isSaved) {
    const { error } = await client.from('saved_questions').delete().eq('user_id', userId).eq('question_id', questionId)
    if (error) throw error
  } else {
    const { error } = await client.from('saved_questions').insert({ user_id: userId, question_id: questionId })
    if (error) throw error
  }
}

export async function toggleSavedConcept(userId: string, topicId: string, isSaved: boolean) {
  const client = requireSupabase()
  if (isSaved) {
    const { error } = await client.from('saved_concepts').delete().eq('user_id', userId).eq('topic_id', topicId)
    if (error) throw error
  } else {
    const { error } = await client.from('saved_concepts').insert({ user_id: userId, topic_id: topicId })
    if (error) throw error
  }
}

export async function saveAnswerLocallyAndRemotely(
  attempt: Attempt,
  answers: AnswerMap,
  flags: string[],
  questionId: string,
  answer: Choice | undefined,
) {
  const next = { ...answers }
  if (answer) next[questionId] = answer
  else delete next[questionId]
  await saveAttempt(attempt, next, flags)
  return next
}
