#!/usr/bin/env node
/* The license card's two pieces of arithmetic, neither of which the browser
 * suite can reach: the recertification requirement solver (which turns the
 * letters on a record into what each one owes this cycle) and the saved-
 * license cache (which has to migrate the single-entry key it replaced, keep
 * a refresh from stacking a duplicate, and stay capped).
 *
 * The lookup is driven through a stubbed fetch rather than the real NC search,
 * so the token mint, the two-call search-then-detail sequence and the upsert
 * are all exercised without a network. */
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

let failed = 0;
const t = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failed += 1; };

// ---- a browser enough to load the two files
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
globalThis.localStorage = new MemoryStorage();

eval(read('data/recert-credits.js').replace('const RECERT', 'globalThis.RECERT'));
eval(read('js/license.js').replace('const License', 'globalThis.License'));

// ---- parsing what the record reports
{
  const rows = RECERT.parseTotals('H [9.0] E [0] A [9.0]');
  t('every credit bucket is read off the record',
    rows.length === 3 && rows[0].code === 'H' && rows[1].code === 'E' && rows[2].code === 'A');
  t('a bucket keeps its earned hours as a number',
    rows[0].earned === 9 && rows[1].earned === 0);
  t('a parenthesized category code survives parsing',
    RECERT.parseTotals('K(PU) [2.5]')[0].code === 'K(PU)');
  t('half credits are not rounded away', RECERT.parseTotals('K(PU) [2.5]')[0].earned === 2.5);
  t('no credit string is an empty list', RECERT.parseTotals('').length === 0
    && RECERT.parseTotals(null).length === 0 && RECERT.parseTotals(undefined).length === 0);
}

// ---- the commercial split: highest in full, three for each additional
const req = (codes, kind) => Object.fromEntries(
  RECERT.plan(codes, kind).map(r => [r.code, r.required]));
{
  t('a single category asks its full requirement', req(['A'], 'commercial').A === 6);
  t('the highest requirement held is earned in full', req(['L', 'A'], 'commercial').L === 10);
  t('an additional category asks three', req(['L', 'A'], 'commercial').A === 3);
  t('order does not decide which category is the highest',
    req(['A', 'L'], 'commercial').L === 10 && req(['A', 'L'], 'commercial').A === 3);
  t('an additional category never asks more than its own requirement',
    req(['M', 'S'], 'commercial').S === 3);
  // AG-714's own worked example: Ornamental & Turf with Aquatic is ten and three.
  t("AG-714's ornamental-and-turf-plus-aquatic example comes out ten and three",
    req(['L', 'A'], 'commercial').L === 10 && req(['L', 'A'], 'commercial').A === 3);
}

// ---- demonstration and research stands outside the split
{
  const both = req(['N', 'L'], 'commercial');
  t('demonstration and research renews at ten beside another category', both.N === 10);
  t('the category beside it still earns its own full requirement', both.L === 10);
  t('a lesser category beside it is unaffected by it', req(['N', 'A'], 'commercial').A === 6);
}

// ---- aerial splits its hours differently
{
  const plan = req(['P', 'L', 'A'], 'aerial');
  t('the aerial methods hour is one', plan.P === 1);
  t('an aerial first category is three, not its ground requirement', plan.L === 3);
  t('each additional aerial category is one', plan.A === 1);
  t('two aerial categories and the methods hour come to five',
    Object.values(req(['P', 'L', 'A'], 'aerial')).reduce((a, b) => a + b, 0) === 5);
}

// ---- private
{
  const plan = req(['V', 'X'], 'private');
  t('private certification asks two hours of V and two of X', plan.V === 2 && plan.X === 2);
}

// ---- letters with no requirement in the table
{
  t('the Core letter carries no credit target', req(['E', 'H'], 'commercial').E === null);
  t('a letter beside Core still gets its own requirement', req(['E', 'H'], 'commercial').H === 4);
  t('an unrecognized letter is shown without inventing a target',
    req(['ZZ', 'A'], 'commercial').ZZ === null);
  t('an unrecognized letter is never chosen as the highest',
    req(['ZZ', 'A'], 'commercial').A === 6);
  t('every entry explains itself',
    RECERT.plan(['L', 'A'], 'commercial').every(r => r.rule));
}

// ---- what a course reports, in either format the record writes
{
  // The cycle totals bracket their numbers; the course list separates its
  // pairs with commas (a real 026 record shows both side by side).
  const rows = RECERT.parseCourse('A 1.0, B 1.0, H 1.0, L 1.0');
  t('a comma-separated course credit string is read pair by pair',
    rows.length === 4 && rows[0].code === 'A' && rows[3].code === 'L'
    && rows.every(r => r.earned === 1));
  t('a course half credit is not rounded away',
    RECERT.parseCourse('A 0.5, L 3.0')[0].earned === 0.5);
  t('a qualified course category survives parsing',
    RECERT.parseCourse('K(PU) 2.5')[0].code === 'K(PU)');
  t('a bracket-format course credit string still reads',
    RECERT.parseCourse('L [2.0] A [1.0]').length === 2
    && RECERT.parseCourse('L [2.0] A [1.0]')[0].earned === 2);
  t('a blank course credit string is a course outside the cycle, not hours',
    RECERT.parseCourse('').length === 0 && RECERT.parseCourse(null).length === 0);
}

// ---- when the hours landed: the course list summed by year
{
  const years = RECERT.creditYears([
    { date: '5/1/2026', credits: 'L 4.0, A 0.5' },
    { date: '3/15/2024', credits: 'L [2.0]' },
    { date: '4/20/2024', credits: 'A 1.0' },
    { date: 'sometime', credits: 'L 9.0' },
    { date: '6/1/2026', credits: '' },
  ]);
  t('course hours are summed by calendar year, oldest first',
    years.length === 2 && years[0].year === 2024 && years[1].year === 2026);
  t('a year sums every course that fell in it, whatever its format',
    years[0].hours === 3 && years[1].hours === 4.5);
  t('a course whose date or credits cannot be read is left out',
    years.reduce((n, y) => n + y.hours, 0) === 7.5);
  t('no course list is no opinion, not zero years of credit',
    RECERT.creditYears([]).length === 0 && RECERT.creditYears(null).length === 0);
}

// ---- the certification cycle as a pair of dates
{
  const d = (y, m, day) => new Date(y, m - 1, day);
  const w = RECERT.cycleWindow(d(2027, 6, 30), 'commercial');
  // The live check behind this: an 026 recertifying by 6/30/2027 whose
  // course list blanks the credits of everything before 7/1/2022.
  t('a commercial cycle runs the five years up to its recertification date',
    w.years === 5 && w.start.getTime() === d(2022, 7, 1).getTime()
    && w.end.getTime() === d(2027, 6, 30).getTime());
  const p = RECERT.cycleWindow(d(2012, 9, 30), 'private');
  t('a private cycle runs three years to September 30',
    p.years === 3 && p.start.getTime() === d(2009, 10, 1).getTime());
  const a = RECERT.cycleWindow(d(2027, 6, 30), 'aerial');
  t('an aerial cycle runs two years',
    a.years === 2 && a.start.getTime() === d(2025, 7, 1).getTime());
  t('no recertification date or no known kind is no window',
    RECERT.cycleWindow(null, 'commercial') === null
    && RECERT.cycleWindow(new Date('nope'), 'commercial') === null
    && RECERT.cycleWindow(d(2027, 6, 30), 'unknown') === null);
}

// ---- which rules a license type renews under
{
  t('a private applicator license renews under the private rules',
    License.kindOf('038') === 'private');
  t('an aerial pilot license renews under the aerial rules', License.kindOf('027') === 'aerial');
  t('a public aerial license renews under the aerial rules too',
    License.kindOf('035') === 'aerial');
  t('a dealer license renews under the commercial rules', License.kindOf('037') === 'commercial');
  t('an unknown license type falls back to commercial rather than nothing',
    License.kindOf('999') === 'commercial');
}

// ---- the saved-license cache
const CACHE_KEY = 'ncagr-licenses';
const LEGACY_KEY = 'ncagr-license';
const entryFor = (number, typeId) => ({
  input: { number, typeId }, record: { number, licenseTypeId: typeId }, fetchedAt: 1,
});
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const reset = () => { localStorage.map.clear(); };

{
  reset();
  t('nothing saved is an empty list', License.saved().length === 0);

  reset();
  write(LEGACY_KEY, entryFor('87690', '026'));
  const migrated = License.saved();
  t('the single-license cache this replaced is carried forward',
    migrated.length === 1 && migrated[0].input.number === '87690');
  t('the old key is dropped once it has been carried forward',
    localStorage.getItem(LEGACY_KEY) === null);
  t('the carried-forward license survives a second read', License.saved().length === 1);

  reset();
  write(LEGACY_KEY, { input: { number: '1', typeId: '026' } }); // no record
  t('a legacy entry with no record is not migrated as a card', License.saved().length === 0);

  reset();
  write(CACHE_KEY, { v: 1, list: [entryFor('1', '026'), { record: {} }, null] });
  t('an entry that could never be refreshed is dropped', License.saved().length === 1);

  reset();
  write(CACHE_KEY, { v: 1, list: [entryFor('1', '026'), entryFor('2', '038')] });
  License.remove('026:1');
  t('forgetting one license leaves the others', License.saved().length === 1
    && License.saved()[0].input.number === '2');
  t('forgetting a license that is not saved changes nothing',
    (License.remove('026:999'), License.saved().length === 1));

  t('the same number under two types is two different licenses',
    License.keyOf({ number: '1', typeId: '026' }) !== License.keyOf({ number: '1', typeId: '027' }));
}

// ---- the layer the user enters on top of the record
{
  reset();
  const KEY = '026:87690';
  const user = () => License.userData(KEY);
  t('a license with nothing logged has an empty user layer',
    user().pending.length === 0 && user().categories.length === 0);

  t('a pending credit needs a category and positive hours',
    License.logPending(KEY, { code: '', hours: 2 }) === false
    && License.logPending(KEY, { code: 'L', hours: 0 }) === false
    && License.logPending(KEY, { code: 'L', hours: NaN }) === false
    && user().pending.length === 0);

  t('a logged credit keeps its course, date, and hours',
    License.logPending(KEY, { code: 'L', hours: 2, date: '2026-03-01', name: 'Turf School' }) === true
    && user().pending[0].code === 'L' && user().pending[0].hours === 2
    && user().pending[0].date === '2026-03-01' && user().pending[0].name === 'Turf School');

  License.logPending(KEY, { code: 'A', hours: 1.5, date: '2026-04-01' });
  License.dropPending(KEY, 0);
  t('dropping a pending credit leaves the others',
    user().pending.length === 1 && user().pending[0].code === 'A');

  License.setCategories(KEY, ['L', 'A', 'L']);
  t('declared categories are kept deduplicated', user().categories.join(',') === 'L,A');
  t('the user layer is kept per license',
    License.userData('027:1').pending.length === 0
    && License.userData('027:1').categories.length === 0);

  License.remove(KEY);
  t('forgetting a license forgets what was logged against it',
    user().pending.length === 0 && user().categories.length === 0);

  License.logPending(KEY, { code: 'L', hours: 2 });
  License.clearCache();
  t('clearing the cache clears the user layer with it', user().pending.length === 0);
}

// ---- lookup: mint, search, detail, and store, against a stubbed portal
const b64 = s => Buffer.from(s).toString('base64');
const TOKEN = `x.${b64(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.y`;
const ok = body => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
let calls = [];
globalThis.fetch = url => {
  calls.push(url);
  if (url.includes('getusertoken')) return ok({ Token: TOKEN });
  if (url.includes('searchV2')) {
    const number = new URL(url).searchParams.get('licensenumber');
    const typeId = /026/.test(url) ? '026' : '026';
    return ok({ Data: [{ LID: `lid-${number}`, LicenseTypeId: typeId }] });
  }
  const number = url.split('/').pop().replace('lid-', '');
  return ok({
    Name: 'Test Applicator', LicenseNumber: number, LicenseType: 'Commercial',
    LicenseTypeId: '026', Status: 'Active', Expire: '12/31/2026',
    CourseCreditTotals: 'L [4.0] A [1.0]', Courses: [],
  });
};

(async () => {
  reset();
  const first = await License.lookup('87690', '026');
  t('a lookup returns the record it stored', first.record.number === '87690');
  t('a lookup saves the license', License.saved().length === 1);
  t('the credit totals survive into the cache',
    License.saved()[0].record.creditTotals === 'L [4.0] A [1.0]');

  await License.lookup('87690', '026');
  t('refreshing a license updates it in place rather than stacking a copy',
    License.saved().length === 1);

  await License.lookup('11111', '026');
  t('a second license is added beside the first', License.saved().length === 2);
  t('the most recently refreshed license comes first',
    License.saved()[0].input.number === '11111');

  calls = [];
  await License.lookup('22222', '026');
  t('a cached token is reused instead of minted again',
    !calls.some(u => u.includes('getusertoken')));

  reset();
  for (let i = 0; i < License.MAX_SAVED + 2; i++) await License.lookup(`n${i}`, '026');
  t('the cache is capped', License.saved().length === License.MAX_SAVED);
  t('the cap drops the least recently refreshed',
    !License.saved().some(e => e.input.number === 'n0'));

  // ---- a pending credit clears itself when the record catches up
  reset();
  License.logPending('026:33333', { code: 'L', hours: 2, date: '2026-03-01', name: 'Turf School' });
  License.logPending('026:33333', { code: 'A', hours: 1, date: '2026-03-01' });
  License.logPending('026:33333', { code: 'L', hours: 2, date: '2026-05-09' });
  globalThis.fetch = url => {
    if (url.includes('getusertoken')) return ok({ Token: TOKEN });
    if (url.includes('searchV2')) return ok({ Data: [{ LID: 'lid-33333', LicenseTypeId: '026' }] });
    return ok({
      Name: 'Test Applicator', LicenseNumber: '33333', LicenseTypeId: '026', Status: 'Active',
      CourseCreditTotals: 'L [2.0]',
      // Same day and category as the first pending entry, under a different
      // course name and in the course list's own comma format: what the user
      // typed never matches NCDA's title, so the match is date + category +
      // at least the hours.
      Courses: [{ CourseName: 'TURF & ORNAMENTAL RECERT', CourseDate: '3/1/2026', CourseString: 'L 2.0' }],
    });
  };
  await License.lookup('33333', '026');
  const left = License.userData('026:33333').pending;
  t('a pending credit the record now posts is dropped',
    left.length === 2 && !left.some(p => p.code === 'L' && p.date === '2026-03-01'));
  t('a pending credit in another category on the same day stays',
    left.some(p => p.code === 'A'));
  t('a pending credit from another day stays',
    left.some(p => p.code === 'L' && p.date === '2026-05-09'));

  // A record whose credits are read end to end: L and A on a commercial
  // license is ten and three, so four earned of thirteen owed.
  const rows = RECERT.parseTotals('L [4.0] A [1.0]');
  const plan = RECERT.plan(rows.map(r => r.code), License.kindOf('026'));
  const need = plan.reduce((n, r) => n + (r.required || 0), 0);
  t('a real record totals the way the card reports it', need === 13);

  console.log(failed ? `\n${failed} FAILED` : '\nAll license checks passed');
  process.exit(failed ? 1 : 0);
})();
