import cities from './atlas-places.json' with { type: 'json' }
import han from './han-regions.json' with { type: 'json' }
import historicalCities from './historical-city-aliases.json' with { type: 'json' }

export const mapName = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s’'‘ʽʼ-]/gu, '')
const variants = value => String(value || '').normalize('NFKC').split(/[()]/u).map(mapName)
const matches = (names, query) => variants(query).some(q => names.some(n => mapName(n) === q))
const inHan = year => Number.isInteger(year) && year >= han.period[0] && year <= han.period[1]
const cityNames = new Map()
for (const row of cities) for (const name of new Set(row[6].map(mapName))) cityNames.set(name, [...(cityNames.get(name) || []), row])

export function historicalRegion(names, year, locationId = '') {
  if (!inHan(year)) return null
  const rows = han.regions.filter(row => (!locationId || row.id === locationId) && names.some(name => matches(row.names, name)))
  return rows.length === 1 ? rows[0] : null
}

/** Dated historical polygons always precede a similarly named modern town. */
export function lookupMapPlaces(queries, year) {
  return queries.slice(0, 24).map(query => {
    const historical = inHan(year) ? han.regions.filter(row => matches(row.names, query)) : []
    const alias = historicalCities.find(row => Number.isInteger(year) && year >= row.period[0] && year <= row.period[1] && matches(row.names, query))
    const modern = alias ? cities.filter(row => row[0] === alias.atlasId) : [...new Map(variants(query).flatMap(q => cityNames.get(q) || []).map(row => [row[0], row])).values()]
    return { query, candidates: historical.length ? historical.map(row => ({ id: row.id, name: row.name, kind: 'region',
      longitude: row.label[0], latitude: row.label[1], referenceYear: han.year, source: han.source, note: han.note }))
      : modern.slice(0, 5).map(row => ({ id: row[0], name: row[1], country: row[2], region: row[3], kind: 'city', longitude: row[4], latitude: row[5], source: alias?.source || 'https://www.naturalearthdata.com/', ...(alias ? { note: alias.note, aliases: alias.names } : {}) })),
      ...(!historical.length && han.regions.some(row => matches(row.names, query)) ? { caution: 'This name is also a historical province. Supply the historical year; a modern city is not its province.' } : {}),
    }
  })
}

/** Legacy saved maps can gain a dated layer without mutating stored text/history.
 * Require an explicit Han-era year in the answer, not just a book title/name. */
export function mapYearForGuide(guide) {
  if (Number.isInteger(guide.mapYear) && guide.mapYear >= -3000 && guide.mapYear <= 3000) return guide.mapYear
  if (!/(东汉|東漢|汉末|漢末|Eastern Han|Later Han)/i.test(guide.answer || '')) return undefined
  const match = (guide.answer || '').match(/(?:\b|\D)(1\d{2}|20\d|21\d)\s*(?:年|CE|AD|A\.D\.)/i)
  return match ? Number(match[1]) : undefined
}

export function groundMap(guide) {
  if (!Array.isArray(guide?.places)) return guide
  const year = mapYearForGuide(guide)
  const places = guide.places.map(place => {
    const row = historicalRegion([place.name, ...(place.aliases || [])], year, place.locationId)
    if (row) return { ...place, locationId: row.id }
    const candidates = lookupMapPlaces([place.name, ...(place.aliases || [])], year).flatMap(match => match.candidates)
    if (place.locationId && !candidates.some(candidate => candidate.id === place.locationId)) {
      const { locationId: _locationId, ...rest } = place
      return rest
    }
    return place
  })
  if (year === guide.mapYear && places.every((place, index) => place === guide.places[index])) return guide
  return { ...guide, ...(year !== undefined ? { mapYear: year } : {}), places }
}

export function mapRequest(question, focus) {
  return focus === 'places' || /地图|地圖|州图|州圖|地理|\bmap\b|geograph|地図/i.test(question || '')
}

/** Check the actual requested artifact, not only syntactically valid JSON.
 * All-province coverage is a named dataset query; it never invents boundaries. */
export function checkMapRequest(raw, question, context, focus) {
  if (!mapRequest(question, focus)) return []
  const issues = []
  if (!raw.places?.length && !raw.insufficient) return ['A map was requested but no places were returned. Return places and routes (routes may be empty).']
  const year = mapYearForGuide(raw)
  const named = han.regions.filter(row => row.names.some(name => mapName(question).includes(mapName(name))))
  if (context.reference?.id === 'zizhi-tongjian' && year === undefined && named.length >= 2) return ['Identify the period from the question and supplied chapter; set mapYear. Look up the historical provinces before drawing them. Do not silently use modern namesake cities.']
  if (!inHan(year)) return issues
  const all = /(?:所有|各个|各個|全部|十三|13|all|every).{0,12}(?:州|province)|(?:州|province).{0,12}(?:所有|全部|all)/i.test(question || '')
  const hanContext = named.length || (raw.places || []).some(place => place.locationId?.startsWith('han140-')) || /东汉|東漢|Eastern Han|Later Han/i.test(question || '')
  const requested = all && hanContext ? han.regions : named
  for (const row of requested) if (!(raw.places || []).some(p => historicalRegion([p.name, ...(p.aliases || [])], year)?.id === row.id)) issues.push(`Missing requested region: ${row.name} (${row.id}). Include it with background evidence and the supplied reference layer, not a modern city.`)
  for (const place of raw.places || []) {
    if (!place.locationId) continue
    const candidates = lookupMapPlaces([place.name, ...(place.aliases || [])], year).flatMap(v => v.candidates)
    if (!candidates.some(candidate => candidate.id === place.locationId)) issues.push(`Invalid locationId for ${place.name}. Use a matching lookup_places result or omit locationId for an unresolved place.`)
  }
  return issues.slice(0, 16)
}

export function mapLayerCatalog() {
  return [{ id: han.id, referenceYear: han.year, period: han.period, note: han.note, source: han.source,
    regions: han.regions.map(row => ({ id: row.id, name: row.name, aliases: row.names })) }]
}
