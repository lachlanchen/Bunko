import locations from './reading-locations.json' with { type: 'json' }
const normalize = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’'‘ʽʼ\s-]/gu, '')

const names = value => { const text = String(value || '').normalize('NFKC'); return [text, ...text.split(/[()]/u).filter(Boolean)].map(normalize) }

/** Add documented modern search names; never fabricate places, routes or coordinates.
 * Read-time adaptation also helps older native maps without rewriting saved chat. */
export function readingGeography(guide) {
  const book = locations.books[guide?.reference?.id]
  if (!book || !Array.isArray(guide.places)) return guide
  return { ...guide, places: guide.places.map(place => {
    if (book.unresolvedNames.some(n => names(place.name).includes(normalize(n)))) return place
    const matches = book.locations.filter(row => row.names.some(n => [place.name, ...(place.aliases || [])].some(v => names(v).includes(normalize(n)))))
    if (matches.length !== 1 || !matches[0].modernName) return place
    const modern = matches[0].modernName
    return { ...place, aliases: [...new Set([modern, ...(place.aliases || [])])].slice(0, 6) }
  }) }
}

export function geographyContext(bookId) {
  const book = locations.books[bookId]
  if (!book) return undefined
  return {
    purpose: 'Name identification only. These locations are not evidence that a person visited them. Include only places and connections relevant to the actual answer and scope.',
    approximateLocations: book.locations.filter(row => !row.countryArea).map(row => ({ names: row.names, modernReference: row.modernName || row.name })),
    noExactPin: book.unresolvedNames,
    uncertainty: 'Countries, broad regions and disputed identifications have no exact city pin. Do not replace Sinhala with Colombo, Java-dvipa with Jakarta, or the Central Kingdom with China. Connections are schematic, not traced roads or sailing tracks.',
  }
}
