/* Calculation drill templates: the questions with numbers in them, written as
   methods rather than as worked examples. js/problems.js draws fresh numbers
   for one of these every time its card comes up, so the card tests the method
   instead of the answer it had last time. docs/math-drills.md is the design.

   This is the one data file that is code rather than JSON, because a
   calculation is code. A template is one card, one id, one FSRS card, and it
   carries the same `section`, `sectionName`, `sectionLabel`, `manual` and
   `page` a written question carries, so it joins whichever exams already draw
   on that section and cites the page that teaches the method. Ids are
   `m<section>-NNN`, the `m` marking a drill the way `s` marks a core-manual
   question.

   The fields a written question does not have:

   - `vary`   what to draw and from where, as [min, max, step] per variable.
              The step is what keeps a drawn number the kind a label prints:
              2.5 pints per acre, not 2.4713.
   - `solve`  the method, as the only place it is written down. The tests
              recompute the correct answer from this and compare it against
              the choice the generator marked correct.
   - `unit`   what the answer is measured in, plural; a value of exactly 1
              renders singular.
   - `places` decimal places the four choices are rounded to.
   - `band`   [min, max] the correct answer must land in. A draw outside it is
              thrown away and redrawn, which is how ranges that can produce a
              silly job size are caught here rather than by the reader.
   - `slips`  the ways this method is actually got wrong, each named. Three of
              them become the three distractors, so every wrong choice is a
              mistake with a name rather than a number near the answer. The
              generator picks which three, aiming to keep the correct answer's
              rank among the four values from settling anywhere (see
              js/problems.js), so a pool wants mistakes that land above the
              answer and mistakes that land below it.
   - `fallback` numbers to fall back on if a draw somehow never validates, so
              a template can never fail to render. It firing is a bug in
              `vary`, and both the engine and the tests say so.
   - `valid`   optional: a draw the template itself rejects. Variables are
              drawn independently, so a method whose numbers have to stand in
              some relation to each other says so here and the draw is thrown
              away rather than asked.
   - `spread`  optional: how far from the answer a distractor may land, 50 by
              default. A method built on a divisor — per 100 gallons, 128 fluid
              ounces to the gallon, a percent active ingredient — raises it,
              because leaving that divisor out is the mistake the question is
              about and it lands exactly a hundred-fold away.

   `ask` and `teach` receive the drawn variables and a number formatter `n`:
   `n(x)` prints a number, `n(x, 'pounds')` prints it with its unit and
   singularizes at exactly 1. `teach` also receives the rounded answer, so the
   worked figure it prints is the one the reader picked.

   Where a drill lives follows the manual that teaches the method, exactly as a
   written question's does, and that is also what decides the exams it joins:
   the core manual's chapters go to Core and Private, the aerial manual's to
   Aerial Methods. The three sections below are spread into the templates that
   belong to them, since a drill has no more say over its section than any
   question in the same chapter does. */
const APPENDIX_C = {
  section: 12,
  sectionName: 'Appendix C: Conversions and Calculations',
  sectionLabel: 'app. C',
};
const CORE_CH11 = {
  section: 11,
  sectionName: 'Pesticide Application Procedures',
};
const AERIAL_CH5 = {
  manual: 'aerial',
  section: 5,
  sectionName: 'Calibrating Aerial Application Equipment',
};

const PROBLEM_TEMPLATES = [
  {
    id: 'm12-001',
    ...APPENDIX_C,
    page: '191',
    name: 'Concentrate for the acres to be treated',
    // Acres to be treated x rate per acre, with the label written in pints
    // and the answer wanted in gallons: the manual's partial-load formula
    // plus the conversion its own table gives on the facing page.
    vary: { pints: [1, 8, 0.5], acres: [2, 40, 2] },
    ask: (v, n) => `The label for an emulsifiable concentrate sets a rate of
      ${n(v.pints, 'pints')} per acre, and you have ${n(v.acres, 'acres')} to
      treat. How much concentrate does the job take?`,
    solve: v => v.pints * v.acres / 8,
    unit: 'gallons',
    places: 2,
    band: [0.25, 60],
    slips: [
      { why: 'never converted the pints to gallons',
        value: v => v.pints * v.acres },
      { why: 'used 4 pints to the gallon',
        value: v => v.pints * v.acres / 4 },
      { why: 'used 16 pints to the gallon',
        value: v => v.pints * v.acres / 16 },
      { why: 'converted the label rate to gallons but never multiplied by the acres',
        value: v => v.pints / 8 },
      { why: 'divided by 8 a second time',
        value: v => v.pints * v.acres / 64 },
      { why: 'moved the decimal one place to the left',
        value: v => v.pints * v.acres / 80 },
      { why: 'moved the decimal one place to the right',
        value: v => v.pints * v.acres * 10 / 8 },
    ],
    teach: (v, ans, n) => `Work the job in the label's own units first, then
      convert: ${n(v.pints)} x ${n(v.acres)} = ${n(v.pints * v.acres)} pints.
      Eight pints make a gallon, so ${n(v.pints * v.acres)} / 8 =
      ${n(ans, 'gallons')}. The acres are what the rate is multiplied by, and 8
      is the only figure the conversion belongs to.`,
    fallback: { pints: 2, acres: 10 },
  },
  {
    id: 'm12-002',
    ...APPENDIX_C,
    page: '191',
    name: 'Concentrate for a full tank at a per-acre rate',
    // The manual's own full-tank pair: gallons in tank / gallons per acre =
    // acres per tankful, then acres per tankful x the label rate.
    vary: { tank: [100, 600, 50], gpa: [10, 40, 5], rate: [0.5, 4, 0.5] },
    ask: (v, n) => `Your sprayer is calibrated to apply ${n(v.gpa, 'gallons')}
      per acre, its tank holds ${n(v.tank, 'gallons')}, and the label rate is
      ${n(v.rate, 'quarts')} per acre. How much concentrate should one full
      tank receive?`,
    solve: v => v.tank / v.gpa * v.rate,
    unit: 'quarts',
    places: 1,
    band: [1, 300],
    slips: [
      { why: 'divided by the label rate instead of multiplying by it',
        value: v => v.tank / v.gpa / v.rate },
      { why: "used the tank's gallons as the acres it covers",
        value: v => v.tank * v.rate },
      { why: 'used the gallons per acre as the acres a tankful covers',
        value: v => v.gpa * v.rate },
      { why: 'used the per-100-gallon formula, which a per-acre rate does not call for',
        value: v => v.tank * v.rate / 100 },
      { why: 'divided by 4, as if the label rate were gallons per acre',
        value: v => v.tank / v.gpa * v.rate / 4 },
      { why: 'multiplied by 4, as if the tank were measured in quarts',
        value: v => v.tank / v.gpa * v.rate * 4 },
      { why: 'moved the decimal one place to the left',
        value: v => v.tank / v.gpa * v.rate / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.tank / v.gpa * v.rate * 10 },
    ],
    teach: (v, ans, n) => `A tankful covers the gallons it holds divided by the
      gallons the sprayer puts out per acre: ${n(v.tank)} / ${n(v.gpa)} =
      ${n(v.tank / v.gpa)} acres. Multiply that by the label rate:
      ${n(v.tank / v.gpa)} x ${n(v.rate)} = ${n(ans, 'quarts')}. The tank's
      gallons are carrier plus concentrate, never acres, and the
      per-100-gallon formula belongs to labels written per 100 gallons.`,
    fallback: { tank: 400, gpa: 20, rate: 1.5 },
  },
  {
    id: 'm12-003',
    ...APPENDIX_C,
    page: '192',
    name: 'Product for acres at a rate per 1,000 square feet',
    // The square-foot-versus-acre conversion: 43,560 / 1,000 = 43.5, the
    // factor that turns a rate per 1,000 square feet into a per-acre rate.
    vary: { oz: [1, 12, 0.5], acres: [0.5, 5, 0.5] },
    ask: (v, n) => `A label gives its rate as ${n(v.oz, 'ounces')} of product
      per 1,000 square feet, and the area you have measured is
      ${n(v.acres, 'acres')}. How much product does that area take?`,
    solve: v => v.oz * 43.5 * v.acres / 16,
    unit: 'pounds',
    places: 1,
    band: [1, 200],
    slips: [
      { why: 'never converted the per-1,000-square-foot rate to a per-acre rate',
        value: v => v.oz * v.acres / 16 },
      { why: 'used 435, the factor for 100 square feet, instead of 43.5',
        value: v => v.oz * 435 * v.acres / 16 },
      { why: 'never converted the ounces to pounds',
        value: v => v.oz * 43.5 * v.acres },
      { why: 'multiplied by 43.5 twice, once for the rate and once for the area',
        value: v => v.oz * 43.5 * 43.5 * v.acres / 16 },
      { why: 'converted the label rate but never multiplied by the acres',
        value: v => v.oz * 43.5 / 16 },
      { why: 'divided by 16 a second time',
        value: v => v.oz * 43.5 * v.acres / 256 },
      { why: 'moved the decimal one place to the left',
        value: v => v.oz * 43.5 * v.acres / 160 },
    ],
    teach: (v, ans, n) => `An acre is 43,560 square feet, which is 43.5 units of
      1,000 square feet, so a rate written per 1,000 square feet becomes a
      per-acre rate by multiplying by 43.5: ${n(v.oz)} x 43.5 =
      ${n(v.oz * 43.5)} ounces per acre. Then ${n(v.oz * 43.5)} x ${n(v.acres)}
      = ${n(v.oz * 43.5 * v.acres)} ounces for the job, and 16 ounces to the
      pound makes that ${n(ans, 'pounds')}.`,
    fallback: { oz: 4, acres: 2 },
  },
  {
    id: 'm12-004',
    ...APPENDIX_C,
    page: '190',
    name: 'Formulation for a full tank at a per-100-gallon rate',
    // Gallons in tank x pounds per 100 gallons / 100. The divisor is the
    // whole question, so the mistake of leaving it out is allowed to land a
    // hundred-fold away.
    vary: { tank: [100, 600, 50], rate: [0.5, 5, 0.5] },
    ask: (v, n) => `Your spray tank holds ${n(v.tank, 'gallons')} and the label
      calls for ${n(v.rate, 'pounds')} of wettable powder per 100 gallons of
      water. How much formulation should a full tank receive?`,
    solve: v => v.tank * v.rate / 100,
    unit: 'pounds',
    places: 2,
    band: [0.5, 40],
    spread: 150,
    slips: [
      { why: 'left the 100-gallon divisor out',
        value: v => v.tank * v.rate },
      { why: 'answered in ounces rather than the pounds the label uses',
        value: v => v.tank * v.rate * 16 / 100 },
      { why: 'divided by 16 as if the label rate were in ounces',
        value: v => v.tank * v.rate / 1600 },
      { why: 'divided by the label rate instead of multiplying by it',
        value: v => v.tank / v.rate / 100 },
      { why: 'used the label rate as the amount for the whole tank',
        value: v => v.rate },
      { why: 'moved the decimal one place to the left',
        value: v => v.tank * v.rate / 1000 },
      { why: 'moved the decimal one place to the right',
        value: v => v.tank * v.rate / 10 },
    ],
    teach: (v, ans, n) => `Multiply the gallons the tank holds by the pounds the
      label wants in 100 gallons, then divide by 100: ${n(v.tank)} x
      ${n(v.rate)} = ${n(v.tank * v.rate)}, and ${n(v.tank * v.rate)} / 100 =
      ${n(ans, 'pounds')}. The same formula covers soluble and wettable powders
      alike, and the 100 is what makes the label's rate a rate.`,
    fallback: { tank: 500, rate: 2 },
  },
  {
    id: 'm12-005',
    ...APPENDIX_C,
    page: '190',
    name: 'Formulation for a partial tank load at a per-100-gallon rate',
    // The same formula with the gallons you will actually put in, which is
    // the calibrated output times the acres rather than the tank's capacity.
    vary: { gpa: [15, 60, 5], rate: [0.5, 4, 0.5], acres: [0.5, 4, 0.5] },
    ask: (v, n) => `Your equipment is calibrated at ${n(v.gpa, 'gallons')} per
      acre and the label calls for ${n(v.rate, 'pounds')} of formulation per
      100 gallons of water. You have ${n(v.acres, 'acres')} to treat. How much
      formulation belongs in that partial tank load?`,
    solve: v => v.gpa * v.acres * v.rate / 100,
    unit: 'pounds',
    places: 2,
    band: [0.3, 10],
    spread: 150,
    slips: [
      { why: 'left the 100-gallon divisor out',
        value: v => v.gpa * v.acres * v.rate },
      { why: 'read the label rate as pounds per acre',
        value: v => v.rate * v.acres },
      { why: 'answered in ounces rather than the pounds the label uses',
        value: v => v.gpa * v.acres * v.rate * 16 / 100 },
      { why: 'divided by 16 as if the label rate were in ounces',
        value: v => v.gpa * v.acres * v.rate / 1600 },
      { why: 'never multiplied by the acres to be treated',
        value: v => v.gpa * v.rate / 100 },
      { why: 'used the acres where the gallons of water belong',
        value: v => v.acres * v.rate / 100 },
      { why: 'moved the decimal one place to the left',
        value: v => v.gpa * v.acres * v.rate / 1000 },
      { why: 'moved the decimal one place to the right',
        value: v => v.gpa * v.acres * v.rate / 10 },
    ],
    teach: (v, ans, n) => `For a partial load the gallons figure is the water
      you will actually put in, not the tank's capacity: ${n(v.gpa)} x
      ${n(v.acres)} = ${n(v.gpa * v.acres)} gallons. Then
      ${n(v.gpa * v.acres)} x ${n(v.rate)} / 100 = ${n(ans, 'pounds')}. The
      label rate is per 100 gallons of water, never per acre.`,
    fallback: { gpa: 60, rate: 2, acres: 1 },
  },
  {
    id: 'm12-006',
    ...APPENDIX_C,
    page: '191',
    name: 'Finished spray needed for a partial job',
    // Gallons per acre x acres to be treated: the other half of a partial
    // load, which is how much water goes in the tank in the first place.
    vary: { gpa: [10, 40, 5], acres: [2, 30, 2] },
    ask: (v, n) => `You plan to treat ${n(v.acres, 'acres')} with equipment that
      is pumping ${n(v.gpa, 'gallons')} per acre, and the job takes less than a
      full tank. How much finished spray do you need to mix?`,
    solve: v => v.gpa * v.acres,
    unit: 'gallons',
    places: 0,
    band: [20, 1200],
    spread: 150,
    slips: [
      { why: 'divided by 100 as if the label rate were written per 100 gallons',
        value: v => v.gpa * v.acres / 100 },
      { why: 'answered in quarts rather than gallons',
        value: v => v.gpa * v.acres * 4 },
      { why: 'divided by 4 as if the sprayer output were measured in quarts',
        value: v => v.gpa * v.acres / 4 },
      { why: 'answered in pints rather than gallons',
        value: v => v.gpa * v.acres * 8 },
      { why: 'divided by 8 as if the sprayer output were measured in pints',
        value: v => v.gpa * v.acres / 8 },
      { why: 'moved the decimal one place to the left',
        value: v => v.gpa * v.acres / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.gpa * v.acres * 10 },
    ],
    teach: (v, ans, n) => `The gallons a partial job needs is what the sprayer
      puts out per acre times the acres you are treating: ${n(v.gpa)} x
      ${n(v.acres)} = ${n(ans, 'gallons')}. The formulation to add is then
      figured from the acres treated, not from what the tank could have held.`,
    fallback: { gpa: 18, acres: 6 },
  },
  {
    id: 'm12-007',
    ...APPENDIX_C,
    page: '191',
    name: 'Active ingredient converted to a dry formulation',
    // Pounds of a.i. per acre x 100 / percent a.i. = pounds of formulation
    // per acre, for a dosage the label writes as active ingredient.
    vary: { ai: [0.5, 4, 0.25], pct: [25, 90, 5] },
    ask: (v, n) => `The recommendation is ${n(v.ai, 'pounds')} of active
      ingredient per acre and the product on hand is a ${n(v.pct)}% wettable
      powder. How much formulation does each acre require?`,
    solve: v => v.ai * 100 / v.pct,
    unit: 'pounds',
    places: 2,
    band: [0.5, 20],
    spread: 150,
    slips: [
      { why: 'multiplied by the percent instead of dividing by it',
        value: v => v.ai * v.pct / 100 },
      { why: 'used the active ingredient figure as the amount of formulation',
        value: v => v.ai },
      { why: 'wrote the percent as a decimal and still multiplied by 100',
        value: v => v.ai * 10000 / v.pct },
      { why: 'divided by the percent without multiplying by 100 first',
        value: v => v.ai / v.pct },
      { why: 'answered in ounces rather than pounds',
        value: v => v.ai * 1600 / v.pct },
      { why: 'moved the decimal one place to the left',
        value: v => v.ai * 10 / v.pct },
      { why: 'moved the decimal one place to the right',
        value: v => v.ai * 1000 / v.pct },
    ],
    teach: (v, ans, n) => `A dosage given as active ingredient has to be
      converted to formulation before anything is weighed out: pounds of a.i.
      per acre times 100, divided by the percent a.i. in the formulation. Here
      ${n(v.ai)} x 100 = ${n(v.ai * 100)}, and ${n(v.ai * 100)} / ${n(v.pct)} =
      ${n(ans, 'pounds')} of formulation per acre.`,
    fallback: { ai: 1.5, pct: 75 },
  },
  {
    id: 'm12-008',
    ...APPENDIX_C,
    page: '191',
    name: 'Active ingredient converted to a liquid concentrate',
    // Pounds of a.i. per acre / pounds of a.i. per gallon of concentrate.
    // The EC number is that second figure, which is the fact being tested.
    vary: { ai: [0.5, 4, 0.25], ec: [2, 8, 1] },
    ask: (v, n) => `A recommendation calls for ${n(v.ai, 'pounds')} of active
      ingredient per acre and you have purchased a ${n(v.ec)} EC. How much of
      that concentrate does each acre require?`,
    solve: v => v.ai / v.ec,
    unit: 'gallons',
    places: 3,
    band: [0.05, 3],
    slips: [
      { why: 'multiplied by the pounds per gallon instead of dividing by them',
        value: v => v.ai * v.ec },
      { why: 'answered in quarts rather than gallons',
        value: v => v.ai / v.ec * 4 },
      { why: 'divided by 4 as if the concentrate were measured in quarts',
        value: v => v.ai / v.ec / 4 },
      { why: 'answered in pints rather than gallons',
        value: v => v.ai / v.ec * 8 },
      { why: 'divided by 8 as if the concentrate were measured in pints',
        value: v => v.ai / v.ec / 8 },
      { why: 'moved the decimal one place to the left',
        value: v => v.ai / v.ec / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.ai / v.ec * 10 },
    ],
    teach: (v, ans, n) => `The label of a liquid formulation states the pounds
      of active ingredient in one gallon of concentrate, which is what the EC
      number is: a ${n(v.ec)} EC carries ${n(v.ec, 'pounds')} per gallon.
      Divide the a.i. needed per acre by that figure: ${n(v.ai)} / ${n(v.ec)} =
      ${n(ans, 'gallons')} of formulation per acre.`,
    fallback: { ai: 2, ec: 4 },
  },
  {
    id: 'm12-009',
    ...APPENDIX_C,
    page: '192',
    name: 'Formulation for a tank calibrated per 1,000 square feet',
    // Gallons per tank / gallons per 1,000 square feet = the number of
    // 1,000-square-foot sections a tankful covers; that times the label rate.
    vary: { tank: [50, 300, 25], gpk: [1, 5, 0.5], rate: [0.25, 2, 0.25] },
    ask: (v, n) => `Your equipment is calibrated at ${n(v.gpk, 'gallons')} of
      spray per 1,000 square feet, the tank holds ${n(v.tank, 'gallons')}, and
      the label calls for ${n(v.rate, 'pounds')} of formulation per 1,000
      square feet. How much formulation should a full tank receive?`,
    solve: v => v.tank / v.gpk * v.rate,
    unit: 'pounds',
    places: 2,
    band: [2, 400],
    slips: [
      { why: 'multiplied by the gallons per 1,000 square feet instead of dividing by them',
        value: v => v.tank * v.gpk * v.rate },
      { why: "used the tank's gallons as the number of 1,000-square-foot sections",
        value: v => v.tank * v.rate },
      { why: 'divided by the label rate instead of multiplying by it',
        value: v => v.tank / v.gpk / v.rate },
      { why: 'divided by 43.5 as well, as if the area had been measured in acres',
        value: v => v.tank / v.gpk * v.rate / 43.5 },
      { why: 'answered in ounces rather than pounds',
        value: v => v.tank / v.gpk * v.rate * 16 },
      { why: 'divided by 16 as if the label rate were in ounces',
        value: v => v.tank / v.gpk * v.rate / 16 },
      { why: 'moved the decimal one place to the left',
        value: v => v.tank / v.gpk * v.rate / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.tank / v.gpk * v.rate * 10 },
    ],
    teach: (v, ans, n) => `Divide the gallons in the tank by the gallons the
      equipment puts out per 1,000 square feet to get the sections a tankful
      covers: ${n(v.tank)} / ${n(v.gpk)} = ${n(v.tank / v.gpk)} sections. Then
      multiply by the rate per 1,000 square feet: ${n(v.tank / v.gpk)} x
      ${n(v.rate)} = ${n(ans, 'pounds')}.`,
    fallback: { tank: 100, gpk: 2, rate: 0.5 },
  },
  {
    id: 'm12-010',
    ...APPENDIX_C,
    page: '192',
    name: 'Per-acre rate brought down to 1,000 square feet',
    // Rate per acre / 43.5. The companion figure is 435 for 100 square feet,
    // and using it here is the mistake worth showing.
    vary: { rate: [2, 20, 1] },
    ask: (v, n) => `A label gives a rate of ${n(v.rate, 'pounds')} of product
      per acre, and you have calibrated your equipment in 1,000-square-foot
      sections. What is the equivalent rate per 1,000 square feet?`,
    solve: v => v.rate / 43.5,
    unit: 'pounds',
    places: 3,
    band: [0.04, 0.5],
    slips: [
      { why: 'used 435, which is the factor for 100 square feet',
        value: v => v.rate / 435 },
      { why: 'used 4.35, misplacing the decimal in the factor',
        value: v => v.rate / 4.35 },
      { why: 'left the rate as it was written, per acre',
        value: v => v.rate },
      { why: 'divided by 43.5 a second time',
        value: v => v.rate / 43.5 / 43.5 },
      { why: 'answered in ounces rather than pounds',
        value: v => v.rate * 16 / 43.5 },
      { why: 'divided by 16 as if the label rate were in ounces',
        value: v => v.rate / 43.5 / 16 },
    ],
    teach: (v, ans, n) => `An acre is 43,560 square feet, which is 43.5 units of
      1,000 square feet, so a per-acre rate comes down to a per-1,000-square-
      foot rate by dividing by 43.5: ${n(v.rate)} / 43.5 =
      ${n(ans, 'pounds')}. The companion figure is 435, which takes the same
      rate down to 100 square feet.`,
    fallback: { rate: 4.35 },
  },
  {
    id: 'm11-001',
    ...CORE_CH11,
    page: '164',
    name: 'Rectangular area in acres',
    // Length x width, then square feet to acres at 43,560. Every area drill
    // ends at that divisor, so the mistakes worth showing are the ones that
    // reach it with the wrong square feet rather than the ones that skip it,
    // which land four orders of magnitude away and fool nobody.
    vary: { len: [200, 2000, 20], wid: [40, 500, 10] },
    ask: (v, n) => `You are treating a rectangular area that measures
      ${n(v.len)} feet by ${n(v.wid)} feet. What is that area in acres?`,
    solve: v => v.len * v.wid / 43560,
    unit: 'acres',
    places: 2,
    band: [0.15, 30],
    slips: [
      { why: 'halved the area, as if the site were a triangle',
        value: v => v.len * v.wid / 2 / 43560 },
      { why: 'read the measurements as yards and multiplied each by 3',
        value: v => v.len * 3 * v.wid * 3 / 43560 },
      { why: 'turned the sides into yards before multiplying them',
        value: v => v.len / 3 * v.wid / 3 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => v.len * v.wid / 40000 },
      { why: 'added the two sides instead of multiplying them',
        value: v => (v.len + v.wid) / 43560 },
      { why: 'moved the decimal one place to the left',
        value: v => v.len * v.wid / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.len * v.wid / 4356 },
    ],
    teach: (v, ans, n) => `Area is length times width: ${n(v.len)} x ${n(v.wid)}
      = ${n(v.len * v.wid)} square feet. An acre is 43,560 square feet, so
      ${n(v.len * v.wid)} / 43,560 = ${n(ans, 'acres')}. Nothing else in the
      job — the rate, the tank, the spray volume — can be figured until the
      area is right.`,
    fallback: { len: 1320, wid: 120 },
  },
  {
    id: 'm11-002',
    ...CORE_CH11,
    page: '164',
    name: 'Triangular area in acres',
    // Base x height / 2, then 43,560. Forgetting the halving is the mistake
    // this shape exists to catch.
    vary: { base: [100, 900, 25], height: [50, 500, 25] },
    ask: (v, n) => `You are treating a triangular area with a base of
      ${n(v.base)} feet and a height of ${n(v.height)} feet. What is that area
      in acres?`,
    solve: v => v.base * v.height / 2 / 43560,
    unit: 'acres',
    places: 2,
    band: [0.05, 6],
    slips: [
      { why: 'never halved the base times the height',
        value: v => v.base * v.height / 43560 },
      { why: 'halved it a second time',
        value: v => v.base * v.height / 4 / 43560 },
      { why: 'read the measurements as yards and multiplied each by 3',
        value: v => v.base * 3 * v.height * 3 / 2 / 43560 },
      { why: 'turned the base and height into yards before multiplying them',
        value: v => v.base / 3 * v.height / 3 / 2 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => v.base * v.height / 2 / 40000 },
      { why: 'moved the decimal one place to the left',
        value: v => v.base * v.height / 2 / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.base * v.height / 2 / 4356 },
    ],
    teach: (v, ans, n) => `A triangle is half the rectangle around it: base
      times height, divided by 2. Here ${n(v.base)} x ${n(v.height)} =
      ${n(v.base * v.height)}, and ${n(v.base * v.height)} / 2 =
      ${n(v.base * v.height / 2)} square feet. Then
      ${n(v.base * v.height / 2)} / 43,560 = ${n(ans, 'acres')}.`,
    fallback: { base: 325, height: 150 },
  },
  {
    id: 'm11-003',
    ...CORE_CH11,
    page: '164',
    name: 'Circular area in acres',
    // 3.14 x radius squared, then 43,560. The radius is half the diameter,
    // and using the diameter instead is the classic four-fold error.
    vary: { diameter: [60, 600, 20] },
    ask: (v, n) => `You are treating a circular area ${n(v.diameter)} feet
      across. Using 3.14 for pi, what is that area in acres?`,
    solve: v => 3.14 * (v.diameter / 2) ** 2 / 43560,
    unit: 'acres',
    places: 2,
    band: [0.06, 7],
    slips: [
      { why: 'used the diameter where the radius belongs',
        value: v => 3.14 * v.diameter ** 2 / 43560 },
      { why: 'halved the diameter a second time',
        value: v => 3.14 * (v.diameter / 4) ** 2 / 43560 },
      { why: 'used 6.28, which is the circumference constant, in place of 3.14',
        value: v => 6.28 * (v.diameter / 2) ** 2 / 43560 },
      { why: 'halved the area, as if the site were a triangle',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 2 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 40000 },
      { why: 'moved the decimal one place to the left',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 4356 },
    ],
    teach: (v, ans, n) => `The radius is half the diameter, so
      ${n(v.diameter)} / 2 = ${n(v.diameter / 2)} feet. Area is 3.14 times the
      radius squared: 3.14 x ${n(v.diameter / 2)} x ${n(v.diameter / 2)} =
      ${n(3.14 * (v.diameter / 2) ** 2)} square feet, and dividing by 43,560
      gives ${n(ans, 'acres')}.`,
    fallback: { diameter: 90 },
  },
  {
    id: 'm11-004',
    ...CORE_CH11,
    page: '165',
    name: 'Spray volume for a job from a calibration test',
    // The test area and the application area are a proportion: whatever the
    // sprayer put out over the test acres, scaled to the acres to be treated.
    vary: { test: [4, 16, 1], area: [0.1, 0.5, 0.05], job: [5, 20, 5] },
    ask: (v, n) => `A calibration test showed your boom sprayer put out
      ${n(v.test, 'gallons')} of water over a ${n(v.area)}-acre test area. You
      have ${n(v.job, 'acres')} to treat. How much spray mixture does the job
      take?`,
    solve: v => v.test / v.area * v.job,
    unit: 'gallons',
    places: 0,
    band: [40, 1600],
    slips: [
      { why: 'divided by the acres to be treated instead of multiplying by them',
        value: v => v.test / v.area / v.job },
      { why: 'multiplied by the test area instead of dividing by it',
        value: v => v.test * v.area * v.job },
      { why: 'used the gallons from the test as gallons per acre',
        value: v => v.test * v.job },
      { why: 'divided by the test area a second time',
        value: v => v.test / v.area / v.area * v.job },
      { why: 'answered in quarts rather than gallons',
        value: v => v.test / v.area * v.job * 4 },
      { why: 'divided by 4 as if the test volume had been measured in quarts',
        value: v => v.test / v.area * v.job / 4 },
      { why: 'moved the decimal one place to the left',
        value: v => v.test / v.area * v.job / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.test / v.area * v.job * 10 },
    ],
    teach: (v, ans, n) => `Always scale from the calibration test:
      ${n(v.test)} gallons over ${n(v.area)} acre is
      ${n(v.test / v.area)} gallons per acre, and ${n(v.test / v.area)} x
      ${n(v.job)} = ${n(ans, 'gallons')} of spray mixture. Set up as a
      proportion it is the same arithmetic: gallons over test acres equals the
      answer over job acres.`,
    fallback: { test: 10, area: 0.25, job: 10 },
  },
  {
    id: 'm11-005',
    ...CORE_CH11,
    page: '165',
    name: 'Product for a mixture at a rate per gallon',
    // Gallons of mixture x ounces per gallon = ounces of product, then 128
    // fluid ounces to the gallon. The 128 is the fact being tested.
    vary: { mix: [100, 800, 50], oz: [1, 8, 0.5] },
    ask: (v, n) => `Your job needs ${n(v.mix, 'gallons')} of finished spray, and
      the label calls for ${n(v.oz, 'ounces')} of liquid product in each gallon
      of mixture. How much product does that take?`,
    solve: v => v.mix * v.oz / 128,
    unit: 'gallons',
    places: 2,
    band: [0.7, 60],
    spread: 150,
    slips: [
      { why: 'left the answer in ounces',
        value: v => v.mix * v.oz },
      { why: 'used 16 ounces to the gallon, which is the dry measure',
        value: v => v.mix * v.oz / 16 },
      { why: 'used 32 ounces to the gallon',
        value: v => v.mix * v.oz / 32 },
      { why: 'divided by 128 a second time',
        value: v => v.mix * v.oz / 16384 },
      { why: 'divided the spray volume by the label rate instead of multiplying by it',
        value: v => v.mix / v.oz / 128 },
      { why: 'divided by 4 as if the product were measured in quarts',
        value: v => v.mix * v.oz / 512 },
      { why: 'moved the decimal one place to the left',
        value: v => v.mix * v.oz / 1280 },
      { why: 'moved the decimal one place to the right',
        value: v => v.mix * v.oz / 12.8 },
    ],
    teach: (v, ans, n) => `Work in the label's units and convert at the end:
      ${n(v.mix)} x ${n(v.oz)} = ${n(v.mix * v.oz)} ounces of product. There
      are 128 fluid ounces in a gallon, so ${n(v.mix * v.oz)} / 128 =
      ${n(ans, 'gallons')}. The 16 ounces in a pound is dry weight and has no
      business in a liquid measure.`,
    fallback: { mix: 400, oz: 4 },
  },
  {
    id: 'm5-001',
    ...AERIAL_CH5,
    page: '67',
    name: 'Boom output from a timed catch',
    // Ounces caught x 60 / seconds = ounces per minute, then 128 fluid ounces
    // to the gallon. Sidebar 1, the helicopter method.
    vary: { oz: [200, 900, 25], sec: [15, 60, 5] },
    ask: (v, n) => `Liquid caught from all the nozzles on a helicopter boom
      totals ${n(v.oz, 'ounces')} in ${n(v.sec)} seconds. What is the boom's
      output?`,
    solve: v => v.oz * 60 / v.sec / 128,
    unit: 'gallons per minute',
    places: 3,
    band: [1.5, 30],
    spread: 150,
    slips: [
      { why: 'left the answer in ounces per minute',
        value: v => v.oz * 60 / v.sec },
      { why: 'used 16 ounces to the gallon, which is the dry measure',
        value: v => v.oz * 60 / v.sec / 16 },
      { why: 'used 32 ounces to the gallon',
        value: v => v.oz * 60 / v.sec / 32 },
      { why: 'treated the collection time as minutes rather than seconds',
        value: v => v.oz / v.sec / 128 },
      { why: 'divided by 128 a second time',
        value: v => v.oz * 60 / v.sec / 16384 },
      { why: 'moved the decimal one place to the left',
        value: v => v.oz * 6 / v.sec / 128 },
      { why: 'moved the decimal one place to the right',
        value: v => v.oz * 600 / v.sec / 128 },
    ],
    teach: (v, ans, n) => `Bring the catch up to a full minute first:
      ${n(v.oz)} x 60 / ${n(v.sec)} = ${n(v.oz * 60 / v.sec)} ounces per
      minute. Then convert at 128 fluid ounces to the gallon:
      ${n(v.oz * 60 / v.sec)} / 128 = ${n(ans)} gallons per minute. Collect
      from every nozzle on the boom, not one of them.`,
    fallback: { oz: 600, sec: 30 },
  },
  {
    id: 'm5-002',
    ...AERIAL_CH5,
    page: '67',
    name: 'Gallons per mile from output and airspeed',
    // Airspeed / 60 = miles per minute, and gallons per minute divided by
    // that is gallons per linear mile.
    vary: { gpm: [5, 30, 0.5], mph: [40, 160, 10] },
    ask: (v, n) => `An aircraft discharging ${n(v.gpm)} gallons per minute is
      flown at ${n(v.mph)} miles per hour. How much is it putting out per mile
      of flight?`,
    solve: v => v.gpm * 60 / v.mph,
    unit: 'gallons per mile',
    places: 2,
    band: [1.5, 50],
    spread: 150,
    slips: [
      { why: 'multiplied by the miles per minute instead of dividing by them',
        value: v => v.gpm * v.mph / 60 },
      { why: 'left the airspeed in miles per hour',
        value: v => v.gpm / v.mph },
      { why: 'multiplied by 60 a second time',
        value: v => v.gpm * 3600 / v.mph },
      { why: 'answered in quarts rather than gallons',
        value: v => v.gpm * 240 / v.mph },
      { why: 'divided by 4 as if the output had been measured in quarts',
        value: v => v.gpm * 15 / v.mph },
      { why: 'moved the decimal one place to the left',
        value: v => v.gpm * 6 / v.mph },
      { why: 'moved the decimal one place to the right',
        value: v => v.gpm * 600 / v.mph },
    ],
    teach: (v, ans, n) => `Put the airspeed on the same footing as the output:
      ${n(v.mph)} / 60 = ${n(v.mph / 60)} miles per minute. Then divide the
      gallons per minute by that: ${n(v.gpm)} / ${n(v.mph / 60)} = ${n(ans)}
      gallons per mile. Flying faster spreads the same output over more
      ground, so the figure falls as airspeed rises.`,
    fallback: { gpm: 9.375, mph: 50 },
  },
  {
    id: 'm5-003',
    ...AERIAL_CH5,
    page: '68',
    name: 'Boom output from timed spray runs',
    // Sidebar 2, the fixed-wing method: refill the tank after several timed
    // runs and divide what it took by the minutes flown.
    vary: { gal: [20, 60, 2], runs: [3, 6, 1], sec: [20, 45, 5] },
    ask: (v, n) => `A fixed-wing aircraft made ${n(v.runs)} spray runs of
      ${n(v.sec)} seconds each, and refilling the tank to its original mark
      took ${n(v.gal, 'gallons')}. What is the boom's output?`,
    solve: v => v.gal / (v.runs * v.sec / 60),
    unit: 'gallons per minute',
    places: 2,
    band: [4, 60],
    spread: 150,
    slips: [
      { why: 'treated the run time as minutes rather than seconds',
        value: v => v.gal / (v.runs * v.sec) },
      { why: 'multiplied by the time flown instead of dividing by it',
        value: v => v.gal * v.runs * v.sec / 60 },
      { why: 'counted one run rather than all of them',
        value: v => v.gal / (v.sec / 60) },
      { why: 'answered in quarts rather than gallons',
        value: v => v.gal * 4 / (v.runs * v.sec / 60) },
      { why: 'divided by 4 as if the refill had been measured in quarts',
        value: v => v.gal / 4 / (v.runs * v.sec / 60) },
      { why: 'moved the decimal one place to the left',
        value: v => v.gal / 10 / (v.runs * v.sec / 60) },
      { why: 'moved the decimal one place to the right',
        value: v => v.gal * 10 / (v.runs * v.sec / 60) },
    ],
    teach: (v, ans, n) => `What went back into the tank is what the boom put
      out, so the only work is the time: ${n(v.runs)} runs x ${n(v.sec)}
      seconds = ${n(v.runs * v.sec)} seconds, which is
      ${n(v.runs * v.sec / 60)} minutes. Then ${n(v.gal)} /
      ${n(v.runs * v.sec / 60)} = ${n(ans)} gallons per minute.`,
    fallback: { gal: 36, runs: 4, sec: 30 },
  },
  {
    id: 'm5-004',
    ...AERIAL_CH5,
    page: '69',
    name: 'Airspeed in feet per minute',
    // MPH x 5,280 / 60. Sidebar 3's first step, and the one that makes the
    // swath arithmetic possible.
    vary: { mph: [60, 180, 5] },
    ask: (v, n) => `An aircraft is flying at ${n(v.mph)} miles per hour. What is
      that speed expressed in feet per minute?`,
    solve: v => v.mph * 5280 / 60,
    unit: 'feet per minute',
    places: 0,
    band: [5000, 16000],
    spread: 150,
    slips: [
      { why: 'left the answer in feet per hour',
        value: v => v.mph * 5280 },
      { why: 'answered in feet per second rather than feet per minute',
        value: v => v.mph * 5280 / 3600 },
      { why: 'used the 1,760 yards in a mile in place of the 5,280 feet',
        value: v => v.mph * 1760 / 60 },
      { why: 'multiplied by 3 again, as if the figure were still in yards',
        value: v => v.mph * 5280 / 60 * 3 },
      { why: 'moved the decimal one place to the left',
        value: v => v.mph * 528 / 60 },
      { why: 'moved the decimal one place to the right',
        value: v => v.mph * 52800 / 60 },
    ],
    teach: (v, ans, n) => `A mile is 5,280 feet and an hour is 60 minutes, so
      ${n(v.mph)} x 5,280 = ${n(v.mph * 5280)} feet per hour, and
      ${n(v.mph * 5280)} / 60 = ${n(ans)} feet per minute. That figure times
      the effective swath width is the square feet covered in a minute.`,
    fallback: { mph: 120 },
  },
  {
    id: 'm5-005',
    ...AERIAL_CH5,
    page: '69',
    name: 'Acres covered per minute',
    // Feet per minute x effective swath = square feet per minute, then
    // 43,560 to the acre. Sidebar 3.
    vary: { fpm: [5280, 15840, 880], swath: [30, 90, 5] },
    ask: (v, n) => `An aircraft moving ${n(v.fpm)} feet per minute sprays an
      effective swath ${n(v.swath)} feet wide. How much ground does it cover in
      a minute?`,
    solve: v => v.fpm * v.swath / 43560,
    unit: 'acres per minute',
    places: 1,
    band: [3, 35],
    slips: [
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => v.fpm * v.swath / 40000 },
      { why: 'halved the swath for overlap, which the effective width already allows for',
        value: v => v.fpm * v.swath / 2 / 43560 },
      { why: 'read the swath width as yards and multiplied it by 3',
        value: v => v.fpm * v.swath * 3 / 43560 },
      { why: 'turned the swath width into yards, dividing it by 3',
        value: v => v.fpm * v.swath / 3 / 43560 },
      { why: 'moved the decimal one place to the left',
        value: v => v.fpm * v.swath / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.fpm * v.swath / 4356 },
    ],
    teach: (v, ans, n) => `Speed times width is ground covered:
      ${n(v.fpm)} x ${n(v.swath)} = ${n(v.fpm * v.swath)} square feet a minute.
      An acre is 43,560 square feet, so ${n(v.fpm * v.swath)} / 43,560 =
      ${n(ans)} acres per minute. Use the effective swath width from a pattern
      test, which already accounts for the overlap between passes.`,
    fallback: { fpm: 10560, swath: 50 },
  },
  {
    id: 'm5-006',
    ...AERIAL_CH5,
    page: '70',
    name: 'Application volume per acre',
    // Sidebar 4: gallons per minute divided by acres per minute. Both
    // figures come out of the calibration, and the label is written per acre.
    vary: { gpm: [8, 30, 1], apm: [5, 25, 0.5] },
    ask: (v, n) => `A spray boom discharges ${n(v.gpm)} gallons per minute while
      the aircraft covers ${n(v.apm)} acres per minute. What is the application
      volume?`,
    solve: v => v.gpm / v.apm,
    unit: 'gallons per acre',
    places: 2,
    band: [0.3, 8],
    slips: [
      { why: 'multiplied the two figures instead of dividing',
        value: v => v.gpm * v.apm },
      { why: 'divided the acres per minute by the gallons per minute',
        value: v => v.apm / v.gpm },
      { why: 'answered in quarts rather than gallons',
        value: v => v.gpm / v.apm * 4 },
      { why: 'divided by 4 as if the output had been measured in quarts',
        value: v => v.gpm / v.apm / 4 },
      { why: 'answered in pints rather than gallons',
        value: v => v.gpm / v.apm * 8 },
      { why: 'divided by 8 as if the output had been measured in pints',
        value: v => v.gpm / v.apm / 8 },
      { why: 'moved the decimal one place to the left',
        value: v => v.gpm / v.apm / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.gpm / v.apm * 10 },
    ],
    teach: (v, ans, n) => `Both figures are per minute, so the minutes cancel:
      ${n(v.gpm)} / ${n(v.apm)} = ${n(ans)} gallons per acre. This is the
      number the label's maximum volume is compared against, and it moves with
      airspeed and swath width, so it is recalculated whenever either changes.`,
    fallback: { gpm: 18, apm: 12.1 },
  },
  {
    id: 'm5-007',
    ...AERIAL_CH5,
    page: '70',
    name: 'Acres one tankful covers',
    // Sidebar 5: tank / gallons per minute = minutes per tank, times acres
    // per minute. It is what says how much pesticide goes in the tank.
    vary: { tank: [100, 500, 50], gpm: [8, 30, 1], apm: [5, 20, 0.5] },
    ask: (v, n) => `A ${n(v.tank)}-gallon spray tank feeds a system discharging
      ${n(v.gpm)} gallons per minute, and the aircraft covers ${n(v.apm)} acres
      per minute. How many acres does one tankful treat?`,
    solve: v => v.tank / v.gpm * v.apm,
    unit: 'acres',
    places: 1,
    band: [15, 900],
    spread: 150,
    slips: [
      { why: 'divided by the acres per minute instead of multiplying by them',
        value: v => v.tank / v.gpm / v.apm },
      { why: 'stopped at the minutes a tankful lasts',
        value: v => v.tank / v.gpm },
      { why: 'turned the minutes a tankful lasts into hours',
        value: v => v.tank / v.gpm / 60 * v.apm },
      { why: 'turned the minutes a tankful lasts into seconds',
        value: v => v.tank / v.gpm * 60 * v.apm },
      { why: "read the tank's gallons as quarts",
        value: v => v.tank * 4 / v.gpm * v.apm },
      { why: 'moved the decimal one place to the left',
        value: v => v.tank / v.gpm * v.apm / 10 },
      { why: 'moved the decimal one place to the right',
        value: v => v.tank / v.gpm * v.apm * 10 },
    ],
    teach: (v, ans, n) => `First how long a tankful lasts: ${n(v.tank)} /
      ${n(v.gpm)} = ${n(v.tank / v.gpm)} minutes. Then how much ground that
      buys: ${n(v.tank / v.gpm)} x ${n(v.apm)} = ${n(ans, 'acres')}. Knowing
      the acres a tank covers is what lets the right amount of pesticide go
      into it.`,
    fallback: { tank: 300, gpm: 18, apm: 12.1 },
  },
  {
    id: 'm5-008',
    ...AERIAL_CH5,
    page: '70',
    name: 'Pesticide for a tankful at a per-acre rate',
    // Sidebar 5's last step: pints per acre x acres per tank / 8 pints to the
    // gallon, which is what goes in before the water.
    vary: { pints: [0.5, 4, 0.5], acres: [80, 300, 10] },
    ask: (v, n) => `A job order calls for ${n(v.pints, 'pints')} of pesticide
      per acre, and one tankful covers ${n(v.acres, 'acres')}. How much
      pesticide goes into that tank?`,
    solve: v => v.pints * v.acres / 8,
    unit: 'gallons',
    places: 1,
    band: [5, 150],
    slips: [
      { why: 'never converted the pints to gallons',
        value: v => v.pints * v.acres },
      { why: 'used 4 pints to the gallon',
        value: v => v.pints * v.acres / 4 },
      { why: 'used 16 pints to the gallon',
        value: v => v.pints * v.acres / 16 },
      { why: 'divided by 8 a second time',
        value: v => v.pints * v.acres / 64 },
      { why: 'moved the decimal one place to the left',
        value: v => v.pints * v.acres / 80 },
      { why: 'moved the decimal one place to the right',
        value: v => v.pints * v.acres * 10 / 8 },
    ],
    teach: (v, ans, n) => `Work the job in the units the order is written in,
      then convert: ${n(v.pints)} x ${n(v.acres)} = ${n(v.pints * v.acres)}
      pints. Eight pints make a gallon, so ${n(v.pints * v.acres)} / 8 =
      ${n(ans, 'gallons')}, and the rest of the tank is water.`,
    fallback: { pints: 2, acres: 202 },
  },
  {
    id: 'm5-009',
    ...AERIAL_CH5,
    page: '71',
    name: 'Rectangular site in acres',
    // Sidebar 6. Knowing the size of the site is what keeps the load from
    // being mixed wrong, whatever the calibration says.
    vary: { len: [400, 3000, 50], wid: [100, 800, 25] },
    ask: (v, n) => `A rectangular application site measures ${n(v.len)} feet
      long and ${n(v.wid)} feet wide. How many acres is that?`,
    solve: v => v.len * v.wid / 43560,
    unit: 'acres',
    places: 2,
    band: [1, 50],
    slips: [
      { why: 'halved the area, as if the site were a triangle',
        value: v => v.len * v.wid / 2 / 43560 },
      { why: 'read the measurements as yards and multiplied each by 3',
        value: v => v.len * 3 * v.wid * 3 / 43560 },
      { why: 'turned the sides into yards before multiplying them',
        value: v => v.len / 3 * v.wid / 3 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => v.len * v.wid / 40000 },
      { why: 'added the two sides instead of multiplying them',
        value: v => (v.len + v.wid) / 43560 },
      { why: 'moved the decimal one place to the left',
        value: v => v.len * v.wid / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.len * v.wid / 4356 },
    ],
    teach: (v, ans, n) => `Length times width gives ${n(v.len)} x ${n(v.wid)} =
      ${n(v.len * v.wid)} square feet, and an acre is 43,560 square feet, so
      ${n(v.len * v.wid)} / 43,560 = ${n(ans, 'acres')}. Mixing a load for a
      site whose size was guessed is how pesticide gets wasted or run short.`,
    fallback: { len: 800, wid: 250 },
  },
  {
    id: 'm5-010',
    ...AERIAL_CH5,
    page: '72',
    name: 'Triangular site in acres',
    // Sidebar 7.
    vary: { base: [200, 1200, 50], height: [100, 700, 50] },
    ask: (v, n) => `A triangular field has a base of ${n(v.base)} feet and a
      height of ${n(v.height)} feet. What is its area in acres?`,
    solve: v => v.base * v.height / 2 / 43560,
    unit: 'acres',
    places: 2,
    band: [0.2, 10],
    slips: [
      { why: 'never halved the base times the height',
        value: v => v.base * v.height / 43560 },
      { why: 'halved it a second time',
        value: v => v.base * v.height / 4 / 43560 },
      { why: 'read the measurements as yards and multiplied each by 3',
        value: v => v.base * 3 * v.height * 3 / 2 / 43560 },
      { why: 'turned the base and height into yards before multiplying them',
        value: v => v.base / 3 * v.height / 3 / 2 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => v.base * v.height / 2 / 40000 },
      { why: 'moved the decimal one place to the left',
        value: v => v.base * v.height / 2 / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.base * v.height / 2 / 4356 },
    ],
    teach: (v, ans, n) => `A triangle is half its surrounding rectangle:
      ${n(v.base)} x ${n(v.height)} = ${n(v.base * v.height)}, halved is
      ${n(v.base * v.height / 2)} square feet. Then
      ${n(v.base * v.height / 2)} / 43,560 = ${n(ans, 'acres')}.`,
    fallback: { base: 650, height: 300 },
  },
  {
    id: 'm5-011',
    ...AERIAL_CH5,
    page: '73',
    name: 'Circular site in acres',
    // Sidebar 8. Center-pivot ground is round, and the radius is half the
    // diameter that gets quoted.
    vary: { diameter: [200, 2000, 50] },
    ask: (v, n) => `A circular application site is ${n(v.diameter)} feet in
      diameter. Using 3.14 for pi, how many acres does it cover?`,
    solve: v => 3.14 * (v.diameter / 2) ** 2 / 43560,
    unit: 'acres',
    places: 2,
    band: [0.7, 75],
    slips: [
      { why: 'used the diameter where the radius belongs',
        value: v => 3.14 * v.diameter ** 2 / 43560 },
      { why: 'halved the diameter a second time',
        value: v => 3.14 * (v.diameter / 4) ** 2 / 43560 },
      { why: 'used 6.28, which is the circumference constant, in place of 3.14',
        value: v => 6.28 * (v.diameter / 2) ** 2 / 43560 },
      { why: 'halved the area, as if the site were a triangle',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 2 / 43560 },
      { why: 'used 40,000 square feet to the acre, rounding the figure off',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 40000 },
      { why: 'moved the decimal one place to the left',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => 3.14 * (v.diameter / 2) ** 2 / 4356 },
    ],
    teach: (v, ans, n) => `Halve the diameter for the radius:
      ${n(v.diameter)} / 2 = ${n(v.diameter / 2)} feet. Area is 3.14 times the
      radius squared, or ${n(3.14 * (v.diameter / 2) ** 2)} square feet, and
      dividing by 43,560 gives ${n(ans, 'acres')}.`,
    fallback: { diameter: 400 },
  },
  {
    id: 'm5-012',
    ...AERIAL_CH5,
    page: '76',
    name: 'Granule application rate from collection pans',
    // Sidebar 10: 43,560 square feet to the acre times the catch, over the
    // square feet the pans cover, then 16 ounces to the pound.
    vary: { oz: [1, 6, 0.25], pans: [13, 25, 1] },
    ask: (v, n) => `A swath test caught granules in ${n(v.pans)} collection pans
      of one square foot each, weighing ${n(v.oz, 'ounces')} in total. What
      rate is the spreader applying?`,
    solve: v => 43560 * v.oz / v.pans / 16,
    unit: 'pounds per acre',
    places: 2,
    band: [100, 1300],
    spread: 150,
    slips: [
      { why: 'left the answer in ounces per acre',
        value: v => 43560 * v.oz / v.pans },
      { why: 'used 128 fluid ounces to the gallon in place of the 16 ounces in a pound',
        value: v => 43560 * v.oz / v.pans / 128 },
      { why: 'never divided by the square feet the pans cover',
        value: v => 43560 * v.oz / 16 },
      { why: 'divided by 16 a second time',
        value: v => 43560 * v.oz / v.pans / 256 },
      { why: 'moved the decimal one place to the left',
        value: v => 4356 * v.oz / v.pans / 16 },
      { why: 'moved the decimal one place to the right',
        value: v => 435600 * v.oz / v.pans / 16 },
    ],
    teach: (v, ans, n) => `The pans are a sample of an acre: ${n(v.pans)} pans
      of a square foot each cover ${n(v.pans)} square feet, so 43,560 x
      ${n(v.oz)} / ${n(v.pans)} = ${n(43560 * v.oz / v.pans)} ounces per acre.
      At 16 ounces to the pound that is ${n(ans)} pounds per acre. Weigh the
      catch from all the pans together, after graphing each one for the
      pattern.`,
    fallback: { oz: 2, pans: 13 },
  },
  {
    id: 'm5-013',
    ...AERIAL_CH5,
    page: '77',
    name: 'Effective swath width of a granule pattern',
    // The trapezoidal pattern a spreader throws: AD between the outer pans
    // holding nothing, BC where the catch is even, and the effective width is
    // the average of the two.
    vary: { ad: [40, 100, 5], bc: [15, 70, 5] },
    valid: v => v.bc <= v.ad - 10,
    ask: (v, n) => `In a trapezoidal granule pattern, the distance AD between
      the two end pans holding no granules is ${n(v.ad)} feet, and the distance
      BC over which the catch per pan is constant is ${n(v.bc)} feet. What is
      the effective swath width?`,
    solve: v => (v.ad + v.bc) / 2,
    unit: 'feet',
    places: 1,
    band: [25, 90],
    slips: [
      { why: 'added the two distances without halving the total',
        value: v => v.ad + v.bc },
      { why: 'took the difference between the two instead of the sum',
        value: v => (v.ad - v.bc) / 2 },
      { why: 'used the outer distance on its own',
        value: v => v.ad },
      { why: 'used the constant-catch distance on its own',
        value: v => v.bc },
      { why: 'halved only the narrower distance before adding',
        value: v => v.ad + v.bc / 2 },
      { why: 'halved the total a second time',
        value: v => (v.ad + v.bc) / 4 },
    ],
    teach: (v, ans, n) => `Add the two distances and halve the total:
      (${n(v.ad)} + ${n(v.bc)}) / 2 = ${n(ans, 'feet')}. Passes are then flown
      that far apart, so the thin shoulders of each pattern fall under the next
      pass and the granules land evenly.`,
    fallback: { ad: 60, bc: 30 },
  },
  // The Aquatic category manual's chapter 8, "Applying the Right Amount of
  // Herbicide" (pp. 30-49), which is the whole dosage-and-calibration
  // sequence the Aquatic (A) exam asks: sizing the water, the acre-foot and
  // its 2.7 constant, formulation conversion, percent solutions, and boat
  // calibration from a timed run to gallons per acre. These join the cat-a
  // exam the way the chapter's written questions do; the area family appears
  // here a third time for the same reason it appears in the aerial manual —
  // the Aquatic exam draws on none of the core manual's chapters, so an
  // aquatic applicator would otherwise never be asked to size a pond. The
  // manual is sold in print (see data/exam-config.js), so the page these cite
  // renders as text rather than a link.
  {
    id: 'm8-001',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '31',
    name: 'Surface acres of a rectangular pond',
    // Length x width / 43,560, the manual's first area example.
    vary: { len: [400, 1200, 50], wid: [200, 800, 40] },
    valid: v => v.wid <= v.len,
    ask: (v, n) => `A rectangular pond measures ${n(v.len, 'feet')} by
      ${n(v.wid, 'feet')}. How many surface acres will a treatment cover?`,
    solve: v => v.len * v.wid / 43560,
    unit: 'acres',
    places: 1,
    band: [1.9, 25],
    spread: 150,
    slips: [
      { why: 'used 4,356 as the square feet in an acre',
        value: v => v.len * v.wid / 4356 },
      { why: 'halved the product as if the pond were a triangle',
        value: v => v.len * v.wid / 87120 },
      { why: 'converted the sides to yards but still divided by 43,560',
        value: v => v.len / 3 * (v.wid / 3) / 43560 },
      { why: 'moved the decimal one place to the left',
        value: v => v.len * v.wid / 435600 },
      { why: 'moved the decimal one place to the right',
        value: v => v.len * v.wid / 4356 * 10 },
      { why: 'divided by 4,840, the square yards in an acre, without converting the feet',
        value: v => v.len * v.wid / 4840 },
    ],
    teach: (v, ans, n) => `Square feet first, then acres: ${n(v.len)} x
      ${n(v.wid)} = ${n(v.len * v.wid)} square feet, and an acre is 43,560 of
      them, so ${n(v.len * v.wid)} / 43,560 = ${n(ans, 'acres')}. A triangle
      would take half the base times the height, and a circle 3.14 times the
      radius squared, over the same 43,560.`,
    fallback: { len: 800, wid: 440 },
  },
  {
    id: 'm8-002',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '35',
    name: 'Active ingredient for a target concentration',
    // ppm x acre-feet x 2.7, with the acre-feet built from surface acres and
    // average depth. One acre-foot of water weighs 2,700,000 lb, so 2.7 lb
    // in it is 1 ppm.
    vary: { ppm: [0.25, 2, 0.25], acres: [1, 15, 1], depth: [3, 10, 0.5] },
    ask: (v, n) => `A pond of ${n(v.acres, 'surface acres')} averages
      ${n(v.depth, 'feet')} deep, and the label calls for a concentration of
      ${n(v.ppm, 'ppm')} of active ingredient. How much active ingredient does
      the treatment take?`,
    solve: v => v.ppm * v.acres * v.depth * 2.7,
    unit: 'pounds',
    places: 1,
    band: [1.5, 500],
    slips: [
      { why: 'left the 2.7 constant out',
        value: v => v.ppm * v.acres * v.depth },
      { why: 'divided by 2.7 instead of multiplying by it',
        value: v => v.ppm * v.acres * v.depth / 2.7 },
      { why: 'used the surface acres alone, never multiplying by the depth',
        value: v => v.ppm * v.acres * 2.7 },
      { why: "used 8.34, a gallon's weight in pounds, in place of 2.7",
        value: v => v.ppm * v.acres * v.depth * 8.34 },
      { why: 'used 27 for the constant',
        value: v => v.ppm * v.acres * v.depth * 27 },
      { why: 'multiplied by the depth twice',
        value: v => v.ppm * v.acres * v.depth * v.depth * 2.7 },
    ],
    teach: (v, ans, n) => `Volume first: ${n(v.acres)} x ${n(v.depth)} =
      ${n(v.acres * v.depth)} acre-feet. An acre-foot of water weighs
      2,700,000 pounds, so 2.7 pounds of substance in one acre-foot is 1 ppm:
      ${n(v.ppm)} x ${n(v.acres * v.depth)} x 2.7 = ${n(ans, 'pounds')} of
      active ingredient. Average the depth from soundings taken across the
      pond in at least two directions.`,
    fallback: { ppm: 0.5, acres: 5, depth: 4.5 },
  },
  {
    id: 'm8-003',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '36',
    name: 'Formulation from the active ingredient requirement',
    // Pounds of a.i. / percent a.i. as a decimal, the dry-formulation
    // conversion the copper sulfate example works.
    vary: { ai: [5, 60, 1], pct: [20, 80, 5] },
    ask: (v, n) => `The treatment calls for ${n(v.ai, 'pounds')} of active
      ingredient, and the granular formulation on hand is ${n(v.pct)} percent
      active ingredient. How much formulation should be applied?`,
    solve: v => v.ai / (v.pct / 100),
    unit: 'pounds',
    places: 1,
    band: [8, 300],
    spread: 150,
    slips: [
      { why: 'multiplied by the percent instead of dividing by it',
        value: v => v.ai * v.pct / 100 },
      { why: 'left the percentage out and weighed up the active ingredient figure itself',
        value: v => v.ai },
      { why: 'divided by the percent without converting it to a decimal',
        value: v => v.ai / v.pct },
      { why: 'divided by the decimal twice',
        value: v => v.ai / (v.pct / 100) / (v.pct / 100) },
      { why: 'moved the decimal one place to the right',
        value: v => v.ai / (v.pct / 100) * 10 },
      { why: 'divided by the inert percentage instead of the active one',
        value: v => v.ai / ((100 - v.pct) / 100) },
    ],
    teach: (v, ans, n) => `The formulation is only ${n(v.pct)} percent active
      ingredient, so more formulation than a.i. is always needed: ${n(v.ai)} /
      ${n(v.pct / 100)} = ${n(ans, 'pounds')} of formulation. For a liquid the
      divisor is the pounds of a.i. per gallon instead; either way the answer
      must come out larger than the a.i. figure, which is the quick check on
      the arithmetic.`,
    fallback: { ai: 10, pct: 25 },
  },
  {
    id: 'm8-004',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '38',
    name: 'Percent solution in a small spray tank',
    // Tank volume x percent / 100, converted to fluid ounces at 128 to the
    // gallon — the manual's 4-gallon, 1.5 percent example.
    vary: { tank: [3, 25, 1], pct: [0.5, 5, 0.25] },
    ask: (v, n) => `A foliar job calls for a ${n(v.pct)} percent solution, and
      the spray tank holds ${n(v.tank, 'gallons')}. How much herbicide goes
      into the tank?`,
    solve: v => v.tank * v.pct / 100 * 128,
    unit: 'fluid ounces',
    places: 1,
    band: [1.5, 300],
    spread: 150,
    slips: [
      { why: 'skipped the divide by 100, reading the percent as whole gallons',
        value: v => v.tank * v.pct * 128 },
      { why: 'left the 128 out, reading the gallons figure as ounces',
        value: v => v.tank * v.pct / 100 },
      { why: 'used 64 ounces to the gallon',
        value: v => v.tank * v.pct / 100 * 64 },
      { why: 'used 16 ounces to the gallon, which is the dry measure',
        value: v => v.tank * v.pct / 100 * 16 },
      { why: 'moved the decimal one place to the right',
        value: v => v.tank * v.pct / 100 * 1280 },
      { why: 'worked the ounces for twice the tank volume',
        value: v => v.tank * v.pct / 100 * 256 },
    ],
    teach: (v, ans, n) => `Percent is parts per hundred by volume:
      ${n(v.tank)} x ${n(v.pct)} / 100 = ${n(v.tank * v.pct / 100)} gallons of
      herbicide, and at 128 fluid ounces to the gallon that is
      ${n(v.tank * v.pct / 100)} x 128 = ${n(ans, 'fluid ounces')}. Percent
      solutions are measured in the formulation, so the same percent of two
      formulations can hold different amounts of active ingredient.`,
    fallback: { tank: 4, pct: 1.5 },
  },
  {
    id: 'm8-005',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '43',
    name: 'Boat speed from timed runs in both directions',
    // Distance x 3600 / (5280 x average seconds): the marked course, run both
    // ways so wind and current average out.
    vary: { dist: [100, 400, 50], t1: [30, 120, 2], t2: [30, 120, 2] },
    valid: v => Math.abs(v.t1 - v.t2) <= Math.min(v.t1, v.t2) * 0.3,
    ask: (v, n) => `A spray boat runs a measured ${n(v.dist, 'feet')} in
      ${n(v.t1, 'seconds')} one way and ${n(v.t2, 'seconds')} back. What speed
      should the calibration use?`,
    solve: v => v.dist * 3600 / (5280 * (v.t1 + v.t2) / 2),
    unit: 'miles per hour',
    places: 1,
    band: [1, 8],
    spread: 150,
    slips: [
      { why: 'left the 88 feet per minute out, so the figure is feet per minute',
        value: v => v.dist * 60 / ((v.t1 + v.t2) / 2) },
      { why: 'reported feet per second as miles per hour',
        value: v => v.dist / ((v.t1 + v.t2) / 2) },
      { why: 'multiplied by 1.47 instead of dividing the seconds by it',
        value: v => v.dist * 1.47 / ((v.t1 + v.t2) / 2) },
      { why: 'summed the two times instead of averaging them',
        value: v => v.dist * 3600 / (5280 * (v.t1 + v.t2)) },
      { why: 'timed against the first run alone instead of the average',
        value: v => v.dist * 3600 / (5280 * v.t1) },
      { why: 'moved the decimal one place to the left',
        value: v => v.dist * 360 / (5280 * (v.t1 + v.t2) / 2) },
    ],
    teach: (v, ans, n) => `Average the two runs first — wind and current help
      one way and hinder the other: (${n(v.t1)} + ${n(v.t2)}) / 2 =
      ${n((v.t1 + v.t2) / 2)} seconds. Then ${n(v.dist)} x 3,600 / (5,280 x
      ${n((v.t1 + v.t2) / 2)}) = ${n(ans)} miles per hour. Time the runs with
      the tank half full and the actual crew and gear aboard; a normal
      treating speed is 3 to 4 mph at idle.`,
    fallback: { dist: 200, t1: 54, t2: 56 },
  },
  {
    id: 'm8-006',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '42',
    name: 'Acres per minute from swath and speed',
    // Swath x mph x 88 / 43,560, the coverage half of every boat calibration.
    vary: { swath: [8, 40, 2], mph: [2, 5, 0.5] },
    ask: (v, n) => `A boat treats a ${n(v.swath)}-foot swath at
      ${n(v.mph)} miles per hour. How much area is it covering each minute?`,
    solve: v => v.swath * v.mph * 88 / 43560,
    unit: 'acres per minute',
    places: 3,
    band: [0.03, 0.45],
    spread: 150,
    slips: [
      { why: 'left the 88 out, using the miles per hour as feet per minute',
        value: v => v.swath * v.mph / 43560 },
      { why: 'used 60 feet per minute to the mile per hour',
        value: v => v.swath * v.mph * 60 / 43560 },
      { why: 'used 5,280, as if the boat covered a mile a minute',
        value: v => v.swath * v.mph * 5280 / 43560 },
      { why: 'halved the coverage for alternate swaths that were not being run',
        value: v => v.swath * v.mph * 44 / 43560 },
      { why: 'doubled the swath as if alternate strips were being treated',
        value: v => v.swath * v.mph * 176 / 43560 },
      { why: 'moved the decimal one place to the right',
        value: v => v.swath * v.mph * 880 / 43560 },
    ],
    teach: (v, ans, n) => `A mile per hour is 88 feet per minute, so the boat
      sweeps ${n(v.swath)} x ${n(v.mph)} x 88 = ${n(v.swath * v.mph * 88)}
      square feet a minute, and over 43,560 that is ${n(ans)} acres per
      minute. The shortcut 2 x swath x mph / 1,000 gives the same figure
      within a percent. Treating alternate swaths doubles the effective swath
      and with it this rate.`,
    fallback: { swath: 16, mph: 2.5 },
  },
  {
    id: 'm8-007',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '45',
    name: 'Gallons per acre from output and coverage',
    // GPM / acres per minute, the last step of the boat calibration.
    vary: { gpm: [2, 8, 0.5], apm: [0.02, 0.12, 0.01] },
    ask: (v, n) => `Calibration finds the handgun putting out ${n(v.gpm)}
      gallons per minute while the boat covers ${n(v.apm)} acres per minute.
      What application rate is that?`,
    solve: v => v.gpm / v.apm,
    unit: 'gallons per acre',
    places: 0,
    band: [20, 300],
    spread: 150,
    slips: [
      { why: 'read the acres per minute a decimal place high',
        value: v => v.gpm / (v.apm * 10) },
      { why: 'read the acres per minute a decimal place low',
        value: v => v.gpm * 10 / v.apm },
      { why: 'divided by acres per hour instead of acres per minute',
        value: v => v.gpm / (v.apm * 60) },
      { why: 'converted the gallons to an hourly figure but not the acres',
        value: v => v.gpm * 60 / v.apm },
      { why: 'halved the rate as if alternate swaths were being run',
        value: v => v.gpm / v.apm / 2 },
      { why: 'doubled the rate for alternate swaths already in the coverage',
        value: v => v.gpm * 2 / v.apm },
    ],
    teach: (v, ans, n) => `Each minute puts ${n(v.gpm)} gallons onto
      ${n(v.apm)} acres, so the rate is ${n(v.gpm)} / ${n(v.apm)} =
      ${n(ans)} gallons per acre. Calibration is a first approximation:
      environmental conditions change while applying, so watch the tank
      against the acres — a quarter of the area treated should have used a
      quarter of the tank.`,
    fallback: { gpm: 3.6, apm: 0.04 },
  },
  {
    id: 'm8-008',
    manual: 'cat-a',
    section: 8,
    sectionName: 'Applying the Right Amount',
    page: '47',
    name: 'Spreader output for a granular rate',
    // Pounds per acre x acres per minute = the pounds per minute the spreader
    // must deliver, the granular calibration example.
    vary: { ppa: [20, 120, 10], swath: [20, 40, 5], mph: [2, 5, 0.5] },
    ask: (v, n) => `Granules are to go out at ${n(v.ppa, 'pounds')} per acre
      from a spreader throwing a ${n(v.swath)}-foot swath at ${n(v.mph)} miles
      per hour. What output must the spreader be set to deliver?`,
    solve: v => v.ppa * v.swath * v.mph * 88 / 43560,
    unit: 'pounds per minute',
    places: 1,
    band: [1.5, 50],
    spread: 150,
    slips: [
      { why: 'left the 88 out of the acres per minute',
        value: v => v.ppa * v.swath * v.mph / 43560 },
      { why: 'read the swath figure as yards',
        value: v => v.ppa * v.swath * 3 * v.mph * 88 / 43560 },
      { why: 'doubled the swath as if the throw to each side counted separately',
        value: v => v.ppa * v.swath * v.mph * 176 / 43560 },
      { why: 'halved the coverage for alternate swaths a spreader does not run',
        value: v => v.ppa * v.swath * v.mph * 44 / 43560 },
      { why: 'moved the decimal one place to the left',
        value: v => v.ppa * v.swath * v.mph * 8.8 / 43560 },
      { why: 'moved the decimal one place to the right',
        value: v => v.ppa * v.swath * v.mph * 880 / 43560 },
    ],
    teach: (v, ans, n) => `Coverage first: ${n(v.swath)} x ${n(v.mph)} x 88 /
      43,560 = ${n(v.swath * v.mph * 88 / 43560)} acres per minute. The
      spreader must feed that coverage at the label rate: ${n(v.ppa)} x
      ${n(v.swath * v.mph * 88 / 43560)} = ${n(ans)} pounds per minute. If the
      lowest non-clogging setting delivers more than this, raise the boat
      speed to lift the acres per minute instead — and recalibrate for each
      granule size, since output differs with the particle.`,
    fallback: { ppa: 40, swath: 40, mph: 2.5 },
  },
];
