export interface AccountDataExportInput {
  user: { id: string; email: string | null }
  exportedAt: string
  attempts: unknown[]
  savedQuestions: unknown[]
  savedConcepts: unknown[]
}

export function createAccountDataExport(input: AccountDataExportInput): string {
  return JSON.stringify({
    format: 'ipas-helper-account-data',
    version: 1,
    exportedAt: input.exportedAt,
    user: input.user,
    attempts: input.attempts,
    savedQuestions: input.savedQuestions,
    savedConcepts: input.savedConcepts,
  }, null, 2)
}
