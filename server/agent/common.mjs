import { createHash } from 'node:crypto'
export const hash = value => createHash('sha256').update(value).digest('hex')
export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; this.code = 'document_error' }
}
export function requireValue(condition, message, status = 400) { if (!condition) throw new AppError(message, status) }
