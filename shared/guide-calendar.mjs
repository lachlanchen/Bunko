/** Deterministic dates from an exact quoted time phrase, never model coordinates. */
const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const normalized = text => String(text || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
export function quotedCalendar(event) {
  const value = normalized(event?.when);
  if (!value || !event?.citations?.some(c => normalized(c.quote).includes(value))) return null;
  return calendarPhrase(value);
}

/** Background dates remain visibly distinct from passage-verified dates. */
export function readingCalendar(event) {
  const quoted = quotedCalendar(event);
  if (quoted) return { ...quoted, evidence: 'passage' };
  const background = event?.certainty === 'background' ? calendarPhrase(normalized(event.when)) : null;
  return background ? { ...background, evidence: 'background' } : null;
}

function calendarPhrase(value) {
  if (!value) return null;
  // Approximate/relative expressions retain their narrative label and are not
  // silently turned into an exact point on a calendar.
  if (/(?:circa|about|around|approximately|early|late|spring|summer|autumn|winter|约|約|頃|ごろ|前後)/u.test(value)) return null;
  const era = value.match(/(?:^|\s)(b\.?c\.?e?\.?|a\.?d\.?|c\.?e\.?)$/u);
  const bce = !!era?.[1].startsWith('b') || /^(?:公元前|紀元前|纪元前)/u.test(value);
  const hasEra = !!era || /(?:公元|紀元|纪元|西暦|年)/u.test(value);
  value = value.replace(/^(?:in|on)\s+/u, '').replace(/(?:^|\s)(?:b\.?c\.?e?\.?|a\.?d\.?|c\.?e\.?)$/u, '').replace(/^(?:公元前|紀元前|纪元前|公元|西暦)/u, '').trim();
  let year, month, day, match;
  if ((match = value.match(/^(\d{1,4})(?:-(\d{2})(?:-(\d{2}))?)?$/u))) [, year, month, day] = match;
  else if ((match = value.match(/^(\d{1,4})年(?:\s*(\d{1,2})月(?:\s*(\d{1,2})日)?)?$/u))) [, year, month, day] = match;
  else if ((match = value.match(/^([a-z]+)\.?\s+(?:(\d{1,2})(?:st|nd|rd|th)?,?\s+)?(\d{1,4})$/u))) {
    const index = months.findIndex(m => m === match[1] || m.slice(0, 3) === match[1]);
    if (index < 0) return null;
    year = match[3]; month = index + 1; day = match[2];
  } else if ((match = value.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?[,]?\s+(\d{1,4})$/u))) {
    const index = months.findIndex(m => m === match[2] || m.slice(0, 3) === match[2]);
    if (index < 0) return null;
    year = match[3]; month = index + 1; day = match[1];
  } else return null;
  year = Number(year); month = month === undefined ? undefined : Number(month); day = day === undefined ? undefined : Number(day);
  if (!Number.isInteger(year) || year < 1 || year > 9999 || (year < 1000 && !hasEra && !month) || (month !== undefined && (month < 1 || month > 12))) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day !== undefined && (!month || day < 1 || day > days[month - 1])) return null;
  const signedYear = bce ? -year : year;
  // Astronomical axis coordinates remove the nonexistent civil year zero.
  const axisYear = bce ? 1 - year : year;
  const start = axisYear + (month ? (month - 1) / 12 : 0) + (day ? (day - 1) / (days[month - 1] * 12) : 0);
  const end = day ? start : month ? axisYear + month / 12 : axisYear + 1;
  return { year: signedYear, ...(month ? { month } : {}), ...(day ? { day } : {}), precision: day ? 'day' : month ? 'month' : 'year', start, end };
}
