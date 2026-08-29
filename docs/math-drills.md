# Calibration and dosage drills

The design for the one kind of exam question a fixed bank cannot teach: the
ones with numbers in them.

All of it is built: `js/problems.js`, `data/problems.js`,
`tests/problems-test.js`, 36 templates — 28 covering every calculation the two
national manuals teach, plus 8 from the Aquatic category manual's dosage and
calibration chapter — the 29 static calculations the first 28 replaced
retired, the named-slip feedback, and the on-screen calculator the exam site
allows. See
[Phasing](#phasing) at the end for what happened in which order and what
changed along the way.

## Why a fixed question is not enough

The bank already has about fifteen worked calculations, most of them in the
core manual's appendix C and the aerial manual's chapter 5:

> Your equipment is calibrated at 40 gallons per acre and the label calls for
> 2.5 pounds of formulation per 100 gallons of water. You have 1 acre to
> treat. How much formulation belongs in that partial tank load?
> — `s12-007`, Core Manual p. 190

Answered three times, that card stops testing the method. The scheduler is
doing exactly what it should — the card is easy now — but what got easy is
recalling *1 pound, or 16 ounces*, not converting a partial load. The real exam
draws the same method with different numbers, and a nonprogrammable calculator
is allowed at the exam site, so the arithmetic itself is fair game.

Every other rule in [question-authoring.md](question-authoring.md) points the
same way. "One fact per question, one question per fact": with a calculation,
the fact is the method, and shipping six variants of `s12-007` would be six
cards for one fact, each drilling the others by accident and each inflating the
readiness projection.

## The model: the template is the card

One template, one id, one FSRS card, **new numbers every time it comes up**.

That keeps the arithmetic honest and it keeps everything else unchanged.
`js/readiness.js` treats each question as one trial whose recall probability
comes from the card's memory state; a template is one trial in exactly that
sense, so the projection needs no special case. Export, import, and the review
log are keyed by id, so they need none either.

The alternative — pre-generating N variants into `data/questions.js` — needs no
engine work at all, and should still be rejected. It multiplies cards without
multiplying facts, which is the failure mode the authoring rules exist to
prevent.

## Where the numbers come from

`data/problems.js`, parallel to `data/questions.js`. It is the one data file
that is code rather than JSON, because a calculation is code:

```js
{
  id: 'm12-002',
  section: 12, sectionLabel: 'app. C',
  sectionName: 'Appendix C: Conversions and Calculations',
  page: '191',                       // cites the page that teaches the method
  name: 'Concentrate for a full tank at a per-acre rate',
  // Ranges the numbers are drawn from, in the units the label uses.
  vary: { tank: [100, 600, 50], gpa: [10, 40, 5], rate: [0.5, 4, 0.5] },
  ask: (v, n) => `Your sprayer is calibrated to apply ${n(v.gpa, 'gallons')}
    per acre, its tank holds ${n(v.tank, 'gallons')}, and the label rate is
    ${n(v.rate, 'quarts')} per acre. How much concentrate should one full
    tank receive?`,
  solve: v => v.tank / v.gpa * v.rate,
  unit: 'quarts',
  places: 1,
  band: [1, 300],                    // a draw outside this is thrown away
  // The ways this method is actually got wrong, each named. Three of them
  // become the three distractors, and the name is what the reader is told
  // when they pick one.
  slips: [
    { why: 'divided by the label rate instead of multiplying by it',
      value: v => v.tank / v.gpa / v.rate },
    { why: "used the tank's gallons as the acres it covers",
      value: v => v.tank * v.rate },
    // ... five more, some landing above the answer and some below
  ],
  teach: (v, ans, n) => `A tankful covers the gallons it holds divided by the
    gallons the sprayer puts out per acre: ${n(v.tank)} / ${n(v.gpa)} =
    ${n(v.tank / v.gpa)} acres. Multiply that by the label rate: ...`,
  fallback: { tank: 400, gpa: 20, rate: 1.5 },
}
```

`vary` gives `[min, max, step]` so the drawn numbers stay the kind a label
prints — 2.5 quarts, not 2.4713. `n` formats a number, and `n(x, 'gallons')`
formats it with its unit, singular at exactly 1.

### Distractors are named mistakes, not noise

This is the part that decides whether the feature is any good. Three random
numbers around the answer make a guessable question and teach nothing. Three
*wrong methods* make a question that diagnoses:

- unit slip — ounces for pounds, per 1,000 sq ft for per acre, quarts for
  gallons
- inverted ratio — divided where you multiply
- wrong constant — 16 ounces to the gallon instead of 128, a forgotten 43,560
- a step skipped — active ingredient never converted to formulation, speed
  never converted to miles per minute
- the decimal in the wrong place

Because each wrong choice is a named slip, a wrong answer says *what you did*,
which no static distractor in the bank did before. A built question carries
`whyWrong[]` alongside `explanation`, parallel to `choices` and `null` at the
correct one, and the feedback screen shows the entry for the choice actually
picked, ahead of the explanation:

> **Incorrect.** *You left the 100-gallon divisor out.* For a partial load the
> gallons figure is the water you will actually put in, not the tank's
> capacity: 40 x 1 = 40 gallons...

The field is generic, not a drill feature: any written question may carry
`whyWrong[]` and the bank validator checks its shape. Each entry completes the
sentence "You ___", so it is a verb phrase in the past tense — "left the
100-gallon divisor out", not "The divisor was omitted." — which is what keeps
the diagnosis reading as one sentence whatever wrote it.

A template wants more slips than the three it needs. The three are picked per
draw from the pool, which is what keeps the same wrong answers from appearing
beside the same method every time, and is also how the rank check below is
satisfied.

## Making a generated item safe

Draw, compute, then check before showing. Reject and redraw if:

- the four values are not distinct once rounded to `places`
- the correct answer is negative, zero, or outside the template's `band`
- a slip happens to produce the correct value for these particular numbers
  (it will: `x / v.rate` and `x * v.rate` coincide when `rate` is 1)

A slip more than fifty times the answer, or less than a fiftieth of it, is
dropped rather than redrawn. A named mistake can be out by a conversion factor
and still be what someone would write down — 43.5, 16, a decimal place — but
past that it is not a choice anyone weighs, and offering it turns a four-choice
question into a three-choice one. A method built on a divisor raises that
limit with `spread`: where the whole question is the 100 in "per 100 gallons",
or the 128 fluid ounces in a gallon, leaving the divisor out is *the* mistake
worth showing and it lands exactly a hundred-fold away.

Variables are drawn independently, which is right for a rate and an acreage
that have nothing to do with each other and wrong where the numbers have to
stand in some relation — the outer distance of a swath pattern being the outer
one. A template says so with `valid`, and a draw that fails it is thrown away
like any other.

Cap the redraws — twenty, then try again with a decimal place more, since most
rejections are values that collide once rounded, and finally fall back to a
recorded set of numbers so a template can never fail to render. The fallback
firing is a bug in the template's ranges, so it warns, and the tests assert it
never fires.

### Which three slips

The rank check below says the correct answer must not settle at one place in
the sorted order. Left alone it does: for most methods the natural mistakes all
overshoot, so the correct answer is the smallest of the four nearly every time
and the drill is beaten by picking the smallest.

So the rank is drawn first, uniformly from 0..3, and the generator takes the
first combination of three usable slips that puts the answer there. When the
drawn numbers make that rank unreachable — no three slips land below the answer
— the first usable combination stands. Every distractor is still a named
mistake; what is chosen is which mistakes to show.

### Determinism

Numbers come from a seeded PRNG (mulberry32, five lines, no dependency), never
`Math.random()`. The seed is drawn when the item is queued and lives in the
session object, which is already mirrored to `sessionStorage`. That gives, for
free:

- **Undo** re-asks the same numbers rather than a new problem
- a **mock exam review screen** shows what was actually asked
- **tests** that can sweep seed 0..9999 and assert properties

Card state in `localStorage` does not store the seed. A card that comes due
tomorrow should be a fresh problem.

## Fitting into the app

Templates should not be a fifth mode. A separate "Math" tab gets practised by
people who already like arithmetic; the point is that a calibration problem
turns up in the ordinary Study queue, scheduled by the same FSRS, counted in
the same readiness projection.

There is a `#drill` route all the same — every drill the selected exams ask
for, in one pass — because wanting to drill the arithmetic deliberately is a
real thing to want the night before an exam, and because it is how a new
template gets looked at. It is a link and not a nav tab, which is the whole
difference: nothing puts it in front of a reader who should be studying the
queue. Like the misses drill it does not schedule, so a pass through it cannot
pull a card forward or push it back.

The engine makes this cheap. Every list operation in `js/app.js` — section
counts, Browse, Stats, exam pools, the Settings picker — reads `QUESTION_BANK`
as a plain list, and there is exactly one lookup by id:

```js
const BY_ID = {};
QUESTION_BANK.forEach(q => { BY_ID[q.id] = q; });   // js/app.js:119
```

So:

1. `js/problems.js` materializes each template into an ordinary question object
   — `{id, section, sectionName, manual, page, question, choices, answer,
   explanation}` — and appends them to the bank at boot. Nothing downstream can
   tell the difference.
2. The two places that are about to *show* a card (`renderQuestion`,
   `renderExamQuestion`) call `drawFor(id)` first, which draws a seed into the
   session on first sight and regenerates that object in place. One line each.
3. Browse rerolls on render too, so the example shown is fresh.

Step 2 covers the mock exam as well as Study, rather than leaving it for later:
a mock exam grades by comparing the picked index against the object it is
holding, so an exam that showed one draw and graded against another would mark
right answers wrong. A reload mid-exam does exactly that if the seed is not in
the session.

`data/exam-config.js` needs nothing structural: a template carries `section`
and `manual` like any question, so it joins whichever exams already draw on
that section. It does count them, though — see the counting note below.

### The calculator

North Carolina allows a nonprogrammable calculator at the exam site, which is
the premise the whole feature rests on: if the arithmetic were meant to be done
in your head, drilling it with fresh numbers would be cruelty rather than
practice. So a drill offers one, in `js/calculator.js` — four functions, a sign
key, a backspace and a single memory, on immediate execution like the handheld
it stands in for. Nothing stores a formula, because the exam room would not
allow a calculator that did.

Three details that are not obvious:

- **Only a drill gets one.** Offering a calculator beside "what does the signal
  word DANGER mean" is noise. The predicate is `q.drill`, one line in
  `js/app.js`, if that ever wants widening.
- **The keyboard is contested.** The quiz screen binds 1-4 to the answers, so a
  digit may only mean a digit while the focus is inside the keypad; the
  shortcut handler asks `Calculator.owns(target)` and stands aside. Otherwise
  typing 3 into the calculator would answer the question.
- **Every card starts cleared**, memory and all, the way picking a calculator
  up off the desk does. Whether it starts *open* is remembered in settings,
  since opening it is a preference rather than a per-card choice.

## Families worth covering

Roughly in the order the manuals teach them. Each is one or a few templates,
not one per number.

| Family | Templates | Source |
| --- | --- | --- |
| Product for a job: rate per acre x acres, in label units | 3 | Core app. C, p. 191-192 |
| Dilution at a rate per 100 gallons: full tanks and partial loads | 2 | Core app. C, p. 190 |
| Spray volume for a partial job | 1 | Core app. C, p. 191 |
| Active ingredient to formulation, dry and liquid | 2 | Core app. C, p. 191 |
| Rates per 1,000 square feet, up to the acre and down from it | 2 | Core app. C, p. 192 |
| Area: rectangles, triangles, circles to acres | 3 | Core ch. 11, p. 164 |
| Scaling a calibration test to the job, and product per gallon | 2 | Core ch. 11, p. 165 |
| Aerial boom output: timed catch, timed runs, gallons per mile | 3 | Aerial ch. 5, p. 67-68 |
| Aerial: airspeed, swath, acres per minute, gallons per acre | 3 | Aerial ch. 5, p. 69-70 |
| Aerial: what one tankful covers, and what goes into it | 2 | Aerial ch. 5, p. 70 |
| Aerial area: rectangles, triangles, circles | 3 | Aerial ch. 5, p. 71-73 |
| Aerial granules: rate from collection pans, effective swath | 2 | Aerial ch. 5, p. 76-77 |

Twenty-eight templates, and the 29 static calculations they replace are
retired: eleven from appendix C, four from chapter 11, fourteen from the aerial
chapter 5 sidebars. Leaving them alongside would make the template and the old
fixed question two cards for one method, which is the thing the authoring rules
exist to prevent. What stays in the written bank is appendix C's conversion
table — square miles to acres, parts per million to grams per liter, Fahrenheit
to Celsius — because those ask a constant rather than a method, and a constant
is recall.

The area family appears twice on purpose. Both manuals teach it, and Aerial
Methods draws on none of the core manual's chapters, so an aerial applicator
who never studies Core would otherwise never be asked to size a field.

### What the free manuals do not teach

The two calibration families this plan first listed under core chapter 11 — the
1/128-acre method, where the ounces collected from one nozzle over 340 square
feet *are* the gallons per acre, and the 5940 constant relating speed, nozzle
flow and spacing — are not in the national core manual. It says the
category-specific manual will explain how to calibrate your equipment, and
North Carolina's category manuals are sold in print, so there is nothing to
cite and no template. What chapter 11 does teach, and what those two families
became, is sizing the area and scaling a calibration test to the job.

## Tests

`tests/problems-test.js`, run by `npm test`. For every template, over four
thousand seeds:

- exactly four choices, all distinct after rounding
- the marked answer equals `solve()` computed independently of the choice
  builder
- the answer is inside the template's declared band, and its unit is the
  declared unit
- no slip ever equals the correct value, and every distractor names a slip the
  template declares
- nothing renders as `undefined` or `NaN`
- the same seed gives the same problem, and the fallback never fires

Plus the template's own fields before any draw: the section it claims exists
and is named the same way the written questions in it name it, its page
resolves in the manual's page map, no two slips share a name, and the recorded
fallback numbers do produce a usable problem.

And the numeric analogue of the answer-length rule the bank validator already
prints. If the correct answer is systematically the largest of the four, or
always the second smallest, the drill is gameable without doing the arithmetic:

- the correct answer's **rank** among the four sorted values is near-uniform
  across seeds — roughly 25% in each position, warn past 35%, fail past 40%

That check is the reason a template needs slips that land on both sides of the
answer rather than always "the answer times something bigger than one", and the
reason the generator draws the rank it wants before choosing which three slips
to show.

The app-level half is in `tests/test.html`, driven through the UI: a drill is
scheduled like any other card, Undo re-asks the problem that was on screen, and
a missed drill comes back as a new one.

## Phasing

1. **Done.** `js/problems.js` with the PRNG, the draw-and-validate loop, and
   the materialize/reroll pair. One family — product for a job — as three
   templates. Tests. This proves the shape end to end and is the point to stop
   and look at whether the generated questions actually read like exam
   questions. Browse and the mock exam came along with it rather than waiting
   for phase 2: rerolling is one line in each, and the exam cannot be left out
   without a reload mid-exam grading against numbers it never showed.
2. **Done.** The remaining families, 25 more templates, and the static
   calculations retired family by family. Two engine additions came out of the
   writing: `spread`, because a method built on a divisor needs the mistake of
   leaving it out, and `valid`, because independently drawn numbers can
   contradict each other. The 1/128-acre and 5940 families turned out to be
   unwritable from the free manuals; see above for what replaced them.
3. **Done.** `whyWrong[]` in the engine and the named-slip feedback, shown on
   the feedback screen and in the mock exam review for the choice actually
   picked. It landed as a generic field with validator support rather than a
   drill feature, which is what waiting for real templates was for: the "You
   ___" phrasing is a convention worth fixing once, and it is fixed by the
   validator now. The on-screen calculator came with it, for the reason in
   [The calculator](#the-calculator) above.

## Open questions

- **Counting.** *Settled.* The question count in the README and the badge is
  validated against the bank length, and one template is unboundedly many
  questions rather than one, so the two are counted separately: "1104 questions
  and 28 calculation drills" in the README, on the home screen, and in About.
  `tests/problems-test.js` holds the README's drill count to the number of
  templates the way the bank validator holds its question count to the bank.
- **Which exams.** *Settled by placement.* Appendix C and chapter 11 put
  fifteen drills in Core and Private, which is where dosage and calibration
  arithmetic is asked, and the aerial manual's chapter 5 puts thirteen in
  Aerial Methods. The Pesticide Dealer exam draws only on NC law, the rules,
  and AG-714, so it gets none, which is right: a dealer sells rather than
  mixes.
- **Rounding conventions.** *Settled by construction.* A template rounds only
  at the end, to its declared `places`, and `teach` is handed the rounded
  answer so the figure it works through is the one the reader picked. Where the
  manual's own worked example rounds an intermediate (the aerial sidebar prints
  0.833 miles per minute and then 11.25 gallons per mile), the drill prints the
  intermediate at the precision it computes with, which can differ from the
  book's by a digit in the last place.
- **Free entry instead of four choices.** Tempting, and it is how the real
  work goes. It would break the engine's one hard assumption (every question
  offers exactly four choices) and it drags in answer-tolerance questions that
  multiple choice sidesteps. Not for the first version.
