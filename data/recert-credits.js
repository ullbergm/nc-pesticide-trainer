/* What North Carolina asks of a certified applicator each cycle, so the
   License card can say "9 of 10" rather than "9" and a link to go find out.

   The NC search returns credits earned as a string of buckets — "H [9.0]
   E [0] A [9.0]" — one per letter the applicator is certified in. That is
   half the story: it counts what was earned and never what was needed, and
   the number needed is not a property of the letter alone, because holding
   two categories changes what each of them asks. This file is the other
   half: Table 2 of NC State Extension's AG-714, plus the combining rules
   printed around it, and a solver that turns the letters on a record into a
   target for each one.

   Everything here is authored from AG-714 (the November 6, 2025 revision),
   the same publication the bank's `ncsu` questions come from, and it goes
   stale the same way and just as fast — it describes the certification
   system rather than fixing it. `cite` on each rule names the heading to
   check it against. The card says out loud that NCDA&CS is authoritative,
   which is the honest position for a number this file computes rather than
   reads off the record.
   Loads before js/license.js and js/app.js, and reads nothing. */
const RECERT = (() => {
  // Table 2, "Commercial Applicator Recertification Credit Requirements".
  // `hours` is what the category asks when it is the only one held, which is
  // also what it asks as the highest of several. A letter with a null `hours`
  // is one the record can show but the table sets no requirement for.
  const CATEGORIES = {
    A: { name: 'Aquatic', hours: 6 },
    B: { name: 'Public Health', hours: 6 },
    G: { name: 'Forestry', hours: 6 },
    H: { name: 'Right-of-Way', hours: 4 },
    I: { name: 'Regulatory', hours: 6 },
    K: { name: 'Agricultural Pest Animal — Livestock', hours: 6 },
    'K(PU)': { name: 'Agricultural Pest Animal — Poultry', hours: 6 },
    'K(SA)': { name: 'Agricultural Pest Animal — Small Animal', hours: 6 },
    L: { name: 'Ornamental & Turf', hours: 10 },
    M: { name: 'Seed Treatment', hours: 3 },
    N: { name: 'Demonstration & Research', hours: 10 },
    O: { name: 'Agricultural Pest Plant', hours: 10 },
    S: { name: 'Commercial Soil Fumigation', hours: 3 },
    T: { name: 'Wood Treatment', hours: 4 },
    // Aerial methods, the hour an aerial applicator earns on top of a
    // category. It is not a work category and is never the "highest" one.
    P: { name: 'Aerial Methods', hours: 1 },
    // E is how a certification record writes the Core Exam, not a category
    // to be recertified in, so the card shows what was earned against no
    // target rather than inventing one.
    E: { name: 'Core', hours: null },
    // The two private applicator buckets. V is the two-hour pesticide safety
    // class NC Cooperative Extension runs; X is private category credit.
    V: { name: 'Private core (pesticide safety class)', hours: 2 },
    X: { name: 'Private category', hours: 2 },
    // The private fumigation letters. Table 2 sets no separate hour
    // requirement for them (private category credit is the X bucket), so a
    // record that shows one renders it named but untargeted.
    'Z(SF)': { name: 'Soil Fumigation (private)', hours: null },
    'Z(CF)': { name: 'Commodity Fumigation (private)', hours: null },
  };

  // An additional category asks three credits rather than its own full
  // requirement — but never more than its own, which is what keeps a
  // three-hour category (seed treatment, soil fumigation) at three.
  const ADDITIONAL = 3;
  // Demonstration & Research renews at its full ten hours however many other
  // categories are held, so it sits outside the highest-plus-three split
  // entirely and every other category's credits are earned on top of it.
  const ALWAYS_FULL = ['N'];
  // Aerial certification runs two years and splits its hours differently:
  // one hour of aerial methods, three for the first category, one for each
  // additional one.
  const AERIAL_FIRST = 3;
  const AERIAL_ADDITIONAL = 1;

  const known = code => Object.prototype.hasOwnProperty.call(CATEGORIES, code);
  const nameOf = code => (known(code) ? CATEGORIES[code].name : '');
  const hoursOf = code => (known(code) ? CATEGORIES[code].hours : null);

  // "H [9.0] E [0] A [9.0]" -> [{code:'H', earned:9}, ...]. Codes are letters
  // and may carry a parenthesized qualifier (K(PU), K(SA)); the number is
  // credits earned this cycle and is written with a decimal because half
  // credits exist. A bucket the string does not name is one the applicator is
  // not certified in, so the order and the membership of this list is the
  // record's own answer to "which categories do I hold".
  function parseTotals(totals) {
    const out = [];
    const re = /([A-Za-z]+(?:\([A-Za-z]+\))?)\s*\[\s*(\d+(?:\.\d+)?)\s*\]/g;
    let m;
    while ((m = re.exec(String(totals || '')))) {
      out.push({ code: m[1], earned: Number(m[2]) });
    }
    return out;
  }

  // 02 NCAC 09L .0522(a): the credits for each ground application pest
  // control category must be obtained in at least two years of the five-year
  // period, so a cycle's worth cannot all be crammed into one seminar. The
  // totals string cannot say when hours were earned; the record's course list
  // can, which is what creditYears below reads. The aerial counterpart —
  // one credit obtained through training in aerial methods, .0522(a)(14) —
  // is already carried by the P bucket's own meter.
  const SPREAD_YEARS = 2;

  // A course's credit string is written differently from the cycle totals:
  // "A 1.0, B 1.0, H 1.0, L 1.0" rather than "A [1.0] B [1.0]" (a real 026
  // record shows both side by side). Read whichever format is there — the
  // bracket one first, since a bare "9.0]" must not be mistaken for a code —
  // and return the same [{code, earned}] shape as parseTotals. A course from
  // before the current cycle is listed with a blank credit string, so it
  // parses to nothing and drops out of every sum, which is the right answer.
  function parseCourse(credits) {
    const bracketed = parseTotals(credits);
    if (bracketed.length) return bracketed;
    const out = [];
    const re = /([A-Za-z]+(?:\([A-Za-z]+\))?)\s+(\d+(?:\.\d+)?)/g;
    let m;
    while ((m = re.exec(String(credits || '')))) {
      out.push({ code: m[1], earned: Number(m[2]) });
    }
    return out;
  }

  // Sum the hours on a record's course list by calendar year, oldest first:
  // [{year, hours}]. A course whose date or credits cannot be read is left
  // out rather than guessed at, so an empty result means "cannot tell", not
  // "no hours".
  function creditYears(courses) {
    const byYear = new Map();
    (Array.isArray(courses) ? courses : []).forEach(c => {
      const m = /(\d{4})/.exec(String((c && c.date) || ''));
      const hours = parseCourse(c && c.credits).reduce((n, b) => n + b.earned, 0);
      if (!m || !hours) return;
      const year = Number(m[1]);
      byYear.set(year, (byYear.get(year) || 0) + hours);
    });
    return [...byYear].map(([year, hours]) => ({ year, hours }))
      .sort((a, b) => a.year - b.year);
  }

  // Which set of rules a license recertifies under. The letter buckets alone
  // cannot say: an aerial applicator and a ground one both hold work
  // categories, and only the license type distinguishes them.
  const KINDS = ['commercial', 'aerial', 'private'];

  // The categories that take part in the highest-plus-three split: the work
  // categories, with the ones that stand outside it removed.
  const splitCodes = (codes, exclude) =>
    codes.filter(c => !exclude.includes(c) && typeof hoursOf(c) === 'number');

  // Given the letters on a record and the kind of license they sit on,
  // return one entry per letter with the hours it asks this cycle:
  //
  //   {code, name, required, rule}
  //
  // `required` is null when the table sets no requirement for that letter
  // (Core, or a letter this file does not know), which the card renders as an
  // earned count with no target rather than as a zero. `rule` names why the
  // number came out the way it did, so the card can explain a 3 that would
  // otherwise look wrong next to a category that plainly asks 6.
  function plan(codes, kind) {
    const list = [...new Set(codes)];
    if (kind === 'private') return list.map(privateEntry);

    const aerial = kind === 'aerial';
    // Aerial methods is an hour of its own on an aerial license and takes no
    // part in choosing the highest category.
    const exclude = aerial ? [...ALWAYS_FULL, 'P'] : ALWAYS_FULL;
    const split = splitCodes(list, exclude);
    // The highest requirement is earned in full; ties do not matter, since
    // the loser then asks for the additional amount either way.
    const first = split.reduce(
      (best, c) => (best === null || hoursOf(c) > hoursOf(best) ? c : best), null);

    return list.map(code => {
      const hours = hoursOf(code);
      const entry = { code, name: nameOf(code), required: null, rule: '' };
      if (typeof hours !== 'number') return entry;
      if (ALWAYS_FULL.includes(code)) {
        return { ...entry, required: hours,
          rule: 'renews at its full requirement however many other categories are held' };
      }
      if (aerial && code === 'P') {
        return { ...entry, required: hours, rule: 'the aerial methods hour' };
      }
      if (code === first) {
        return aerial
          ? { ...entry, required: AERIAL_FIRST, rule: 'first category on an aerial certification' }
          : { ...entry, required: hours, rule: 'the highest requirement held, earned in full' };
      }
      const additional = aerial ? AERIAL_ADDITIONAL : Math.min(ADDITIONAL, hours);
      return { ...entry, required: additional, rule: 'an additional category' };
    });
  }

  // Private certification asks four hours whatever else is held: two of the
  // safety class and two of category credit. Holding all three private
  // categories raises the X hours to one for each, so a record showing three
  // is meeting a requirement this file cannot see from the letters alone —
  // hence the floor rather than an exact number.
  function privateEntry(code) {
    const hours = hoursOf(code);
    const entry = { code, name: nameOf(code), required: null, rule: '' };
    if (typeof hours !== 'number') return entry;
    if (code === 'X') {
      return { ...entry, required: hours,
        rule: 'two hours, or one for each private category if all three are held' };
    }
    return { ...entry, required: hours, rule: 'the two-hour pesticide safety class' };
  }

  // How long a cycle runs and when its credits are due, for the line under
  // the meters. Keyed by the same kinds `plan` takes.
  const CYCLES = {
    commercial: { years: 5, due: 'June 30 of the year the certification expires' },
    aerial: { years: 2, due: 'June 30 of the second year following certification' },
    private: { years: 3, due: 'September 30 of the third year following certification' },
  };

  // The certification cycle as a pair of dates. The record names only the
  // end (RecertificationDateString — June 30 for commercial and aerial,
  // September 30 for private); the start is the day after that date minus
  // the cycle length. Verified against a live 026 record: recertify by
  // 6/30/2027 puts the start at 7/1/2022, and NCDA's own course list agrees,
  // blanking the credit strings of courses from before that day. Note the
  // start is NOT derivable from the license's Expire date — that is the
  // annual license year, a different clock entirely (a record can expire
  // 12/31/2010 yet recertify by 9/30/2013). Takes the parsed end Date and a
  // kind; returns {start, end, years}, or null when either is unknown.
  function cycleWindow(end, kind) {
    const cycle = CYCLES[kind];
    if (!cycle || !(end instanceof Date) || Number.isNaN(end.getTime())) return null;
    const start = new Date(end.getFullYear() - cycle.years, end.getMonth(), end.getDate() + 1);
    return { start, end, years: cycle.years };
  }

  return { CATEGORIES, KINDS, CYCLES, SPREAD_YEARS, cycleWindow, parseTotals, parseCourse,
           creditYears, plan, nameOf, hoursOf };
})();
