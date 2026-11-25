import { Capacitor, registerPlugin } from '@capacitor/core'
import { downloadFile, fileBase64 } from './fileDelivery'
import { api, requestId, sessionRevision } from './discussions'

const native = registerPlugin<{ save(options: { filename: string; base64: string }): Promise<{ saved: boolean }> }>('BunkoExport')

export async function saveEpub(file: File): Promise<boolean> {
  if (Capacitor.isNativePlatform()) return (await native.save({ filename: file.name, base64: await fileBase64(file) })).saved
  if (window.__BUNKO_DESKTOP__) {
    const result = await window.webkit?.messageHandlers.bunkoAuth.postMessage({ saveEpub: { filename: file.name, base64: await fileBase64(file) } })
    return result === true
  }
  downloadFile(file)
  return true
}

export function kindleMailStatus(signal?: AbortSignal) {
  return api<{ enabled: boolean; signedIn: boolean; sender?: string }>('/v1/kindle/status', {}, signal)
}

export function kindleMailRequest() { return requestId() }

export async function sendEpubToKindle(file: File, recipient: string, id: string) {
  const revision = sessionRevision()
  const attachment = await fileBase64(file)
  return api<{ accepted: true }>('/v1/kindle/send', { recipient, filename: file.name, attachment, requestId: id }, undefined, 0, revision)
}
