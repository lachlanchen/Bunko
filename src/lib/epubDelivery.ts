import { Capacitor, registerPlugin } from '@capacitor/core'
import { api, requestId, sessionRevision } from './discussions'

const native = registerPlugin<{ save(options: { filename: string; base64: string }): Promise<{ saved: boolean }> }>('BunkoExport')

async function encode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return reject(new Error('Invalid file'))
      resolve(reader.result.slice(reader.result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function saveEpub(file: File): Promise<boolean> {
  if (Capacitor.isNativePlatform()) return (await native.save({ filename: file.name, base64: await encode(file) })).saved
  if (window.__BUNKO_DESKTOP__) {
    const result = await window.webkit?.messageHandlers.bunkoAuth.postMessage({ saveEpub: { filename: file.name, base64: await encode(file) } })
    return result === true
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}

export function kindleMailStatus(signal?: AbortSignal) {
  return api<{ enabled: boolean; signedIn: boolean; sender?: string }>('/v1/kindle/status', {}, signal)
}

export function kindleMailRequest() { return requestId() }

export async function sendEpubToKindle(file: File, recipient: string, id: string) {
  const revision = sessionRevision()
  const attachment = await encode(file)
  return api<{ accepted: true }>('/v1/kindle/send', { recipient, filename: file.name, attachment, requestId: id }, undefined, 0, revision)
}
