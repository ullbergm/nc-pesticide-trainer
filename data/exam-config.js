/* Everything that names the exam this trainer studies for: the tests and the
   manual chapters behind them, the pass mark, the manual PDF links, and the
   prose that mentions the pesticide exams. The engine under js/ reads only
   this file and data/questions.js, so a trainer for a different exam is built
   by replacing the data/ directory and the page shell (index.html,
   manifest.webmanifest, icons, CNAME); js/ carries no knowledge of any
   particular exam.
   Loads after data/questions.js and data/manual-pages.js and may read both. */
// Which chapters belong to which manual, and so to which exams. Each manual
// numbers its own chapters from 1, exactly as the printed book does, so a
// chapter is identified by the pair (manual, number) and never by the number
// alone: "1" is Pest Management in the core manual and Laws and Regulations
// for the Aerial Applicator Pilot in the aerial one. `chapters()` writes that
// pair the way the app keys it, "<manual>:<number>", and a question belongs to
// the chapter matching its own `manual` field (`default` when it has none).
// Back matter counts as a section too, numbered on after the last chapter for
// ordering; what it calls itself ("app. C") comes from the questions'
// `sectionLabel`, since an appendix's designation is not its position.
//
// The lists are read off the bank rather than written out, because an exam
// listing a section the bank has no questions for is hidden from the app
// entirely: spelling out chapters ahead of authoring them would silently take
// the whole exam away. So a manual's exam covers exactly the sections of that
// manual that exist, and authoring a new one adds it to the exam by itself.
const sectionsOf = manual => [...new Set(
  QUESTION_BANK
    .filter(q => (q.manual || 'default') === manual)
    .map(q => `${manual}:${q.section}`))];
const CORE_SECTIONS = sectionsOf('default');   // chapters 1-11 and appendices
const AERIAL_SECTIONS = sectionsOf('aerial');  // chapters 1-6 and appendices

// North Carolina's own law, which the national manuals cannot cover and every
// NC exam asks about. Two documents: the statute (G.S. 143, Article 52, in
// five Parts) and the Pesticide Board's rules under it (02 NCAC 09L, in
// numbered Sections), so `section` is a Part in the one and a rule Section in
// the other.
const LAW_SECTIONS = sectionsOf('law');
const RULE_SECTIONS = sectionsOf('rules');
// NC State Extension's AG-714, which describes the certification and
// licensing system to applicators: exam formats, credit requirements, and
// reciprocity. Its headings are numbered in printed order (see
// data/questions.js), and which exam each one belongs to depends on the
// licence it describes, so they are split the same way the rules are.
const NCSU_SECTIONS = sectionsOf('ncsu');
// Most of the rules bind every applicator, but some Sections are written for
// one license and belong only to the exam that leads to it: .0500 licenses
// commercial applicators, dealers and consultants, .1100 certifies private
// applicators, .1000 governs aerial application, and .0300 registration,
// .0400 sampling tolerances and .0800 bulk containment govern the selling
// side of the trade rather than the applying side. Splitting them here is
// what keeps a Private Applicator mock exam from asking about the dealer
// license examination, or a Core one about registration fees for a blend.
const RULES_CORE_ONLY = ['rules:5'];      // .0500 Pesticide Licenses
const RULES_PRIVATE_ONLY = ['rules:11'];  // .1100 Private Pesticide Applicator Certification
const RULES_AERIAL_ONLY = ['rules:10'];   // .1000 Aerial Application of Pesticides
const RULES_DEALER_ONLY = ['rules:3', 'rules:4', 'rules:8']; // .0300 Registration, .0400 Samples, .0800 Bulk Distribution
const RULES_EXAM_SPECIFIC = [...RULES_CORE_ONLY, ...RULES_PRIVATE_ONLY,
  ...RULES_AERIAL_ONLY, ...RULES_DEALER_ONLY];
const RULES_SHARED = RULE_SECTIONS.filter(s => !RULES_EXAM_SPECIFIC.includes(s));
// The rule Sections a pesticide dealer is examined on, following the contents
// of the printed dealer training manual (see `manuals.dealer`), the closest
// thing NCDA&CS has to a published dealer syllabus: licensing under .0500,
// registration under .0300, sampling tolerances under .0400 (a dealer's stock
// is what gets sampled), disposal under .0600, declared pests under .0700
// (what animal-control products a dealer may lawfully sell for), bulk
// containment under .0800, arsenic trioxide under .1200, sales and records
// under .1300, worker protection under .1800, and commercial storage under
// .1900. The Sections written for applying pesticides - ground application,
// chemigation, aerial - stay out, which is what keeps a dealer mock exam off
// swath widths and spray records.
const RULES_DEALER = ['rules:3', 'rules:4', 'rules:5', 'rules:6', 'rules:7',
  'rules:8', 'rules:12', 'rules:13', 'rules:18', 'rules:19']
  .filter(s => RULE_SECTIONS.includes(s));
// AG-714 by license. Everyone sits an exam and earns credits (sec. 1, 7, 8);
// the rest follow the license each was written for. A dealer is examined on
// the license types (sec. 4) because knowing which license a buyer must hold
// is the dealer's own duty, but not on supervising noncertified applicators
// (sec. 6), which is applicator work.
const ncsu = keys => keys.filter(s => NCSU_SECTIONS.includes(s));
const NCSU_CORE = ncsu(['ncsu:1', 'ncsu:3', 'ncsu:4', 'ncsu:6', 'ncsu:7', 'ncsu:8']);
const NCSU_PRIVATE = ncsu(['ncsu:1', 'ncsu:2', 'ncsu:6', 'ncsu:7', 'ncsu:8']);
const NCSU_DEALER = ncsu(['ncsu:1', 'ncsu:4', 'ncsu:7', 'ncsu:8']);
const NCSU_AERIAL = ncsu(['ncsu:5']);
// What the two core-material exams draw on: the national core manual plus NC
// law, minus the rules meant for the other license.
const CORE_EXAM_SECTIONS = [...CORE_SECTIONS, ...LAW_SECTIONS, ...RULES_SHARED,
  ...RULES_CORE_ONLY, ...NCSU_CORE];
const PRIVATE_EXAM_SECTIONS = [...CORE_SECTIONS, ...LAW_SECTIONS, ...RULES_SHARED,
  ...RULES_PRIVATE_ONLY, ...NCSU_PRIVATE];
const AERIAL_EXAM_SECTIONS = [...AERIAL_SECTIONS, ...RULES_AERIAL_ONLY, ...NCSU_AERIAL];
// The dealer exam is the one certification exam that is not built on Core: a
// dealer sells restricted use pesticides rather than applying them, so the
// national manuals do not come into it and the exam is NC law, the rules a
// dealer works under, the licensing system AG-714 describes, and the printed
// dealer training manual's own chapters (see `manuals.dealer`).
const DEALER_EXAM_SECTIONS = [...LAW_SECTIONS, ...RULES_DEALER, ...NCSU_DEALER,
  ...sectionsOf('dealer')];

// The category exams. Core licenses nobody on its own: a commercial applicator
// passes Core and then one of these per category they want to work in, and an
// aerial applicator adds Aerial Methods on top. Each is written from its own
// North Carolina category manual, which is sold in print and has no public PDF
// to cite. Two are authored: cat-ksa, from "Ectoparasites of Pets", and
// cat-a, from the "Aquatic Weed Management Training Manual"; the rest have
// no questions yet.
//
// They are all listed anyway, with the manual key their questions carry, so
// the app can show what the bank does not cover yet and the gap is visible
// instead of implied. `sectionsOf` gives an empty list until the first question
// arrives, and the exam then fills in by itself. Add a `manuals` entry beside
// the key when authoring one, so its citations can name the book.
const CATEGORIES = [
  ['cat-a', 'A', 'Aquatic Pest Control'],
  ['cat-b', 'B', 'Public Health'],
  ['cat-g', 'G', 'Forestry'],
  ['cat-h', 'H', 'Right-of-Way'],
  ['cat-i', 'I', 'Regulatory'],
  ['cat-k', 'K', 'Agricultural Pest Animal - Livestock'],
  ['cat-kpu', 'K(PU)', 'Agricultural Pest Animal - Poultry'],
  ['cat-ksa', 'K(SA)', 'Agricultural Pest Animal - Small Animal'],
  ['cat-l', 'L', 'Ornamental & Turf'],
  ['cat-m', 'M', 'Seed Treatment'],
  ['cat-n', 'N', 'Demonstration & Research'],
  ['cat-o', 'O', 'Agricultural Pest Plant'],
  ['cat-s', 'S', 'Commercial Soil Fumigation'],
  ['cat-t', 'T', 'Wood Treatment'],
];
const CATEGORY_EXAMS = CATEGORIES.map(([key, code, name]) => ({
  key,
  name: `${name} (${code})`,
  sections: sectionsOf(key),
  count: 50, // every NC category exam is 50 questions at 70%
}));

// Written questions and generated calculation drills are counted separately
// wherever the app states a size. A drill is one card but unboundedly many
// questions — it draws new numbers every time it comes up — so folding it into
// the question count would state a number that is both wrong and impossible to
// check against anything.
const WRITTEN_COUNT = QUESTION_BANK.filter(q => !q.drill).length;
const DRILL_COUNT = QUESTION_BANK.length - WRITTEN_COUNT;
const BANK_SIZE = `${WRITTEN_COUNT} questions${
  DRILL_COUNT ? ` and ${DRILL_COUNT} calculation drills` : ''}`;

const EXAM_CONFIG = {
  storageKey: 'nc-pesticide-trainer-v1',      // localStorage; changing it orphans saved progress
  sessionKey: 'nc-pesticide-trainer-session', // sessionStorage mirror of the active session
  exportPrefix: 'pesticide-progress',         // backup filename: <prefix>-YYYY-MM-DD.json
  repo: 'https://github.com/ullbergm/nc-pesticide-trainer',
  passMark: 0.7, // NC requires 70% on the core and category exams

  // Manuals the questions cite. A question picks one with its `manual` field
  // and uses `default` when it has none. `pages` maps the manual's printed
  // page numbers to physical PDF pages for #page= deep links. The questions
  // are written from the national core manual, which is freely published by
  // EPA; North Carolina's own Core Manual is sold in print by the NC State
  // Pesticide Safety Education Program and has no public PDF to link.
  requireCitations: true, // the bank validator rejects a question without a page
  manuals: {
    default: {
      title: 'National Pesticide Applicator Certification Core Manual',
      cite: 'Core Manual', // prefix on the "p. 14" citation
      short: 'Core',       // prefix on a chapter label, "Core ch. 3"
      url: 'https://www.epa.gov/system/files/documents/2022-09/national-pesticide-applicator-cert-core-manual-2014.pdf',
      pages: MANUAL_PAGES,
    },
    // The aerial manual's own chapters 1-6; a question there carries
    // `"manual": "aerial"`, which both picks this manual for its citation and
    // keeps its chapter 1 distinct from the core manual's chapter 1.
    aerial: {
      title: "National Aerial Applicator's Manual",
      cite: 'Aerial Manual',
      short: 'Aerial', // chapter labels: "Aerial ch. 3 Preventing Pesticide Drift"
      url: 'https://www.epa.gov/system/files/documents/2023-11/national-aerial-applicator-manual-2014.pdf',
      pages: AERIAL_PAGES,
    },
    // North Carolina's pesticide law, and the Pesticide Board's rules under
    // it. Both are cited the way lawyers and inspectors cite them, by section
    // number rather than by page, so their questions carry a `ref` and
    // `citeByRef` makes the bank validator insist on one. The page is still
    // recorded, because it is what opens the PDF in the right place.
    //
    // These are the two documents NCDA&CS itself publishes as the law, and
    // both are free to read, which is what lets the bank cover NC material at
    // all: the state's study manuals are sold in print and cannot be cited.
    law: {
      title: 'North Carolina Pesticide Law of 1971 (G.S. 143, Article 52)',
      cite: 'NC Pesticide Law', // citations read "NC Pesticide Law § 143-452(a)"
      short: 'Law',             // section labels: "Law pt. 4 Pesticide Applicators and Consultants"
      url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByArticle/Chapter_143/Article_52.pdf',
      pages: LAW_PAGES,
      citeByRef: true,
    },
    // Served over http because that is how the Office of Administrative
    // Hearings publishes it; it answers on nothing else.
    rules: {
      title: 'North Carolina Pesticide Rules (02 NCAC 09L)',
      cite: '02 NCAC 09L', // citations read "02 NCAC 09L .0503"
      short: 'Rules',      // section labels: "Rules sec. .0500 Pesticide Licenses"
      url: 'http://reports.oah.state.nc.us/ncac/title%2002%20-%20agriculture%20and%20consumer%20services/chapter%2009%20-%20food%20and%20drug%20protection/subchapter%20l/subchapter%20l%20rules.pdf',
      pages: RULES_PAGES,
      citeByRef: true,
    },
    // NC State Extension AG-714, the free publication that describes the
    // certification and licensing system itself: what each exam looks like,
    // what recertification takes, and who North Carolina has reciprocity
    // with. It is the one North Carolina source on the subject that is not
    // sold in print, which is why the bank can cover this material at all.
    //
    // `web` marks it as a web publication rather than a PDF: it has no pages,
    // so a question's `page` carries the heading its fact is printed under,
    // the citation reads as that heading instead of "p. 12", and the link is
    // the anchor on the heading instead of "#page=N". `pages` still does the
    // translating, from heading to anchor.
    ncsu: {
      title: 'Pesticide Applicator Certification and Licensing (NC State Extension AG-714)',
      cite: 'NC State AG-714', // citations read "NC State AG-714 Reciprocity"
      short: 'AG-714',         // section labels: "AG-714 sec. 7 Reciprocity"
      url: 'https://content.ces.ncsu.edu/pesticide-applicator-certification-and-licensing',
      pages: NCSU_ANCHORS,
      web: true,
    },
    // The dealer training manual: "Pesticide Training Manual for Restricted
    // Use Pesticide Dealers" (NCDA and NC Cooperative Extension Service,
    // revised May 1995), the study manual NCDA&CS still issues for the dealer
    // licensing exam, today with a Rev. 11/2024 insert replacing its
    // recordkeeping pages. Sold in print with no public PDF, so no `url` and
    // citations render as plain text naming the printed page; its parts are
    // unnumbered, so its major headings are numbered in printed order. Only
    // its still-current teaching is authored: its 1995 fees, its employee
    // purchase age, the recordkeeping pages the insert replaces, and its
    // reprint of the 1995 rule text are all superseded, so those facts are
    // asked from the law and rules sections above, which cite the current
    // documents, and never from this manual.
    dealer: {
      title: 'Pesticide Training Manual for Restricted Use Pesticide Dealers (NC, 1995)',
      cite: 'Dealer Manual', // citations read "Dealer Manual p. 20"
      short: 'Dealer',       // section labels: "Dealer sec. 4 Dealer's Suggestions"
    },
    // The first North Carolina category manual in the bank: "Ectoparasites of
    // Pets" (J. J. Arends, NC Agricultural Extension Service, January 1994),
    // the study manual for the Agricultural Pest Animal - Small Animal
    // category, K(SA) - applicators treating pets and the places pets are
    // confined, pet groomers included. Like every NC study manual it is sold
    // in print by the NC State Pesticide Safety Education Program and has no
    // public PDF, so there is no `url` and its citations render as plain text
    // naming the printed page; the manual has no chapter numbers, so its
    // major headings are numbered in printed order the way AG-714's are.
    'cat-ksa': {
      title: 'Ectoparasites of Pets (NC pesticide training manual, 1994)',
      cite: 'Ectoparasites of Pets', // citations read "Ectoparasites of Pets p. 6"
      short: 'K(SA)',                // section labels: "K(SA) sec. 3 Ticks"
    },
    // The Aquatic Pest Control category manual: "Aquatic Weed Management
    // Training Manual - For North Carolina Applicators", the Southeastern
    // aquatic herbicide applicator training manual (K. A. Langeland ed.,
    // UF/IFAS Center for Aquatic Plants, July 1991) slightly revised for NC
    // by S. H. Kay and J. H. Wilson. Sold in print like every NC category
    // manual, so no `url` and its citations render as plain text. Its
    // chapters are unnumbered, so headings are numbered in printed order;
    // section 12 gathers the back matter (conversion factors and the
    // glossary) under the "app." label.
    'cat-a': {
      title: 'Aquatic Weed Management Training Manual (NC, 1991)',
      cite: 'Aquatic Weed Manual', // citations read "Aquatic Weed Manual p. 35"
      short: 'Aquatic',            // section labels: "Aquatic sec. 8 Applying the Right Amount"
    },
  },

  // Mock exams: how many questions the real test asks, drawn from which
  // sections. The core manual's sections feed the two core-material exams and
  // the aerial manual's feed Aerial Methods, so an aerial question never turns
  // up in a Core mock exam and vice versa.
  exams: [
    { key: 'core', name: 'Commercial Core', sections: CORE_EXAM_SECTIONS, count: 100 },
    { key: 'private', name: 'Private Applicator', sections: PRIVATE_EXAM_SECTIONS, count: 50 },
    { key: 'aerial', name: 'Aerial Methods', sections: AERIAL_EXAM_SECTIONS, count: 50 },
    // NCDA&CS publishes no dealer exam length; 50 matches every NC pesticide
    // exam except Core and stays this app's assumption. The syllabus follows
    // the printed dealer training manual (see `manuals.dealer`), whose
    // contents are NC law, the rules a dealer works under, and its own
    // dealer chapters.
    { key: 'dealer', name: 'Pesticide Dealer', sections: DEALER_EXAM_SECTIONS, count: 50 },
    ...CATEGORY_EXAMS,
  ],

  // Exams -> the manual sections that cover them. The Settings picker offers
  // these, grouped by testGroups.
  tests: [
    { key: 'core', group: 'cert', name: 'Commercial Core', note: 'the 100-question first exam for every commercial applicator license', sections: CORE_EXAM_SECTIONS },
    { key: 'private', group: 'cert', name: 'Private Applicator', note: 'the 50-question exam for producing an agricultural commodity on your own land', sections: PRIVATE_EXAM_SECTIONS },
    { key: 'aerial', group: 'methods', name: 'Aerial Methods', note: 'the extra exam every aerial applicator takes on top of Core and a category', sections: AERIAL_EXAM_SECTIONS },
    { key: 'dealer', group: 'cert', name: 'Pesticide Dealer', note: 'the only exam a pesticide dealer sits: NC law and rules and the dealer manual, no Core', sections: DEALER_EXAM_SECTIONS },
    ...CATEGORY_EXAMS.map(e => ({
      key: e.key,
      group: 'category',
      name: e.name,
      note: 'one 50-question category exam on top of Core',
      sections: e.sections,
    })),
  ],
  testGroups: [
    ['cert', 'Certification exams'],
    ['methods', 'Methods exams'],
    ['category', 'Category exams'],
  ],

  // The licenses these exams lead to, shown as a reference table in About.
  // NCDA&CS issues the licenses and is the authority; this is a summary, so
  // `source` is linked next to it and every fee or term here should be
  // rechecked against that page when it changes. Categories are listed by
  // letter and spelled out in `categories` below. Rendering is generic: any
  // exam config that omits `licenses` simply shows no such section.
  // Prose above the About page's per-exam coverage table (the engine renders
  // the table whenever some exam has nothing written for it).
  coverageIntroHTML: `North Carolina licenses on the Core exam plus a category exam for each
    kind of work, and aerial applicators add Aerial Methods. The category
    exams are written from North Carolina's own category manuals, which are
    sold in print, so they are listed here with what the bank has for them
    rather than left out.`,

  licenses: {
    title: 'North Carolina licenses and certifications',
    source: 'https://www.ncagr.gov/divisions/structural-pest-control-and-pesticides/pesticide/licensing-and-certification/licenses',
    sourceName: 'NCDA&CS Pesticide Licenses',
    intro: `Every commercial license below is earned by passing the 100-question Core exam
      plus a 50-question exam in each category you want, at 70% each. Aerial licenses add
      the Aerial Methods exam on top of that.`,
    groups: [
      {
        name: 'Ground application',
        items: [
          { code: '026', name: 'Commercial Ground Applicator', who: 'applying pesticides on someone else\'s property for compensation, by any means other than aircraft', exams: 'Core + category', term: '5-year certification, $75 a year' },
          { code: '031', name: 'Federal/State Public Operator (Ground)', who: 'federal and state employees applying pesticides', exams: 'Core + category', term: '5-year certification, no fee' },
          { code: '032', name: 'County/City Public Operator (Ground)', who: 'county and municipal employees applying pesticides', exams: 'Core + category', term: '5-year certification, no fee' },
          { code: '033', name: 'Public Utility Ground Applicator', who: 'utility company employees treating rights-of-way', exams: 'Core + category', term: '5-year certification, $75 a year' },
        ],
      },
      {
        name: 'Aerial application',
        items: [
          { code: '027', name: 'Pilot - Aerial Pesticide Applicator', who: 'applying pesticides from an aircraft; needs FAA credentials, 1 year and 125 hours of aerial agricultural experience, and a link to an aerial contractor', exams: 'Core + category + Aerial Methods', term: '2-year certification, $75 a year' },
          { code: '028', name: 'Aerial Contractor', who: 'overseeing aerial applications; submits an FAA 137 certificate and meets the pilot requirements', exams: 'Core + category + Aerial Methods', term: '2-year certification, $75 a year' },
          { code: '029', name: 'Apprentice - Aerial Pesticide Applicator', who: 'applying pesticides from an aircraft without the year and 125 hours a pilot license needs', exams: 'Core + category + Aerial Methods', term: '2-year certification, $75 a year' },
          { code: '034', name: 'Federal/State Public Operator (Aerial)', who: 'federal and state employees applying pesticides by air', exams: 'Core + category + Aerial Methods', term: '2-year certification, no fee' },
          { code: '035', name: 'County/City Public Operator (Aerial)', who: 'county and municipal employees applying pesticides by air', exams: 'Core + category + Aerial Methods', term: '2-year certification, no fee' },
          { code: '036', name: 'Public Utility Aerial Applicator', who: 'utility employees treating rights-of-way by air, with 1 year and 125 hours of aerial agricultural experience', exams: 'Core + category + Aerial Methods', term: '2-year certification, $75 a year' },
        ],
      },
      {
        name: 'Advice, sales, and private use',
        items: [
          { code: '030', name: 'Pesticide Consultant', who: 'selling pest control advice; does not permit applications, and needs a degree with at least 30 hours of coursework in the category', exams: 'Core + category', term: '5-year certification, $75 a year' },
          { code: '037', name: 'Pesticide Dealer', who: 'making restricted-use pesticides available to certified users; one license per location', exams: 'Dealer exam (no Core)', term: '5-year certification, $75 a year' },
          { code: '038', name: 'Private Pesticide Applicator', who: 'using restricted-use pesticides to produce an agricultural commodity on land you own or rent', exams: 'Private Applicator exam', term: '3-year certification, $10 every three years' },
        ],
      },
    ],
    // The category exams a license is endorsed for. Only Core, Private, and
    // Aerial Methods are in the question bank; the rest are listed so the
    // reader knows what else the license they want will ask of them.
    categories: [
      ['A', 'Aquatic Pest Control'],
      ['B', 'Public Health'],
      ['G', 'Forestry'],
      ['H', 'Right-of-Way'],
      ['I', 'Regulatory (government employees)'],
      ['K', 'Agricultural Pest Animal - Livestock'],
      ['K(PU)', 'Agricultural Pest Animal - Poultry'],
      ['K(SA)', 'Agricultural Pest Animal - Small Animal'],
      ['L', 'Ornamental & Turf'],
      ['M', 'Seed Treatment'],
      ['N', 'Demonstration & Research'],
      ['O', 'Agricultural Pest Plant'],
      ['P', 'Aerial applications only'],
      ['S', 'Commercial Soil Fumigation'],
      ['T', 'Wood Treatment'],
      ['Z(SF)', 'Soil Fumigation (private applicators)'],
      ['Z(CF)', 'Commodity Fumigation (private applicators)'],
    ],
  },

  // Prose that names the exam, injected as HTML into the matching views.
  homeSubtitle: `${BANK_SIZE} from the national applicator manuals, North Carolina pesticide law, NC State Extension, the dealer training manual, and the K(SA) and Aquatic category manuals`,
  disclaimerHTML: `Questions were extracted from the national
    <a href="https://www.epa.gov/system/files/documents/2022-09/national-pesticide-applicator-cert-core-manual-2014.pdf"
       target="_blank" rel="noopener">core</a> and
    <a href="https://www.epa.gov/system/files/documents/2023-11/national-aerial-applicator-manual-2014.pdf"
       target="_blank" rel="noopener">aerial</a> applicator manuals and from North Carolina's
    <a href="https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByArticle/Chapter_143/Article_52.pdf"
       target="_blank" rel="noopener">pesticide law</a> and
    <a href="http://reports.oah.state.nc.us/ncac/title%2002%20-%20agriculture%20and%20consumer%20services/chapter%2009%20-%20food%20and%20drug%20protection/subchapter%20l/subchapter%20l%20rules.pdf"
       target="_blank" rel="noopener">rules</a>, and from NC State Extension's
    <a href="https://content.ces.ncsu.edu/pesticide-applicator-certification-and-licensing"
       target="_blank" rel="noopener">AG-714</a> on certification and licensing, and from
    three printed North Carolina manuals: <em>Ectoparasites of Pets</em> (1994) for the
    K(SA) exam, the <em>Aquatic Weed Management Training Manual</em> (1991) for the
    Aquatic exam, and the still-current chapters of the <em>Pesticide Training Manual for
    Restricted Use Pesticide Dealers</em> (1995) for the Dealer exam; accuracy is not guaranteed. Each question links to where it came from, so verify
    anything important against the source, and check the law questions against the current
    section: statutes and rules are amended, and fees and deadlines move first.
    North Carolina's exams are written from the NC manuals, which cover the same material,
    and the actual exam questions are not public; no claim is made that these match or
    resemble them. All progress is stored locally in your browser and never sent to a server.`,
  aboutIntroHTML: `<p>NC Pesticide Trainer is a free, open-source study tool for the North Carolina
    pesticide applicator certification exams. Its ${WRITTEN_COUNT} questions were written from the
    <a href="https://www.epa.gov/system/files/documents/2022-09/national-pesticide-applicator-cert-core-manual-2014.pdf"
       target="_blank" rel="noopener">National Pesticide Applicator Certification
    Core Manual</a>, which covers the Core exam, the
    <a href="https://www.epa.gov/system/files/documents/2023-11/national-aerial-applicator-manual-2014.pdf"
       target="_blank" rel="noopener">National Aerial Applicator's Manual</a>, which
    covers the Aerial Methods exam, and North Carolina's own pesticide law: the
    <a href="https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByArticle/Chapter_143/Article_52.pdf"
       target="_blank" rel="noopener">Pesticide Law of 1971</a> and the Pesticide Board's
    <a href="http://reports.oah.state.nc.us/ncac/title%2002%20-%20agriculture%20and%20consumer%20services/chapter%2009%20-%20food%20and%20drug%20protection/subchapter%20l/subchapter%20l%20rules.pdf"
       target="_blank" rel="noopener">rules</a> under it, which every NC exam asks about.
    A fifth source covers the certification system itself, which no manual describes:
    NC State Extension's
    <a href="https://content.ces.ncsu.edu/pesticide-applicator-certification-and-licensing"
       target="_blank" rel="noopener">Pesticide Applicator Certification and Licensing</a>
    (AG-714), on exam formats, recertification credits, noncertified applicator training,
    and reciprocity. On top of those come the first two North Carolina category manuals
    in the bank: <em>Ectoparasites of Pets</em> (J. J. Arends, NC Agricultural Extension
    Service, 1994), the study manual for the Agricultural Pest Animal &ndash; Small Animal
    category, K(SA) &mdash; applicators applying pesticides to pets and the places pets are
    confined, pet groomers included &mdash; and the <em>Aquatic Weed Management Training
    Manual</em> (K. A. Langeland ed., 1991, revised for North Carolina), the study manual
    for the Aquatic Pest Control category (A), covering herbicide technology, safety,
    adjuvants, application equipment, dosage calculation, biological and mechanical
    control, environmental effects, and aquatic plant identification. An eighth source
    covers the dealer's own trade: the printed <em>Pesticide Training Manual for Restricted
    Use Pesticide Dealers</em> (NCDA and NC Cooperative Extension Service, 1995), the study
    manual for the Pesticide Dealer exam. Only its still-current chapters are asked from it
    &mdash; store practice, the other laws a dealer meets, and dealer recertification &mdash;
    while everything it restates from the law and rules is asked from the current statute and
    rules instead, since its 1995 fees and superseded recordkeeping pages no longer bind anyone.
    Every question cites where it came from, by page for the manuals, by section for
    the law, and by heading for AG-714. Wherever the source is free to read online, the
    citation is a link, so it opens the source in the right place and you can check
    anything important against it; the NC dealer and category manuals are sold in print, so
    their questions name the printed page instead.</p>
    <p>${DRILL_COUNT} of the cards are calculation drills rather than written questions. A
    drill is one of the methods the manuals teach — the dosage formulas in the core
    manual's appendix C, the area and calibration-test arithmetic in its chapter 11,
    the aerial manual's whole sequence from a timed catch to the gallons that go in the
    tank, and the aquatic manual's dosage and boat-calibration chapter, from pond acres
    and the 2.7 acre-foot constant to gallons per acre from a timed run — with new
    numbers drawn every time it comes up. What gets easy is doing the
    conversion rather than recalling the answer it had last time, and each wrong choice is
    a particular mistake — a conversion left out, a ratio inverted, a decimal misplaced —
    rather than a number near the right one. A nonprogrammable calculator is allowed at
    the exam site, so the arithmetic is fair game.</p>`,
  aboutCaveatHTML: `<p><strong>The subject matter here comes from the national manuals, not from a North
    Carolina one.</strong> The national manuals are published by the NASDA Research Foundation,
    hosted by EPA, and free to read, which is why this bank can cite them page by page. NC
    pesticide law is free to read too, from the General Assembly and the Office of
    Administrative Hearings, so this bank covers it. So is AG-714, published rather than
    sold by NC State Extension, which is what lets the bank cover the certification and
    licensing system the way North Carolina explains it. North Carolina's own study texts, the
    NC Pesticide Applicator Certification Core Manual and the category manuals, are sold in
    print by the
    <a href="https://go.ncsu.edu/psep" target="_blank" rel="noopener">NC State Pesticide Safety
    Education Program</a>. They are adapted from these national manuals and add material,
    particularly for the categories, that nothing free covers. Three of them are
    now in the bank: <em>Ectoparasites of Pets</em>, the K(SA) category manual, the
    <em>Aquatic Weed Management Training Manual</em>, the Aquatic (A) category manual,
    and the <em>Pesticide Training Manual for Restricted Use Pesticide Dealers</em>, the
    dealer manual, whose questions cite the printed page without a link since there is no
    public PDF to open. The dealer manual dates from 1995, so only its still-current
    chapters are asked from it; where it restates the law and rules, or where the law has
    since moved past it, the questions come from the current statute and rules instead.
    Questions from the remaining category manuals are planned, and each will cite
    its own manual the same way.</p>
    <p>Questions were extracted from the sources by a language model and reviewed for
    accuracy, but mistakes are possible and accuracy is not guaranteed. Law changes:
    the statute and rules were current when the questions were written, and a citation
    that no longer matches the linked section is a question to report. The
    actual exam questions are not public, and no claim is made that these match
    or resemble them.</p>`,
};
