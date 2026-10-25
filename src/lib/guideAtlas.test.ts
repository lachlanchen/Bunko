import { expect, it } from 'vitest'
import { historicalPlaces, readingPlaceChoices, suggestedReadingPlace } from './guideAtlas'
import { guideMapGeometry, mapMarkerPositions, mapLabelPositions } from './guideMapGeometry'
import han from '../../server/agent/han-regions.json'
import { geoArea, geoContains } from 'd3-geo'

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
  for (const names of [['Java-dvîpa', 'Jakarta'], ['中國', 'Beijing'], ['竭叉'], ['迦維羅衛'], ['竺剎尸羅', 'Taxila'], ['中天竺（印度）', 'Beijing']]) {
    expect(suggestedReadingPlace(names, 'foguoji')).toBeNull()
  }
  expect(suggestedReadingPlace(['Kingdom of Invisible Clouds'], 'foguoji')).toBeNull()
  expect(suggestedReadingPlace(['London'], 'other-book')).toBeNull()
  expect(readingPlaceChoices('巴連弗邑', 'foguoji')[0].name).toContain('Patna')
})

it('keeps reviewed historical coordinates finite and provenance available offline', () => {
  const places = historicalPlaces('foguoji')
  expect(new Set(places.map(p => p.id)).size).toBe(19)
  for (const p of places) {
    expect(Math.abs(p.longitude)).toBeLessThanOrEqual(180)
    expect(Math.abs(p.latitude)).toBeLessThan(85)
    expect(p.sources?.every(s => s.startsWith('https://'))).toBe(true)
  }
})

it('resolves parenthesized historical names and represents an island as an area, never its capital', () => {
  expect(suggestedReadingPlace(['多摩梨帝（耽摩栗底）', '耽摩栗底'], 'foguoji')?.longitude).toBe(87.92)
  expect(suggestedReadingPlace(['巴连弗邑（华氏城）'], 'foguoji')?.country).toBe('India')
  expect(suggestedReadingPlace(['巴连弗邑（建康）'], 'foguoji')).toBeNull()
  expect(suggestedReadingPlace(['玉门关'], 'foguoji')?.longitude).toBeCloseTo(93.864, 2)
  const region = suggestedReadingPlace(['师子国（斯里兰卡）', 'Colombo'], 'foguoji')!
  expect(region.area).toBeDefined(); expect(region.bounds).toHaveLength(2)
  expect(region.name).not.toContain('Colombo')
  expect(suggestedReadingPlace(['师子国'], 'another-book')).toBeNull()
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

it('separates coincident and nearby touch targets at phone and desktop zoom levels', () => {
  const points: [number, number][] = [[200,200],[200,200],[203,205],[205,202],[202,208]]
  for (const scale of [.3,1,2]) {
    const markers = mapMarkerPositions(points,scale)
    markers.forEach((p,i) => markers.slice(i+1).forEach(q => expect(Math.hypot(p[0]-q[0],p[1]-q[1])*scale).toBeGreaterThanOrEqual(35)))
  }
  expect(points[1]).toEqual([200,200])
})

it('locates all thirteen Han provinces as colored dated areas and rejects other-period substitutions', () => {
  const regions = historicalPlaces('zizhi-tongjian', 191).filter(r => r.area)
  expect(regions).toHaveLength(13)
  expect(new Set(regions.map(r => r.color)).size).toBe(13)
  for (const region of regions) {
    expect(region.referenceYear).toBe(140)
    expect(region.area).toBeDefined()
    expect(geoArea(region.area!)).toBeGreaterThan(0)
    expect(geoArea(region.area!)).toBeLessThan(.2)
    expect(geoContains(region.area!, [region.longitude, region.latitude])).toBe(true)
    expect(suggestedReadingPlace([region.name], 'zizhi-tongjian', 191)?.id).toBe(region.id)
  }
  expect(historicalPlaces('zizhi-tongjian', 800).filter(r => r.area)).toHaveLength(0)
  expect(suggestedReadingPlace(['长安'], 'zizhi-tongjian', 191)?.name).toBe('Xian')
  expect(suggestedReadingPlace(['荆州'], 'zizhi-tongjian', 191, 'han140-jing')?.area).toBeDefined()
  expect(han.license).toBe('CC-BY-SA-4.0')
})

it('keeps all region labels separately readable and selectable on narrow phones', () => {
  const places = historicalPlaces('zizhi-tongjian', 191)
  const geometry = guideMapGeometry(places, 520, 600)
  const points = places.map(p => geometry.projection([p.longitude, p.latitude])!)
  for (const scale of [.3, .55, .7, 1.5]) {
    const labels = mapLabelPositions(points, places.map(() => 46), scale)
    labels.forEach((a, i) => labels.slice(i + 1).forEach(b => expect(Math.abs(a[0] - b[0]) * scale >= 50 || Math.abs(a[1] - b[1]) * scale >= 33.99).toBe(true)))
  }
})
