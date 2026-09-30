import type { SubjectCode, Topic } from '../types'

export function getInitialTopic(
  topics: Topic[],
  subject: SubjectCode,
  requestedTopicId?: string | null,
): Topic | undefined {
  const subjectTopics = topics
    .filter((topic) => topic.subject === subject)
    .sort((left, right) => left.sort_order - right.sort_order)

  return subjectTopics.find((topic) => topic.id === requestedTopicId)
    ?? subjectTopics.find((topic) => topic.parent_id === null)
    ?? subjectTopics[0]
}

export function getTopicQuestionScope(topics: Topic[], topicId: string): string[] {
  const descendants = new Set<string>([topicId])
  let foundNewDescendant = true

  while (foundNewDescendant) {
    foundNewDescendant = false
    for (const topic of topics) {
      if (topic.parent_id && descendants.has(topic.parent_id) && !descendants.has(topic.id)) {
        descendants.add(topic.id)
        foundNewDescendant = true
      }
    }
  }

  return [...descendants]
}
