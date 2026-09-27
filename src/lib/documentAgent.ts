import { api, requestId } from './discussions'
export interface PrivateDocument { id: string; name: string; state: string; error?: string; source: string; pages?: number; created: number; resumable: boolean; mmd?: string; assets?: { path: string; data: string }[] }
export interface PaperMatch { title: string; authors: string; summary: string; pdfUrl: string; source: string; year?: string }
export interface AgentMessage { id: string; state: string; question: string; answer: string; error?: string; papers: PaperMatch[] }
export const agentCall = <T>(action: string, data: object = {}) => api<T>(`/v1/agent/${action}`, data)
export async function uploadDocument(file: File) {
  if (!/\.(pdf|docx|md|mmd|txt|tex)$/i.test(file.name) || !file.size || file.size > 20_000_000) throw new Error('file_limit')
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('file_read_failed'))
    reader.readAsDataURL(file)
  })
  return agentCall<PrivateDocument>('upload', { name: file.name, data, requestId: requestId() })
}
