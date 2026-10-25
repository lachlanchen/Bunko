import { AppError, hash } from './common.mjs'

export const visualGroups = { people: ['people', 'relationships'], places: ['places', 'routes'], timeline: ['events'] }
const limits = { people: 128, relationships: 384, places: 96, routes: 192, events: 160 }
const normalized = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase()
const fail = detail => { throw Object.assign(new AppError('The reading update needs correction.', 502), { repairable: true, repairDetails: detail }) }

/** Stable keys belong to the saved data, not to a particular drawing/layout. */
export function stableEntries(field, entries, reference) {
  return entries.map(entry => ({ ...entry,
    ...(!entry.id ? { id: `${field.slice(0, 1)}-${hash(JSON.stringify(field === 'events' ? [normalized(entry.title), normalized(entry.when)] : [entry.direction === 'mutual' ? [entry.from, entry.to].sort() : [entry.from, entry.to], entry.direction, normalized(entry.label)])).slice(0, 24)}` } : {}),
    citations: (entry.citations || []).map(c => ({ ...c, ...(c.chapter === undefined && reference ? { chapter: reference.chapter, file: reference.file } : {}) })),
  }))
}

export function updateBases(raw, snapshots = {}) {
  const bases = {}
  for (const [view, fields] of Object.entries(visualGroups)) {
    const snapshot = snapshots[view]
    if (!snapshot || raw.updateModes?.[view] === 'replace') continue
    for (const field of fields) bases[field] = stableEntries(field, snapshot[field] || [], snapshot.reference)
  }
  return bases
}

/** Validate only new claims against today's supplied passages. Earlier verified
 * claims retain their own chapter/file provenance and are never re-quoted by a model. */
export function applyReadingUpdate(validated, raw, snapshots, reference) {
  const bases = updateBases(raw, snapshots), output = { ...validated }
  for (const [view, fields] of Object.entries(visualGroups)) {
    if (!fields.some(field => Object.hasOwn(raw, field) || raw.remove?.[field]?.length)) continue
    const aliases = new Map()
    for (const field of fields) {
      const base = bases[field] || [], remove = new Set(raw.remove?.[field] || [])
      for (const id of remove) if (!base.some(entry => entry.id === id)) fail(`${field}: removal id ${id} does not exist in this saved view. Use the supplied stable ids.`)
      let changes = validated[field] || []
      if (field === 'people' || field === 'places') {
        const identities = [...base]
        changes = changes.map(entry => {
          const exact = identities.find(old => old.id === entry.id)
          const names = new Set([entry.name, ...(entry.aliases || [])].map(normalized))
          const matches = identities.filter(old => [old.name, ...(old.aliases || [])].some(name => names.has(normalized(name))))
          if (!exact && matches.length > 1) fail(`${field}: ${entry.id} matches multiple saved names. Use the exact saved id.`)
          const id = exact?.id || matches[0]?.id || entry.id
          aliases.set(entry.id, id)
          const next = { ...entry, id }
          if (!identities.some(old => old.id === id)) identities.push(next)
          return next
        })
      } else if (field === 'relationships' || field === 'routes') {
        changes = changes.map(entry => ({ ...entry, from: aliases.get(entry.from) || entry.from, to: aliases.get(entry.to) || entry.to }))
      }
      const rows = new Map(base.filter(entry => !remove.has(entry.id)).map(entry => [entry.id, entry]))
      for (const entry of stableEntries(field, changes, reference)) {
        if (remove.has(entry.id)) fail(`${field}: cannot remove and update ${entry.id} in the same response.`)
        rows.set(entry.id, entry)
      }
      if (rows.size > limits[field]) fail(`${field}: this saved view holds at most ${limits[field]} entries. Extend a focused branch instead; do not silently discard the previous result.`)
      output[field] = [...rows.values()]
    }
    if (view !== 'timeline') {
      const [nodes, links] = fields, ids = new Set(output[nodes].map(entry => entry.id))
      // Deleting a node also deletes its previous links. New dangling links are
      // errors, not a reason to discard the whole previous diagram.
      const removedNodes = new Set(raw.remove?.[nodes] || [])
      for (const edge of validated[links] || []) if (removedNodes.has(aliases.get(edge.from) || edge.from) || removedNodes.has(aliases.get(edge.to) || edge.to)) fail(`${links}: a new connection refers to a node removed in this response.`)
      output[links] = output[links].filter(edge => !removedNodes.has(edge.from) && !removedNodes.has(edge.to))
      for (const edge of output[links]) if (!ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to) fail(`${links}: ${edge.id} has an unknown endpoint. Use an existing or newly added ${nodes} id.`)
    }
    if (view === 'places' && raw.mapYear === undefined && bases.places && snapshots.places?.mapYear !== undefined) output.mapYear = snapshots.places.mapYear
  }
  return output
}

/** Host-owned complexity routing; neither book text nor model output selects a provider. */
export function readingTask(question = '', kind, focus = 'chat', memory = {}, reference = {}) {
  const text = question.normalize('NFKC')
  const extending = /extend|expand|improv|detail|add|continue|enhanc|correct|补充|補充|增强|增強|详细|詳細|完善|继续|繼續|修正|追加|詳しく/i.test(text)
  const named = /timeline|chronolog|时间线|時間線|年表|年代|时间轴|時間軸/i.test(text) ? 'timeline'
    : /map|route|geograph|地图|地圖|路线|路線|地理|地図/i.test(text) ? 'places'
      : /relationship|character|family tree|人物|关系|關係|谋士|謀士|人間関係/i.test(text) ? 'people' : null
  const view = named || (focus !== 'chat' ? focus : extending ? memory.lastView : null) || focus
  const count = (memory.visuals?.[view]?.[visualGroups[view]?.[0]] || []).length
  const broad = /whole|entire|complete|all\b|各|整个|整個|全部|所有|三[个個]?[方国國集团集團]|全体|全體|全体|全巻/i.test(text)
  const capable = kind === 'guide' && reference.scope === 'book' || view !== 'chat' && (broad || count >= 16 || extending && count >= 8 || text.length > 600)
  return { focus: view, quality: capable ? 'capable' : 'standard' }
}
