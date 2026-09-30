import { createAccountDataExport } from './account-data'
import { requireSupabase } from './supabase'

export async function downloadAccountData(user: { id: string; email?: string | null }) {
  const client = requireSupabase()
  const [{ data: attempts, error: attemptsError }, { data: savedQuestions, error: questionsError }, { data: savedConcepts, error: conceptsError }] = await Promise.all([
    client.from('exam_attempts').select('*').order('created_at', { ascending: true }),
    client.from('saved_questions').select('*').order('created_at', { ascending: true }),
    client.from('saved_concepts').select('*').order('created_at', { ascending: true }),
  ])

  if (attemptsError) throw attemptsError
  if (questionsError) throw questionsError
  if (conceptsError) throw conceptsError

  const exportedAt = new Date().toISOString()
  const json = createAccountDataExport({
    user: { id: user.id, email: user.email ?? null },
    exportedAt,
    attempts: attempts ?? [],
    savedQuestions: savedQuestions ?? [],
    savedConcepts: savedConcepts ?? [],
  })
  const blobUrl = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = `ipas-helper-data-${exportedAt.slice(0, 10)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0)
}

export async function clearAccountStudyData() {
  const { data, error } = await requireSupabase().rpc('delete_my_study_data')
  if (error) throw error
  return data as { attempts: number; saved_questions: number; saved_concepts: number }
}
