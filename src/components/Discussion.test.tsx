// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Discussion } from './Discussion'
import * as api from '../lib/discussions'
vi.mock('../lib/discussions', async importOriginal => {
  const original = await importOriginal<typeof api>()
  return { ...original, readDiscussion: vi.fn(), postDiscussion: vi.fn(), currentUser: vi.fn(), subscribeSession: () => () => {}, signIn: vi.fn() }
})
const passage = 'sample/c001.json/p1/2'
const props = { passage, excerpt: 'Some text', ui: 'en' as const }
const issue = { id: 1, number: 1, body: '> Text\n\nPassage: sample/c001.json/p1/2\n\nA question', user: { id: 4, login: 'reader' }, locked: false }
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks()
  vi.mocked(api.currentUser).mockReturnValue({ id: 4, login: 'reader' })
  vi.mocked(api.readDiscussion).mockResolvedValue({ issue: null, comments: [], nextPage: null })
})
afterEach(cleanup)
it('posts only explicitly, preserves offline drafts and reuses the request after remount', async () => {
  vi.mocked(api.postDiscussion).mockRejectedValue(new api.DiscussionError('offline'))
  const view = render(<Discussion {...props} />)
  await screen.findByText('Be the first to leave a thought.')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '请解释这段。' } })
  expect(api.postDiscussion).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
  await screen.findByRole('alert')
  expect(localStorage.getItem(`bunko:discussion-draft:${passage}`)).toBe('请解释这段。')
  const id = vi.mocked(api.postDiscussion).mock.calls[0][3]
  view.unmount()
  render(<Discussion {...props} />)
  await screen.findByText('Be the first to leave a thought.')
  vi.mocked(api.postDiscussion).mockResolvedValue({ issue, comment: null })
  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
  await screen.findByText('Your comment is published.')
  expect(vi.mocked(api.postDiscussion).mock.calls[1][3]).toBe(id)
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('')
  expect(localStorage.getItem(`bunko:discussion-draft:${passage}`)).toBeNull()
})
it('requires sign-in for posting, retains draft when sign-in fails', async () => {
  vi.mocked(api.currentUser).mockReturnValue(null)
  vi.mocked(api.signIn).mockImplementation(() => ({ promise: Promise.reject(new api.DiscussionError('popup_blocked')), cancel: vi.fn() }))
  render(<Discussion {...props} />)
  await screen.findByText('Be the first to leave a thought.')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My note' } })
  expect((screen.getByRole('button', { name: 'Post comment' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }))
  await screen.findByText('Allow the sign-in window, then try again.')
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('My note')
  expect(api.postDiscussion).not.toHaveBeenCalled()
})
it('blocks repeated clicks while posting and shows uncertain delivery', async () => {
  let reject!: (reason: unknown) => void
  vi.mocked(api.postDiscussion).mockReturnValue(new Promise((_, fail) => { reject = fail }))
  render(<Discussion {...props} />)
  await screen.findByText('Be the first to leave a thought.')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question' } })
  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
  fireEvent.click(screen.getByRole('button', { name: 'Posting…' }))
  expect(api.postDiscussion).toHaveBeenCalledTimes(1)
  reject(new api.DiscussionError('post_uncertain'))
  await screen.findByRole('alert')
  expect((screen.getByRole('button', { name: 'Post comment' }) as HTMLButtonElement).disabled).toBe(true)
})
it('paginates comments, escapes HTML, and remembers hidden readers', async () => {
  const comment = { id: 2, body: '<img src=x onerror=alert(1)>', user: { id: 5, login: 'second-reader' } }
  vi.mocked(api.readDiscussion).mockResolvedValueOnce({ issue, comments: [], nextPage: 2 }).mockResolvedValueOnce({ issue, comments: [comment], nextPage: null })
  const { container } = render(<Discussion {...props} />)
  await screen.findByText('A question')
  fireEvent.click(screen.getByRole('button', { name: 'Load more comments' }))
  await screen.findByText(comment.body)
  expect(container.querySelector('img')).toBeNull()
  expect(api.readDiscussion).toHaveBeenLastCalledWith(passage, 2)
  fireEvent.click(screen.getAllByText('⋯')[1])
  fireEvent.click(screen.getAllByRole('button', { name: 'Hide this reader' })[1])
  await waitFor(() => expect(screen.queryByText(comment.body)).toBeNull())
  expect(localStorage.getItem('bunko:hidden-readers')).toBe('second-reader')
})
