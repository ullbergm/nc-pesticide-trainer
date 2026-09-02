/* Demo progress for the documentation screenshots.
 *
 * generate.sh drops this into a throwaway copy of index.html, ahead of
 * js/app.js, so the app boots into a realistic mid-study state instead of an
 * empty one. It is never part of the app or the deploy.
 *
 * The scenario is an aerial applicator twelve days out from Commercial Core
 * and Aerial Methods: most of the core manual has been seen and the aerial
 * one and the law are underway, with a mix of solid and shaky cards, a failed
 * first mock and passing retakes on record. Everything is seeded, so a re-run
 * reproduces the same images.
 */
(() => {
  // generate.sh injects this after the data scripts, so the config is loaded.
  const KEY = EXAM_CONFIG.storageKey;
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  let s = 20240815;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  // Shuffles, choice order and interval fuzz all draw from here, so the study
  // screenshot shows the same question every time.
  Math.random = rand;

  const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const dayKey = ts => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // manual -> how much of it has been seen, and the stability range in days.
  // Keyed by manual and not by chapter, because a chapter number means a
  // different chapter in each of them: "1" is Pest Management in the core
  // manual and Laws and Regulations in the aerial one.
  //
  // The scenario is an aerial applicator, who sits Commercial Core and the
  // Aerial Methods exam on top of it, so both national manuals are in play.
  // The core manual is furthest along, the aerial one and North Carolina's
  // law and rules are underway, and AG-714 on certification is barely
  // started. The wide stability ranges mix solid cards with shaky ones, which
  // keeps the due queue and the forecast populated.
  const PROFILE = {
    default: { seen: 0.88, stab: [4, 60] },
    aerial: { seen: 0.72, stab: [3, 40] },
    law: { seen: 0.78, stab: [3, 35] },
    rules: { seen: 0.62, stab: [2, 25] },
    ncsu: { seen: 0.5, stab: [2, 20] },
  };

  const cards = {};
  QUESTION_BANK.forEach(q => {
    const p = PROFILE[q.manual || 'default'];
    if (!p || rand() > p.seen) return;
    const stability = p.stab[0] + rand() * (p.stab[1] - p.stab[0]);
    const age = rand() * stability * 1.25; // a slice of the pool is overdue
    const lastReview = now - age * DAY;
    const wrong = rand() < 0.28 ? int(1, 2) : 0;
    cards[q.id] = {
      stability,
      difficulty: 3 + rand() * 5,
      lastReview,
      due: lastReview + stability * DAY,
      reps: int(1, 6),
      lapses: wrong,
      state: 'review',
      wrong,
      right: int(1, 5),
      streak: wrong > 0 && rand() < 0.35 ? 0 : int(1, 3),
    };
  });

  // Thirty days of review counts, unbroken over the last stretch so the
  // streak tile reads like someone actually studying for a date.
  const daily = {};
  for (let i = 29; i >= 0; i--) {
    if (i > 9 && rand() < 0.15) continue; // an off day here and there
    const reviews = i === 0 ? 16 : int(9, 38);
    daily[dayKey(now - i * DAY)] = {
      new: i === 0 ? 4 : int(0, 15),
      reviews,
      correct: Math.round(reviews * (0.72 + rand() * 0.22)),
    };
  }

  // The countdown runs to the end of exam day, so a date eleven days out is
  // the one that reads "in 12 days" whatever time of day the shot is taken.
  const exam = new Date(now + 11 * DAY);

  localStorage.setItem(KEY, JSON.stringify({
    cards,
    settings: {
      newPerDay: 15,
      tests: ['core', 'aerial'],
      // The drill shot is the one that shows the on-screen calculator, and it
      // is only on screen when this preference has been turned on.
      calcOpen: true,
      examDate: dayKey(exam.getTime()),
      theme: new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light',
    },
    daily,
    // A mock is the real test's length once the bank can fill it: 100
    // questions for Commercial Core, 50 for Aerial Methods.
    exams: [
      { date: now - 9 * DAY, type: 'Commercial Core', total: 100, correct: 62, passed: false },
      { date: now - 5 * DAY, type: 'Commercial Core', total: 100, correct: 74, passed: true },
      { date: now - 2 * DAY, type: 'Aerial Methods', total: 50, correct: 39, passed: true },
    ],
    log: [],
  }));

  // Two licenses in the lookup cache, so the License tab shows its cards
  // rather than an empty form: a pilot's own certification and the contractor
  // they fly under, which is the case that tab is built for.
  //
  // The records are invented, not a real licensee's — the shot blurs the name
  // and the license number on top of that — but every other field is shaped
  // the way the NCDA&CS search returns it, since that shape is what the card
  // reads. Seeding them also keeps generation offline: nothing here calls the
  // portal, so the images do not depend on it being up.
  const usDate = ts => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };
  const licEntry = (number, typeId, record) => ({
    input: { number, typeId },
    record: { number, licenseTypeId: typeId, owner: 'FDPE', status: 'Active', ...record },
    fetchedAt: now - 2 * 60 * 60 * 1000,
  });
  // The cache key is private to js/license.js; this is its value.
  localStorage.setItem('ncagr-licenses', JSON.stringify({
    v: 1,
    list: [
      licEntry('99999', '027', {
        name: 'SAMPLE PILOT (DEMO RECORD)',
        licenseType: 'Aerial Pesticide Applicator (Pilot)',
        county: 'WAYNE',
        expire: usDate(now + 320 * DAY),
        recertBy: usDate(now + 137 * DAY),
        originalIssue: '3/14/2014',
        // An aerial certification asks the aerial methods hour, three for the
        // first category and one for each additional: earned here are the
        // hour, two of the three, and none of the one.
        creditTotals: 'P [1.0] O [2.0] G [0]',
        // Course credits in the comma format real records use, which is not
        // the bracket format of the cycle totals above.
        courses: [
          { name: 'Aerial Application Technology Update', date: usDate(now - 96 * DAY), credits: 'P 1.0' },
          { name: 'Row Crop Weed Management Field Day', date: usDate(now - 41 * DAY), credits: 'O 2.0' },
        ],
      }),
      // No categories sit on a contractor license, so its card is the one
      // with nothing to score — and it expires inside the two months that
      // turn the badge from green to amber.
      licEntry('99998', '028', {
        name: 'SAMPLE FLYING SERVICE INC (DEMO RECORD)',
        licenseType: 'Aerial Pesticide Applicator (Contractor)',
        county: 'WAYNE',
        expire: usDate(now + 38 * DAY),
        originalIssue: '5/2/2011',
        creditTotals: '',
        courses: [],
      }),
    ],
  }));

  // The name and the license number are the two fields on a card that belong
  // to a person rather than to the app, so the documentation shot blurs them.
  // Everything the card is worth showing — the status, the deadlines, the
  // credits scored against AG-714 — is not personal and stays legible.
  const blurStyle = document.createElement('style');
  blurStyle.textContent = '.shotblur{filter:blur(7px)}';
  document.head.appendChild(blurStyle);

  function blurPersonal() {
    document.querySelectorAll('.liccard').forEach(card => {
      const fields = [card.querySelector('.licname')];
      card.querySelectorAll('.licgrid dt').forEach(dt => {
        if (dt.textContent.trim() === 'License number') fields.push(dt.nextElementSibling);
      });
      fields.forEach(el => { if (el) el.classList.add('shotblur'); });
    });
  }

  // What a graded answer looks like — the explanation, the citation back to
  // the manual, and the three interval buttons — is a screen the app reaches
  // by answering rather than by navigating, so there is no hash for it. This
  // gives it one: #answer is #study with the first question answered
  // correctly. The app never sees the name; it is swapped for the real route
  // here, before app.js boots and reads the hash.
  const answerShot = location.hash === '#answer';
  if (answerShot) location.hash = 'study';

  // The right choice is the one the bank says it is. The rendered question is
  // matched back to its entry by text, which holds for everything but a
  // calculation drill, whose numbers are drawn per session; those are what
  // #drill is for, so an unmatched question is simply left unanswered.
  function answerCorrectly() {
    const asked = document.querySelector('.qtext');
    const q = asked && QUESTION_BANK.find(x => x.question === asked.textContent);
    const choice = q && document.querySelector(`.choice[data-i="${q.answer}"]`);
    if (choice) choice.click();
  }

  // generate.sh reads the rendered page height back out of the title to size
  // the capture window; the title is never visible in a screenshot. Measure
  // the body, not the document: the document element is stretched to the
  // viewport, which would pad every short view with empty background, and
  // measure after any click above, which is what grew the page.
  addEventListener('load', () => {
    if (answerShot) answerCorrectly();
    blurPersonal();
    document.title = 'shot ' + Math.ceil(document.body.getBoundingClientRect().height);
  });
})();
