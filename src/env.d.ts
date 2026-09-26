declare const __APP_VERSION__: string

interface Window {
  __BUNKO_DESKTOP__?: boolean
  __BUNKO_APP_INFO__?: { version: string; build: string }
}
