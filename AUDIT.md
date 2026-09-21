# AUDIT — UFO Sightings (pre-refactor, scope kept)

Tier 3 "keep scope": the filterable table stays. Previous build:
`index.html` (121 lines), `static/js/app.js` (101 lines),
`static/js/data.js` (146 lines, 16 records), Bootstrap 4.0.0 CSS from a
CDN, D3 4.11.0 from a CDN, two decorative images.

---

## A. Honesty of the copy

### A1 — "thousands of recorded UFO sightings"
The structured-data description (`index.html:27`) and README promised
thousands of records; `data.js` held 16, all dated 1 January 2010.
**Fix:** the page, README and shell say sixteen January 2010 reports,
and the data file states its origin.

### A2 — "Filter by date" that required an exact string
`app.js:40`: `row.datetime === date` against a text box with a
placeholder of `1/10/2010`. A user typing `01/10/2010` or `2010-01-10`
got nothing. City, state, country and shape were exact matches on
lower-cased input, so `El Cajon` matched but `el caj` did not.
**Fix:** date is a from/to range on native date inputs; city and
comments match on substring; state, country and shape are selects
populated from the data; everything is case-insensitive.

## B. Correctness

### B1 — Durations were opaque strings
"5 mins.", "2-3 seconds", "about 15 minutes", "30 minuets": the column
could not be sorted or compared. **Fix:** `parseDuration` reads a
number (or a range's midpoint) and a unit, returns minutes with an
`approximate` flag, and the table sorts on it with unparseable text
last; the parse is shown beside the original text.

### B2 — No sorting at all
**Fix:** every column except comments sorts ascending and descending
with `aria-sort` on the header.

### B3 — Result count was appended to the form each time
`app.js:63–66` created a new count element on every filter without
removing the old one. **Fix:** one `aria-live` count.

## C. Dependencies and structure

### C1 — D3 4.11.0 and Bootstrap 4.0.0 from CDNs, unpinned by integrity,
for a table
**Fix:** no external scripts or stylesheets beyond the font; CSP
`default-src 'none'; script-src 'self'`.

### C2 — Data as a global `var` in a script file
**Fix:** `data/sightings.json`, validated on load (16 rows, 0
problems).

### C3 — Stock images and stale screenshot committed
**Fix:** removed; one current screenshot in `docs/`.

## D. Engineering

### D1 — No tests, no CI
**Fix:** 7 Vitest tests at 100 % statement coverage over parsing,
filtering, sorting, counting and CSV export; ESLint, html-validate,
security scan, Pages deployment.
