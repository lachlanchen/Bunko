export interface CalendarDate { year: number; month?: number; day?: number; precision: 'year' | 'month' | 'day'; start: number; end: number }
export function quotedCalendar(event: { when?: string; citations?: { quote: string }[] }): CalendarDate | null
