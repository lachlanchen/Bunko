export const LEGACY_BUNKO_API = 'https://llm.lazying.art/bunko'
export const DIRECT_BUNKO_API = 'https://bunko.lazying.art/bunko'

// Enable only in a release built after direct-origin TLS and route qualification.
// A boolean gate cannot redirect saved credentials to an arbitrary build URL.
export const DIRECT_ORIGIN_ENABLED = import.meta.env.VITE_BUNKO_DIRECT_ORIGIN === '1'

export function discussionOrigin(secureNativeSession: boolean, direct = DIRECT_ORIGIN_ENABLED): string {
  // Existing PWA cookies are host-only on llm.lazying.art. Keep that origin until
  // a separate cookie migration is qualified; native opaque sessions use the
  // same authoritative database through either ingress.
  return direct && secureNativeSession ? DIRECT_BUNKO_API : LEGACY_BUNKO_API
}

export function bookMirrorOrigins(direct = DIRECT_ORIGIN_ENABLED): readonly string[] {
  return (direct ? [DIRECT_BUNKO_API, LEGACY_BUNKO_API] : [LEGACY_BUNKO_API])
    .map(origin => `${origin}/books-cache`)
}

export const BUNKO_LEGAL_API = DIRECT_ORIGIN_ENABLED ? DIRECT_BUNKO_API : LEGACY_BUNKO_API
