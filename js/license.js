/* NC pesticide license lookup. Queries the North Carolina Department of
   Agriculture public license search — the same public data behind
   apps.ncagr.gov/AgRSysPortalV2/licensesearch — and caches the result so the
   card shows instantly and only touches the network when the user asks it to.

   More than one license can be kept, because more than one is the normal
   case: an aerial applicator holds a pilot license and a commercial ground
   one, and the business they fly for holds a contractor license on top. Each
   is saved under its own (number, type) pair and refreshed on its own.

   This is the one place the app talks to a server. The cache lives under its
   own localStorage key and is never folded into the study state that Export
   writes, so a progress backup stays a progress backup. What the user *types
   in* on top of the record — credits logged before they post, categories
   declared on a bucketless record — is theirs rather than a cache, so that
   layer alone rides along in a backup (see the Store wrappers at the end). */
const License = (() => {
  const API = 'https://apps.ncagr.gov/AgRSysAPI/api';
  // The portal ships this fixed anonymous credential in its own public
  // JavaScript bundle; the public search is unauthenticated in every way but
  // needing a bearer token minted from it. If NCAGR ever rotates it the token
  // request just fails, the lookup reports it, and any cached card stays put.
  const PORTAL_USER = 'AgrSysPortal';
  const PORTAL_PASS = 'V]Na`Ck[!XFP(ts-nnE-V]a+Hd->j[99%QR#Ls>!u)UbsTVgU#9!!!NPF4Cj?9!L.';
  // With no credential to mint a token from there is nothing the lookup can
  // do, so the whole feature (its nav tab and its view) is hidden rather than
  // shown broken. Blank either constant above to turn it off.
  const enabled = Boolean(PORTAL_USER.trim() && PORTAL_PASS.trim());
  const TOKEN_KEY = 'ncagr-token';       // {token, exp} — cached bearer token
  const CACHE_KEY = 'ncagr-licenses';    // {v, list:[{input, record, fetchedAt}]}
  const LEGACY_KEY = 'ncagr-license';    // the single {input, record, fetchedAt} this replaced
  const USER_KEY = 'ncagr-user';         // {v, byLicense:{key:{pending, categories}}}
  const TIMEOUT = 15000;
  // Enough for a pilot's own licenses plus the contractor they fly under and
  // a spouse or two, and low enough that the cache stays a cache. Adding past
  // it drops the least recently refreshed.
  const MAX_SAVED = 8;

  // Pesticide license types, from the portal's own ownerlicensetypes list
  // (the two pesticide owners, FDPE and FDPR). The owner scopes the search, so
  // it travels with each type rather than being a second thing to pick.
  //
  // `kind` is which set of recertification rules the license renews under
  // (see data/recert-credits.js). The letter buckets on a record cannot say:
  // an aerial applicator and a ground one both hold work categories, and only
  // the license type tells them apart.
  const TYPES = [
    { id: '026', owner: 'FDPE', kind: 'commercial', label: 'Commercial Pesticide Applicator (026)' },
    { id: '038', owner: 'FDPR', kind: 'private', label: 'Private Pesticide Applicator (038)' },
    { id: '027', owner: 'FDPE', kind: 'aerial', label: 'Aerial Pesticide Applicator (Pilot) (027)' },
    { id: '028', owner: 'FDPE', kind: 'aerial', label: 'Aerial Pesticide Applicator (Contractor) (028)' },
    { id: '029', owner: 'FDPE', kind: 'aerial', label: 'Aerial Pesticide Applicator (Apprentice) (029)' },
    { id: '030', owner: 'FDPE', kind: 'commercial', label: 'Pesticide Consultant (030)' },
    { id: '031', owner: 'FDPE', kind: 'commercial', label: 'Public Pesticide Operator (Fed-State)-Ground (031)' },
    { id: '032', owner: 'FDPE', kind: 'commercial', label: 'Public Pesticide Operator (County-Municipal)-Ground (032)' },
    { id: '033', owner: 'FDPE', kind: 'commercial', label: 'Public Pesticide Operator (Public Utility)-Ground (033)' },
    { id: '034', owner: 'FDPE', kind: 'aerial', label: 'Public Aerial Pesticide (Fed-State)-Pilot (034)' },
    { id: '035', owner: 'FDPE', kind: 'aerial', label: 'Public Aerial Pesticide (County-Municipal)-Pilot (035)' },
    { id: '037', owner: 'FDPE', kind: 'commercial', label: 'Pesticide Dealer (037)' },
  ];
  const typeById = id => TYPES.find(t => t.id === id);
  // Commercial is the fallback because it is the rule set every license but
  // the private and aerial ones renews under, so an id the list has not heard
  // of still gets the right answer more often than not.
  const kindOf = id => (typeById(id) || {}).kind || 'commercial';

  const readJSON = key => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  };
  const writeJSON = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota/private mode: non-fatal */ }
  };

  // exp is seconds since epoch in the JWT; a minute of slack keeps a token
  // that is about to lapse from being sent and bouncing as 401.
  function tokenExpiry(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    } catch { return 0; }
  }

  async function fetchJSON(url, opts) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function mintToken() {
    let res;
    try {
      res = await fetchJSON(`${API}/authorization/getusertoken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: PORTAL_USER, passphrase: PORTAL_PASS }),
      });
    } catch {
      throw new Error('Could not reach the NC license search. Check your connection and try again.');
    }
    if (!res.ok) throw new Error('The NC license search turned the app away. It may have changed; try again later.');
    const body = await res.json().catch(() => null);
    const token = body && body.Token;
    if (!token) throw new Error('The NC license search sent back nothing usable. Try again later.');
    writeJSON(TOKEN_KEY, { token, exp: tokenExpiry(token) });
    return token;
  }

  function cachedToken() {
    const t = readJSON(TOKEN_KEY);
    return t && t.token && t.exp - Date.now() > 60000 ? t.token : null;
  }

  // GET an API path with a bearer token, minting one first if none is cached
  // and re-minting once if the cached one is rejected (expired server-side, or
  // the signing key rotated). Anything past that is a real failure.
  async function authedGet(path) {
    let token = cachedToken() || await mintToken();
    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await fetchJSON(`${API}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
      } catch {
        throw new Error('Could not reach the NC license search. Check your connection and try again.');
      }
      if (res.status === 401 && attempt === 0) {
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* non-fatal */ }
        token = await mintToken();
        continue;
      }
      if (!res.ok) throw new Error('The NC license search returned an error. Try again later.');
      return res.json();
    }
    // Unreachable: the loop either returns a body or throws.
    throw new Error('The NC license search returned an error. Try again later.');
  }

  // Keep only what the card shows, so the cache never holds more of the
  // record (email, phone, mailing address) than the feature needs.
  function normalize(d) {
    return {
      name: d.Name || d.EntityName || '',
      number: d.LicenseNumber,
      licenseType: (d.LicenseType || '').trim(),
      licenseTypeId: d.LicenseTypeId || '',
      owner: d.Owner || '',
      county: d.County || '',
      status: d.Status || '',
      expire: d.Expire || '',
      issueDate: d.IssueDate || '',
      originalIssue: d.OriginalIssue || '',
      recertBy: d.RecertificationDateString || '',
      creditTotals: d.CourseCreditTotals || '',
      courses: (Array.isArray(d.Courses) ? d.Courses : []).map(c => ({
        name: (c.CourseName || '').trim(),
        date: c.CourseDate || '',
        credits: (c.CourseString || '').trim(),
      })),
    };
  }

  // A saved license is identified by what was typed to find it, not by
  // anything the record carries: the same number exists under more than one
  // type, and the record's own fields are what a refresh replaces.
  const keyOf = input => `${input.typeId}:${input.number}`;

  // What the user tracks on top of the state record, under its own key so a
  // refresh — which replaces a cache entry wholesale — never touches it:
  // credits from a course taken but not yet posted, and categories declared
  // on a record that shows no buckets yet (a fresh cycle shows none, so there
  // is nothing to infer them from). Keyed like the cache, so the data
  // survives the cache cap evicting its entry and reattaches when the
  // license is looked up again.
  function sanitizeUser(raw) {
    const out = {};
    const by = raw && typeof raw === 'object' && raw.byLicense && typeof raw.byLicense === 'object'
      ? raw.byLicense : {};
    Object.entries(by).forEach(([key, u]) => {
      if (!u || typeof u !== 'object') return;
      const pending = (Array.isArray(u.pending) ? u.pending : [])
        .filter(p => p && typeof p === 'object'
          && typeof p.code === 'string' && p.code
          && Number.isFinite(p.hours) && p.hours > 0)
        .map(p => ({
          code: p.code,
          hours: p.hours,
          date: typeof p.date === 'string' ? p.date : '',
          name: typeof p.name === 'string' ? p.name : '',
        }));
      const categories = [...new Set((Array.isArray(u.categories) ? u.categories : [])
        .filter(c => typeof c === 'string' && c))];
      if (pending.length || categories.length) out[key] = { pending, categories };
    });
    return { v: 1, byLicense: out };
  }
  const userAll = () => sanitizeUser(readJSON(USER_KEY));
  const userData = key => userAll().byLicense[key] || { pending: [], categories: [] };
  function writeUser(key, u) {
    const all = userAll();
    if (u.pending.length || u.categories.length) all.byLicense[key] = u;
    else delete all.byLicense[key];
    writeJSON(USER_KEY, all);
  }

  // Log a credit the record does not show yet. Sanitized on the way in, so a
  // half-filled form cannot store an entry the meters would choke on.
  function logPending(key, entry) {
    const code = String((entry && entry.code) || '').trim();
    const hours = Number(entry && entry.hours);
    if (!code || !Number.isFinite(hours) || hours <= 0) return false;
    const u = userData(key);
    u.pending.push({
      code, hours,
      date: String((entry && entry.date) || '').trim(),
      name: String((entry && entry.name) || '').trim(),
    });
    writeUser(key, u);
    return true;
  }

  function dropPending(key, index) {
    const u = userData(key);
    if (index < 0 || index >= u.pending.length) return;
    u.pending.splice(index, 1);
    writeUser(key, u);
  }

  function setCategories(key, codes) {
    const u = userData(key);
    u.categories = [...new Set((Array.isArray(codes) ? codes : [])
      .filter(c => typeof c === 'string' && c))];
    writeUser(key, u);
  }

  // '6/30/2028' (the record) and '2028-06-30' (a date input) name the same
  // day; reduce either to one comparable key, or null when unreadable.
  function dateKey(s) {
    const str = String(s || '').trim();
    let m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
    if (m) return `${m[3]}-${Number(m[1])}-${Number(m[2])}`;
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str);
    if (m) return `${m[1]}-${Number(m[2])}-${Number(m[3])}`;
    return null;
  }

  // A pending credit is done when the record catches up: a course on the same
  // date whose credit string carries at least those hours in that category.
  // Matched entries are dropped so an hour is never counted twice; the rest
  // stay, since a record can lag its courses by weeks. Runs on every lookup,
  // which is the only moment the record can have changed.
  function prunePending(key, record) {
    const u = userData(key);
    if (!u.pending.length) return;
    const posted = (record.courses || []).map(c => ({
      date: dateKey(c.date),
      buckets: RECERT.parseCourse(c.credits),
    }));
    u.pending = u.pending.filter(p => {
      const d = dateKey(p.date);
      return !posted.some(c => c.date && c.date === d
        && c.buckets.some(b => b.code === p.code && b.earned >= p.hours));
    });
    writeUser(key, u);
  }

  // The saved list, newest refresh first, migrating the single-entry key this
  // replaced on the way. An entry is only kept if it still has the input that
  // would refresh it, since an entry that cannot be refreshed is a card that
  // can only ever go stale.
  function saved() {
    const stored = readJSON(CACHE_KEY);
    const list = stored && Array.isArray(stored.list) ? stored.list : migrate();
    return list.filter(e =>
      e && e.record && e.input && e.input.number && e.input.typeId);
  }

  // The pre-multi-license cache held one entry under its own key. Lift it
  // into the list and drop the old key, so an upgrade keeps the card the user
  // already had rather than presenting them an empty page.
  function migrate() {
    const old = readJSON(LEGACY_KEY);
    if (!old || !old.record || !old.input) return [];
    const list = [old];
    writeJSON(CACHE_KEY, { v: 1, list });
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* non-fatal */ }
    return list;
  }

  // Save an entry, replacing any earlier lookup of the same license so a
  // refresh updates in place rather than stacking a second copy of the same
  // card. Newest first, capped: the list is a convenience, not a record.
  function store(entry) {
    const list = [entry, ...saved().filter(e => keyOf(e.input) !== keyOf(entry.input))]
      .slice(0, MAX_SAVED);
    writeJSON(CACHE_KEY, { v: 1, list });
    return list;
  }

  // Look a license up fresh and cache it. number is the printed license
  // number; typeId is one of TYPES[].id. Throws a user-facing Error on any
  // failure so the view can show its message verbatim.
  async function lookup(number, typeId) {
    const num = String(number || '').trim();
    const type = typeById(typeId);
    if (!num) throw new Error('Enter your license number.');
    if (!type) throw new Error('Pick your license type.');

    const params = new URLSearchParams({
      owner: type.owner,
      licensenumber: num,
      pagenumber: '1',
      exacttext: 'false',
    });
    const results = await authedGet(`publiclicensesearch/searchV2?${params}`);
    const rows = (results && Array.isArray(results.Data)) ? results.Data : [];
    // A number can appear under more than one type for the same person, so
    // pin it to the type the user chose rather than taking the first row.
    const match = rows.find(r => String(r.LicenseTypeId) === typeId)
      || (rows.length === 1 ? rows[0] : null);
    if (!match) {
      throw new Error(`No ${type.label} found for license number ${num}. Check the number and type.`);
    }
    const detail = await authedGet(`publiclicensesearch/publiclicensedetail/${match.LID}`);
    const record = normalize(detail);
    const entry = { input: { number: num, typeId }, record, fetchedAt: Date.now() };
    store(entry);
    prunePending(keyOf(entry.input), record);
    return entry;
  }

  // Forget one saved license, returning what is left. What the user logged
  // against it goes with it: "forget this license" means all of it.
  function remove(key) {
    const list = saved().filter(e => keyOf(e.input) !== key);
    writeJSON(CACHE_KEY, { v: 1, list });
    writeUser(key, { pending: [], categories: [] });
    return list;
  }

  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch { /* non-fatal */ }
  }

  // Settings' data controls live in the engine and know only Store, so its
  // three verbs are wrapped here rather than edited there: Reset everything
  // clears the license keys too (a card surviving a full reset is a surprise,
  // not a feature), and a backup carries the user-entered layer — pending
  // credits and declared categories — while the fetched records stay out of
  // it, since they are a cache of state data a lookup re-fetches. Absent
  // under node, where the tests load this file without the engine.
  if (typeof Store !== 'undefined' && Store && typeof Store.reset === 'function') {
    const engine = {
      reset: Store.reset, exportJSON: Store.exportJSON, importJSON: Store.importJSON,
    };
    Store.reset = () => { clearCache(); engine.reset(); };
    Store.exportJSON = () => {
      const user = userAll();
      if (!Object.keys(user.byLicense).length) return engine.exportJSON();
      const out = JSON.parse(engine.exportJSON());
      out.licenseUser = user;
      return JSON.stringify(out, null, 2);
    };
    Store.importJSON = text => {
      engine.importJSON(text); // throws on a bad file before anything applies
      try {
        const parsed = JSON.parse(text);
        // Only a backup that carries the layer replaces it: a file from
        // before the field existed must not silently wipe what is here.
        if (parsed && parsed.licenseUser && typeof parsed.licenseUser === 'object') {
          writeJSON(USER_KEY, sanitizeUser(parsed.licenseUser));
        }
      } catch { /* the engine accepted the file; the extra layer is best-effort */ }
    };
  }

  return { enabled, TYPES, MAX_SAVED, kindOf, keyOf, lookup, saved, remove, clearCache,
           userData, logPending, dropPending, setCategories };
})();
