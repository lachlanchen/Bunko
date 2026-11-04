declare const __APP_VERSION__: string

interface Window {
  __BUNKO_BOOK_LINK__?: string
  __BUNKO_DESKTOP__?: boolean
  __BUNKO_APP_INFO__?: { version: string; build: string }
}

interface Window {
  webkit?: { messageHandlers: { bunkoAuth: { postMessage: (message: { region?: boolean; share?: {title:string;url:string}; url?: string; cancel?: boolean; storage?: 'read' | 'save' | 'clear'; token?: string }) => Promise<unknown> } } }
}
