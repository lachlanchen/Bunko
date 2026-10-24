import { geoMercator, geoPath } from 'd3-geo'

/** Keep touch targets distinct; leader lines retain the actual geographic point. */
export function mapMarkerPositions(points: [number, number][], scale: number) {
  const placed: [number, number][] = []
  for (const point of points) {
    let chosen = point
    search: for (let ring = 0; ring <= 8; ring++) for (let step = 0; step < (ring ? 12 : 1); step++) {
      const angle = step * Math.PI / 6
      const candidate: [number, number] = [point[0] + Math.cos(angle) * ring * 36 / scale, point[1] + Math.sin(angle) * ring * 36 / scale]
      if (placed.every(p => Math.hypot(p[0] - candidate[0], p[1] - candidate[1]) * scale >= 35)) { chosen = candidate; break search }
    }
    placed.push(chosen)
  }
  return placed
}

/** Fit the actual projected bounds, not the arithmetic mean of clustered pins. */
export function guideMapGeometry(locations: { longitude: number; latitude: number }[]) {
  const lons = locations.map(p => (p.longitude + 360) % 360).sort((a, b) => a - b)
  let center = 0
  if (lons.length) {
    const gaps = lons.map((lon, i) => (lons[(i + 1) % lons.length] + (i === lons.length - 1 ? 360 : 0)) - lon)
    const gap = gaps.indexOf(Math.max(...gaps)), start = lons[(gap + 1) % lons.length]
    center = start + (360 - gaps[gap]) / 2
  }
  const projection = geoMercator().rotate([-center, 0]).scale(100).translate([0, 0])
  const point = (p: { longitude: number; latitude: number }) => projection([p.longitude, Math.max(-85, Math.min(85, p.latitude))])!
  if (locations.length) {
    const points = locations.map(point), xs = points.map(p => p[0]), ys = points.map(p => p[1])
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const ratio = Math.min(18, 520 / Math.max(30, maxX - minX), 290 / Math.max(30, maxY - minY))
    projection.scale(100 * ratio).translate([360 - (minX + maxX) / 2 * ratio, 230 - (minY + maxY) / 2 * ratio])
  } else projection.translate([360, 230])
  return { projection, path: geoPath(projection) }
}
