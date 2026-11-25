import { Capacitor, registerPlugin } from '@capacitor/core'
import { downloadFile, fileBase64 } from './fileDelivery'

type ImageInput = { filename: string; base64: string }
const bridge = registerPlugin<{
  shareImage(input: ImageInput): Promise<void>
  save(input: ImageInput): Promise<{ saved: boolean }>
}>('BunkoExport')

export async function deliverBookCard(file: File, save: boolean) {
  if (Capacitor.isNativePlatform()) {
    const input = { filename: file.name, base64: await fileBase64(file) }
    if (save) return (await bridge.save(input)).saved
    await bridge.shareImage(input)
    return false
  }
  if (window.__BUNKO_DESKTOP__) {
    const result = await window.webkit?.messageHandlers.bunkoAuth.postMessage({
      shareImage: { filename: file.name, base64: await fileBase64(file), save },
    })
    return save && result === true
  }
  if (!save && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
    return false
  }
  downloadFile(file)
  return true
}
