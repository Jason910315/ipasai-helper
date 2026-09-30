import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// The shared preparation step validates the full bank and writes a SQL fallback.
await import('./build-question-seed.mjs')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim()
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!supabaseUrl || !secretKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in the local .env.local file first.')
}
if (process.env.VITE_SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Do not prefix an elevated Supabase key with VITE_; frontend bundles must never receive it.')
}

const client = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const files = ['l21.json', 'l23.json']
const sourceData = await Promise.all(files.map((file) => readJson(`content/questions/${file}`)))
const questionRows = sourceData.flatMap((data) => Array.isArray(data) ? data : data.questions)
const topicRows = await readJson('content/topics.json')

function groupIdFor(question) {
  if (!question.shared_stem && !(question.media?.length)) return question.group_id ?? null
  if (question.group_id) return question.group_id
  const source = `${question.subject}\n${question.shared_stem ?? ''}\n${JSON.stringify(question.media ?? [])}`
  return `group-${createHash('sha256').update(source).digest('hex').slice(0, 20)}`
}

async function upsertBatches(table, rows, conflict = 'id') {
  const batchSize = 50
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize)
    const { error } = await client.from(table).upsert(batch, { onConflict: conflict })
    if (error) throw new Error(`Import failed for ${table} batch ${Math.floor(start / batchSize) + 1}: ${error.message}`)
  }
}

const parentTopics = topicRows.filter((topic) => !topic.parent_id)
const childTopics = topicRows.filter((topic) => topic.parent_id)
const groups = new Map()
for (const question of questionRows) {
  const groupId = groupIdFor(question)
  if (!groupId) continue
  if (!question.shared_stem?.trim()) throw new Error(`${question.id} has a group id but no shared stem.`)
  const group = { id: groupId, shared_stem: question.shared_stem, media: question.media ?? [] }
  const previous = groups.get(groupId)
  if (previous && JSON.stringify(previous) !== JSON.stringify(group)) throw new Error(`Question group ${groupId} has inconsistent data.`)
  groups.set(groupId, group)
}

const publicQuestions = questionRows.map((question) => ({
  id: question.id,
  subject: question.subject,
  origin: question.origin,
  stem: question.stem,
  options: question.options,
  topic_ids: question.topic_ids,
  difficulty: question.difficulty ?? 2,
  tags: question.tags ?? [],
  group_id: groupIdFor(question),
  display_order: question.display_order ?? 0,
  source_label: question.source_label,
  source_url: question.source_url,
  exam_year: question.exam_year,
  exam_session: question.exam_session,
  source_question_number: question.source_question_number,
  source_pdf_page: question.source_pdf_page ?? null,
  style_reference: question.style_reference,
  theory_sources: question.theory_sources ?? [],
  verified_at: question.verified_at,
  needs_manual_media_review: Boolean(question.needs_manual_media_review),
}))
const privateAnswers = questionRows.map((question) => ({
  question_id: question.id,
  correct_option: question.correct_option,
  explanation: question.explanation,
  option_explanations: question.option_explanations,
}))

await upsertBatches('topics', parentTopics)
await upsertBatches('topics', childTopics)
await upsertBatches('question_groups', [...groups.values()])
await upsertBatches('questions', publicQuestions)
await upsertBatches('question_answers', privateAnswers, 'question_id')

console.log(`Imported ${topicRows.length} topics, ${groups.size} question groups, and ${questionRows.length} questions.`)
console.log('Answer keys and explanations were written to the private question_answers table.')
