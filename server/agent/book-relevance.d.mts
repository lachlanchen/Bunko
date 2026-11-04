import type { BookReference } from '../../src/lib/bookCompanion'
export function bookRelevance(candidate: BookReference | undefined, current: BookReference): number
export function nearestReadingTip<T extends { id: string; parentId?: string | null; reference?: BookReference }>(rows: T[], current: BookReference): T | undefined
