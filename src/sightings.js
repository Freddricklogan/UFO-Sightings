/** UFO sightings table logic: validation, date and duration parsing, filtering, sorting and summaries. Pure functions. */

export const FIELDS = ['datetime', 'city', 'state', 'country', 'shape', 'durationMinutes', 'comments'];

export function validateRecords(records) {
  const p = [];
  if (!Array.isArray(records) || records.length === 0) return ['records must be a non-empty array'];
  records.forEach((r, i) => {
    for (const f of FIELDS) if (typeof r[f] !== 'string') p.push(`row ${i + 1}: ${f} must be a string`);
    if (typeof r.datetime === 'string' && parseDate(r.datetime) === null) p.push(`row ${i + 1}: datetime "${r.datetime}" is not M/D/YYYY`);
  });
  return p;
}

/** Parses M/D/YYYY into an ISO date string, or null. */
export function parseDate(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mo, d, y] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/**
 * Best-effort duration in minutes from free text ("5 mins.", "2-3 seconds", "about 15 minutes", "30 minuets").
 * Returns { minutes, approximate } or null when no number can be read; ranges use the midpoint.
 */
export function parseDuration(text) {
  const t = String(text ?? '').toLowerCase();
  const num = t.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
  if (!num) return null;
  let n = Number(num[1]);
  if (num[2]) n = (n + Number(num[2])) / 2;
  const approximate = Boolean(num[2]) || /about|approx|~|few|several/.test(t);
  if (/sec/.test(t)) return { minutes: n / 60, approximate };
  if (/hour|hr/.test(t)) return { minutes: n * 60, approximate };
  return { minutes: n, approximate: approximate || !/min/.test(t) };
}

/** Enriches a record with an ISO date and minutes for sorting and filtering. */
export function enrich(r) {
  const d = parseDuration(r.durationMinutes);
  return { ...r, iso: parseDate(r.datetime), minutes: d ? d.minutes : null, approximate: d ? d.approximate : true };
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Text filters are case-insensitive; city and comments match on substring, state/country/shape exactly; from/to are ISO dates. */
export function filterRecords(records, f = {}) {
  const city = norm(f.city);
  const state = norm(f.state);
  const country = norm(f.country);
  const shape = norm(f.shape);
  const text = norm(f.text);
  return records.filter((r) =>
    (!f.from || (r.iso && r.iso >= f.from)) &&
    (!f.to || (r.iso && r.iso <= f.to)) &&
    (!city || norm(r.city).includes(city)) &&
    (!state || norm(r.state) === state) &&
    (!country || norm(r.country) === country) &&
    (!shape || norm(r.shape) === shape) &&
    (!text || norm(r.comments).includes(text))
  );
}

export function sortRecords(records, key = 'iso', dir = 'asc') {
  const s = [...records].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    return x < y ? -1 : 1;
  });
  if (dir !== 'desc') return s;
  const present = s.filter((r) => r[key] !== null && r[key] !== undefined).reverse();
  return [...present, ...s.filter((r) => r[key] === null || r[key] === undefined)];
}

export function countBy(records, key) {
  const m = new Map();
  for (const r of records) { const k = norm(r[key]) || '(blank)'; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function distinct(records, key) {
  return [...new Set(records.map((r) => norm(r[key])).filter(Boolean))].sort();
}

export function toCsv(records) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return [FIELDS.join(','), ...records.map((r) => FIELDS.map((f) => esc(r[f])).join(','))].join('\n') + '\n';
}
