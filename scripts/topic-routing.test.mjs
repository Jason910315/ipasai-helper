import test from 'node:test'
import assert from 'node:assert/strict'
import { getInitialTopic, getTopicQuestionScope } from '../src/lib/topic-routing.ts'

const topics = [
  { id: 'L21-1', subject: 'L21', parent_id: null, sort_order: 1 },
  { id: 'L21-1.1', subject: 'L21', parent_id: 'L21-1', sort_order: 2 },
  { id: 'L23-3', subject: 'L23', parent_id: null, sort_order: 13 },
  { id: 'L23-3.1', subject: 'L23', parent_id: 'L23-3', sort_order: 14 },
  { id: 'L23-4', subject: 'L23', parent_id: null, sort_order: 15 },
]

test('defaults each subject to its first main topic', () => {
  assert.equal(getInitialTopic(topics, 'L21')?.id, 'L21-1')
  assert.equal(getInitialTopic(topics, 'L23')?.id, 'L23-3')
})

test('keeps a valid requested topic within the selected subject', () => {
  assert.equal(getInitialTopic(topics, 'L23', 'L23-3.1')?.id, 'L23-3.1')
  assert.equal(getInitialTopic(topics, 'L23', 'L21-1')?.id, 'L23-3')
})

test('collects a main topic and all descendant topics for whole-chapter practice', () => {
  assert.deepEqual(getTopicQuestionScope(topics, 'L23-3'), ['L23-3', 'L23-3.1'])
  assert.deepEqual(getTopicQuestionScope(topics, 'L23-3.1'), ['L23-3.1'])
})
