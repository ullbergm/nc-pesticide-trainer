import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    // Browser scripts loaded via <script> tags. These files define one shared
    // global each (QUESTION_BANK, FSRS, Store), consumed by js/app.js;
    // storage.js reads its localStorage key out of EXAM_CONFIG.
    files: ['js/fsrs.js', 'js/storage.js', 'data/questions.js', 'data/manual-pages.js',
      'data/aerial-pages.js', 'data/law-pages.js', 'data/rules-pages.js',
      'data/ncsu-anchors.js', 'data/problems.js', 'data/recert-credits.js',
      'data/app-assets.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, EXAM_CONFIG: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(FSRS|Store|QUESTION_BANK|MANUAL_PAGES|AERIAL_PAGES|LAW_PAGES|RULES_PAGES|NCSU_ANCHORS|PROBLEM_TEMPLATES|RECERT|APP_ASSETS)$' }],
    },
  },
  {
    // The drill engine reads its templates from data/problems.js and appends
    // the questions it builds from them to the bank.
    files: ['js/problems.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        PROBLEM_TEMPLATES: 'readonly',
        QUESTION_BANK: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^Problems$' }],
    },
  },
  {
    // Same, but readiness.js reads the FSRS global rather than defining it,
    // and takes its pass mark from EXAM_CONFIG when that is loaded.
    files: ['js/readiness.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, FSRS: 'readonly', EXAM_CONFIG: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^Readiness$' }],
    },
  },
  {
    // The exam config loads after the bank and the page maps, and reads all
    // of them: one map per manual it lists.
    files: ['data/exam-config.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        QUESTION_BANK: 'readonly',
        MANUAL_PAGES: 'readonly',
        AERIAL_PAGES: 'readonly',
        LAW_PAGES: 'readonly',
        RULES_PAGES: 'readonly',
        NCSU_ANCHORS: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^EXAM_CONFIG$' }],
    },
  },
  {
    // The license lookup is self-contained: it defines one global and reads
    // only the DOM and localStorage.
    files: ['js/license.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^License$' }],
    },
  },
  {
    // The on-screen calculator is self-contained too: it owns its state and
    // its markup and reads nothing but the DOM it was given.
    files: ['js/calculator.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^Calculator$' }],
    },
  },
  {
    files: ['js/app.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        QUESTION_BANK: 'readonly',
        EXAM_CONFIG: 'readonly',
        Calculator: 'readonly',
        FSRS: 'readonly',
        Problems: 'readonly',
        Readiness: 'readonly',
        Store: 'readonly',
        License: 'readonly',
        RECERT: 'readonly',
      },
    },
  },
  {
    // Documentation tooling: injected into a throwaway copy of index.html by
    // docs/screenshots/generate.sh, never part of the app.
    files: ['docs/screenshots/seed.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, QUESTION_BANK: 'readonly', EXAM_CONFIG: 'readonly' },
    },
  },
  {
    // The license view renders on top of js/license.js and the AG-714 table,
    // and registers its route on self.APP_VIEWS for the engine.
    files: ['js/license-view.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, License: 'readonly', RECERT: 'readonly' },
    },
  },
  {
    // APP_ASSETS comes from data/app-assets.js via importScripts.
    files: ['sw.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.serviceworker, APP_ASSETS: 'readonly' },
    },
  },
  {
    // Node scripts run by hand to regenerate committed data files.
    files: ['tools/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    // The Playwright harness: node-side runner files that also carry snippets
    // executed in the page via page.evaluate, so both global sets apply.
    files: ['tests/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        QUESTION_BANK: 'readonly', MANUAL_PAGES: 'readonly',
        AERIAL_PAGES: 'readonly', LAW_PAGES: 'readonly',
        RULES_PAGES: 'readonly', NCSU_ANCHORS: 'readonly', EXAM_CONFIG: 'readonly',
        FSRS: 'readonly', Readiness: 'readonly',
        PROBLEM_TEMPLATES: 'readonly', Problems: 'readonly',
        RECERT: 'readonly', License: 'readonly',
      },
    },
  },
  {
    // The pre-boot session plant runs inside tests/test.html before app.js
    // and defines AOTA for the suite.
    files: ['tests/plant-session.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, QUESTION_BANK: 'readonly', EXAM_CONFIG: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^AOTA$' }],
    },
  },
  {
    // The engine browser suite runs inside tests/test.html against the real app.
    files: ['tests/engine-suite.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        QUESTION_BANK: 'readonly', EXAM_CONFIG: 'readonly',
        FSRS: 'readonly', Readiness: 'readonly', Store: 'readonly',
        AOTA: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^TestSuite$' }],
    },
  },
  {
    // This app's browser tests run after the engine suite, through its harness.
    files: ['tests/app-suite.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        QUESTION_BANK: 'readonly', EXAM_CONFIG: 'readonly',
        Store: 'readonly', TestSuite: 'readonly',
      },
    },
  },
];
