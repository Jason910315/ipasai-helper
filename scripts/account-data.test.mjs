import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccountDataExport } from '../src/lib/account-data.ts'

test('account data export contains the owner, timestamp, attempts, and collections', () => {
  const exported = createAccountDataExport({
    user: { id: 'user-1', email: 'learner@example.com' },
    exportedAt: '2026-09-30T00:00:00.000Z',
    attempts: [{ id: 'attempt-1', answers: { question: 'A' } }],
    savedQuestions: [{ question_id: 'question-1', note: 'review' }],
    savedConcepts: [{ topic_id: 'topic-1', note: null }],
  })

  assert.deepEqual(JSON.parse(exported), {
    format: 'ipas-helper-account-data',
    version: 1,
    exportedAt: '2026-09-30T00:00:00.000Z',
    user: { id: 'user-1', email: 'learner@example.com' },
    attempts: [{ id: 'attempt-1', answers: { question: 'A' } }],
    savedQuestions: [{ question_id: 'question-1', note: 'review' }],
    savedConcepts: [{ topic_id: 'topic-1', note: null }],
  })
})

test('account data export preserves empty collections', () => {
  const exported = JSON.parse(createAccountDataExport({
    user: { id: 'user-1', email: null },
    exportedAt: '2026-09-30T00:00:00.000Z',
    attempts: [],
    savedQuestions: [],
    savedConcepts: [],
  }))

  assert.deepEqual(exported.attempts, [])
  assert.deepEqual(exported.savedQuestions, [])
  assert.deepEqual(exported.savedConcepts, [])
})
