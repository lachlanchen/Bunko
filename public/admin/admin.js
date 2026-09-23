const repo = 'lachlanchen/bunko-books'
const raw = `https://raw.githubusercontent.com/${repo}/main`
const $ = (id) => document.getElementById(id)
let token = ''
let bundle = null
let books = []
let busy = false
const status = (id, message) => { $(id).textContent = message }
const enabled = () => { $('publish').disabled = busy || !token || !bundle || !$('confirm').checked }

async function api(path, body) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${data.message || 'request failed'}`)
  return data
}

function disconnect() {
  token = ''
  $('token').value = ''
  status('identity', 'Not connected.')
  enabled()
}
$('disconnect').addEventListener('click', disconnect)
$('connect').addEventListener('click', async () => {
  token = $('token').value.trim()
  $('token').value = ''
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await response.json()
    if (!response.ok || !data.permissions?.push) throw new Error('This token cannot write to the book repository.')
    status('identity', `Connected to ${repo}.`)
  } catch (error) { disconnect(); status('identity', error.message) }
  enabled()
})
$('confirm').addEventListener('change', enabled)

$('files').addEventListener('change', async () => {
  bundle = null
  $('confirm').checked = false
  enabled()
  try {
    const files = [...$('files').files]
    const byName = new Map(files.map((file) => [file.name, file]))
    if (byName.size !== files.length) throw new Error('Choose one book folder, without nested duplicate filenames.')
    const meta = JSON.parse(await byName.get('meta.json')?.text())
    const rights = JSON.parse(await byName.get('rights.json')?.text())
    if (meta.schema !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id)) throw new Error('Invalid bundle schema or book id.')
    if (rights.id !== meta.id || rights.status !== 'ship' || !rights.basis || !rights.references?.length || !rights.checked) throw new Error('A completed rights.json clearance is required.')
    if (!meta.chapters?.length || !meta.langs?.length || !meta.langs.includes(meta.primary)) throw new Error('Missing chapters or languages.')
    if ([...meta.langs].sort().join() !== [...rights.langs].sort().join()) throw new Error('Published languages do not match the rights record.')
    const names = ['meta.json', 'rights.json', ...meta.chapters.map((chapter) => chapter.file)]
    if (meta.cover) names.push(meta.cover)
    if (new Set(names).size !== names.length) throw new Error('Duplicate chapter files.')
    let bytes = 0
    for (const name of names) {
      if (!/^(meta\.json|rights\.json|c[0-9]+(?:p[0-9]+)?(?:-[a-f0-9]+)?\.json|cover-[a-f0-9]+\.(webp|png|jpg))$/.test(name)) throw new Error('Unsupported file path: ' + name)
      const file = byName.get(name)
      if (!file || !file.size || file.size >= 20_000_000) throw new Error('Missing or oversized file: ' + name)
      bytes += file.size
    }
    if (bytes > 250_000_000) throw new Error('Use the Git CLI workflow for bundles larger than 250 MB.')
    if (meta.cover && rights.cover?.textFree !== true) throw new Error('Cover must be reviewed as text-free.')
    bundle = { meta, files: names.map((name) => byName.get(name)) }
    status('bundle', `${meta.titleText?.[meta.primary] || meta.id} · ${meta.chapters.length} chapters · ${(bytes / 1e6).toFixed(1)} MB · ${meta.langs.join(' / ')}`)
  } catch (error) { status('bundle', 'Cannot upload: ' + error.message) }
  enabled()
})

async function base64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
  return btoa(binary)
}

$('publish').addEventListener('click', async () => {
  if (busy || !token || !bundle || !$('confirm').checked) return
  busy = true
  enabled()
  let branch = ''
  try {
    const { meta, files } = bundle
    const head = await api('git/ref/heads/main')
    const commit = await api(`git/commits/${head.object.sha}`)
    const tree = []
    for (const [index, file] of files.entries()) {
      status('progress', `Uploading ${index + 1}/${files.length}: ${file.name}`)
      const blob = await api('git/blobs', { encoding: 'base64', content: await base64(file) })
      tree.push({ path: `books/${meta.id}/${file.name}`, mode: '100644', type: 'blob', sha: blob.sha })
    }
    const newTree = await api('git/trees', { base_tree: commit.tree.sha, tree })
    const created = await api('git/commits', { message: `Publish ${meta.id} through Bunko library management`, tree: newTree.sha, parents: [head.object.sha] })
    branch = `library/${meta.id}-${Date.now()}`
    await api('git/refs', { ref: `refs/heads/${branch}`, sha: created.sha })
    const pr = await api('pulls', { title: `Publish book: ${meta.titleText?.[meta.primary] || meta.id}`, head: branch, base: 'main', body: 'Prepared through Bunko library management.\n\nThe uploader confirms rights, complete chapters, final translations and text-free cover review. The library workflow validates the bundle and rebuilds the catalog after merge; no app build is required.' })
    $('progress').replaceChildren(document.createTextNode('Upload complete. Review the checks and merge: '))
    const link = document.createElement('a')
    link.href = pr.html_url; link.textContent = `Pull request #${pr.number}`; link.target = '_blank'; link.rel = 'noopener noreferrer'
    $('progress').append(link)
    bundle = null
  } catch (error) {
    status('progress', error.message + (branch ? ` Your uploaded branch is ${branch}; open it in GitHub to finish the pull request.` : ' The live catalog was not changed.'))
  } finally { busy = false; enabled() }
})

function render() {
  const query = $('search').value.toLowerCase().trim()
  const list = books.filter((book) => [book.id, book.author, ...Object.values(book.title)].join(' ').toLowerCase().includes(query))
  const cards = list.map((book) => {
    const article = document.createElement('article'); article.className = 'card'
    if (/^books\/[a-z0-9-]+\/cover-[a-f0-9]+\.(webp|png|jpg)$/.test(book.cover || '')) {
      const image = document.createElement('img'); image.src = `${raw}/${book.cover}`; image.alt = ''; image.loading = 'lazy'; article.append(image)
    } else { const placeholder = document.createElement('div'); placeholder.className = 'placeholder'; article.append(placeholder) }
    const title = document.createElement('h3'); title.textContent = book.title[book.primary] || book.id
    const detail = document.createElement('p'); detail.textContent = `${book.author} · ${book.chapters} chapters`
    const link = document.createElement('a'); link.href = `https://github.com/${repo}/tree/main/books/${encodeURIComponent(book.id)}`; link.textContent = 'Manage in GitHub ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer'
    article.append(title, detail, link); return article
  })
  $('library').replaceChildren(...cards)
}
async function refresh() {
  try {
    const response = await fetch(`${raw}/reader-index.json`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const index = await response.json(); books = index.books
    status('count', `Published library · ${index.count} books`); render()
  } catch (error) { status('count', 'Library unavailable: ' + error.message) }
}
$('search').addEventListener('input', render)
$('refresh').addEventListener('click', refresh)
$('theme').addEventListener('click', () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'night' ? 'paper' : 'night' })
if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'night'
void refresh()
