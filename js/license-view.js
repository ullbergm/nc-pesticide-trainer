/* The License tab: NC license lookup cards with recertification-credit
   meters, plus the planning layer on top of them — credits logged before the
   record shows them, categories declared on a bucketless record, per-year
   timing against the two-year spread rule, and a shortfall banner injected
   into the engine's Home view. App-specific UI on top of js/license.js (the
   portal client and the user-data layer) and data/recert-credits.js (what
   AG-714 asks of each category), registered with the engine through its
   APP_VIEWS hook: the engine routes #license to renderLicense and hands it
   the view surface. When no portal credential is configured the view never
   registers, the engine drops the route, and the nav tab is removed at boot.
   Loads after js/license.js and before js/app.js. */
(() => {
  if (!License.enabled) return;

  const DAY = 24 * 60 * 60 * 1000;
  // Bound at each render from the engine's view context; the helpers below
  // only run from inside renderLicense, so they always see current bindings.
  let view, $, esc, cfg;

  // The Home banner renders before any view context is bound, so it cannot
  // borrow the engine's esc; everything outside renderLicense escapes with
  // this one instead.
  const escHTML = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // The NC search prints dates as M/D/YYYY. Parse to a local Date, or null
  // when the string is empty or not a date, so callers can fall back to
  // showing the raw text.
  function parseUSDate(s) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || '').trim());
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // A pending credit's date comes from a date input, which writes YYYY-MM-DD.
  function parseISODate(s) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '').trim());
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const fmtDate = d =>
    d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  // "in 3 months" / "5 days ago", rounded to whatever unit reads cleanly at
  // that distance. Used for the expiration and recertification deadlines.
  function relDays(d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((d - today) / DAY);
    if (days === 0) return 'today';
    const n = Math.abs(days);
    let phrase;
    if (n < 60) phrase = `${n} day${n === 1 ? '' : 's'}`;
    else if (n < 550) { const mo = Math.round(n / 30); phrase = `${mo} month${mo === 1 ? '' : 's'}`; }
    else { const yr = Math.round(n / 36.5) / 10; phrase = `${yr} year${yr === 1 ? '' : 's'}`; }
    return days > 0 ? `in ${phrase}` : `${phrase} ago`;
  }

  // How long ago the cached lookup was fetched, for the "last checked" line.
  function relTime(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    return `on ${new Date(ts).toLocaleDateString()}`;
  }

  const titleCase = s =>
    String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const fmtHours = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const hrs = n => `hour${n === 1 ? '' : 's'}`;

  // Credits earned against credits owed. The record counts only what was
  // earned; data/recert-credits.js supplies what each letter asks of this
  // licence, which depends on the other letters beside it, so the two are
  // zipped here into one meter per category. Two user-entered layers join
  // the record's: categories declared on a record that shows no buckets yet
  // enter the plan at zero earned, and pending credits — courses taken but
  // not yet posted — count beside the earned hours rather than into them.
  function creditPlan(record, user) {
    const earned = RECERT.parseTotals(record.creditTotals);
    const kind = License.kindOf(record.licenseTypeId);
    const held = earned.map(e => e.code);
    const declared = (user.categories || []).filter(c => !held.includes(c));
    const required = RECERT.plan(held.concat(declared), kind);
    const byCode = new Map(required.map(r => [r.code, r]));
    const pendingBy = new Map();
    (user.pending || []).forEach(p =>
      pendingBy.set(p.code, (pendingBy.get(p.code) || 0) + p.hours));
    const rows = earned.concat(declared.map(code => ({ code, earned: 0 })))
      .map(e => ({ ...e, ...(byCode.get(e.code) || {}), pending: pendingBy.get(e.code) || 0 }));
    // Only the categories with a requirement can be totalled; Core and any
    // letter the table does not know sit outside the sum rather than
    // dragging it silently off.
    const scored = rows.filter(r => typeof r.required === 'number');
    const need = scored.reduce((n, r) => n + r.required, 0);
    const met = scored.reduce((n, r) => n + Math.min(r.earned, r.required), 0);
    const pendingMet = scored.reduce(
      (n, r) => n + Math.min(r.earned + r.pending, r.required), 0) - met;
    return { rows, need, met, pendingMet, kind,
      short: Math.max(0, need - met - pendingMet) };
  }

  // The ground-category timing rule the totals cannot carry: credits must be
  // earned in at least two years of the five-year period (02 NCAC 09L
  // .0522(a)). Only the course list says when hours landed, so a record
  // without one gets no opinion rather than a false all-clear.
  function spreadHTML(record, kind, short) {
    if (kind !== 'commercial') return '';
    const years = RECERT.creditYears(record.courses);
    if (!years.length || years.length >= RECERT.SPREAD_YEARS) return '';
    const y = years[0].year;
    return short === 0
      ? `<p class="crspread warn">All of this cycle's hours were earned in ${y}, but
           ground-category credits must come from at least two different years of the
           five-year cycle (02 NCAC 09L .0522) — a course in another year is still needed.</p>`
      : `<p class="crspread hint">Hours so far are all from ${y}; ground-category credits
           must come from at least two different years of the cycle.</p>`;
  }

  function creditsHTML(record, plan) {
    const { rows, need, met, pendingMet, kind, short } = plan;
    if (!rows.length) return '<p class="hint">No credits on record for this cycle.</p>';
    const recert = parseUSDate(record.recertBy);
    const cycle = RECERT.CYCLES[kind];
    // The record's own recertification date beats the rulebook prose: "due
    // Jun 30, 2028 (in 22 months)" is a deadline, "June 30 of the year the
    // certification expires" is homework.
    const due = recert
      ? `due ${esc(fmtDate(recert))} (${esc(relDays(recert))})`
      : cycle ? `due by ${esc(cycle.due)}` : '';
    const pendBit = pendingMet > 0 ? ` — ${fmtHours(pendingMet)} pending` : '';
    const summary = need === 0
      ? ''
      : short === 0
        ? met >= need
          ? `<p class="crsum met">All ${fmtHours(need)} hours earned for this cycle.</p>`
          : `<p class="crsum pend">${fmtHours(met)} of ${fmtHours(need)} hours earned${pendBit}
               — covered once they post.</p>`
        : `<p class="crsum">${fmtHours(met)} of ${fmtHours(need)} hours earned${pendBit} —
             <b>${fmtHours(short)} short</b>${due ? `, ${due}` : ''}.</p>`;
    // What to go looking for, biggest hole first, and the pace that fills it
    // by the deadline. The pace only speaks when there is enough runway for
    // "a year" to mean anything.
    const missing = rows
      .filter(r => typeof r.required === 'number' && r.earned + r.pending < r.required)
      .map(r => ({ ...r, gap: r.required - Math.min(r.earned + r.pending, r.required) }))
      .sort((a, b) => b.gap - a.gap);
    const needList = short > 0 && missing.length
      ? `<p class="crneed">Still needed: ${missing.map(r =>
          `<b>${fmtHours(r.gap)}</b> ${hrs(r.gap)} in ${esc(r.code)}${
            r.name ? ` (${esc(r.name)})` : ''}`).join(' · ')}</p>`
      : '';
    let pace = '';
    if (short > 0 && recert && recert - Date.now() > 180 * DAY) {
      const rate = Math.ceil((short / ((recert - Date.now()) / (365.25 * DAY))) * 2) / 2;
      pace = `<p class="crpace hint">About ${fmtHours(rate)} ${hrs(rate)} of approved
        courses a year from here covers it.</p>`;
    }
    return `
      <ul class="creditlist">
        ${rows.map(r => {
          const has = typeof r.required === 'number';
          const pct = has && r.required > 0
            ? Math.min(100, Math.round((r.earned / r.required) * 100)) : 0;
          const pendPct = has && r.required > 0 && r.pending > 0
            ? Math.min(100 - pct, Math.round((r.pending / r.required) * 100)) : 0;
          const rowMet = has && r.earned >= r.required;
          return `
            <li class="credit${has ? (rowMet ? ' met' : ' short') : ' untargeted'}">
              <div class="crhead">
                <span class="crname"><b>${esc(r.code)}</b>${
                  r.name ? ` ${esc(r.name)}` : ''}</span>
                <span class="crnum">${fmtHours(r.earned)}${
                  r.pending ? ` <span class="crpend">+ ${fmtHours(r.pending)}</span>` : ''}${
                  has ? ` <span class="crof">of ${fmtHours(r.required)}</span>` : ''}</span>
              </div>
              ${has
                ? `<div class="crbar"><span class="fill" style="width:${pct}%"></span>${
                    pendPct ? `<span class="pend" style="width:${pendPct}%"></span>` : ''}</div>`
                : ''}
              ${r.rule ? `<div class="crrule">${esc(r.rule)}</div>` : ''}
            </li>`;
        }).join('')}
      </ul>
      ${summary}
      ${needList}
      ${pace}
      ${spreadHTML(record, kind, short)}`;
  }

  // Categories declared by hand, offered only while the record shows no
  // credit buckets: with none, there is nothing to infer the categories from
  // and nothing to score, which is exactly when a plan is most wanted. The
  // record takes over the moment credits post.
  function catsHTML(record, user, key, kind) {
    if (RECERT.parseTotals(record.creditTotals).length) return '';
    const chosen = new Set(user.categories || []);
    const offer = Object.entries(RECERT.CATEGORIES).filter(([code, c]) => {
      if (kind === 'private') return code === 'V' || code === 'X';
      if (typeof c.hours !== 'number') return false;
      if (code === 'V' || code === 'X') return false;
      if (code === 'P') return kind === 'aerial';
      return true;
    });
    return `
      <details class="liccats" open>
        <summary>Certified categories</summary>
        <p class="hint">The record shows no credit buckets yet, so there is nothing to read your
          categories from. Tick the ones on your license to see what each asks this cycle.</p>
        <div class="catgrid">
          ${offer.map(([code, c]) => `
            <label><input type="checkbox" data-cat="${esc(code)}" data-catkey="${esc(key)}"
              ${chosen.has(code) ? 'checked' : ''}>
              <span><b>${esc(code)}</b> ${esc(c.name)}</span></label>`).join('')}
        </div>
      </details>`;
  }

  // Credits the user is waiting on: logged here the day the course is taken,
  // shown as the second segment of each meter, and cleared by the first
  // Refresh that finds the course posted. Offered only when the plan has
  // rows, since a pending hour needs a category to land in.
  function pendingHTML(plan, user, key, window) {
    if (!plan.rows.length) return '';
    const pend = user.pending || [];
    return `
      <details class="licpend"${pend.length ? ' open' : ''}>
        <summary>Credits waiting to post${pend.length ? ` (${pend.length})` : ''}</summary>
        <p class="hint">Took an approved course the record doesn't show yet? Log it and the
          meters count it as pending; it clears itself once a Refresh finds it posted.</p>
        ${pend.length ? `
          <ul class="pendlist">
            ${pend.map((p, i) => {
              const d = parseISODate(p.date);
              const off = window && d && (d < window.start || d > window.end);
              return `
              <li><span class="cname">${esc(p.name || 'Course')}</span>
                <span class="cmeta">${p.date
                  ? `${esc(fmtDate(d) || p.date)} · ` : ''}${
                  esc(p.code)} · ${fmtHours(p.hours)} ${hrs(p.hours)}${
                  off ? ' · <span class="pendoff">outside this cycle</span>' : ''}</span>
                <button class="btn" data-penddrop="${esc(key)}" data-pendix="${i}">Remove</button>
              </li>`;
            }).join('')}
          </ul>` : ''}
        <div class="pendform">
          <label>Course <input type="text" class="pendname" placeholder="optional"></label>
          <label>Date <input type="date" class="penddate" value="${esc(Store.todayKey())}"></label>
          <label>Category
            <select class="pendcode">
              ${plan.rows.map(r => `<option value="${esc(r.code)}">${esc(r.code)}${
                r.name ? ` — ${esc(r.name)}` : ''}</option>`).join('')}
            </select>
          </label>
          <label>Hours <input type="number" class="pendhours" min="0.5" step="0.5" value="1"></label>
          <button class="btn primary" data-pendadd="${esc(key)}">Log credit</button>
        </div>
      </details>`;
  }

  function coursesHTML(record) {
    if (!record.courses.length) return '';
    const years = RECERT.creditYears(record.courses);
    return `
      <details class="liccourses">
        <summary>${record.courses.length} course${record.courses.length === 1 ? '' : 's'} on record</summary>
        ${years.length ? `<p class="cryears">By year: ${years.map(y =>
          `${y.year} · ${fmtHours(y.hours)} ${hrs(y.hours)}`).join(' — ')}</p>` : ''}
        <ul>
          ${record.courses.map(c =>
            `<li><span class="cname">${esc(c.name || 'Course')}</span>
               <span class="cmeta">${esc(c.date)}${c.credits ? ` · ${esc(c.credits)}` : ''}</span></li>`).join('')}
        </ul>
      </details>`;
  }

  function licenseCard(entry) {
    const r = entry.record;
    const key = License.keyOf(entry.input);
    const user = License.userData(key);
    const plan = creditPlan(r, user);
    const exp = parseUSDate(r.expire);
    const recert = parseUSDate(r.recertBy);
    const window = RECERT.cycleWindow(recert, plan.kind);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expired = exp && exp < today;
    const expSoon = exp && !expired && exp - today <= 60 * DAY;
    const badge = expired ? 'danger' : expSoon ? 'warn' : 'ok';
    // The two dates run on two clocks — the license renews on its own term,
    // the certification runs its multi-year cycle — and side by side they
    // read as a contradiction ("expires before it recertifies?"), so each is
    // labeled with the clock it belongs to. Commercial and aerial licenses
    // renew every calendar year; the private license renews every three
    // (NCDA&CS: $10 every three years), on the same December 31 date.
    const licClock = plan.kind === 'private' ? '3-year license' : 'annual license';
    const cycleYears = window ? `${window.years}-year certification` : 'certification';
    // Which year of the cycle today falls in, so "spread over two years"
    // has a visible denominator.
    const yearOf = window && today >= window.start && today <= window.end
      ? ` · year ${Math.min(window.years,
          Math.floor((today - window.start) / (365.25 * DAY)) + 1)} of ${window.years}`
      : '';
    return `
      <div class="liccard" data-lic="${esc(key)}">
        <div class="lichead">
          <div>
            <div class="licname">${esc(r.name || '—')}</div>
            <div class="licsub">${esc(r.licenseType || '')}${
              r.county ? ` · ${esc(titleCase(r.county))} County` : ''}</div>
          </div>
          <span class="licbadge ${badge}">${esc(r.status || 'Unknown')}</span>
        </div>
        <dl class="licgrid">
          <div><dt>License number</dt><dd>${esc(String(r.number))}</dd></div>
          <div><dt>Expires</dt><dd>${exp
            ? `${esc(fmtDate(exp))} <small>${esc(relDays(exp))}${
                expired ? ' — expired' : ''} · ${esc(licClock)}</small>`
            : esc(r.expire || '—')}</dd></div>
          <div><dt>Recertify by</dt><dd>${recert
            ? `${esc(fmtDate(recert))} <small>${esc(relDays(recert))} · ${esc(cycleYears)}</small>`
            : esc(r.recertBy || '—')}</dd></div>
          ${r.originalIssue
            ? `<div><dt>First licensed</dt><dd>${esc(r.originalIssue)}</dd></div>` : ''}
        </dl>
        <div class="liccredits">
          <h3>Continuing-certification credits</h3>
          ${window ? `<p class="crcycle">Certification cycle: ${esc(fmtDate(window.start))} –
            ${esc(fmtDate(window.end))}${esc(yearOf)}</p>` : ''}
          ${creditsHTML(r, plan)}
        </div>
        ${catsHTML(r, user, key, plan.kind)}
        ${pendingHTML(plan, user, key, window)}
        ${coursesHTML(r)}
        <div class="licfoot">
          <button class="btn primary" data-licrefresh="${esc(key)}">Refresh</button>
          <button class="btn" data-licforget="${esc(key)}">Forget this license</button>
          <span class="hint">Last checked ${esc(relTime(entry.fetchedAt))}</span>
        </div>
      </div>`;
  }

  // Refresh silently when a card's lookup has gone stale, so the meters and
  // the Home banner track a record that changed while the app sat installed.
  // Each license is tried once per page load: a portal that is down must not
  // be hammered on every visit to the tab, and a failed try leaves the cached
  // card exactly as it was — the manual Refresh is the one that reports.
  const STALE_AFTER = 7 * DAY;
  const autoTried = new Set();
  let autoRunning = false;
  async function refreshStale(entries) {
    if (autoRunning) return;
    const due = entries.filter(e => Date.now() - e.fetchedAt > STALE_AFTER
      && !autoTried.has(License.keyOf(e.input)));
    if (!due.length) return;
    autoRunning = true;
    due.forEach(e => autoTried.add(License.keyOf(e.input)));
    let changed = false;
    for (const e of due) {
      try {
        await License.lookup(e.input.number, e.input.typeId);
        changed = true;
      } catch { /* stale card stays put */ }
    }
    autoRunning = false;
    if (changed && view && view.querySelector('#liclist')) renderLicense();
  }

  function renderLicense(ctx) {
    if (ctx) ({ view, $, esc, cfg } = ctx);
    const saved = License.saved();
    const full = saved.length >= License.MAX_SAVED;
    view.innerHTML = `
      <div class="license">
        <h2>My licenses</h2>
        <p class="hint">Look a North Carolina pesticide license up by number and type. This is the
          only screen that reaches a server — the
          <a href="https://apps.ncagr.gov/AgRSysPortalV2/licensesearch" target="_blank" rel="noopener">NC
          Department of Agriculture public license search</a>. Results are cached in this browser, so
          they show instantly, and refresh when you ask — or quietly, once a lookup is more than a
          week old. Keep as many as you hold: a pilot's own license and the contractor they fly
          under are two separate records.</p>
        <div class="licform">
          <label>License number
            <input type="text" id="licnum" inputmode="numeric" autocomplete="off"
              value="" placeholder="e.g. 87690" ${full ? 'disabled' : ''}>
          </label>
          <label>License type
            <select id="lictype" ${full ? 'disabled' : ''}>
              <option value="">Select type…</option>
              ${License.TYPES.map(t =>
                `<option value="${t.id}">${esc(t.label)}</option>`).join('')}
            </select>
          </label>
          <button class="btn primary" id="liclookup" ${full ? 'disabled' : ''}>
            ${saved.length ? 'Add license' : 'Look up'}</button>
        </div>
        <p id="licstatus" class="licstatus" role="status" aria-live="polite">${
          full ? `Forget one to add another; ${License.MAX_SAVED} is the most this keeps.` : ''}</p>
        <div id="liclist">${saved.map(licenseCard).join('')}</div>
        ${saved.length ? `
          <p class="hint">A card carries two deadlines on two clocks, and the expiration is often
            the earlier one. <b>Expires</b> is the license itself, which lapses on December 31 of
            its last year: commercial and aerial licenses renew every calendar year, the private
            license every three. <b>Recertify by</b> is the certification behind the license,
            which runs its own cycle: five years for commercial and dealer licenses (credits due
            June 30 of the cycle's last year), two for aerial (June 30), three for private
            (September 30). Only courses taken inside the current cycle count toward it — the
            record lists earlier ones with no credits — and missing the recertification date
            turns the next renewal into re-taking the exams rather than paying the fee.</p>
          <p class="hint">Letters are NC recertification categories and the first number is what this
            cycle has earned. What each one asks is worked out from
            <a href="${esc(cfg.manuals.ncsu.url)}" target="_blank" rel="noopener">AG-714</a>: the
            highest category held is earned in full and each additional one takes three, except
            demonstration and research, which always takes ten. Aerial certification splits its
            hours differently and runs two years rather than five.</p>
          <p class="disclaimer">These mirror the NC Department of Agriculture public record and can lag
            their system, and the credits each category is shown as owing are worked out here from
            AG-714 rather than read off the record. Credits you log yourself are kept only in this
            browser (and in a progress backup) until the record posts them. The official
            <a href="https://apps.ncagr.gov/AgRSysPortalV2/licensesearch"
            target="_blank" rel="noopener">license search</a> and the
            <a href="https://www.ncagr.gov/divisions/structural-pest-control-and-pesticides"
            target="_blank" rel="noopener">NCDA&amp;CS Pesticide Section</a> are authoritative.</p>` : ''}
      </div>`;

    const statusEl = $('#licstatus');
    const busy = (on, msg) => {
      statusEl.className = 'licstatus';
      statusEl.textContent = on ? msg : '';
      view.querySelectorAll('#liclist button').forEach(b => { b.disabled = on; });
      // Add stays disabled at the cap however the lookup that was running
      // turned out; only a Forget makes room, and that re-renders.
      $('#liclookup').disabled = on || full;
    };

    // Add and Refresh are the same call — a lookup of a (number, type) pair,
    // which stores in place — so the difference is only where the pair comes
    // from and whether the form is cleared afterwards.
    async function run(number, typeId, fromForm) {
      busy(true, 'Checking with the NC license search…');
      try {
        await License.lookup(number, typeId);
        if (fromForm) {
          $('#licnum').value = '';
          $('#lictype').value = '';
        }
        renderLicense();
      } catch (err) {
        busy(false);
        statusEl.className = 'licstatus error';
        statusEl.textContent = err.message;
      }
    }

    const fromForm = () => run($('#licnum').value, $('#lictype').value, true);
    $('#liclookup').addEventListener('click', fromForm);
    $('#licnum').addEventListener('keydown', e => { if (e.key === 'Enter') fromForm(); });

    // Delegated, because the cards are re-rendered wholesale on every change.
    $('#liclist').addEventListener('click', e => {
      const refresh = e.target.closest('[data-licrefresh]');
      if (refresh) {
        const entry = saved.find(x => License.keyOf(x.input) === refresh.dataset.licrefresh);
        if (entry) run(entry.input.number, entry.input.typeId, false);
        return;
      }
      const forget = e.target.closest('[data-licforget]');
      if (forget) {
        License.remove(forget.dataset.licforget);
        renderLicense();
        return;
      }
      const add = e.target.closest('[data-pendadd]');
      if (add) {
        const card = add.closest('.liccard');
        const ok = License.logPending(add.dataset.pendadd, {
          name: card.querySelector('.pendname').value,
          date: card.querySelector('.penddate').value,
          code: card.querySelector('.pendcode').value,
          hours: Number(card.querySelector('.pendhours').value),
        });
        if (ok) { renderLicense(); return; }
        statusEl.className = 'licstatus error';
        statusEl.textContent = 'Pick a category and the hours it granted to log a credit.';
        return;
      }
      const drop = e.target.closest('[data-penddrop]');
      if (drop) {
        License.dropPending(drop.dataset.penddrop, Number(drop.dataset.pendix));
        renderLicense();
      }
    });

    // Declared categories: whatever boxes are ticked on that card is the
    // declaration, so one handler reads them all rather than diffing.
    $('#liclist').addEventListener('change', e => {
      const box = e.target.closest('input[data-cat]');
      if (!box) return;
      const card = box.closest('.liccard');
      const codes = [...card.querySelectorAll('input[data-cat]:checked')].map(x => x.dataset.cat);
      License.setCategories(box.dataset.catkey, codes);
      renderLicense();
    });

    refreshStale(saved);
  }

  // ---------- the Home banner ----------
  // The most urgent thing across every saved license, one line, linked to the
  // tab: an expired license, else the nearest recertification shortfall, else
  // an expiration inside the sixty days that turn a card's badge amber.
  function homeBannerHTML() {
    const entries = License.saved();
    if (!entries.length) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let expired = null, expiring = null, short = null;
    entries.forEach(entry => {
      const r = entry.record;
      const exp = parseUSDate(r.expire);
      if (exp && exp < today) {
        if (!expired || exp < expired.exp) expired = { r, exp };
      } else if (exp && exp - today <= 60 * DAY) {
        if (!expiring || exp < expiring.exp) expiring = { r, exp };
      }
      const plan = creditPlan(r, License.userData(License.keyOf(entry.input)));
      if (plan.short > 0) {
        const due = parseUSDate(r.recertBy);
        if (!short || (due && (!short.due || due < short.due))) {
          short = { r, due, hours: plan.short };
        }
      }
    });
    const h = escHTML;
    let msg;
    if (expired) {
      msg = `License ${h(expired.r.number)} expired ${h(relDays(expired.exp))} — see the License tab.`;
    } else if (short) {
      msg = `${h(fmtHours(short.hours))} CCU ${hrs(short.hours)} still needed on license ${
        h(short.r.number)}${short.due
          ? ` — due ${h(fmtDate(short.due))} (${h(relDays(short.due))})` : ''}.`;
    } else if (expiring) {
      msg = `License ${h(expiring.r.number)} expires ${h(relDays(expiring.exp))}.`;
    } else {
      return '';
    }
    return `<a class="exambanner licbanner" href="#license">${msg}</a>`;
  }

  // Home is the engine's view, so the banner is injected after the engine
  // renders rather than by it. Every path that renders Home passes a
  // synchronous injection point: the nav-link and button click handlers (the
  // engine renders inside the same click, and this document-level listener
  // runs as the click bubbles out), the boot render (which happens before
  // DOMContentLoaded), and the back button (this hashchange listener
  // registers after the engine's, so it runs after the render).
  function injectHomeBanner() {
    const home = document.querySelector('#view .home');
    if (!home || home.querySelector('.licbanner')) return;
    const html = homeBannerHTML();
    if (!html) return;
    const anchor = home.querySelector('.exambanner') || home.querySelector('.sub');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else home.insertAdjacentHTML('afterbegin', html);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-view="home"]')) injectHomeBanner();
  });
  window.addEventListener('DOMContentLoaded', () => {
    injectHomeBanner();
    window.addEventListener('hashchange', injectHomeBanner);
  });

  self.APP_VIEWS = Object.assign(self.APP_VIEWS || {}, { license: renderLicense });
})();
