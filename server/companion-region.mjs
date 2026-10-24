import ipaddr from 'ipaddr.js'
import { readFileSync } from 'node:fs'
const dataset = JSON.parse(readFileSync(new URL('./regions/cn-networks.json', import.meta.url), 'utf8'))
const integer = ip => ip.toByteArray().reduce((n, b) => (n << 8n) | BigInt(b), 0n)
const ranges = { ipv4: [], ipv6: [] }
for (const cidr of dataset.networks) {
  const [ip, prefix] = ipaddr.parseCIDR(cidr), start = integer(ip)
  ranges[ip.kind()].push([start, start + (1n << BigInt((ip.kind() === 'ipv4' ? 32 : 128) - prefix)) - 1n])
}
for (const [kind, rows] of Object.entries(ranges)) {
  rows.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  const merged = []
  for (const row of rows) {
    const previous = merged[merged.length - 1]
    if (previous && row[0] <= previous[1] + 1n) previous[1] = row[1] > previous[1] ? row[1] : previous[1]
    else merged.push([...row])
  }
  ranges[kind] = merged
}
export function companionClientAddress(req) {
  const peer = req.socket.remoteAddress
  // Both owned HTTPS entrances reach the private service through loopback.
  // A direct network client cannot substitute its own forwarding header.
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer)
    ? req.headers['x-bunko-client-address'] || peer : peer
}
export function mainlandNetwork(address) {
  try {
    let ip = ipaddr.parse(address)
    if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address()
    const n = integer(ip), rows = ranges[ip.kind()]
    let lo = 0, hi = rows.length - 1
    while (lo <= hi) { const m = (lo + hi) >> 1; if (n < rows[m][0]) hi = m - 1; else if (n > rows[m][1]) lo = m + 1; else return true }
  } catch { /* An invalid/missing address is not a verified country. */ }
  return false
}
const country = value => typeof value === 'string' ? value.toUpperCase() : ''
// These client signals only restrict service. They never grant account or billing access.
// The edge overwrites X-Bunko-Client-Address; arbitrary forwarded-country headers are ignored.
export function companionAvailability(region, address) {
  const storefront = country(region?.storefront), deviceRegion = country(region?.deviceRegion)
  if (['CN', 'CHN'].includes(storefront) || ['CN', 'CHN'].includes(deviceRegion) || mainlandNetwork(address)) return { available: false, reason: 'mainland', policy: 'mainland-v1' }
  if (['macos', 'ios'].includes(region?.platform) && !/^[A-Z]{3}$/.test(storefront)) return { available: false, reason: 'region_unknown', policy: 'mainland-v1' }
  return { available: true, reason: '', policy: 'mainland-v1' }
}
export const generatesContent = action => ['send', 'upload', 'import', 'resume'].includes(action)
