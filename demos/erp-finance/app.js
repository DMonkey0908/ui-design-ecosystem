/* ==========================================================================
   Accounts payable workbench — demo behaviour.
   No framework, no network. The "server" is a timer, and its latencies are
   chosen to exercise the feedback bands in core/08-feedback.md:

     row action     ~350ms   optimistic; rolls back out loud on failure
     refresh        ~1200ms  skeleton rows, scheduled at 300ms
     payment run    ~250ms   the button's own busy state, nothing more

   Rigged on purpose so the failure paths can be seen:
     - approving AP-104427 fails (supplier blocked in the vendor master)
     - index.html?demo=error  the first load fails; Retry succeeds
     - index.html?demo=empty  the queue is empty
   ========================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var shell = document.querySelector('.erp-shell');
    var $ = function (id) { return document.getElementById(id); };

    /* ── i18n: strings are marked, the source language is the fallback ──── */

    var LOCALE = root.lang || 'en-GB';
    var DICT = window.APP_I18N || {};

    function t(key, fallback, params) {
        var s = Object.prototype.hasOwnProperty.call(DICT, key) ? DICT[key] : fallback;
        if (!params) return s;
        return s.replace(/\{\{(\w+)\}\}/g, function (m, k) {
            return Object.prototype.hasOwnProperty.call(params, k) ? params[k] : m;
        });
    }

    var plural = new Intl.PluralRules(LOCALE);
    var nfInt = new Intl.NumberFormat(LOCALE);

    /* Plurals via the platform's categories, never `n === 1 ? a : b`. */
    function tn(key, n, forms, params) {
        var cat = plural.select(n);
        var p = { n: nfInt.format(n) };
        if (params) Object.keys(params).forEach(function (k) { p[k] = params[k]; });
        return t(key + '.' + cat, forms[cat] || forms.other, p);
    }

    function applyStaticI18n() {
        try {
            document.querySelectorAll('[data-i18n]').forEach(function (el) {
                var k = el.getAttribute('data-i18n');
                if (Object.prototype.hasOwnProperty.call(DICT, k)) el.textContent = DICT[k];
            });
            document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
                el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
                    var i = pair.indexOf(':');
                    if (i < 0) return;
                    var k = pair.slice(i + 1).trim();
                    if (Object.prototype.hasOwnProperty.call(DICT, k)) el.setAttribute(pair.slice(0, i).trim(), DICT[k]);
                });
            });
        } finally {
            /* Always removed, including on a failed dictionary, or the page stays blank. */
            root.classList.remove('i18n-pending');
        }
    }

    /* ── Formatting, all through Intl ───────────────────────────────────── */

    var BASE = 'GBP';
    var FX = { GBP: 1, EUR: 0.86, USD: 0.76, CHF: 0.93, SEK: 0.072, PLN: 0.2 };

    var fmtDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });
    var fmtTime = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' });
    var fmtDays = new Intl.NumberFormat(LOCALE, { style: 'unit', unit: 'day', unitDisplay: 'long' });
    var fmtRel = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
    var fmtBase = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: BASE, maximumFractionDigits: 0 });
    var amountFmts = {};

    function fmtAmount(value, cur) {
        if (!amountFmts[cur]) {
            var digits = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: cur })
                .resolvedOptions().maximumFractionDigits;
            amountFmts[cur] = new Intl.NumberFormat(LOCALE, {
                minimumFractionDigits: digits, maximumFractionDigits: digits
            });
        }
        return amountFmts[cur].format(value);
    }

    function fmtMoney(value, cur) {
        return t('money', '{{cur}} {{amount}}', { cur: cur, amount: fmtAmount(value, cur) });
    }

    var TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);

    function dayOffset(n) {
        var d = new Date(TODAY);
        d.setDate(d.getDate() + n);
        return d;
    }

    /* ── Data: dates are offsets from today so the queue never goes stale ── */
    /* [document, supplier, currency, amount, invoiced (days), due (days), state, PO match] */

    var SEED = [
        ['AP-104398', 'Ferrobeck Steel Stockholders Ltd', 'GBP', 48912.60, -71, -41, 'open', 'ok'],
        ['AP-104411', 'Kessler & Brandt Fördertechnik GmbH', 'EUR', 17340.00, -63, -33, 'hold', 'price'],
        ['AP-104427', 'Corvane Logistics Ltd', 'GBP', 6218.44, -58, -28, 'open', 'ok'],
        ['AP-104433', 'Pinecrest Polymers Inc.', 'USD', 22975.00, -52, -22, 'open', 'ok'],
        ['AP-104440', 'Lowmere Forklift Hire', 'GBP', 1864.80, -49, -19, 'hold', 'nogr'],
        ['AP-104452', 'Delacroix-Vey Emballages SAS', 'EUR', 9406.75, -44, -14, 'open', 'ok'],
        ['AP-104459', 'Quillon Office Supplies', 'GBP', 412.36, -41, -11, 'open', 'nonpo'],
        ['AP-104463', 'Wisłok Opakowania Sp. z o.o.', 'PLN', 38600.00, -39, -9, 'approved', 'ok'],
        ['AP-104470', 'Marrowby Electrical Wholesale', 'GBP', 3057.12, -37, -7, 'open', 'ok'],
        ['AP-104476', 'Alpenrhein Präzision AG', 'CHF', 14820.50, -34, -4, 'approved', 'ok'],
        ['AP-104481', 'Tideway Waste & Recycling', 'GBP', 968.00, -32, -2, 'open', 'nonpo'],
        ['AP-104488', 'Van Hoorn Transport B.V.', 'EUR', 5731.20, -31, -1, 'approved', 'ok'],
        ['AP-104492', 'Aldermoor Packaging Ltd', 'GBP', 12480.00, -30, 0, 'open', 'ok'],
        ['AP-104497', 'Redwater Bearings LLC', 'USD', 7112.90, -29, 1, 'approved', 'ok'],
        ['AP-104501', 'Hadleigh Fleet Services', 'GBP', 2946.55, -28, 2, 'open', 'ok'],
        ['AP-104506', 'Norrsund Verktyg AB', 'SEK', 86400.00, -27, 3, 'open', 'ok'],
        ['AP-104512', 'Northfell Timber & Board Ltd', 'GBP', 21733.08, -26, 4, 'hold', 'qty'],
        ['AP-104515', 'Castellmare Adesivi S.r.l.', 'EUR', 3298.40, -25, 5, 'approved', 'ok'],
        ['AP-104519', 'Greyfriar Facilities Management', 'GBP', 4675.00, -24, 6, 'open', 'nonpo'],
        ['AP-104523', 'Tessaly Industrial Fasteners', 'GBP', 1209.74, -22, 8, 'approved', 'ok'],
        ['AP-104528', 'Calder Vale Energy Supply', 'GBP', 15386.19, -21, 9, 'open', 'nonpo'],
        ['AP-104531', 'Atelier Morvane SARL', 'EUR', 2150.00, -20, 10, 'open', 'ok'],
        ['AP-104536', 'Stanmoor Telecom', 'GBP', 689.50, -18, 12, 'approved', 'nonpo'],
        ['AP-104540', 'Ferrobeck Steel Stockholders Ltd', 'GBP', 33104.25, -16, 14, 'open', 'ok'],
        ['AP-104544', 'Brightwell Temp Staffing', 'GBP', 8942.00, -15, 15, 'open', 'nonpo'],
        ['AP-104549', 'Pinecrest Polymers Inc.', 'USD', 11460.00, -13, 17, 'hold', 'price'],
        ['AP-104553', 'Oakhollow Print & Signage', 'GBP', 756.90, -11, 19, 'open', 'ok'],
        ['AP-104557', 'Kessler & Brandt Fördertechnik GmbH', 'EUR', 28615.30, -9, 21, 'open', 'ok'],
        ['AP-104562', 'Hartlow & Pryce LLP', 'GBP', 5400.00, -8, 22, 'open', 'nonpo'],
        ['AP-104566', 'Ravensgate IT Services', 'GBP', 3840.00, -6, 24, 'approved', 'nonpo'],
        ['AP-104571', 'Aldermoor Packaging Ltd', 'GBP', 9127.44, -4, 26, 'open', 'ok'],
        ['AP-104575', 'Penhallow Insurance Brokers', 'GBP', 18250.00, -2, 28, 'open', 'nonpo'],
        ['AP-104579', 'Marrowby Electrical Wholesale', 'GBP', 1573.60, -1, 29, 'open', 'ok'],
        ['AP-104583', 'Alpenrhein Präzision AG', 'CHF', 6044.00, 0, 30, 'open', 'ok']
    ];

    var BLOCKED_DOC = 'AP-104427';
    var demo = new URLSearchParams(location.search).get('demo');

    function seedInvoices() {
        if (demo === 'empty') return [];
        return SEED.map(function (r) {
            return {
                doc: r[0], supplier: r[1], cur: r[2], amount: r[3],
                invoiced: r[4], due: r[5], state: r[6], match: r[7]
            };
        }).sort(function (a, b) { return a.due - b.due; });
    }

    var invoices = seedInvoices();
    var loadError = demo === 'error';
    var loading = false;
    var pending = new Set();          /* documents with a row action in flight */

    /* ── Vocabulary ─────────────────────────────────────────────────────── */

    function statusOf(inv) {
        if (inv.state === 'hold') return 'hold';
        if (inv.state === 'approved') return 'approved';
        return inv.due < 0 ? 'overdue' : 'due';
    }

    function statusLabel(s) {
        return {
            due: t('status.due', 'To approve'),
            overdue: t('status.overdue', 'Overdue'),
            approved: t('status.approved', 'Approved'),
            hold: t('status.hold', 'On hold')
        }[s];
    }

    var MATCH = {
        ok: ['match.ok', 'Matched', 'ok'],
        price: ['match.price', 'Price variance', 'warn'],
        qty: ['match.qty', 'Quantity variance', 'warn'],
        nogr: ['match.nogr', 'No goods receipt', 'warn'],
        nonpo: ['match.nonpo', 'Non-PO', 'none']
    };

    function ageing(inv) {
        if (inv.due < 0) return t('age.overdue', '{{days}} overdue', { days: fmtDays.format(-inv.due) });
        return fmtRel.format(inv.due, 'day');
    }

    function actionFor(inv) {
        if (inv.state === 'hold') {
            return {
                label: t('action.release', 'Release'),
                name: t('action.release.name', 'Release hold on {{doc}}', { doc: inv.doc }),
                pressed: null
            };
        }
        if (inv.state === 'approved') {
            return {
                label: t('action.revoke', 'Revoke'),
                name: t('action.revoke.name', 'Revoke approval of {{doc}}', { doc: inv.doc }),
                pressed: 'true'
            };
        }
        return {
            label: t('action.approve', 'Approve'),
            name: t('action.approve.name', 'Approve {{doc}} for payment', { doc: inv.doc }),
            pressed: 'false'
        };
    }

    /* ── Small DOM helper ───────────────────────────────────────────────── */

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    /* ── Tiles: the whole queue, in the base currency ───────────────────── */

    function baseValue(inv) { return inv.amount * FX[inv.cur]; }

    function sumBase(list) {
        return list.reduce(function (s, inv) { return s + baseValue(inv); }, 0);
    }

    function invoicesCount(n) {
        return tn('count.invoices', n, { one: '{{n}} invoice', other: '{{n}} invoices' });
    }

    function nextRunDate() {
        var d = dayOffset(2);
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        return d;
    }

    function renderTiles() {
        var open = invoices;
        var overdue = open.filter(function (i) { return statusOf(i) === 'overdue'; });
        var week = open.filter(function (i) { return i.due >= 0 && i.due <= 7 && i.state !== 'hold'; });
        var approved = open.filter(function (i) { return i.state === 'approved'; });
        var hold = open.filter(function (i) { return i.state === 'hold'; });
        var currencies = new Set(open.map(function (i) { return i.cur; })).size;
        var oldest = overdue.reduce(function (m, i) { return Math.max(m, -i.due); }, 0);
        var variances = hold.filter(function (i) { return i.match === 'price' || i.match === 'qty'; }).length;

        var tiles = [
            [t('tile.open', 'Open payables'), sumBase(open),
            t('tile.open.sub', '{{count}} · {{cur}}', {
                count: invoicesCount(open.length),
                cur: tn('count.currencies', currencies, { one: '{{n}} currency', other: '{{n}} currencies' })
            })],
            [t('tile.overdue', 'Overdue, not approved'), sumBase(overdue),
            overdue.length
                ? t('tile.overdue.sub', '{{count}} · oldest {{days}}', {
                    count: invoicesCount(overdue.length), days: fmtDays.format(oldest)
                })
                : t('tile.overdue.none', 'Nothing past due is waiting')],
            [t('tile.week', 'Due within 7 days'), sumBase(week),
            t('tile.week.sub', '{{count}} · holds excluded', { count: invoicesCount(week.length) })],
            [t('tile.approved', 'Approved for payment'), sumBase(approved),
            t('tile.approved.sub', '{{count}} · next run {{date}}', {
                count: invoicesCount(approved.length), date: fmtDate.format(nextRunDate())
            })],
            [t('tile.hold', 'On hold'), sumBase(hold),
            t('tile.hold.sub', '{{count}} · {{variances}}', {
                count: invoicesCount(hold.length),
                variances: tn('count.variances', variances, { one: '{{n}} variance', other: '{{n}} variances' })
            })]
        ];

        /* A figure that was never read is not zero. */
        var unknown = loadError;
        var box = $('tiles');
        box.textContent = '';
        tiles.forEach(function (x) {
            var tile = el('div', 'tile');
            tile.appendChild(el('div', 'tile-label', x[0]));
            tile.appendChild(el('div', 'tile-value', unknown ? t('tile.unknown', '—') : fmtBase.format(x[1])));
            tile.appendChild(el('div', 'tile-sub', unknown ? t('tile.unknown.sub', 'Not loaded') : x[2]));
            box.appendChild(tile);
        });

        $('navCount').textContent = unknown ? '' : nfInt.format(open.length);
        $('navCount').hidden = unknown;
    }

    /* ── Rows ───────────────────────────────────────────────────────────── */

    var COLS = 10;

    function buildRow(inv) {
        var tr = el('tr');
        tr.dataset.doc = inv.doc;

        var doc = el('td');
        doc.appendChild(el('code', null, inv.doc));
        tr.appendChild(doc);

        var sup = el('td', 'truncate', inv.supplier);
        sup.title = inv.supplier;
        tr.appendChild(sup);

        var m = MATCH[inv.match];
        var match = el('td');
        var ms = el('span', 'status', t(m[0], m[1]));
        ms.dataset.state = m[2];
        match.appendChild(ms);
        tr.appendChild(match);

        tr.appendChild(el('td', 'date', fmtDate.format(dayOffset(inv.invoiced))));
        tr.appendChild(el('td', 'date', fmtDate.format(dayOffset(inv.due))));

        var age = el('td', 'num');
        var as = el('span', 'status', ageing(inv));
        as.dataset.state = inv.due < 0 ? 'bad' : 'ok';
        age.appendChild(as);
        tr.appendChild(age);

        tr.appendChild(el('td', 'num', fmtAmount(inv.amount, inv.cur)));
        tr.appendChild(el('td', 'cur', inv.cur));

        var st = el('td', 'col-status');
        st.appendChild(el('span', 'pill'));
        tr.appendChild(st);

        var act = el('td', 'col-action');
        var btn = el('button', 'row-action');
        btn.type = 'button';
        act.appendChild(btn);
        tr.appendChild(act);

        paintRowState(tr, inv);
        return tr;
    }

    /* The mutable part of a row. Updated in place so focus stays on the
       button that was pressed. */
    function paintRowState(tr, inv) {
        var s = statusOf(inv);
        tr.dataset.state = s;
        var pill = tr.querySelector('.pill');
        pill.dataset.state = s;
        pill.textContent = statusLabel(s);

        var a = actionFor(inv);
        var btn = tr.querySelector('.row-action');
        btn.textContent = a.label;
        btn.setAttribute('aria-label', a.name);
        if (a.pressed === null) btn.removeAttribute('aria-pressed');
        else btn.setAttribute('aria-pressed', a.pressed);
        if (pending.has(inv.doc)) btn.setAttribute('aria-busy', 'true');
        else btn.removeAttribute('aria-busy');
    }

    function rowFor(doc) {
        return Array.prototype.find.call($('rows').children, function (tr) { return tr.dataset.doc === doc; });
    }

    /* Skeleton rows in the real row structure: one per row expected, the
       header left in place, hidden from assistive tech. */
    var SKELETON = ['is-short', '', 'is-short', 'is-short', 'is-short', 'is-right', 'is-right', 'is-short', 'is-short', 'is-right'];

    /* "The header stays" only helps if the columns stay under it. The widths
       the data produced are pinned while the body is unknown, and released
       when the answer lands. */
    function lockColumns(lock) {
        var table = $('table');
        var old = table.querySelector('colgroup');
        if (old) old.remove();
        table.style.tableLayout = '';
        if (!lock) return;
        var group = document.createElement('colgroup');
        table.querySelectorAll('thead th').forEach(function (th) {
            var col = document.createElement('col');
            col.style.width = th.getBoundingClientRect().width + 'px';
            group.appendChild(col);
        });
        table.insertBefore(group, table.firstChild);
        table.style.tableLayout = 'fixed';
    }

    function renderSkeleton(count) {
        lockColumns(true);
        var body = $('rows');
        body.textContent = '';
        for (var i = 0; i < count; i++) {
            var tr = el('tr', 'is-skeleton');
            tr.setAttribute('aria-hidden', 'true');
            for (var c = 0; c < COLS; c++) {
                var td = el('td', c === COLS - 1 ? 'col-action' : '');
                td.appendChild(el('span', 'skeleton-cell ' + SKELETON[c]));
                tr.appendChild(td);
            }
            body.appendChild(tr);
        }
    }

    /* ── Filtering ──────────────────────────────────────────────────────── */

    var fSearch = $('fSearch'), fStatus = $('fStatus'), fDue = $('fDue'), fCur = $('fCur');

    function filtersActive() {
        return !!(fSearch.value.trim() || fStatus.value || fDue.value || fCur.value);
    }

    function fold(s) {
        return s.toLocaleLowerCase(LOCALE).normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function matches(inv) {
        var q = fold(fSearch.value.trim());
        if (q && fold(inv.supplier).indexOf(q) < 0 && fold(inv.doc).indexOf(q) < 0) return false;
        if (fStatus.value && statusOf(inv) !== fStatus.value) return false;
        if (fCur.value && inv.cur !== fCur.value) return false;
        if (fDue.value === 'past' && inv.due >= 0) return false;
        if (fDue.value === 'week' && (inv.due < 0 || inv.due > 7)) return false;
        if (fDue.value === 'later' && inv.due <= 7) return false;
        return true;
    }

    function visibleInvoices() { return invoices.filter(matches); }

    function fillCurrencies() {
        var seen = [];
        SEED.forEach(function (r) { if (seen.indexOf(r[2]) < 0) seen.push(r[2]); });
        seen.sort();
        seen.forEach(function (c) {
            var o = el('option', null, c);
            o.value = c;
            fCur.appendChild(o);
        });
    }

    /* ── Empty, filtered-out, failed: three cases, three wordings ───────── */

    function showEmpty(state, text, actionLabel, action) {
        var box = $('empty'), btn = $('emptyAction');
        box.hidden = false;
        box.dataset.state = state;
        $('emptyText').textContent = text;
        btn.hidden = !actionLabel;
        btn.textContent = actionLabel || '';
        btn.onclick = action || null;
    }

    /* Agrees with the number that matched, not with the total. */
    var MATCH_FORMS = { one: '{{n}} of {{all}} invoices matches', other: '{{n}} of {{all}} invoices match' };

    function render() {
        var body = $('rows');
        var wrap = $('tableWrap');
        var active = filtersActive();
        $('fClear').hidden = !active;
        $('empty').hidden = true;
        wrap.removeAttribute('aria-busy');
        lockColumns(false);
        renderTiles();

        if (loadError) {
            body.textContent = '';
            $('filterNote').textContent = t('count.failed', 'Invoices could not be loaded.');
            showEmpty('error',
                t('empty.error', 'The ledger service did not answer within 10 seconds (GET /ap/invoices, HTTP 504). No invoice was changed. Your filters are kept.'),
                t('action.retry', 'Retry'), refresh);
            return;
        }

        var list = visibleInvoices();
        body.textContent = '';
        list.forEach(function (inv) { body.appendChild(buildRow(inv)); });

        if (!invoices.length) {
            $('filterNote').textContent = invoicesCount(0);
            showEmpty('none', t('empty.none', 'No supplier invoices are waiting. An invoice appears here once it is posted from the scan inbox or the supplier portal.'));
        } else if (!list.length) {
            $('filterNote').textContent = tn('count.match', 0, MATCH_FORMS, { all: nfInt.format(invoices.length) });
            showEmpty('filtered', t('empty.filtered', 'No invoice matches these filters.'),
                t('filter.clear', 'Clear filters'), clearFilters);
        } else if (active) {
            $('filterNote').textContent = tn('count.match', list.length, MATCH_FORMS, { all: nfInt.format(invoices.length) });
        } else {
            $('filterNote').textContent = invoicesCount(invoices.length);
        }
    }

    function clearFilters() {
        fSearch.value = '';
        fStatus.value = '';
        fDue.value = '';
        fCur.value = '';
        render();
        fSearch.focus();
    }

    function say(text) { $('actionNote').textContent = text; }

    /* ── Refresh: nothing under 300ms, skeleton rows past it ────────────── */

    var loadToken = 0;

    function refresh() {
        if (loading) return;               /* double trigger */
        loading = true;
        var token = ++loadToken;
        var expected = loadError ? 12 : Math.max(visibleInvoices().length, 1);
        $('empty').hidden = true;
        $('tableWrap').setAttribute('aria-busy', 'true');

        var skeletonTimer = setTimeout(function () {
            renderSkeleton(expected);
            $('filterNote').textContent = t('count.loading', 'Loading invoices…');
        }, 300);

        setTimeout(function () {
            clearTimeout(skeletonTimer);
            if (token !== loadToken) return;
            loading = false;
            loadError = false;
            render();
            say(t('refresh.done', 'Ledger read at {{time}}.', { time: fmtTime.format(new Date()) }));
        }, 1200);
    }

    /* ── Row action: optimistic, reversible, and loud when it fails ─────── */

    function toast(title, text) {
        $('toastTitle').textContent = title;
        $('toastText').textContent = text;
        $('toast').hidden = false;
    }

    function onRowAction(btn) {
        if (loading) return;
        var tr = btn.closest('tr');
        var doc = tr && tr.dataset.doc;
        var inv = invoices.find(function (i) { return i.doc === doc; });
        if (!inv || pending.has(doc)) return;      /* gone, or already in flight */

        var previous = inv.state;
        var next = previous === 'open' ? 'approved' : 'open';
        inv.state = next;
        pending.add(doc);
        paintRowState(tr, inv);
        renderTiles();

        setTimeout(function () {
            pending.delete(doc);
            var still = invoices.indexOf(inv) >= 0;     /* it may have left in a payment run */
            var failed = next === 'approved' && doc === BLOCKED_DOC;

            if (failed) {
                inv.state = previous;
                var back = statusLabel(statusOf(inv));
                toast(t('approve.fail.title', '{{doc}} was not approved', { doc: doc }),
                    t('approve.fail.text', '{{supplier}} is blocked for payment in the vendor master (block VM-217, bank details under review). The invoice is back to {{status}}; remove the block, then approve again.',
                        { supplier: inv.supplier, status: back }));
                say(t('approve.fail.note', '{{doc}} not approved — back to {{status}}.', { doc: doc, status: back }));
            } else if (previous === 'hold') {
                say(t('release.done', 'Hold released on {{doc}}. It is now {{status}}.',
                    { doc: doc, status: statusLabel(statusOf(inv)) }));
            } else if (next === 'approved') {
                say(t('approve.done', '{{doc}} approved for payment: {{money}} to {{supplier}}.',
                    { doc: doc, money: fmtMoney(inv.amount, inv.cur), supplier: inv.supplier }));
            } else {
                say(t('revoke.done', 'Approval revoked for {{doc}}. It is now {{status}}.',
                    { doc: doc, status: statusLabel(statusOf(inv)) }));
            }

            var row = still && rowFor(doc);
            if (row && !row.classList.contains('is-skeleton')) paintRowState(row, inv);
            renderTiles();
        }, 350);
    }

    /* ── Payment run ────────────────────────────────────────────────────── */

    var runDialog = $('runDialog');

    function approvedInvoices() {
        return invoices.filter(function (i) { return i.state === 'approved' && !pending.has(i.doc); });
    }

    function openRunDialog() {
        var list = approvedInvoices();
        var rows = $('runRows');
        var confirm = $('runConfirm');
        rows.textContent = '';
        confirm.removeAttribute('aria-busy');
        confirm.textContent = t('run.confirm', 'Create run');

        if (!list.length) {
            $('runNote').textContent = t('run.none', 'No invoice is approved yet. Approve at least one invoice in the table, then create the run.');
            $('runTableWrap').hidden = true;
            confirm.hidden = true;
            $('runCancel').textContent = t('action.close', 'Close');
        } else {
            $('runNote').textContent = t('run.note', '{{count}} will be paid with value date {{date}} and will then leave this queue. Invoices on hold are not included.',
                { count: invoicesCount(list.length), date: fmtDate.format(nextRunDate()) });
            $('runTableWrap').hidden = false;
            confirm.hidden = false;
            $('runCancel').textContent = t('action.cancel', 'Cancel');

            var by = {};
            list.forEach(function (i) {
                by[i.cur] = by[i.cur] || { n: 0, total: 0 };
                by[i.cur].n += 1;
                by[i.cur].total += i.amount;
            });
            Object.keys(by).sort().forEach(function (cur) {
                var tr = el('tr');
                var c = el('td');
                c.appendChild(el('code', null, cur));
                tr.appendChild(c);
                tr.appendChild(el('td', 'num', nfInt.format(by[cur].n)));
                tr.appendChild(el('td', 'num', fmtAmount(by[cur].total, cur)));
                rows.appendChild(tr);
            });
            var total = el('tr', 'is-total');
            total.appendChild(el('td', null, t('run.total', 'GBP equivalent')));
            total.appendChild(el('td', 'num', nfInt.format(list.length)));
            total.appendChild(el('td', 'num', fmtBase.format(sumBase(list))));
            rows.appendChild(total);
        }
        runDialog.showModal();
    }

    function confirmRun() {
        var confirm = $('runConfirm');
        if (confirm.getAttribute('aria-busy') === 'true') return;      /* double trigger */
        var list = approvedInvoices();
        confirm.setAttribute('aria-busy', 'true');
        confirm.textContent = t('run.busy', 'Creating…');

        setTimeout(function () {
            var paid = sumBase(list);
            invoices = invoices.filter(function (i) { return list.indexOf(i) < 0; });
            var id = 'PR-' + String(TODAY.getFullYear()).slice(2) + String(TODAY.getMonth() + 1).padStart(2, '0') + '-014';
            runDialog.close();
            render();
            say(t('run.done', 'Payment run {{id}} created: {{count}}, {{total}} equivalent, value date {{date}}. They have left this queue.', {
                id: id, count: invoicesCount(list.length), total: fmtBase.format(paid),
                date: fmtDate.format(nextRunDate())
            }));
        }, 250);
    }

    /* ── Export ─────────────────────────────────────────────────────────── */

    function exportCsv() {
        var list = loadError ? [] : visibleInvoices();
        if (!list.length) {
            say(t('export.none', 'Nothing to export: no invoice is listed.'));
            return;
        }
        var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
        var iso = function (d) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        };
        var lines = [['document', 'supplier', 'po_match', 'invoice_date', 'due_date', 'days_past_due', 'amount', 'currency', 'status'].join(',')];
        list.forEach(function (i) {
            lines.push([q(i.doc), q(i.supplier), q(i.match), iso(dayOffset(i.invoiced)), iso(dayOffset(i.due)),
            -i.due, i.amount.toFixed(2), i.cur, statusOf(i)].join(','));
        });
        var url = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ap-workbench.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        say(t('export.done', '{{count}} exported to ap-workbench.csv.', { count: invoicesCount(list.length) }));
    }

    /* ── Shell: sidebar toggle, nav, topbar menus ───────────────────────── */

    var narrow = window.matchMedia('(max-width: 820px)');
    var toggle = document.querySelector('[data-toggle-sidebar]');

    function sidebarOpen() {
        return narrow.matches ? shell.classList.contains('is-expanded') : !shell.classList.contains('is-collapsed');
    }

    function syncToggle() {
        var open = sidebarOpen();
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open
            ? t('nav.collapse.name', 'Collapse navigation')
            : t('nav.expand.name', 'Expand navigation'));
    }

    function initShell() {
        if (root.classList.contains('sb-collapsed')) shell.classList.add('is-collapsed');
        syncToggle();

        toggle.addEventListener('click', function () {
            if (narrow.matches) {
                shell.classList.toggle('is-expanded');
            } else {
                var collapsed = shell.classList.toggle('is-collapsed');
                root.classList.toggle('sb-collapsed', collapsed);
                try { localStorage.setItem('app.sidebar.collapsed', collapsed ? '1' : '0'); } catch (_e) { /* storage unavailable */ }
            }
            syncToggle();
        });
        narrow.addEventListener('change', syncToggle);

        /* Nothing animates on resize. */
        var resizeTimer;
        window.addEventListener('resize', function () {
            shell.classList.add('is-resizing');
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { shell.classList.remove('is-resizing'); }, 150);
        });

        /* The active item does not navigate. The other modules are not part
           of this demo, and say so instead of doing nothing. */
        document.querySelector('.sidebar-nav').addEventListener('click', function (e) {
            var a = e.target.closest('.nav-item');
            if (!a) return;
            e.preventDefault();
            if (a.getAttribute('aria-current') === 'page') return;
            say(t('demo.na', '“{{item}}” is not part of this demo screen.', { item: a.getAttribute('aria-label') }));
        });
    }

    var openMenu = null;

    function closeMenu(returnFocus) {
        if (!openMenu) return;
        var m = openMenu;
        openMenu = null;
        m.panel.classList.remove('is-open');
        m.panel.setAttribute('inert', '');
        m.trigger.setAttribute('aria-expanded', 'false');
        if (returnFocus) m.trigger.focus();
    }

    function initMenus() {
        document.querySelectorAll('[data-menu]').forEach(function (trigger) {
            var panel = $(trigger.getAttribute('data-menu'));
            trigger.addEventListener('click', function () {
                var wasOpen = openMenu && openMenu.panel === panel;
                closeMenu(false);
                if (wasOpen) return;
                panel.removeAttribute('inert');
                panel.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                openMenu = { panel: panel, trigger: trigger };
                var first = panel.querySelector('[role="menuitem"]');
                if (first) first.focus();
            });

            panel.addEventListener('keydown', function (e) {
                var items = Array.prototype.slice.call(panel.querySelectorAll('[role="menuitem"]'));
                if (!items.length) return;
                var i = items.indexOf(document.activeElement);
                var to = null;
                if (e.key === 'ArrowDown') to = items[(i + 1) % items.length];
                else if (e.key === 'ArrowUp') to = items[(i - 1 + items.length) % items.length];
                else if (e.key === 'Home') to = items[0];
                else if (e.key === 'End') to = items[items.length - 1];
                else if (e.key === 'Tab') { closeMenu(true); e.preventDefault(); return; }
                if (to) { e.preventDefault(); to.focus(); }
            });
        });

        document.addEventListener('click', function (e) {
            if (!openMenu) return;
            if (openMenu.panel.contains(e.target) || openMenu.trigger.contains(e.target)) return;
            closeMenu(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && openMenu) closeMenu(true);
        });

        document.querySelectorAll('[data-demo-item]').forEach(function (item) {
            item.addEventListener('click', function () {
                var name = item.textContent.replace(/\s+/g, ' ').trim();
                closeMenu(true);
                say(t('demo.na', '“{{item}}” is not part of this demo screen.', { item: name }));
            });
        });
    }

    /* ── Wire up ────────────────────────────────────────────────────────── */

    applyStaticI18n();
    initShell();
    initMenus();
    fillCurrencies();

    [fStatus, fDue, fCur].forEach(function (c) { c.addEventListener('change', render); });
    fSearch.addEventListener('input', render);
    $('fClear').addEventListener('click', clearFilters);

    $('rows').addEventListener('click', function (e) {
        var btn = e.target.closest('.row-action');
        if (btn) onRowAction(btn);
    });

    $('btnRefresh').addEventListener('click', refresh);
    $('btnExport').addEventListener('click', exportCsv);
    $('btnRun').addEventListener('click', openRunDialog);
    $('runCancel').addEventListener('click', function () { runDialog.close(); });
    $('runConfirm').addEventListener('click', confirmRun);
    $('toastClose').addEventListener('click', function () { $('toast').hidden = true; });

    render();
    if (!loadError) say(t('refresh.done', 'Ledger read at {{time}}.', { time: fmtTime.format(new Date()) }));
})();
