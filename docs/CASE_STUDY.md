# Case Study — UFO Sightings

**Repository:** [UFO-Sightings](https://github.com/Freddricklogan/UFO-Sightings) · **Live demo:** [freddricklogan.github.io/UFO-Sightings](https://freddricklogan.github.io/UFO-Sightings/) · **Author:** Freddrick Logan

---

## 1. Who has this problem

Anyone who keeps an early exercise in a public portfolio: the graduate whose "filterable table" is the first thing a recruiter opens, the instructor who wants a reference implementation whose filters behave the way users expect, and the reviewer deciding whether small work was done carefully. The table itself is trivial; what it reveals about habits is not.

## 2. The problem, as a scenario

A reviewer opens the page. The description promises thousands of sightings. She types "01/10/2010" into the date box and gets nothing, because the code compares strings exactly against "1/10/2010". She types "El Cajon" and gets one row, then "el caj" and gets none. She tries to sort by duration and cannot; the column holds "2-3 seconds" and "about 15 minutes" as text. Each filter appends a new "Showing N results" line under the last one. Two CDNs were loaded to do this. The file behind it has sixteen rows, all from one day.

## 3. What it costs to leave it alone

A description that overstates the data by two orders of magnitude is the kind of claim a reader remembers. Filters that fail on ordinary input teach that "works" means "works for the placeholder". Duration text that cannot be compared means the one numeric question a reader might ask — which sighting lasted longest — has no answer. And an unpinned dependency on two CDNs for a table is a supply-chain surface with no benefit.

## 4. The approach, and the alternative I rejected

I rejected widening the scope to a larger dataset or a map. This is a Tier 3 item: keep the table, make it right. The sixteen records moved from a global variable into `data/sightings.json` with their origin stated, validated on load. `src/sightings.js` parses dates strictly, parses durations into minutes with an approximate flag — reading a number or a range midpoint and a unit — and filters with stated semantics: a date range, substring matching on city and comments, exact matching on state, country and shape, all case-insensitive. Sorting handles unparseable values by placing them last in either direction. The page has no external scripts; the policy is `default-src 'none'; script-src 'self'`. The copy says sixteen.

## 5. What the code does today

A form offers a from and to date, a city substring, selects for state, country and shape populated from the data, and a comments substring; the table updates as you type, and a live count says how many of the sixteen rows match and, when none do, suggests clearing a filter. A row of chips counts shapes among the shown rows. Every column except comments sorts on click, with `aria-sort` on the header; the duration column shows the original text and the parsed minutes, and rows with no parseable duration sort last. A button exports the shown rows as a properly quoted CSV. The Executive Shell reports the shown count, the most common shape and the current sort.

## 6. Evidence

Seven Vitest tests cover the dataset's shape and validation messages, strict date parsing including 30 February, duration parsing for each pattern present in the data ("5 mins.", "2-3 seconds", "about 15 minutes", "30 minuets", "1 hour", a bare number, and the one unparseable "a few minutes"), every filter rule with positive and negative cases, ascending and descending sorts with nulls last, shape counts and distinct values, and CSV quoting. Statement coverage of the module is 100 %. In headless Chrome, filtering by shape "light" showed 7 of 16, adding city "EL" showed 1, sorting duration descending put the 30-minute row first and the unparseable row last with the header marked descending, a from-date after the data's only day showed 0 with guidance, and there were zero console errors and no horizontal scroll at 1280 or 400 pixels. `AUDIT.md` records nine findings.

## 7. What it would take to run this in production

There is no production, but the module would take a larger export unchanged: a city or state filter over the full NUFORC-style dataset would need virtualised rows and a worker for parsing, and the duration parser would need the additional patterns a bigger file contains. The provenance line would need the dataset's licence.

## 8. Limits and next steps

Sixteen rows from one day, so the date range is demonstrably correct but not interesting. Duration parsing is best-effort and flags approximations rather than resolving them. Next, if the scope were widened: the full dataset with pagination, a per-state summary, and a map. As a Tier 3 item, none of that is planned.

## 9. Who should look at this

**Hiring manager:** evidence that I correct my own overstatements and finish small pieces to the same standard as large ones.
**Consulting client:** a small, readable example of filter semantics done properly.
**Engineer:** read `parseDuration` and `filterRecords` in `src/sightings.js` with their tests.
