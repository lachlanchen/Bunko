// WebViews disagree about URL.host for custom schemes. Match the exact app
// contract instead of treating an opaque custom URL as an HTTPS authority.
export function bookIdFromLink(value: string): string | null {
  return /^art\.lazying\.bunko:\/\/book\/([a-z0-9-]{1,120})$/.exec(value)?.[1] ?? null
}
