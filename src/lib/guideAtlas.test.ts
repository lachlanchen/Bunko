import { expect, it } from 'vitest'
import { historicalPlaces, readingPlaceChoices, suggestedReadingPlace } from './guideAtlas'
import { guideMapGeometry } from './guideMapGeometry'

it('locates historical Foguoji names without inferring a route or borrowing another book context', () => {
  const names = ['長安', '張掖', '燉煌', '于闐', '弗樓沙', '巴連弗邑', '多摩梨帝']
  const places = names.map(name => suggestedReadingPlace([name], 'foguoji')!)
  expect(places.every(p => p?.approximate && p.sources?.length)).toBe(true)
  expect(places[0].longitude).toBeCloseTo(108.89, 1)
  expect(places[3].longitude).toBeCloseTo(79.93, 1)
  expect(places[5].country).toBe('India')
  expect(places[6].longitude).toBeCloseTo(87.92)
  expect(suggestedReadingPlace(['巴連弗邑'], 'other-book')).toBeNull()
  expect(suggestedReadingPlace(['Chʽang-gan', '西安'], 'foguoji')?.atlasId).toBe(places[0].atlasId)
  expect(suggestedReadingPlace(['長安', 'Paris'], 'foguoji')).toBeNull()
})

it('does not turn disputed places, regions, islands or kingdoms into exact city pins', () => {
  for (const names of [['師子國', 'Colombo'], ['Java-dvîpa', 'Jakarta'], ['中國', 'Beijing'], ['竭叉'], ['迦維羅衛'], ['竺剎尸羅', 'Taxila']]) {
    expect(suggestedReadingPlace(names, 'foguoji')).toBeNull()
  }
  expect(suggestedReadingPlace(['Kingdom of Invisible Clouds'], 'foguoji')).toBeNull()
  expect(suggestedReadingPlace(['London'], 'other-book')).toBeNull()
  expect(readingPlaceChoices('巴連弗邑', 'foguoji')[0].name).toContain('Patna')
})

it('keeps reviewed historical coordinates finite and provenance available offline', () => {
  const places = historicalPlaces('foguoji')
  expect(new Set(places.map(p => p.id)).size).toBe(17)
  for (const p of places) {
    expect(Math.abs(p.longitude)).toBeLessThanOrEqual(180)
    expect(Math.abs(p.latitude)).toBeLessThan(85)
    expect(p.sources?.every(s => s.startsWith('https://'))).toBe(true)
  }
})

it('fits every actual stop despite clusters, outliers, or crossing the date line', () => {
  const routes = [
    historicalPlaces('foguoji'),
    [{longitude: 179, latitude: 10}, {longitude: -179, latitude: 15}],
    [...Array.from({length: 20}, () => ({longitude: 85, latitude: 25})), {longitude: 120, latitude: 40}],
    [{longitude: 0, latitude: 0}],
  ]
  for (const places of routes) {
    const {projection} = guideMapGeometry(places)
    for (const place of places) {
      const [x,y] = projection([place.longitude,place.latitude])!
      expect(x).toBeGreaterThanOrEqual(99.9); expect(x).toBeLessThanOrEqual(620.1)
      expect(y).toBeGreaterThanOrEqual(84.9); expect(y).toBeLessThanOrEqual(375.1)
    }
  }
  const west=guideMapGeometry(routes[0]).projection([85,25]), east=guideMapGeometry(routes[1]).projection([85,25])
  expect(west).not.toEqual(east)
})
