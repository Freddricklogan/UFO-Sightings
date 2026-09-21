import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { countBy, distinct, enrich, filterRecords, parseDate, parseDuration, sortRecords, toCsv, validateRecords } from '../src/sightings.js';

const { records } = JSON.parse(readFileSync(new URL('../data/sightings.json', import.meta.url), 'utf8'));
const rows = records.map(enrich);

describe('dataset and parsing', () => {
  it('ships 16 valid records', () => {
    expect(records).toHaveLength(16);
    expect(validateRecords(records)).toEqual([]);
    expect(validateRecords([])).toEqual(['records must be a non-empty array']);
    expect(validateRecords([{ datetime: '13/40/2010', city: 1 }])).toEqual(expect.arrayContaining(['row 1: city must be a string', 'row 1: datetime "13/40/2010" is not M/D/YYYY']));
  });
  it('parses M/D/YYYY strictly', () => {
    expect(parseDate('1/1/2010')).toBe('2010-01-01');
    expect(parseDate('12/31/2010')).toBe('2010-12-31');
    expect(parseDate('2/30/2010')).toBeNull();
    expect(parseDate('2010-01-01')).toBeNull();
  });
  it('reads durations from the messy free text in the data', () => {
    expect(parseDuration('5 mins.')).toEqual({ minutes: 5, approximate: false });
    expect(parseDuration('2-3 seconds')).toEqual({ minutes: 2.5 / 60, approximate: true });
    expect(parseDuration('about 15 minutes')).toEqual({ minutes: 15, approximate: true });
    expect(parseDuration('30 minuets')).toEqual({ minutes: 30, approximate: false }); // "minuets" still contains "min"
    expect(parseDuration('1 hour')).toEqual({ minutes: 60, approximate: false });
    expect(parseDuration('10')).toEqual({ minutes: 10, approximate: true }); // unit missing
    expect(parseDuration('a few minutes')).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
    expect(rows.filter((r) => r.minutes === null)).toHaveLength(1);
  });
});

describe('filter, sort, summarise', () => {
  it('filters case-insensitively: substring on city and comments, exact on state/country/shape, range on date', () => {
    expect(filterRecords(rows, { state: 'CA' }).length).toBeGreaterThan(0);
    expect(filterRecords(rows, { state: 'ca' })).toEqual(filterRecords(rows, { state: 'CA' }));
    expect(filterRecords(rows, { city: 'el' }).some((r) => r.city === 'el cajon')).toBe(true);
    expect(filterRecords(rows, { shape: 'light' })).toHaveLength(7);
    expect(filterRecords(rows, { shape: 'ligh' })).toHaveLength(0);
    expect(filterRecords(rows, { from: '2010-01-02' }).every((r) => r.iso >= '2010-01-02')).toBe(true);
    expect(filterRecords(rows, { from: '2010-01-01', to: '2010-01-01' }).every((r) => r.iso === '2010-01-01')).toBe(true);
    expect(filterRecords(rows, { text: 'bright' }).every((r) => /bright/i.test(r.comments))).toBe(true);
    expect(filterRecords(rows, {})).toHaveLength(16);
    expect(filterRecords(rows, { country: 'zz' })).toEqual([]);
  });
  it('sorts with nulls last in both directions', () => {
    const asc = sortRecords(rows, 'minutes');
    expect(asc[asc.length - 1].minutes).toBeNull();
    for (let i = 1; i < asc.length - 1; i += 1) expect(asc[i - 1].minutes).toBeLessThanOrEqual(asc[i].minutes);
    const desc = sortRecords(rows, 'minutes', 'desc');
    expect(desc[0].minutes).toBe(Math.max(...rows.map((r) => r.minutes ?? -1)));
    expect(desc[desc.length - 1].minutes).toBeNull();
    expect(sortRecords([{ k: 2 }, { k: 1 }, { k: 2 }], 'k').map((r) => r.k)).toEqual([1, 2, 2]);
  });
  it('counts by shape and lists distinct values', () => {
    expect(countBy(rows, 'shape')[0]).toEqual({ value: 'light', count: 7 });
    expect(countBy([{ shape: '' }], 'shape')).toEqual([{ value: '(blank)', count: 1 }]);
    expect(distinct(rows, 'country')).toEqual(['us']);
    expect(distinct(rows, 'state')).toContain('ca');
  });
  it('exports CSV with quoting', () => {
    const csv = toCsv(rows.slice(0, 1));
    expect(csv.split('\n')[0]).toBe('datetime,city,state,country,shape,durationMinutes,comments');
    expect(csv.split('\n')[1]).toMatch(/^"1\/1\/2010","benton","ar","us","circle","5 mins\."/);
  });
});
