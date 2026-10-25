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

/** Labels keep readable screen size. Displace only overlapping boxes and retain
 * a leader to the geographic anchor; never move a province's geometry. */
export function mapLabelPositions(points: [number, number][], widths: number[], scale: number) {
  const placed: [number, number][] = []
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    let chosen = point
    search: for (let ring = 0; ring <= 25; ring++) for (let step = 0; step < (ring ? 16 : 1); step++) {
      const angle = step * Math.PI / 8
      const candidate: [number, number] = [point[0] + Math.cos(angle) * ring * 8 / scale, point[1] + Math.sin(angle) * ring * 8 / scale]
      if (placed.every((p, j) => Math.abs(p[0] - candidate[0]) * scale >= (widths[i] + widths[j]) / 2 + 4 || Math.abs(p[1] - candidate[1]) * scale >= 34)) { chosen = candidate; break search }
    }
    placed.push(chosen)
  }
  return placed
}

/** Fit the actual projected bounds, not the arithmetic mean of clustered pins. */
export function guideMapGeometry(locations: { longitude: number; latitude: number }[], width = 720, height = 460, padding = { x: 200, y: 170 }) {
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
    const ratio = Math.min(18, (width - padding.x) / Math.max(30, maxX - minX), (height - padding.y) / Math.max(30, maxY - minY))
    projection.scale(100 * ratio).translate([width / 2 - (minX + maxX) / 2 * ratio, height / 2 - (minY + maxY) / 2 * ratio])
  } else projection.translate([width / 2, height / 2])
  return { projection, path: geoPath(projection) }
}
