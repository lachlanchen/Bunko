import cities from '../data/atlas-places.json'
import historical from '../../server/agent/reading-locations.json'

export interface AtlasPlace { id: string; name: string; country: string; region: string; longitude: number; latitude: number; names: string[]; approximate?: boolean; sources?: string[]; atlasId?: string }
const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[’'‘ʽʼ\s-]/gu, '').trim()
export const atlas: AtlasPlace[] = (cities as [string, string, string, string, number, number, string[]][]).map(([id, name, country, region, longitude, latitude, names]) => ({ id, name, country, region, longitude, latitude, names }))
const atlasById = new Map(atlas.map(place => [place.id, place]))
const labels = new Map(atlas.map(p => [p.id, p.names.map(normalize)]))
const exactNames = new Map<string, AtlasPlace[]>()
for (const place of atlas) for (const name of new Set(labels.get(place.id)!)) exactNames.set(name, [...(exactNames.get(name) || []), place])
export function findPlaces(query: string, exact = false): AtlasPlace[] {
  const value = normalize(query)
  if (!value || (!exact && value.length < 2)) return []
  if (exact) return [...(exactNames.get(value) || [])].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50)
  return atlas.map(place => ({ place, rank: labels.get(place.id)!.some(n => n === value) ? 0 : labels.get(place.id)!.some(n => n.startsWith(value)) ? 1 : labels.get(place.id)!.some(n => n.includes(value)) ? 2 : 3 }))
    .filter(row => row.rank <= 2).sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name)).slice(0, 20).map(row => row.place)
}
export function suggestedPlace(names: string[]): AtlasPlace | null {
  const results = [...new Map(names.flatMap(n => findPlaces(n, true)).map(p => [p.id, p])).values()]
  return results.length === 1 ? results[0] : null
}

type HistoricalRow = { id: string; name: string; names: string[]; sources: string[]; atlasId?: string; country?: string; region?: string; longitude?: number; latitude?: number }
const books = historical.books as Record<string, { locations: HistoricalRow[]; unresolvedNames: string[] }>
export function historicalPlaces(bookId: string): AtlasPlace[] {
  return (books[bookId]?.locations || []).flatMap(row => {
    const modern = row.atlasId ? atlasById.get(row.atlasId) : undefined
    if (row.atlasId && !modern) return []
    return [{ ...modern, id: `historical-${bookId}-${row.id}`, name: row.name, country: modern?.country || row.country!, region: modern?.region || row.region!,
      longitude: modern?.longitude ?? row.longitude!, latitude: modern?.latitude ?? row.latitude!, names: [...row.names, row.name], approximate: true, sources: row.sources, atlasId: row.atlasId }]
  })
}

// Exact names only. Book-scoped historical names must not silently become a
// namesake town, a country's capital, or an invented coordinate from the model.
export function suggestedReadingPlace(names: string[], bookId: string): AtlasPlace | null {
  const blocked = new Set((books[bookId]?.unresolvedNames || []).map(normalize))
  if (blocked.has(normalize(names[0] || ''))) return null
  const historic = historicalPlaces(bookId)
  const candidates = names.flatMap(name => {
    const known = historic.filter(p => p.names.some(n => normalize(n) === normalize(name)))
    return known.length ? known : findPlaces(name, true)
  })
  const unique = new Map<string, AtlasPlace>()
  for (const place of candidates) {
    const id = place.atlasId || place.id
    if (!unique.has(id) || place.approximate) unique.set(id, place)
  }
  return unique.size === 1 ? [...unique.values()][0] : null
}

export function readingPlaceChoices(query: string, bookId: string): AtlasPlace[] {
  const value = normalize(query)
  if (!value || value.length < 2) return []
  return [...historicalPlaces(bookId).filter(p => p.names.some(n => normalize(n).includes(value))), ...findPlaces(query)].slice(0, 20)
}
