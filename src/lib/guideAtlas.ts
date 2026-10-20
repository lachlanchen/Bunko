import cities from '../data/atlas-places.json'

export interface AtlasPlace { id: string; name: string; country: string; region: string; longitude: number; latitude: number; names: string[] }
const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[’']/gu, '').trim()
export const atlas: AtlasPlace[] = (cities as [string, string, string, string, number, number, string[]][]).map(([id, name, country, region, longitude, latitude, names]) => ({ id, name, country, region, longitude, latitude, names }))
const labels = new Map(atlas.map(p => [p.id, p.names.map(normalize)]))
export function findPlaces(query: string, exact = false): AtlasPlace[] {
  const value = normalize(query)
  if (!value || (!exact && value.length < 2)) return []
  return atlas.map(place => ({ place, rank: labels.get(place.id)!.some(n => n === value) ? 0 : labels.get(place.id)!.some(n => n.startsWith(value)) ? 1 : labels.get(place.id)!.some(n => n.includes(value)) ? 2 : 3 }))
    .filter(row => row.rank <= (exact ? 0 : 2)).sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name)).slice(0, exact ? 50 : 20).map(row => row.place)
}
export function suggestedPlace(names: string[]): AtlasPlace | null {
  const results = [...new Map(names.flatMap(n => findPlaces(n, true)).map(p => [p.id, p])).values()]
  return results.length === 1 ? results[0] : null
}
