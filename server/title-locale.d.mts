export function chineseScript(language: string): 'Hans' | 'Hant' | undefined
export function convertChinese(text: string, script: 'Hans' | 'Hant'): string
export function localizedTitle(
  titles: Partial<Record<string, string>> | undefined,
  ui: string,
  primary: string,
  fallback?: string,
): { key: string; text: string; lang: string; derived: boolean }
