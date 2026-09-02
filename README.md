# NC Pesticide Trainer

[![CI](https://github.com/ullbergm/nc-pesticide-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/ullbergm/nc-pesticide-trainer/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/ullbergm/nc-pesticide-trainer)](https://github.com/ullbergm/nc-pesticide-trainer/releases)
[![License: MIT](https://img.shields.io/github/license/ullbergm/nc-pesticide-trainer)](LICENSE)
[![Live site](https://img.shields.io/website?url=https%3A%2F%2Fnc-pesticide.ullberg.io&label=nc-pesticide.ullberg.io)](https://nc-pesticide.ullberg.io)

[![Questions](https://img.shields.io/badge/questions-1392-blue)](data/questions.js)
[![Dependencies](https://img.shields.io/badge/dependencies-none-blue)](package.json)
[![PWA](https://img.shields.io/badge/PWA-offline%20ready-blue)](manifest.webmanifest)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-blue)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-blue)](https://www.conventionalcommits.org/en/v1.0.0/)

Practice questions with spaced repetition for the North Carolina pesticide
applicator certification exams: the 100-question commercial Core exam, the
50-question Private Applicator exam, the Aerial Methods exam every aerial
applicator adds on top, and the Pesticide Dealer exam, all passed at 70%. The
bank has 1392 questions and 36 calculation drills, written
with the recipe in
[docs/question-authoring.md](docs/question-authoring.md) and covering eight
sources: all eleven chapters of the
[National Pesticide Applicator Certification Core Manual](https://www.epa.gov/system/files/documents/2022-09/national-pesticide-applicator-cert-core-manual-2014.pdf)
(second edition, 2014) and all six of the
[National Aerial Applicator's Manual](https://www.epa.gov/system/files/documents/2023-11/national-aerial-applicator-manual-2014.pdf)
(2014), plus the appendices of each that teach something a test could ask:
conversions and calibration math, Safety Data Sheets, FAA requirements for
agricultural aircraft, heat stress, spill cleanup, and GPS. On top of those,
North Carolina's own pesticide law: the
[North Carolina Pesticide Law of 1971](https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByArticle/Chapter_143/Article_52.pdf)
(G.S. 143, Article 52) and the Pesticide Board's
[rules under it](http://reports.oah.state.nc.us/ncac/title%2002%20-%20agriculture%20and%20consumer%20services/chapter%2009%20-%20food%20and%20drug%20protection/subchapter%20l/subchapter%20l%20rules.pdf)
(02 NCAC 09L) — licensing and certification, recertification credits, storage,
disposal, worker protection, chemigation, and the aerial and ground application
rules. Fifth is NC State Extension's
[Pesticide Applicator Certification and Licensing](https://content.ces.ncsu.edu/pesticide-applicator-certification-and-licensing)
(AG-714), the free publication that describes the certification system to
applicators themselves: what each exam looks like, how many recertification
credits each category takes and by when, the training a noncertified applicator
needs, and which states North Carolina has reciprocity with. Sixth and
seventh are the first two North Carolina category manuals in the bank:
*Ectoparasites of Pets* (J. J. Arends, NC Agricultural Extension Service,
January 1994), the study manual for the Agricultural Pest Animal – Small
Animal category, K(SA) — for applicators applying pesticides to pets and the
places pets are confined, pet groomers included — covering mites, ticks,
lice, flies, mosquitoes, fleas, and insecticide use on pets; and the *Aquatic
Weed Management Training Manual — For North Carolina Applicators* (K. A.
Langeland ed., UF/IFAS, July 1991, revised for NC by S. H. Kay and J. H.
Wilson), the study manual for the Aquatic Pest Control category (A), covering
the history of aquatic plant management, management decision making,
regulations, herbicide technology and safety, adjuvants, application
equipment, dosage calculation and calibration, biological and mechanical
control, environmental and public health considerations, aquatic plant
identification, and its conversion-factor and glossary appendices. Eighth is
the printed *Pesticide Training Manual for Restricted Use Pesticide Dealers*
(NCDA and NC Cooperative Extension Service, revised May 1995), the study
manual NCDA&CS still issues for the Pesticide Dealer exam, today with a 2024
insert replacing its recordkeeping pages. Only its still-current chapters are
asked from it — store practice, the other laws a dealer meets, and dealer
recertification; everything it restates from the law and rules, and everything
the law has since moved past (its 1995 fees, its employee purchase age, the
superseded recordkeeping pages), is asked from the current statute and rules
instead. Every question cites where it came from:
manual questions cite a page, law and rule questions cite their section number,
and questions from AG-714 cite the heading they were written from. Wherever
the source is free to read online the citation is a link that opens it at the
right place; the dealer and category manuals are sold in print by the NC State
Pesticide Safety Education Program with no public PDF, so their questions name
the printed page instead.

The 36 **calculation drills** are counted apart from the questions because they
are not questions in the same sense. A drill is a method — the dosage formulas
in the core manual's appendix C, the area and calibration-test arithmetic in
its chapter 11, the whole sequence the aerial manual's chapter 5 works
through from a timed catch to the gallons that go in the tank, and the
aquatic manual's chapter 8 from pond acres and the 2.7 acre-foot constant to
a boat calibrated from a timed run — with new
numbers drawn every time the card comes up. What gets easy is doing the
conversion rather than recalling the answer it had last time, which is the one
thing a fixed question cannot teach. Every wrong choice is a particular mistake
with a name (a conversion left out, a ratio inverted, a decimal misplaced,
43,560 where 43.5 belongs) rather than a number near the right one, and a wrong
answer tells you which one you made: *You left the 100-gallon divisor out.* A
nonprogrammable calculator is allowed at the exam site, so the arithmetic is
fair game and every drill offers one on screen — four functions and a memory,
the same as the handheld you may carry in. [docs/math-drills.md](docs/math-drills.md)
is the design, and the worked calculations these replaced have been retired
from the bank so that no method is drilled twice.

Core chapters and NC law feed the Core and Private exams; aerial chapters and
the NC aerial rules feed Aerial Methods, so a mock exam never mixes the two.
The rules written for one license go only to its exam: commercial licensing
(.0500) to Core, private applicator certification (.1100) to Private, aerial
application (.1000) to Aerial Methods. The Pesticide Dealer exam is the one
certification exam not built on Core, because a dealer sells restricted use
pesticides rather than applying them: it draws on NC law, the rule Sections a
dealer works under (licenses, disposal, arsenic trioxide, availability of
restricted use pesticides, and storage), and AG-714's account of the licensing
system. Settings picks which exams you are
studying for, and About lists every NC license and the exams it takes. That
choice is remembered as the exams themselves, so when a release adds material
to an exam you picked, it joins what you are studying without your having to
go back and re-pick anything.

North Carolina licenses on the Core exam plus a **category** exam for each kind
of work you do, and aerial applicators add Aerial Methods on top. All fourteen
categories are listed in the app with what the bank has for them, which so far
is nothing: they are written from North Carolina's own category manuals, which
are sold in print. About has a coverage table, and an exam with no questions is
shown but not selectable, so the gap is visible rather than implied.

**The subject matter comes from the national manuals; North Carolina's own
study texts are not quoted here.** The national manuals are published by the
NASDA Research Foundation, hosted by EPA, and free to read, which is what lets
this bank cite them page by page and link each citation into the PDF. The same
is true of NC pesticide law: the statute is published by the General Assembly
and the rules by the Office of Administrative Hearings, both free, so the bank
covers them and cites each question to its section. AG-714 is free as well,
published by NC State Extension rather than sold, which is what lets the bank
cover the certification and licensing system the way North Carolina explains it
to applicators. What is missing is North
Carolina's own study texts, the NC Pesticide Applicator Certification Core
Manual and the category manuals, which are sold in print by the
[NC State Pesticide Safety Education Program](https://go.ncsu.edu/psep). They
are adapted from these national manuals and add material, particularly for the
categories, that nothing free covers. Questions from them are still planned;
each source is a separate entry in `data/exam-config.js` with its own citation
prefix and page map, and questions pick theirs with a `manual` field, so
adding one does not disturb what is already there.

This project is a fork of
[nc-cdl-trainer](https://github.com/ullbergm/nc-cdl-trainer): the
same engine studying a different manual. Live at
[nc-pesticide.ullberg.io](https://nc-pesticide.ullberg.io), or run it
yourself. There is no build step, no dependencies, and no server. Just open
`index.html` in a browser. All progress
is stored locally in the browser and never sent anywhere. Settings has export
and import for backups or for moving between devices.

<p align="center">
  <img src="docs/screenshots/home.png" width="500" alt="Home screen with due review, new card, and miss counts, an exam countdown banner, and a projected score for each exam">
</p>
<p align="center">
  <img src="docs/screenshots/answer.png" width="500" alt="A correctly answered question showing the explanation, a link to the manual page it came from, and Hard, Good, and Easy buttons with the interval each would schedule">
</p>
<p align="center">
  <a href="docs/screenshots/README.md">More screenshots</a>: the study queue,
  calculation drills, mock exams, the bank browser, stats, license lookup, and settings
</p>

## Modes

- **Study**: the spaced repetition queue. Due reviews plus a daily allotment of new
  cards, drawn round-robin across the selected chapters and interleaved with the
  reviews. Wrong answers come back a few cards later in the same session. Correct
  answers are rated Hard, Good, or Easy, which tells the scheduler how the recall felt.
  Feel like doing more once the queue is empty? The home and session-complete screens
  offer 5, 10, or 25 extra new cards; the extra applies to today only and your
  configured pace is untouched.
- **Misses**: re-drills every question whose last answer was wrong, without touching
  the review schedule. Answering one correctly removes it from the pool.
- **Exam**: mock exams in the real format. No feedback until the end, and 70% to
  pass. The list mirrors the NC exam structure (commercial Core, Private
  Applicator, Aerial Methods, and Pesticide Dealer) and shows only the exams
  selected in Settings. Missed exam questions feed the Misses pool.
- **Browse**: the whole bank by manual chapter, with each card's schedule and accuracy.
- **Stats**: exam readiness, mastery counts, day streak, 7-day due forecast,
  per-chapter accuracy, and exam history.
- **License**: look your actual NC pesticide licenses up by number and type. It queries
  the [NC Department of Agriculture public license search](https://apps.ncagr.gov/AgRSysPortalV2/licensesearch)
  and shows status, expiration, recertification deadline, and the continuing-certification
  credits on record. Keep as many licenses as you hold, each refreshed on its own: a pilot's
  own license and the contractor they fly under are two separate records, and so is a spouse's
  private certification. This is the one screen that contacts a server; results are cached in
  the browser so they load instantly, refresh when you press Refresh, and refresh quietly once
  a lookup is more than a week old.

  The credits are shown **against what they owe**, not just as what has been earned. The NC
  search reports one bucket per category — `L [4.0] A [1.0]` — and counts only hours earned;
  what each category *asks* is worked out here from Table 2 of AG-714 and the rules printed
  around it, in [data/recert-credits.js](data/recert-credits.js): the highest category held is
  earned in full and each additional one takes three, except demonstration and research, which
  always takes ten however many others are held. Aerial certification splits its hours
  differently — one for aerial methods, three for the first category, one for each additional —
  and runs two years rather than five, so the card scores an aerial license by aerial rules and
  a ground one by ground rules, off the license type. Each category gets a meter, a note saying
  why it asks what it asks, and the card totals the shortfall for the cycle. A letter the table
  sets no requirement for, like `E` for Core, is shown as earned hours with no target rather
  than as a zero. That arithmetic is this app's, not NCDA&CS's: it is computed from a
  publication that goes stale, so the card says so and links the official search.

  On top of the record sits a small planning layer, kept in the browser rather than fetched.
  **Credits waiting to post**: a course counts toward recertification the day it is taken, but
  can take weeks to appear on the state record — log it on the card and it rides its category's
  meter as a second, signage-yellow segment until the first Refresh finds it posted, at which
  point it clears itself. **Certified categories**: a record fresh into its cycle shows no
  credit buckets at all, which is exactly when a plan is most wanted, so a bucketless card
  offers checkboxes to declare the categories held and scores each from zero. The card also
  totals what is still needed by category, turns the recertification date into a pace ("about
  3 hours of approved courses a year from here covers it"), and — for ground licenses — checks
  the course dates against the timing rule the totals cannot carry: credits must be earned in
  at least two different years of the five-year cycle (02 NCAC 09L .0522). Because the two
  deadlines run on two clocks — the license itself lapses on December 31 of its last year
  (renewed annually for commercial and aerial, every three years for private), while the
  certification behind it runs a two-, three-, or five-year cycle — the card labels each with
  its clock and spells the cycle out ("Certification cycle: Jul 1, 2022 – Jun 30, 2027 ·
  year 4 of 5", worked back from the record's recertification date), which is also why an
  expiration can legitimately precede the recertify-by date. If any saved license
  is short, Home shows a one-line banner with the hours and the deadline, linked to the tab.
  What you log yourself travels in a progress backup; the fetched records stay out of it, and
  Reset everything in Settings clears both.

A **calculation drill** turns up in whichever of those modes the card is due
in, with a calculator beside it: North Carolina allows a nonprogrammable one at
the exam site, so the drill is about the method rather than mental arithmetic.
To drill the arithmetic on purpose rather than waiting for the cards to come
due, open [#drill](https://nc-pesticide.ullberg.io/#drill), which runs every
drill your selected exams ask for. It is a link rather than a tab on purpose: a
calibration problem belongs in the ordinary study queue, and a Math tab gets
practised by the people who already like arithmetic. Like the misses drill it
leaves the schedule alone, so using it cannot pull a card forward or push it
back.
It opens on a button and stays open on later drills once you have opened it,
starts cleared on every card, and takes keyboard input while the focus is
inside it. Answer wrong and the feedback names the mistake behind the choice
you picked before it explains the rule.

On a keyboard, 1 through 4 pick an answer, Enter continues after a wrong answer,
and 1/2/3 (or Enter for Good) grade a correct one. A stray tap is not final: an
Undo button (or the U key) on the feedback screen takes back the answer and asks
the question again, as long as you have not yet continued or graded. The buttons
show badges for their shortcut keys on devices with a mouse and keyboard; on
touch screens the badges stay hidden.

## Scheduling

The scheduler implements [FSRS-6](https://github.com/open-spaced-repetition)
(Free Spaced Repetition Scheduler) with its published default parameters. FSRS
models each card with three quantities:

- Difficulty: how hard the card is for you, on a scale of 1 to 10, adjusted by
  each answer.
- Stability: how durable the memory is, measured as the number of days until recall
  probability falls to 90%. Successful reviews grow it, and a miss collapses it.
- Retrievability: the predicted chance of recalling the card right now, which decays
  along a power-law forgetting curve.

Each review updates difficulty and stability from your rating, then schedules the
next review for the day retrievability is predicted to reach the target, shortly
before you would likely forget. Intervals grow quickly for cards you keep getting
right and reset for cards you miss. Repeat answers within the same day use a
separate short-term memory formula. Intervals of three days or more get a small
deterministic fuzz (up to about 5%) so cards learned together drift apart
instead of always coming due on the same day.

Every scheduled review is also appended to a compact log (question, rating,
timestamp) that is kept with your progress and included in backups. Nothing
reads it yet; it exists so a future version can fit the FSRS parameters to
your actual review history instead of the published defaults, which the
aggregate card state alone could never support.

## Studying for a date

Set your test date in Settings and the scheduler optimizes for that day instead of
indefinite retention:

- The retention target ramps from 90% to 95% over the final three weeks.
- No review is scheduled past the exam. Anything that would land later is pulled
  back to exam day.
- If the daily new-card pace is too slow to cover every remaining question in time,
  it is raised automatically. Your stored setting is untouched, the boost is shown
  on the home screen, and it goes away when the date is cleared.
- In the last five days a "Final review sweep" appears on the home screen. It goes
  through every card, weakest memory first, ignoring due dates.

Without an exam date the app runs at your own pace with the normal 90% target. The
same applies automatically once the date passes.

## Am I ready

The home screen projects a score for each exam you are studying for, and Stats
breaks the same projection down with the odds and what is dragging it. Both come
from the memory model the scheduler already maintains, so the number moves with
your actual reviews rather than with a running average of past answers.

Each question is one trial: either the answer is recalled, at the retrievability
FSRS predicts for the moment of the test, or it is not and the guess still lands
one time in four. A question you have never seen is a straight guess. The real
test draws its questions from a much larger pool, so the projected score is the
pool average, and the spread around it accounts for both the draw and the recall
itself. The chance of passing is the probability that the draw clears 70%.

Two counts explain a low projection. Unseen questions are the ones the queue has
not reached yet. Rusty ones have been studied but are predicted to fall below the
90% recall the scheduler targets by test day, which is what the review queue is
there to fix. Without an exam date the projection is for taking the test today.

The projection assumes the bank is representative of the real test. It now
covers both national manuals and NC pesticide law end to end, but the real
exams are written from North Carolina's own manuals, which no free source
reproduces. Treat it as a direction, not a score report.

## Layout

```
index.html               app shell
css/engine.css           structural styling, synced from the trainer-engine repo
css/app.css              this app's color tokens (light/dark follows the device; Settings can force either)
js/problems.js           calculation drills: draws a template's numbers and builds the question
js/calculator.js         the on-screen calculator a drill offers (four functions, one memory)
js/fsrs.js               FSRS-6 scheduler
js/readiness.js          projected score and pass odds per exam
js/storage.js            localStorage persistence, export/import
js/license.js            NC license lookup (public NCDA&CS search), caching the licenses you keep
js/app.js                UI and session logic
data/questions.js        question bank (1392 questions, tagged by section and source page)
data/problems.js         36 calculation drills, as methods with the numbers left open
data/manual-pages.js     printed page numbers to PDF page numbers, for the citation links
data/aerial-pages.js     the same map for the aerial manual
data/law-pages.js        the same map for the NC Pesticide Law
data/rules-pages.js      the same map for the NC pesticide rules (identity: that PDF prints no page numbers)
data/ncsu-anchors.js     the same map for AG-714, which is a web page: heading to anchor, written by hand
data/recert-credits.js   what each recertification category owes per cycle (AG-714 table 2), and the solver for it
data/exam-config.js      what exam this is: tests, pass mark, manual links, exam-specific prose
tools/                   regenerates those maps from local copies of the PDFs, and the icons
sw.js                    service worker (offline cache, only active on the hosted site)
manifest.webmanifest     PWA manifest, lets the app be installed to a home screen
icons/                   app icons (icon.svg is the source, PNGs rendered from it)
tests/validate-bank.js   question bank schema checks (node)
tests/problems-test.js   calculation drills, swept over thousands of seeds (node)
tests/fsrs-test.js       FSRS scheduler property tests (node)
tests/readiness-test.js  readiness projection tests, incl. a Monte Carlo check (node)
tests/test.html          end-to-end tests driven through the real UI
tests/run-browser.sh     Playwright runner for the browser suite (local + CI)
docs/question-authoring.md  the recipe the question bank is written with
docs/math-drills.md      design for the calculation drills, and what is left to build
docs/screenshots/        README images and the script that regenerates them
```

On the hosted site the app is an installable PWA: a service worker caches
everything on first load, so it keeps working offline, and "Add to home screen"
installs it like an app. Each release stamps its version into the service
worker, so open tabs notice the new deploy, show a "new version is ready"
toast, and switch over cleanly on reload; otherwise the release is picked up
on the next load.

## Building a trainer for another exam

The engine under `js/` knows nothing about pesticides, and the test suites
derive their assertions from the config and the bank, so a trainer for a
different manual-based exam is a matter of replacing data and identity files;
this repository is itself that recipe applied to
[nc-cdl-trainer](https://github.com/ullbergm/nc-cdl-trainer).
Create a new repository from this one and touch:

- `data/questions.js`: the new question bank, tagged by section and manual page;
  [docs/question-authoring.md](docs/question-authoring.md) is the recipe, written
  to be followed by a person or handed to a language model per section
- `data/exam-config.js`: the tests and exams, pass mark, manual links, storage
  keys, and every piece of prose that names the exam
- `data/problems.js`: the calculation drills, if the exam has arithmetic in it;
  [docs/math-drills.md](docs/math-drills.md) is the design. An exam with none
  drops the file, and `js/problems.js` then adds nothing to the bank
- `data/manual-pages.js`: regenerate with `node tools/gen-manual-pages.js`; the
  footer-label parsing in that script is written for this manual's page
  numbering, so adjust it to the new manual's
- `css/app.css`: the token blocks set all colors and the progress-bar
  texture; everything structural lives in `css/engine.css`, which is synced
  from the [trainer-engine](https://github.com/ullbergm/trainer-engine) repo
- `index.html`: title, meta description, canonical URL, brand text, favicon,
  theme color
- `manifest.webmanifest`, `icons/`, `CNAME`: PWA identity and hosting; redraw
  `icons/icon.svg` and rerun `tools/gen-icons.sh` for the PNGs
- `package.json`: name and description
- `.github/ISSUE_TEMPLATE/question-correction.yml`: names the manual in its
  field description
- `docs/screenshots/seed.js`: the demo scenario behind the README screenshots
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`: name the repository, the live
  site, and the release artifact

The GitHub workflows and the service worker derive their names from the
repository and need no edits. The release tarball is named after the repo, so
`SECURITY.md`'s verification example follows it.

One engine assumption to keep in mind: every question offers exactly four
choices. Manual citations are optional at every level: a question may cite a
page of any manual in the config's `manuals` map, a manual without a public
URL renders its citations as plain text instead of PDF links, and an exam
with nothing citable leaves the map empty and the `page` fields off.

## Releases and deployment

Two workflows in `.github/workflows/`:

- CI (`ci.yml`) validates the question bank and runs the browser test suite on every
  push to `main` and every pull request.
- Release (`release.yml`) uses [release-please](https://github.com/googleapis/release-please)
  to maintain a release PR from [Conventional Commit](https://www.conventionalcommits.org/)
  messages. Merging that PR tags a version, publishes a GitHub release with a
  generated changelog, and deploys to GitHub Pages. Ordinary pushes to `main` do not
  touch the live site. The deploy job re-runs the tests before publishing.

To run the checks locally:

```
npm install          # one time, dev tooling only (the app itself has no dependencies)
npm run lint
npm test             # question bank validation, FSRS scheduler, readiness projection,
                     # recertification credit solver and the saved-license cache
npm run test:browser # end-to-end suite via Playwright (chromium+firefox locally; CI adds webkit)
```

Every line should say `PASS`. Opening `tests/test.html` in a normal browser also
works, with the results printed at the bottom of the page. The test page clears the
app's localStorage for its origin, so do not run it in the browser profile where you
keep real study progress.

## Accuracy

The questions were authored from each source's own text, section by section. Accuracy is
not guaranteed. Each question carries where it came from and links there, so
verify anything important against the source. Manual questions cite a printed page (like
`14`); law and rule questions cite a section (like `§ 143-452(a)` or `.0503`) and the link
opens the PDF at the page that section is printed on; questions from AG-714 cite the heading
they were written from (like `Reciprocity`) and the link opens that heading. The
actual exam questions are not publicly available, and no claim is made that these
questions match or resemble them. This is a study aid for the material, not
a copy of the test. If a question reads wrong, check the citation and edit
`data/questions.js`, which is a plain JSON array.

**Law changes.** The statute and rules are current as of the copies the bank was written
from; NC law is amended from time to time, and a question can go stale in a way a manual
question cannot. The citation is the check: if a rule has changed, the linked section will
say so. Fees and deadlines are the parts most likely to move. AG-714 goes stale the same
way and faster, since it describes the system rather than fixing it: the copy the bank was
written from is the November 6, 2025 revision. `data/recert-credits.js` is written from that
same revision and is the one place the app states a requirement in its own voice rather than
quoting a source, so recheck its hours against Table 2 whenever AG-714 is revised.

None of the four source PDFs is included in this repository. The two manuals are published
by the NASDA Research Foundation and hosted by EPA; download them from the EPA links above.
NC pesticide law comes from the two sources NCDA&CS itself links on its
[rules and statutes page](https://www.ncagr.gov/divisions/structural-pest-control-and-pesticides/rules-and-statutes):
the [statute](https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByArticle/Chapter_143/Article_52.pdf)
from the General Assembly and the
[rules](http://reports.oah.state.nc.us/ncac/title%2002%20-%20agriculture%20and%20consumer%20services/chapter%2009%20-%20food%20and%20drug%20protection/subchapter%20l/subchapter%20l%20rules.pdf)
from the Office of Administrative Hearings, which serves them over plain http.
The fifth source is not a PDF at all: AG-714 is a web page, read where it is published.

The citation links point into those hosted PDFs with a `#page=` fragment, which counts
physical pages rather than the page numbers printed in the footers, so a page map
translates between the two: `data/manual-pages.js` for the core manual,
`data/aerial-pages.js` for the aerial one, `data/law-pages.js` for the statute, and
`data/rules-pages.js` for the rules. The manual maps are built from the 2014 editions;
if a new edition or a revised rule set is published, download it and re-run the generator
(needs `pdftotext`) so the links keep landing on the right pages:

```sh
node tools/gen-manual-pages.js                       # core manual
node tools/gen-manual-pages.js aerial-applicator-manual.pdf \
  --out data/aerial-pages.js --var AERIAL_PAGES      # aerial manual
node tools/gen-manual-pages.js nc-pesticide-law-article-52.pdf \
  --out data/law-pages.js --var LAW_PAGES            # NC Pesticide Law
node tools/gen-manual-pages.js nc-pesticide-rules-09l.pdf \
  --out data/rules-pages.js --var RULES_PAGES --identity  # NC pesticide rules
```

The rules PDF prints no page numbers at all, so `--identity` writes a 1:1 map
whose only job is to record how far the document runs; the page a citation
names there is the physical page it is on.

`data/ncsu-anchors.js` is the same idea for a source that has no pages either:
AG-714 is a web page, so its map is heading to the anchor the Extension
publishing system puts on that heading, and its manual entry in
`data/exam-config.js` sets `web: true`, which is what makes a citation read
`NC State AG-714 Reciprocity` and link to `#section_heading_21033` rather than
to `#page=`. There is no generator for it: the anchors are database ids with
nothing local to derive them from, so the file is written by hand and should be
rechecked whenever the publication is revised. A renamed or reordered heading
still links, just to the wrong part of the page.

## License

[MIT](LICENSE)
