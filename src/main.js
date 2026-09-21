/** Filterable, sortable UFO sightings table; scope kept from the original exercise, with the dataset vendored and the logic tested. */
import { mountExecShell } from './exec-shell.js';
import { countBy, distinct, enrich, filterRecords, sortRecords, toCsv, validateRecords } from './sightings.js';
import { $, el, setText } from './ui.js';

const state = { rows: [], shown: [], sortKey: 'iso', sortDir: 'asc' };
let shell;
const COLS = [['datetime', 'Date', 'iso'], ['city', 'City', 'city'], ['state', 'State', 'state'], ['country', 'Country', 'country'], ['shape', 'Shape', 'shape'], ['durationMinutes', 'Duration', 'minutes'], ['comments', 'Comments', null]];

function filters() {
  return { from: $('from').value, to: $('to').value, city: $('city').value, state: $('state').value, country: $('country').value, shape: $('shape').value, text: $('text').value };
}

function render() {
  state.shown = sortRecords(filterRecords(state.rows, filters()), state.sortKey, state.sortDir);
  const tbody = $('ufo-table');
  tbody.replaceChildren();
  for (const r of state.shown) {
    const tr = el('tr');
    tr.append(el('td', { text: r.datetime }), el('td', { text: r.city }), el('td', { text: r.state.toUpperCase() }), el('td', { text: r.country.toUpperCase() }), el('td', { text: r.shape }), el('td', { text: r.minutes === null ? r.durationMinutes : `${r.durationMinutes} (≈${r.minutes < 1 ? `${Math.round(r.minutes * 60)} s` : `${r.minutes} min`})` }), el('td', { class: 'wrap', text: r.comments }));
    tbody.append(tr);
  }
  setText('count', `Showing ${state.shown.length} of ${state.rows.length} sightings${state.shown.length === 0 ? ' — no rows match; clear a filter.' : ''}`);
  for (const th of document.querySelectorAll('th[data-key]')) {
    th.setAttribute('aria-sort', th.dataset.key === state.sortKey ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
    th.querySelector('button').classList.toggle('is-sorted', th.dataset.key === state.sortKey);
  }
  const shapes = countBy(state.shown, 'shape');
  const list = $('shapes');
  list.replaceChildren(...shapes.map((s) => el('li', { text: `${s.value}: ${s.count}` })));
  shell?.refreshKpis();
}

async function boot() {
  const data = await fetch('data/sightings.json').then((r) => r.json());
  const problems = validateRecords(data.records);
  if (problems.length) { setText('count', `Data invalid: ${problems.join(' · ')}`); return; }
  state.rows = data.records.map(enrich);
  setText('source-note', `${data.source} Durations are parsed from free text and marked ≈ when read from a range or a missing unit.`);
  for (const [id, key] of [['shape', 'shape'], ['state', 'state'], ['country', 'country']]) {
    const sel = $(id);
    sel.replaceChildren(el('option', { value: '', text: 'Any' }), ...distinct(state.rows, key).map((v) => el('option', { value: v, text: id === 'shape' ? v : v.toUpperCase() })));
  }
  const thead = $('head-row');
  thead.replaceChildren(...COLS.map(([, label, key]) => {
    const th = el('th', { scope: 'col' });
    if (key) {
      th.dataset.key = key;
      const b = el('button', { type: 'button', class: 'sort', text: label });
      b.addEventListener('click', () => { if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; } render(); });
      th.append(b);
    } else th.textContent = label;
    return th;
  }));
  $('filter-form').addEventListener('submit', (e) => { e.preventDefault(); render(); });
  $('filter-form').addEventListener('input', render);
  $('reset-btn').addEventListener('click', () => { $('filter-form').reset(); render(); });
  $('export-btn').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([toCsv(state.shown)], { type: 'text/csv' }));
    const a = el('a', { href: url, download: 'ufo-sightings-filtered.csv' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  render();
  shell = mountExecShell({
    title: 'UFO Sightings',
    tagline: 'The filterable-table exercise, kept to its scope: sixteen January 2010 reports, filtered by date range, city, state, country, shape and free text, sorted by any column, exported as CSV. The dataset is vendored and every filter, parser and sort is unit-tested.',
    repo: 'https://github.com/Freddricklogan/UFO-Sightings',
    pagesUrl: 'https://freddricklogan.github.io/UFO-Sightings/',
    badges: [{ label: '16 records', tone: 'accent' }, { label: 'No dependencies', dot: true }, { label: 'Scope kept', dot: true }],
    kpis: [
      { label: 'Shown', compute: () => state.shown.length, tone: 'accent' },
      { label: 'Records', compute: () => state.rows.length },
      { label: 'Most common shape', compute: () => countBy(state.shown, 'shape')[0]?.value ?? '—', tone: 'ok' },
      { label: 'Sorted by', compute: () => `${state.sortKey} ${state.sortDir}`, tone: 'muted' }
    ],
    tour: [
      { selector: '#filter-form', title: 'Filters that mean something', body: 'City and comments match on substring, state, country and shape exactly, and dates as a range — case-insensitive throughout, and the count says how many rows match.', action: () => { $('shape').value = 'light'; render(); } },
      { selector: '#head-row', title: 'Sort by any column', body: 'Durations like "2-3 seconds" and "about 15 minutes" are parsed into minutes so the column sorts numerically; unparseable text sorts last.', action: () => { state.sortKey = 'minutes'; state.sortDir = 'desc'; render(); } },
      { selector: '#export-btn', title: 'Take the rows with you', body: 'The CSV export writes exactly the filtered rows with proper quoting.', action: () => { $('filter-form').reset(); state.sortKey = 'iso'; state.sortDir = 'asc'; render(); } }
    ]
  });
  shell.refreshKpis();
}

boot();
