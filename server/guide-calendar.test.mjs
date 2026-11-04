import test from 'node:test';
import assert from 'node:assert/strict';
import { quotedCalendar, readingCalendar } from '../shared/guide-calendar.mjs';
const event = when => ({ when, citations: [{ quote: `The record says ${when}, when the journey began.` }] });
test('calendar retains stated precision, accepts leap days and does not reorder by publication year', () => {
  assert.equal(quotedCalendar(event('1813')).precision, 'year');
  assert.equal(quotedCalendar(event('December 1813')).month, 12);
  assert.equal(quotedCalendar(event('29 February 2000')).day, 29);
  assert.equal(quotedCalendar(event('February 29, 1900')), null);
  assert.equal(quotedCalendar(event('1813-13')), null);
  assert.equal(quotedCalendar({ when: '1813', citations: [{ quote: 'They arrived in spring.' }] }), null);
});
test('calendar handles source-language CJK dates and BCE without inventing year zero', () => {
  assert.equal(quotedCalendar(event('1898年4月5日')).day, 5);
  assert.equal(quotedCalendar(event('公元前221年')).year, -221);
  assert.equal(quotedCalendar(event('1 BCE')).end, quotedCalendar(event('1 CE')).start);
  assert.equal(quotedCalendar(event('0000')), null);
});
test('relative, uncertain, translated or non-calendar numbers remain narrative events', () => {
  for (const text of ['At sunrise', 'Later that day', 'around 1813', 'early 1813', 'spring 1813', '约1813年', '1813年頃', '3']) assert.equal(quotedCalendar(event(text)), null, text);
  assert.equal(quotedCalendar({ when: '1813年', citations: [{ quote: 'In 1813 the family moved.' }] }), null);
});


test('background dates can be plotted with distinct provenance, without upgrading uncertain dates', () => {
  assert.equal(readingCalendar({ when: '公元200年', certainty: 'background', citations: [] }).evidence, 'background')
  assert.equal(readingCalendar({ when: '公元200年', certainty: 'stated', citations: [{ quote: '公元200年官渡之战' }] }).evidence, 'passage')
  assert.equal(readingCalendar({ when: '公元200年', certainty: 'stated', citations: [] }), null)
  assert.equal(readingCalendar({ when: '约公元200年', certainty: 'background', citations: [] }), null)
  assert.equal(readingCalendar({ when: 'Chapter 200', certainty: 'background', citations: [] }), null)
  assert.equal(readingCalendar({ when: '2023-02-31', certainty: 'background', citations: [] }), null)
  assert.equal(quotedCalendar({ when: '公元200年', certainty: 'background', citations: [] }), null)
})
