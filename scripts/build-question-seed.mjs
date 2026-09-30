import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const subjectFiles = ['l21.json', 'l23.json']
const choiceKeys = ['A', 'B', 'C', 'D']

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'))
}

function fail(message) {
  throw new Error(message)
}

function sqlText(value) {
  return value === null || value === undefined ? 'null' : `'${String(value).replaceAll("'", "''")}'`
}

function sqlNumber(value) {
  return value === null || value === undefined ? 'null' : String(value)
}

function sqlBoolean(value) {
  return value ? 'true' : 'false'
}

function sqlTextArray(values = []) {
  if (!values.length) return "'{}'::text[]"
  return `array[${values.map(sqlText).join(', ')}]::text[]`
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value ?? {}))}::jsonb`
}

function questionGroupId(question) {
  if (!question.shared_stem && !(question.media?.length)) return question.group_id ?? null
  if (question.group_id) return question.group_id
  const source = `${question.subject}\n${question.shared_stem ?? ''}\n${JSON.stringify(question.media ?? [])}`
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 20)
  return `group-${hash}`
}

function validateQuestion(question, topicById) {
  const label = `${question.id ?? '(missing id)'}`
  if (!question.id || !['L21', 'L23'].includes(question.subject)) fail(`${label}: missing id or invalid subject`)
  if (!['official', 'exam_style', 'guide_research'].includes(question.origin)) fail(`${label}: invalid origin`)
  if (!question.stem?.trim()) fail(`${label}: empty stem`)
  if (!question.options || choiceKeys.some((key) => !question.options[key]?.trim())) fail(`${label}: one or more choices are missing`)
  if (!choiceKeys.includes(question.correct_option)) fail(`${label}: invalid correct choice`)
  if (!question.explanation?.trim()) fail(`${label}: missing explanation`)
  if (!question.option_explanations || choiceKeys.some((key) => !question.option_explanations[key]?.trim())) fail(`${label}: missing choice explanations`)
  if (question.origin !== 'official' && question.explanation.length < 80) fail(`${label}: authored explanation must be at least 80 characters`)
  if (question.origin !== 'official' && choiceKeys.some((key) => question.option_explanations[key].length < 35)) fail(`${label}: authored choice explanation is too brief`)
  if (!Array.isArray(question.topic_ids) || !question.topic_ids.length) fail(`${label}: missing topic ids`)
  for (const topicId of question.topic_ids) {
    const topic = topicById.get(topicId)
    if (!topic) fail(`${label}: topic ${topicId} is not present in content/topics.json`)
    if (topic.subject !== question.subject) fail(`${label}: topic ${topicId} belongs to ${topic.subject}`)
  }
  if (!question.source_label?.trim()) fail(`${label}: missing source label`)
  if (question.origin === 'official') {
    if (!Number.isInteger(question.exam_year) || !/^\d+$/.test(String(question.exam_session ?? '')) || !Number.isInteger(question.source_question_number) || !question.source_url) {
      fail(`${label}: official source metadata is incomplete`)
    }
    if (question.source_question_number < 1 || question.source_question_number > 50) fail(`${label}: official question number must be 1–50`)
    if (question.exam_year === 114 && question.exam_session !== '2') fail(`${label}: 114 official paper must be marked session 2`)
    if (question.exam_year === 115 && question.exam_session !== '1') fail(`${label}: 115 official paper must be marked session 1`)
  } else if (question.origin === 'exam_style' && !question.style_reference?.trim()) {
    fail(`${label}: exam-style reference is missing`)
  } else if (question.origin === 'guide_research' && (!question.theory_sources?.length || !question.verified_at)) {
    fail(`${label}: guide/research source or verification date is missing`)
  }
  if (question.origin === 'guide_research' && question.theory_sources.some((source) => !source.title?.trim() || !/^https:\/\//.test(source.url ?? ''))) {
    fail(`${label}: theory sources need a title and HTTPS URL`)
  }

  const textFields = [question.stem, question.explanation, ...Object.values(question.options), ...Object.values(question.option_explanations)]
  for (const text of textFields) {
    if (text.includes('\uFFFD')) fail(`${label}: contains a Unicode replacement character`)
    if (/\?{2,}/.test(text) && !question.needs_manual_media_review) fail(`${label}: contains repeated question-mark placeholders`)
    if (/TEXT NOT EXTRACTED|PLACEHOLDER|TODO/i.test(text) && !question.needs_manual_media_review) fail(`${label}: contains an unresolved placeholder`)
  }
  if (question.needs_manual_media_review && question.origin !== 'official') fail(`${label}: authored question cannot be marked for media review`)
}

function insertValues(table, columns, rows, conflictColumns, updateColumns) {
  if (!rows.length) return ''
  const values = rows.map((row) => `  (${columns.map((column) => row[column]).join(', ')})`).join(',\n')
  const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(',\n  ')
  return `insert into public.${table} (${columns.join(', ')}) values\n${values}\non conflict (${conflictColumns.join(', ')}) do update set\n  ${updates};\n`
}

const topicRows = await readJson('content/topics.json')
const topicById = new Map(topicRows.map((topic) => [topic.id, topic]))
if (topicById.size !== topicRows.length) fail('content/topics.json contains duplicate topic ids')
for (const topic of topicRows) {
  if (!['L21', 'L23'].includes(topic.subject)) fail(`${topic.id}: invalid topic subject`)
  if (topic.parent_id && !topicById.has(topic.parent_id)) fail(`${topic.id}: missing parent topic ${topic.parent_id}`)
  if (topic.parent_id && topicById.get(topic.parent_id).subject !== topic.subject) fail(`${topic.id}: parent topic belongs to another subject`)
}

const questions = []
for (const file of subjectFiles) {
  const data = await readJson(`content/questions/${file}`)
  const subjectQuestions = Array.isArray(data) ? data : data.questions
  if (!Array.isArray(subjectQuestions)) fail(`content/questions/${file} must be an array or have a questions array`)
  questions.push(...subjectQuestions)
}

const ids = new Set()
const officialPaperNumbers = new Map()
const authoredStems = new Set()
const counts = new Map()
const questionRows = []
const answerRows = []
const groups = new Map()
for (const question of questions) {
  validateQuestion(question, topicById)
  if (ids.has(question.id)) fail(`Duplicate question id: ${question.id}`)
  ids.add(question.id)
  const originKey = `${question.subject}:${question.origin}`
  counts.set(originKey, (counts.get(originKey) ?? 0) + 1)
  if (question.origin === 'official') {
    const paperKey = `${question.subject}:${question.exam_year}:${question.exam_session}`
    const numbers = officialPaperNumbers.get(paperKey) ?? new Set()
    if (numbers.has(question.source_question_number)) fail(`${paperKey}: duplicate source question number ${question.source_question_number}`)
    numbers.add(question.source_question_number)
    officialPaperNumbers.set(paperKey, numbers)
  } else {
    const stemKey = `${question.subject}:${question.origin}:${question.stem.trim()}`
    if (authoredStems.has(stemKey)) fail(`${question.id}: duplicate authored stem`)
    authoredStems.add(stemKey)
  }

  const groupId = questionGroupId(question)
  if (groupId) {
    if (!question.shared_stem?.trim()) fail(`${question.id}: group requires a shared stem`)
    const group = { id: groupId, shared_stem: question.shared_stem, media: question.media ?? [] }
    const existing = groups.get(groupId)
    if (existing && JSON.stringify(existing) !== JSON.stringify(group)) fail(`${question.id}: group ${groupId} has inconsistent shared content`)
    groups.set(groupId, group)
  }

  questionRows.push({
    id: sqlText(question.id),
    subject: sqlText(question.subject),
    origin: sqlText(question.origin),
    stem: sqlText(question.stem),
    options: sqlJson(question.options),
    topic_ids: sqlTextArray(question.topic_ids),
    difficulty: sqlNumber(question.difficulty ?? 2),
    tags: sqlTextArray(question.tags ?? []),
    group_id: sqlText(groupId),
    display_order: sqlNumber(question.display_order ?? 0),
    source_label: sqlText(question.source_label),
    source_url: sqlText(question.source_url),
    exam_year: sqlNumber(question.exam_year),
    exam_session: sqlText(question.exam_session),
    source_question_number: sqlNumber(question.source_question_number),
    source_pdf_page: sqlNumber(question.source_pdf_page),
    style_reference: sqlText(question.style_reference),
    theory_sources: sqlJson(question.theory_sources ?? []),
    verified_at: sqlText(question.verified_at),
    needs_manual_media_review: sqlBoolean(question.needs_manual_media_review),
  })
  answerRows.push({
    question_id: sqlText(question.id),
    correct_option: sqlText(question.correct_option),
    explanation: sqlText(question.explanation),
    option_explanations: sqlJson(question.option_explanations),
  })
}

for (const subject of ['L21', 'L23']) {
  for (const origin of ['official', 'exam_style', 'guide_research']) {
    const expected = origin === 'official' ? 100 : 50
    if ((counts.get(`${subject}:${origin}`) ?? 0) !== expected) fail(`${subject}:${origin} expected ${expected} rows, found ${counts.get(`${subject}:${origin}`) ?? 0}`)
  }
  for (const [year, session] of [[114, '2'], [115, '1']]) {
    const numbers = officialPaperNumbers.get(`${subject}:${year}:${session}`) ?? new Set()
    if (numbers.size !== 50 || Array.from({ length: 50 }, (_, index) => index + 1).some((number) => !numbers.has(number))) {
      fail(`${subject} ${year} session ${session} must contain official questions 1–50`)
    }
  }
  const guideTopics = topicRows.filter((topic) => topic.subject === subject && topic.guide_section)
  for (const origin of ['exam_style', 'guide_research']) {
    for (const topic of guideTopics) {
      if (!questions.some((question) => question.subject === subject && question.origin === origin && question.topic_ids.includes(topic.id))) {
        fail(`${subject}:${origin} has no authored question for ${topic.id}`)
      }
    }
  }
}

const topicSqlRow = (topic) => ({
  id: sqlText(topic.id),
  subject: sqlText(topic.subject),
  parent_id: sqlText(topic.parent_id),
  title: sqlText(topic.title),
  guide_section: sqlText(topic.guide_section),
  guide_page: sqlText(topic.guide_page),
  sort_order: sqlNumber(topic.sort_order),
})
const topicColumns = ['id', 'subject', 'parent_id', 'title', 'guide_section', 'guide_page', 'sort_order']
const topicUpdates = ['subject', 'parent_id', 'title', 'guide_section', 'guide_page', 'sort_order']
const groupRows = [...groups.values()].map((group) => ({
  id: sqlText(group.id),
  shared_stem: sqlText(group.shared_stem),
  media: sqlJson(group.media),
}))

const statements = [
  '-- Generated by npm run question-bank:seed. Do not edit this file by hand.',
  '-- Run after applying every migration in supabase/migrations.',
  'begin;',
  insertValues('topics', topicColumns, topicRows.filter((topic) => !topic.parent_id).map(topicSqlRow), ['id'], topicUpdates),
  insertValues('topics', topicColumns, topicRows.filter((topic) => topic.parent_id).map(topicSqlRow), ['id'], topicUpdates),
  insertValues('question_groups', ['id', 'shared_stem', 'media'], groupRows, ['id'], ['shared_stem', 'media']),
  insertValues('questions', Object.keys(questionRows[0] ?? {}), questionRows, ['id'], Object.keys(questionRows[0] ?? {}).filter((column) => column !== 'id')),
  insertValues('question_answers', ['question_id', 'correct_option', 'explanation', 'option_explanations'], answerRows, ['question_id'], ['correct_option', 'explanation', 'option_explanations']),
  'commit;',
].filter(Boolean).join('\n\n')

const output = resolve(root, 'supabase/seed_questions.sql')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${statements}\n`, 'utf8')
console.log(`Wrote ${output} (${questions.length} questions; ${groups.size} groups; ${topicRows.length} topics).`)
