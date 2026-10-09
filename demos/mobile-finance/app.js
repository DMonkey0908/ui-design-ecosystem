/* ==========================================================================
   Brindle - behaviour.

   What this file is for, in the order the pack cares about:

   1. The session ends without warning. The route (tab and the stack under
      it), each tab's own stack, the scroll anchor, which card is showing,
      the analytics view, the send draft and whether its sheet was open are
      all saved ON CHANGE and restored on launch.   pack/04-lifecycle.md
   2. Offline is a normal condition. Balances stay on screen with their age,
      writes are queued and counted in ONE banner, and a write refused after
      queueing comes back as a notice that outlives a toast.
   3. A transfer is not optimistic (core/08-feedback.md). The button goes busy
      in place, and success is only drawn once the stand-in server says so.
   4. Every gesture has a visible equivalent: the card carousel has two
      buttons, drag-to-dismiss has Cancel or Done, and back has a control.
   5. The custom keypad costs nothing a system keyboard gives: the amount is
      a real field, and the keys only edit it.

   There is no server. `db` below stands in for one and is kept in
   localStorage so the demo survives a reload; nothing leaves the page.
   ========================================================================== */

(() => {
    'use strict';

    const LOCALE = document.documentElement.lang || 'en-GB';
    const CURRENCY = 'GBP';
    const TABS = ['home', 'analytics', 'cards', 'you'];

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
    const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Storage can throw outright, so every access is guarded. */
    const NS = 'brindle2.';
    const store = {
        get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (_e) { return d; } },
        set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (_e) { /* private mode */ } },
        del(k) { try { localStorage.removeItem(NS + k); } catch (_e) { /* private mode */ } },
        clear() { try { Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k)); } catch (_e) { /* private mode */ } },
    };

    /* ── Strings ───────────────────────────────────────────────────────────
       Marked, with the source language left in place as the fallback. A
       dictionary, if one is ever loaded, goes in window.BRINDLE_STRINGS. */
    const DICT = window.BRINDLE_STRINGS || {};
    const t = (key, fallback, vars) => {
        let s = DICT[key] || fallback;
        if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
        return s;
    };
    const pluralRules = new Intl.PluralRules(LOCALE);
    const plural = (key, n, forms, vars) => t(key + '.' + pluralRules.select(n), forms[pluralRules.select(n)] || forms.other, Object.assign({ n }, vars));
    $$('[data-i18n]').forEach((el) => { const s = DICT[el.dataset.i18n]; if (s) el.textContent = s; });

    /* ── Formatting: always through Intl, never by hand ────────────────── */
    const fmtMoney = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
    const fmtMoney0 = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
    const fmtSigned = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, signDisplay: 'exceptZero' });
    const fmtPercent = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 2 });
    const fmtShare = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });
    const fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
    const fmtDay = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    const fmtStamp = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const fmtFull = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
    const fmtMonth = new Intl.DateTimeFormat(LOCALE, { month: 'long' });
    const fmtMonthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
    const fmtRel = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
    const money = (pence) => fmtMoney.format(pence / 100);
    const signed = (pence) => fmtSigned.format(pence / 100);
    const moneyParts = fmtMoney.formatToParts(1234.5);
    const DECIMAL = (moneyParts.find((p) => p.type === 'decimal') || { value: '.' }).value;
    const SYMBOL = (moneyParts.find((p) => p.type === 'currency') || { value: '' }).value;

    const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const dayLabel = (ts) => {
        const diff = Math.round((dayStart(ts) - dayStart(Date.now())) / 864e5);
        return diff >= -1 && diff <= 1 ? fmtRel.format(diff, 'day') : fmtDay.format(ts);
    };

    /* A figure. The typeface has no tabular numerals, so each digit goes in a
       cell of one width (see .d in app.css); the plain text rides along,
       hidden, for a screen reader, which would otherwise meet the amount one
       digit at a time. */
    const cells = (s) => Array.from(String(s), (ch) => (ch >= '0' && ch <= '9' ? `<span class="d">${ch}</span>` : esc(ch))).join('');
    const fig = (s) => `<span class="fig"><span aria-hidden="true">${cells(s)}</span><span class="sr-only">${esc(s)}</span></span>`;

    /* ── The stand-in server ───────────────────────────────────────────── */

    const CATS = {
        eating: t('cat.eating', 'Eating out'),
        transport: t('cat.transport', 'Transport'),
        groceries: t('cat.groceries', 'Groceries'),
        bills: t('cat.bills', 'Bills'),
        fun: t('cat.fun', 'Entertainment'),
        health: t('cat.health', 'Health'),
        housing: t('cat.housing', 'Housing'),
        transfer: t('cat.transfer', 'Transfers'),
        savings: t('cat.savings', 'Savings'),
        salary: t('cat.salary', 'Salary'),
        interest: t('cat.interest', 'Interest'),
        other: t('cat.other', 'Other'),
    };
    const KINDS = {
        debit: t('kind.debit', 'Debit card'),
        savings: t('kind.savings', 'Savings card'),
        travel: t('kind.travel', 'Travel card'),
    };

    /* One month of invented life: [day, hour, minute, name, category, pence,
       account, reference]. Laid over this month up to today, and over the
       whole of last month, so the analytics have something real to add up. */
    const MONTH = [
        [1, 7, 0, 'Kiln Yard Gym', 'health', -3200, 'everyday', 'DD KILN YARD 0091'],
        [1, 0, 5, 'Interest', 'interest', 612, 'rainy', 'INTEREST'],
        [2, 18, 12, 'Corner Pantry', 'groceries', -4318, 'everyday', 'CORNER PANTRY 0214'],
        [3, 8, 2, 'Northline Rail', 'transport', -5460, 'travel', 'NORTHLINE WEEKLY'],
        [4, 7, 0, 'Emberlight Energy', 'bills', -8600, 'everyday', 'DD EMBERLIGHT 5530921'],
        [5, 8, 41, 'Wren & Fig Bakery', 'eating', -720, 'everyday', 'WREN AND FIG'],
        [6, 17, 50, 'Corner Pantry', 'groceries', -3650, 'everyday', 'CORNER PANTRY 0214'],
        [6, 19, 32, 'Kestrel Cinema', 'fun', -1900, 'everyday', 'KESTREL CINEMA'],
        [7, 9, 15, 'Citycycle Hire', 'transport', -1200, 'travel', 'CITYCYCLE 4471'],
        [8, 12, 20, 'Oak Street Pharmacy', 'health', -749, 'everyday', 'OAK ST PHARMACY'],
        [8, 20, 5, 'Saffron Lane', 'eating', -3880, 'everyday', 'SAFFRON LANE'],
        [10, 8, 2, 'Northline Rail', 'transport', -5460, 'travel', 'NORTHLINE WEEKLY'],
        [11, 18, 30, 'Corner Pantry', 'groceries', -5127, 'everyday', 'CORNER PANTRY 0214'],
        [13, 13, 44, 'Fathom Books', 'fun', -1499, 'everyday', 'FATHOM BOOKS'],
        [15, 11, 8, 'Greenway Market', 'groceries', -2890, 'everyday', 'GREENWAY MKT'],
        [17, 8, 2, 'Northline Rail', 'transport', -5460, 'travel', 'NORTHLINE WEEKLY'],
        [19, 8, 55, 'Halden Coffee', 'eating', -410, 'everyday', 'HALDEN COFFEE 0931'],
        [20, 18, 3, 'Corner Pantry', 'groceries', -4705, 'everyday', 'CORNER PANTRY 0214'],
        [22, 19, 40, 'Saffron Lane', 'eating', -4250, 'everyday', 'SAFFRON LANE'],
        [24, 8, 2, 'Northline Rail', 'transport', -5460, 'travel', 'NORTHLINE WEEKLY'],
        [25, 6, 2, 'Saltmarsh Studio Ltd', 'salary', 284000, 'everyday', 'SALARY'],
        [26, 7, 0, 'Tidewater Mobile', 'bills', -1800, 'everyday', 'DD TIDEWATER'],
        [27, 16, 22, 'Greenway Market', 'groceries', -3320, 'everyday', 'GREENWAY MKT'],
        [28, 8, 0, 'Alder Lettings', 'housing', -64000, 'everyday', 'RENT FLAT 3B'],
    ];

    function seed() {
        const now = Date.now();
        const today = new Date(now);
        const tx = [];
        [1, 0].forEach((back) => {
            const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
            const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
            MONTH.forEach((m, i) => {
                const ts = new Date(first.getFullYear(), first.getMonth(), Math.min(m[0], days), m[1], m[2]).getTime();
                /* Nothing from the future, and today is written below. */
                if (ts >= dayStart(now)) return;
                tx.push({ id: `m${back}x${i}`, account: m[6], name: m[3], cat: m[4], amount: m[5], ts, status: 'done', ref: m[7] });
            });
        });
        const ago = (min) => now - min * 6e4;
        tx.push(
            { id: 't3', account: 'travel', name: 'Northline Rail', cat: 'transport', amount: -1280, ts: ago(214), status: 'done', ref: 'NORTHLINE TKT 77104' },
            { id: 't2', account: 'everyday', name: 'Tomasz Nowak', cat: 'transfer', amount: 1800, ts: ago(96), status: 'done', ref: 'Cinema tickets' },
            { id: 't1', account: 'everyday', name: 'Halden Coffee', cat: 'eating', amount: -340, ts: ago(38), status: 'done', ref: 'HALDEN COFFEE 0931' },
        );
        return {
            accounts: [
                { id: 'everyday', name: 'Everyday', kind: 'debit', art: 'ink', mask: '4417', number: '31904417', sort: '04-18-27', balance: 184642, frozen: false },
                { id: 'rainy', name: 'Rainy day', kind: 'savings', art: 'teal', mask: '9024', number: '60219024', sort: '04-18-27', rate: 0.031, balance: 244000, frozen: false },
                { id: 'travel', name: 'Travel', kind: 'travel', art: 'cream', mask: '7730', number: '71407730', sort: '04-18-27', balance: 32015, frozen: false },
            ],
            tx,
            payees: [
                { id: 'priya', name: 'Priya Raman', short: 'Priya', mask: '2291' },
                { id: 'tomasz', name: 'Tomasz Nowak', short: 'Tomasz', mask: '6408' },
                { id: 'ines', name: 'Ines Okafor', short: 'Ines', mask: '3350' },
                /* Rigged: the stand-in server refuses this one, so the refusal
                   paths can be seen - inline when online, a notice when queued. */
                { id: 'oskar', name: 'Oskar Lindqvist', short: 'Oskar', mask: '5002', closed: true },
                { id: 'mei', name: 'Mei Tanaka', short: 'Mei', mask: '8816' },
                { id: 'alder', name: 'Alder Lettings', short: 'Alder', mask: '1175' },
            ],
            limits: { groceries: 25000, transport: 20000, eating: 12000, fun: 6000 },
            inbox: [
                { id: 'n1', title: t('inbox.salary', 'Your salary usually arrives on the 25th'), body: t('inbox.salaryBody', 'Saltmarsh Studio Ltd has paid on that day for the last three months.'), read: false },
                { id: 'n2', title: t('inbox.limit', 'Transport went over its limit last month'), body: t('inbox.limitBody', 'Analytics has the month by category, under Limits.'), read: false },
            ],
        };
    }

    let db = store.get('server', null);
    if (!db || !db.accounts || !db.inbox) { db = seed(); store.set('server', db); }
    const EMPTY = Object.assign({}, db, { accounts: db.accounts.map((a) => Object.assign({}, a, { balance: 0 })), tx: [] });

    /* Writes waiting for a network, and writes that were refused after waiting. */
    let queue = store.get('queue', []);
    let notices = store.get('notices', []);
    const saveServer = () => store.set('server', db);
    const saveQueue = () => store.set('queue', queue);
    const saveNotices = () => store.set('notices', notices);

    /* A payment left "pending" by a reload has long since settled. */
    db.tx.forEach((x) => { if (x.status === 'pending') x.status = 'done'; });

    const params = new URLSearchParams(location.search);
    const ui = {
        view: ['loading', 'empty', 'error'].includes(params.get('state')) ? params.get('state') : 'ready',
        demoOffline: params.get('state') === 'offline',
        private: store.get('private', false) === true,
        card: store.get('card', 0),
        seg: store.get('seg', 'expenses'),
        chart: store.get('chart', 'chart'),
        period: store.get('period', 0),
        selected: -1,
        fetchedAt: Date.now(),
        refreshing: false,
        draining: false,
    };
    const D = () => (ui.view === 'empty' ? EMPTY : db);
    const isOffline = () => ui.demoOffline || navigator.onLine === false;
    const acct = (id) => D().accounts.find((a) => a.id === id);
    const queuedPayments = () => queue.filter((q) => q.type === 'payment');
    const queuedAsTx = (q) => ({ id: q.id, account: q.from, name: q.name, cat: 'transfer', amount: -q.amount, ts: q.ts, status: 'queued', ref: q.ref });
    const allTx = () => queuedPayments().map(queuedAsTx).concat(D().tx).sort((a, b) => b.ts - a.ts);
    const findTx = (id) => allTx().find((x) => x.id === id);

    function serverSend(p) {
        const from = db.accounts.find((a) => a.id === p.from);
        const payee = db.payees.find((x) => x.id === p.payee);
        if (!payee || payee.closed) return { ok: false, reason: t('err.closed', 'The receiving account is closed.') };
        if (!from || from.balance < p.amount) return { ok: false, reason: t('err.funds', '{account} no longer has enough available.', { account: from ? from.name : '' }) };
        from.balance -= p.amount;
        db.tx.push({ id: p.id, account: p.from, name: p.name, cat: 'transfer', amount: -p.amount, ts: Date.now(), status: 'pending', ref: p.ref });
        saveServer();
        return { ok: true };
    }
    function serverCancel(id) {
        const i = db.tx.findIndex((x) => x.id === id);
        if (i < 0) return false;
        const x = db.tx[i];
        db.accounts.find((a) => a.id === x.account).balance -= x.amount;
        db.tx.splice(i, 1);
        saveServer();
        return true;
    }
    function settle(id) {
        const x = db.tx.find((y) => y.id === id);
        if (x && x.status === 'pending') { x.status = 'done'; saveServer(); refresh(); }
    }

    /* ── Elements ──────────────────────────────────────────────────────── */

    const device = $('#device');
    const stacksEl = $('#stacks');
    const tabBar = $('#tabBar');
    const live = $('#live');
    const scrim = $('#scrim');
    const snackbar = $('#snackbar');
    const stackOf = (tab) => $(`.stack[data-tab="${tab}"]`);
    const rootOf = (tab) => $('.page[data-root]', stackOf(tab));

    let liveTimer = null;
    function announce(msg) {
        /* Cleared first, so the same sentence twice is still announced twice. */
        live.textContent = '';
        clearTimeout(liveTimer);
        liveTimer = setTimeout(() => { live.textContent = msg; }, 50);
    }

    /* ── Rendering: shared pieces ──────────────────────────────────────── */

    const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
    const chevron = '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron"/></svg>';

    /* A balance, or dots when the user has asked for them to be hidden. */
    const figure = (pence) => (ui.private
        ? `<span aria-hidden="true">••••</span><span class="sr-only">${esc(t('bal.hidden', 'Hidden'))}</span>`
        : fig(money(pence)));

    /* A monogram on one of five quiet tints, chosen by the name so the same
       merchant is always the same colour. Invented marks for invented names. */
    function mark(name, extraClass) {
        const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
        const initials = ((words[0] || '?')[0] + (words[1] ? words[1][0] : '')).toUpperCase();
        let h = 0;
        for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 997;
        return `<span class="mark${extraClass ? ' ' + extraClass : ''}" data-mark="${(h % 5) + 1}" aria-hidden="true">${esc(initials)}`;
    }

    const STATUS = {
        pending: t('status.pending', 'Pending'),
        queued: t('status.queued', 'Queued'),
        done: t('status.done', 'Completed'),
    };
    const statusHtml = (state, always) => (state === 'done' && !always ? '' : `<span class="status" data-state="${state}">${esc(STATUS[state])}</span>`);
    const masked = (mask) => fig('•••• ' + mask);

    /* `when` is 'stamp' for a flat list (date and time) or 'time' under a day
       heading, where the date would only repeat it. */
    function txRow(x, base, when) {
        const a = acct(x.account);
        const sub = when === 'time'
            ? `<span>${esc(CATS[x.cat] || CATS.other)}</span><span class="sep">${fig(fmtTime.format(x.ts))}</span>`
            : fig(fmtStamp.format(x.ts));
        return `<li><a class="row pressable" href="${base}/tx:${x.id}" data-anchor="${x.id}">
            ${mark(x.name)}</span>
            <span class="row-body">
                <span class="row-headline">${esc(x.name)}</span>
                <span class="row-subhead">${sub}</span>
                ${statusHtml(x.status)}
            </span>
            <span class="row-trail">
                <span class="amount" data-sign="${x.amount > 0 ? 'in' : 'out'}">${fig(signed(x.amount))}</span>
                ${a ? `<span class="row-trail-sub">${masked(a.mask)}</span>` : ''}
            </span>
            ${chevron}</a></li>`;
    }

    function txGroups(list, base) {
        const groups = [];
        list.forEach((x) => {
            const key = dayStart(x.ts);
            let g = groups[groups.length - 1];
            if (!g || g.key !== key) { g = { key, items: [] }; groups.push(g); }
            g.items.push(x);
        });
        const uid = base.replace(/\W/g, '');
        return groups.map((g, i) => `
            <h2 class="section-header is-sticky" id="day-${uid}-${i}">${esc(dayLabel(g.key))}</h2>
            <ul class="list" aria-labelledby="day-${uid}-${i}">${g.items.map((x) => txRow(x, base, 'time')).join('')}</ul>`).join('');
    }

    /* Skeleton rows at the real row dimensions: nothing moves when rows land. */
    const skeletonRow = `<li><div class="row" aria-hidden="true"><span class="mark skel"></span>
        <span class="row-body"><span class="skel skel-line"></span><span class="skel skel-line is-short"></span></span>
        <span class="skel skel-fig"></span></div></li>`;

    /* ── Home ──────────────────────────────────────────────────────────── */

    function balanceMeta() {
        const time = fmtTime.format(ui.fetchedAt);
        /* A stale figure with a timestamp is honest; one that looks live is not. */
        if (ui.view === 'loading') return t('bal.loading', 'Loading your accounts');
        if (isOffline()) return t('bal.asOf', 'Balance from {time}', { time });
        if (ui.refreshing) return t('bal.updating', 'Balance from {time}. Updating now.', { time });
        return t('bal.updated', 'Updated {time}', { time });
    }

    function cardHtml(a, current) {
        const name = t('card.name', '{name}, {kind} ending {mask}', { name: a.name, kind: KINDS[a.kind], mask: a.mask });
        return `<li><a class="bank-card" href="#/home/acct:${a.id}" data-card="${a.id}" data-art="${a.art}" aria-label="${esc(name)}"${current ? ' aria-current="true"' : ''}>
            <span class="card-balance">${figure(a.balance)}</span>
            <svg class="card-wave" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wave"/></svg>
            <span class="card-id">
                ${a.frozen ? `<span class="card-state">${esc(t('card.frozen', 'Frozen'))}</span>` : ''}
                <span class="card-kind">${esc(a.name)} · ${esc(KINDS[a.kind])}</span>
                <span class="card-number">${masked(a.mask)}</span>
            </span>
            <svg class="card-scheme" viewBox="0 0 40 24" aria-hidden="true"><use href="#i-scheme"/></svg>
        </a></li>`;
    }

    function renderHome() {
        const d = D();
        const loading = ui.view === 'loading';
        const region = $('#txRegion');
        const list = $('#cardList');

        $('#totalBalance').innerHTML = loading ? '<span class="skel"></span>' : figure(d.accounts.reduce((s, a) => s + a.balance, 0));
        $('#balanceMeta').textContent = balanceMeta();

        const left = list.scrollLeft;
        list.innerHTML = loading
            ? '<li><div class="bank-card skel" aria-hidden="true"></div></li><li><div class="bank-card skel" aria-hidden="true"></div></li>'
            : d.accounts.map((a, i) => cardHtml(a, i === ui.card)).join('');
        list.scrollLeft = left;
        renderPager();

        region.setAttribute('aria-busy', String(loading));
        $('#viewAll').hidden = loading || ui.view === 'error' || !allTx().length;
        if (loading) {
            region.innerHTML = `<p class="sr-only">${esc(t('tx.loading', 'Loading transactions'))}</p><ul class="list">${skeletonRow.repeat(4)}</ul>`;
        } else if (ui.view === 'error') {
            /* What actually happened, and which kind of failure it was. */
            region.innerHTML = `<div class="empty">
                <p class="empty-title">${esc(t('tx.errorTitle', 'Transactions did not load'))}</p>
                <p class="empty-body">${esc(t('tx.errorBody', 'Brindle answered with an error (503), so this is not your connection. Your balances above are current and your money is not affected.'))}</p>
                <button class="btn btn-secondary" type="button" data-action="retry">${esc(t('tx.retry', 'Try again'))}</button></div>`;
        } else {
            const recent = allTx().filter((x) => !x.mirror).slice(0, 5);
            region.innerHTML = recent.length ? `<ul class="list" aria-labelledby="recentHeading">${recent.map((x) => txRow(x, '#/home', 'stamp')).join('')}</ul>` : `<div class="empty">
                <p class="empty-title">${esc(t('tx.emptyTitle', 'No transactions yet'))}</p>
                <p class="empty-body">${esc(t('tx.emptyBody', 'Pay money in using your account number and sort code, and it shows up here.'))}</p>
                <button class="btn btn-secondary" type="button" data-action="add">${esc(t('tx.emptyAction', 'Show account details'))}</button></div>`;
        }

        const btn = $('#privacyBtn');
        btn.textContent = ui.private ? t('home.show', 'Show') : t('home.hide', 'Hide');
        btn.setAttribute('aria-label', ui.private ? t('home.showLong', 'Show balances') : t('home.hideLong', 'Hide balances'));
        $('#privacySwitch').checked = ui.private;

        const unread = db.inbox.filter((n) => !n.read).length;
        $('#bellDot').hidden = !unread;
        $('#bellBtn').setAttribute('aria-label', unread
            ? plural('bell.unread', unread, { one: 'Notifications, {n} unread', other: 'Notifications, {n} unread' })
            : t('bell.none', 'Notifications'));

        $('#notices').innerHTML = notices.map((n) => `
            <div class="notice" role="group" aria-label="${esc(t('notice.label', 'Payment not sent'))}">
                ${icon('alert')}
                <div>
                    <p class="notice-title">${esc(t('notice.title', '{amount} to {name} was not sent', { amount: money(n.amount), name: n.name }))}</p>
                    <p class="notice-body">${esc(n.reason)} ${esc(t('notice.safe', 'Nothing has left {account}.', { account: n.account }))}</p>
                    <div class="notice-actions">
                        <button class="btn-text" type="button" data-action="notice-edit" data-id="${n.id}">${esc(t('notice.edit', 'Edit payment'))}</button>
                        <button class="btn-text" type="button" data-action="notice-dismiss" data-id="${n.id}">${esc(t('notice.dismiss', 'Dismiss'))}</button>
                    </div>
                </div>
            </div>`).join('');
    }

    /* The carousel. Swiping is native scrolling with snap points; these are
       the two buttons that do the same thing, and the dots that say where
       you are. */
    const cardList = $('#cardList');
    const cardCount = () => $$('.bank-card[data-card]', cardList).length;
    function renderPager() {
        const n = cardCount();
        ui.card = Math.max(0, Math.min(ui.card, n - 1));
        $('#cardDots').innerHTML = Array.from({ length: n }, (_, i) => `<span${i === ui.card ? ' class="is-current"' : ''}></span>`).join('');
        const prev = $('#cardPrev');
        const next = $('#cardNext');
        prev.disabled = ui.card <= 0;
        next.disabled = ui.card >= n - 1;
        prev.setAttribute('aria-label', t('cards.prev', 'Previous card'));
        next.setAttribute('aria-label', t('cards.next', 'Next card'));
        $$('.bank-card[data-card]', cardList).forEach((c, i) => { if (i === ui.card) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
        $('.pager').hidden = n < 2;
    }
    function cardLeft(i) {
        const items = $$('li', cardList);
        if (!items[i]) return 0;
        return items[i].offsetLeft - items[0].offsetLeft;
    }
    function showCard(i, instant) {
        const n = cardCount();
        if (!n) return;
        i = Math.max(0, Math.min(i, n - 1));
        cardList.scrollTo({ left: cardLeft(i) * (document.dir === 'rtl' ? -1 : 1), behavior: instant || reducedMotion() ? 'auto' : 'smooth' });
        setCard(i, instant);
    }
    function setCard(i, silent) {
        if (i === ui.card) return;
        ui.card = i;
        store.set('card', i);            // which card is showing survives a relaunch
        renderPager();
        const a = D().accounts[i];
        if (a && !silent) $('#cardPos').textContent = t('cards.pos', '{name} card, {i} of {n}', { name: a.name, i: i + 1, n: cardCount() });
    }
    let cardRaf = 0;
    cardList.addEventListener('scroll', () => {
        if (cardRaf) return;
        cardRaf = requestAnimationFrame(() => {
            cardRaf = 0;
            const x = Math.abs(cardList.scrollLeft);
            let best = 0;
            for (let i = 1; i < cardCount(); i++) if (Math.abs(cardLeft(i) - x) < Math.abs(cardLeft(best) - x)) best = i;
            setCard(best);
        });
    }, { passive: true });
    $('#cardPrev').addEventListener('click', () => showCard(ui.card - 1));
    $('#cardNext').addEventListener('click', () => showCard(ui.card + 1));
    /* A card that is only peeking in is brought forward first; the one in
       front opens. Focusing one with the keyboard scrolls to it by itself. */
    cardList.addEventListener('click', (e) => {
        const card = e.target.closest('.bank-card[data-card]');
        if (!card) return;
        const i = $$('.bank-card[data-card]', cardList).indexOf(card);
        if (i !== ui.card && e.detail > 0) { e.preventDefault(); showCard(i); }
    });
    cardList.addEventListener('focusin', (e) => {
        const card = e.target.closest('.bank-card[data-card]');
        if (card && card.matches(':focus-visible')) showCard($$('.bank-card[data-card]', cardList).indexOf(card));
    });

    /* ── Analytics ─────────────────────────────────────────────────────── */

    function periodOf(back) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1);
        const label = start.getFullYear() === now.getFullYear() ? fmtMonth.format(start) : fmtMonthYear.format(start);
        return { start: start.getTime(), end: end.getTime(), label };
    }
    const inPeriod = (p) => (x) => x.ts >= p.start && x.ts < p.end && x.status !== 'queued' && !x.mirror;
    /* Moving money to your own savings is not spending it. */
    const isExpense = (x) => x.amount < 0 && x.cat !== 'savings';
    const isIncome = (x) => x.amount > 0;

    /* At most five slices: the four largest, and the rest as Other. Six is
       the point at which a ring is the wrong form (core/07-charts.md). */
    function breakdown(list) {
        const by = new Map();
        list.forEach((x) => by.set(x.cat, (by.get(x.cat) || 0) + Math.abs(x.amount)));
        let parts = Array.from(by, ([cat, value]) => ({ cat, name: CATS[cat] || CATS.other, value })).sort((a, b) => b.value - a.value);
        if (parts.length > 5) {
            const rest = parts.slice(4);
            parts = parts.slice(0, 4).concat({ cat: 'other', name: CATS.other, value: rest.reduce((s, p) => s + p.value, 0) });
        }
        const total = parts.reduce((s, p) => s + p.value, 0);
        parts.forEach((p, i) => { p.share = total ? p.value / total : 0; p.series = i + 1; });
        return { parts, total };
    }

    /* Geometry for the ring, in the SVG's own units. */
    const RING = { w: 358, h: 268, cx: 179, cy: 134, r: 80, stroke: 20, gap: 7 };
    const polar = (r, a) => [RING.cx + r * Math.cos(a), RING.cy + r * Math.sin(a)];
    function arcPath(a0, a1) {
        const [x0, y0] = polar(RING.r, a0);
        const [x1, y1] = polar(RING.r, a1);
        return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${RING.r} ${RING.r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    }
    function ringGeometry(parts) {
        /* Round caps add half the stroke at each end, so each arc is drawn
           shorter by a cap and a gap; a sliver too small for that is a dot. */
        const trim = (RING.stroke + RING.gap) / 2 / RING.r;
        let a = -Math.PI / 2;
        return parts.map((p) => {
            const sweep = p.share * Math.PI * 2;
            const g = { a0: a, a1: a + sweep, mid: a + sweep / 2 };
            g.d0 = parts.length === 1 ? a + 0.001 : Math.min(g.mid, a + trim);
            g.d1 = parts.length === 1 ? a + Math.PI * 2 - 0.001 : Math.max(g.mid + 0.001, a + sweep - trim);
            a += sweep;
            return g;
        });
    }

    function donutHtml(b, period, kindLabel) {
        const geo = ringGeometry(b.parts);
        /* Every segment is labelled where it is drawn: a name and a share,
           outside the ring at the segment's middle. Labels on the same side
           that would collide are pushed apart. */
        const labels = b.parts.map((p, i) => {
            const [x, y] = polar(RING.r + RING.stroke / 2 + 16, geo[i].mid);
            const c = Math.cos(geo[i].mid);
            return { i, x, y: y + 4, anchor: Math.abs(c) < 0.3 ? 'middle' : c > 0 ? 'start' : 'end', side: Math.abs(c) < 0.3 ? 0 : Math.sign(c) };
        });
        [-1, 1].forEach((side) => {
            const col = labels.filter((l) => l.side === side).sort((a, b2) => a.y - b2.y);
            for (let k = 1; k < col.length; k++) if (col[k].y - col[k - 1].y < 36) col[k].y = col[k - 1].y + 36;
        });
        /* Two lines hang below their anchor; in the upper half that is towards
           the ring, so lift them clear of it. */
        labels.forEach((l) => { if (l.side !== 0 && Math.sin(geo[l.i].mid) < -0.25) l.y -= 14; });
        labels.forEach((l) => { if (l.side === 0) l.y += Math.sin(geo[l.i].mid) < 0 ? -18 : 14; });

        const sel = ui.selected >= 0 && ui.selected < b.parts.length ? b.parts[ui.selected] : null;
        const summary = b.parts.map((p) => `${p.name} ${fmtShare.format(p.share)}`).join(', ');
        const label = plural('chart.label', b.parts.length, {
            one: '{kind} for {period}: {total}, in {n} category. {summary}.',
            other: '{kind} for {period}: {total}, in {n} categories. {summary}.',
        }, { kind: kindLabel, period: period.label, total: money(b.total), summary });
        return `<div class="donut${sel ? ' has-selection' : ''}">
            <svg id="donut" viewBox="0 0 ${RING.w} ${RING.h}" role="img" tabindex="0" aria-label="${esc(label)}" aria-describedby="donutHelp">
                <rect width="${RING.w}" height="${RING.h}" fill="none" pointer-events="all"/>
                ${b.parts.map((p, i) => `<path class="seg-rim" d="${arcPath(geo[i].d0, geo[i].d1)}"/>`).join('')}
                ${b.parts.map((p, i) => `<path class="seg${i === ui.selected ? ' is-selected' : ''}" data-series="${p.series}" d="${arcPath(geo[i].d0, geo[i].d1)}"/>`).join('')}
                ${labels.map((l) => `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="${l.anchor}">${esc(b.parts[l.i].name)}<tspan class="lbl-share" x="${l.x.toFixed(1)}" dy="1.25em">${esc(fmtShare.format(b.parts[l.i].share))}</tspan></text>`).join('')}
                <text class="mid-label" x="${RING.cx}" y="${RING.cy - 8}" text-anchor="middle">${esc(sel ? sel.name : kindLabel)}</text>
                <text class="mid-value" x="${RING.cx}" y="${RING.cy + 20}" text-anchor="middle">${esc(sel ? money(sel.value) : period.label)}</text>
            </svg>
            <p class="sr-only" id="donutHelp">${esc(t('chart.help', 'Arrow keys step through the categories. Escape clears the selection. The List view has the same numbers as a table.'))}</p>
        </div>`;
    }

    function tableHtml(b, period, kindLabel) {
        return `<table class="cat-table">
            <caption class="sr-only">${esc(t('table.caption', '{kind} by category, {period}', { kind: kindLabel, period: period.label }))}</caption>
            <thead><tr><th scope="col">${esc(t('table.category', 'Category'))}</th><th scope="col" class="num">${esc(t('table.share', 'Share'))}</th><th scope="col" class="num">${esc(t('table.amount', 'Amount'))}</th></tr></thead>
            <tbody>${b.parts.map((p) => `<tr><th scope="row"><span class="swatch" data-series="${p.series}" aria-hidden="true">${p.series}</span>${esc(p.name)}</th><td class="num">${fig(fmtShare.format(p.share))}</td><td class="num">${fig(money(p.value))}</td></tr>`).join('')}</tbody>
            <tfoot><tr><th scope="row">${esc(t('table.total', 'Total'))}</th><td class="num">${fig(fmtShare.format(1))}</td><td class="num">${fig(money(b.total))}</td></tr></tfoot>
        </table>`;
    }

    function limitsHtml(list) {
        const spent = new Map();
        list.filter(isExpense).forEach((x) => spent.set(x.cat, (spent.get(x.cat) || 0) - x.amount));
        return `<ul class="list no-icons">${Object.entries(db.limits).map(([cat, limit]) => {
            const s = spent.get(cat) || 0;
            const over = s > limit;
            const state = over
                ? `<span class="status" data-state="over">${esc(t('limit.over', 'Over by {amount}', { amount: money(s - limit) }))}</span>`
                : `<span class="row-subhead">${esc(t('limit.left', '{amount} left', { amount: money(limit - s) }))}</span>`;
            return `<li><div class="row limit"${over ? ' data-over' : ''}>
                <span class="row-body">
                    <span class="limit-line"><span class="row-headline">${esc(CATS[cat])}</span>${state}</span>
                    <span class="meter" role="meter" aria-valuemin="0" aria-valuemax="${limit / 100}" aria-valuenow="${s / 100}"
                        aria-valuetext="${esc(t('limit.text', '{spent} of {limit}', { spent: money(s), limit: money(limit) }))}" aria-label="${esc(CATS[cat])}">
                        <span class="meter-fill" style="--v:${Math.min(1, s / limit).toFixed(3)}"></span></span>
                    <span class="row-subhead">${fig(t('limit.text', '{spent} of {limit}', { spent: money(s), limit: money(limit) }))}</span>
                </span></div></li>`;
        }).join('')}</ul>`;
    }

    let analytics = null;            // what is on screen, for the ring's keys and taps
    function renderAnalytics() {
        const period = periodOf(ui.period);
        const all = allTx().filter(inPeriod(period));
        const loading = ui.view === 'loading';
        const kind = ui.seg;
        const list = kind === 'income' ? all.filter(isIncome) : all.filter(isExpense);
        const b = breakdown(kind === 'limits' ? list.filter((x) => x.cat in db.limits) : list);
        const kindLabel = { expenses: t('an.totalExpenses', 'Total expenses'), income: t('an.totalIncome', 'Total income'), limits: t('an.totalLimits', 'Spent against limits') }[kind];
        analytics = kind === 'limits' || ui.chart !== 'chart' ? null : b;
        if (!analytics || ui.selected >= b.parts.length) ui.selected = -1;

        $$('[role="tab"]', $('#anTabs')).forEach((tab) => {
            const on = tab.dataset.seg === kind;
            tab.setAttribute('aria-selected', String(on));
            tab.tabIndex = on ? 0 : -1;
        });
        $('#anPanel').setAttribute('aria-labelledby', 'seg-' + kind);
        $('#periodBtn').setAttribute('aria-label', t('an.period', 'Month: {period}. Change month', { period: period.label }));

        $('#anLabel').textContent = kindLabel;
        $('#anTotal').innerHTML = loading ? '<span class="skel"></span>' : figure(b.total);
        const limitTotal = Object.values(db.limits).reduce((s, v) => s + v, 0);
        $('#anMeta').textContent = loading ? t('bal.loading', 'Loading your accounts')
            : kind === 'limits' ? t('an.metaLimits', '{period}, of {limit} in limits', { period: period.label, limit: money(limitTotal) })
                : plural('an.meta', list.length, { one: '{period}, {n} transaction', other: '{period}, {n} transactions' }, { period: period.label });

        const view = $('#anView');
        view.hidden = kind === 'limits';
        $$('button', view).forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.view === ui.chart)));

        const body = $('#anBody');
        if (loading) body.innerHTML = `<ul class="list">${skeletonRow.repeat(3)}</ul>`;
        else if (kind === 'limits') body.innerHTML = limitsHtml(all);
        else if (!b.parts.length) {
            /* Zero points is an empty state, not an empty ring. */
            body.innerHTML = `<div class="empty">
                <p class="empty-title">${esc(kind === 'income' ? t('an.noIncome', 'No money in during {period}', { period: period.label }) : t('an.noExpenses', 'Nothing spent in {period}', { period: period.label }))}</p>
                <p class="empty-body">${esc(t('an.emptyBody', 'Card payments and transfers show up here as soon as they are made. The calendar button changes the month.'))}</p></div>`;
        } else body.innerHTML = ui.chart === 'chart' ? donutHtml(b, period, kindLabel) + `<div class="chart-alt">${tableHtml(b, period, kindLabel)}</div>` : tableHtml(b, period, kindLabel);

        const recent = list.slice(0, 4);
        $('#anTxHeading').textContent = kind === 'income' ? t('an.recentIn', 'Recent money in') : t('an.recentOut', 'Recent transactions');
        $('#anTxHeading').parentElement.hidden = loading || !recent.length;
        $('#anTx').innerHTML = loading || !recent.length ? '' : `<ul class="list" aria-labelledby="anTxHeading">${recent.map((x) => txRow(x, '#/analytics', 'stamp')).join('')}</ul>`;
    }

    /* The ring. One hit area over the whole plot and a lookup by angle, not a
       handler per segment; arrow keys step, Home and End jump, Escape clears. */
    function selectSegment(i, viaKeyboard) {
        if (!analytics) return;
        ui.selected = i;
        renderAnalytics();
        if (viaKeyboard) { const svg = $('#donut'); if (svg) svg.focus({ preventScroll: true }); }
        const p = analytics && analytics.parts[i];
        announce(p
            ? t('chart.selected', '{name}: {amount}, {share} of the total.', { name: p.name, amount: money(p.value), share: fmtShare.format(p.share) })
            : t('chart.cleared', 'Selection cleared.'));
    }
    $('#anBody').addEventListener('click', (e) => {
        const svg = e.target.closest('#donut');
        if (!svg || !analytics) return;
        const r = svg.getBoundingClientRect();
        /* Client pixels to the SVG's own units: the two are different spaces. */
        const x = ((e.clientX - r.left) / r.width) * RING.w - RING.cx;
        const y = ((e.clientY - r.top) / r.height) * RING.h - RING.cy;
        const dist = Math.hypot(x, y);
        let hit = -1;
        if (Math.abs(dist - RING.r) <= RING.stroke / 2 + 14) {
            let a = Math.atan2(y, x);
            if (a < -Math.PI / 2) a += Math.PI * 2;
            hit = ringGeometry(analytics.parts).findIndex((g) => a >= g.a0 && a < g.a1);
        }
        selectSegment(hit === ui.selected ? -1 : hit, false);
    });
    $('#anBody').addEventListener('keydown', (e) => {
        if (!e.target.closest('#donut') || !analytics) return;
        const n = analytics.parts.length;
        const cur = ui.selected;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        else if (e.key === 'Escape' && cur >= 0) next = -1;
        if (next === null) return;
        e.preventDefault();
        selectSegment(next, true);
    });

    function setSeg(seg, focus) {
        ui.seg = seg;
        ui.selected = -1;
        store.set('seg', seg);
        renderAnalytics();
        if (focus) $('#seg-' + seg).focus();
    }
    $('#anTabs').addEventListener('click', (e) => { const tab = e.target.closest('[role="tab"]'); if (tab) setSeg(tab.dataset.seg, false); });
    $('#anTabs').addEventListener('keydown', (e) => {
        const order = ['expenses', 'income', 'limits'];
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Home') setSeg(order[0], true);
        else if (e.key === 'End') setSeg(order[2], true);
        else if (step) setSeg(order[(order.indexOf(ui.seg) + step * (document.dir === 'rtl' ? -1 : 1) + 3) % 3], true);
        else return;
        e.preventDefault();
    });
    $('#anView').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        ui.chart = btn.dataset.view;
        ui.selected = -1;
        store.set('chart', ui.chart);
        renderAnalytics();
        $(`#anView [data-view="${ui.chart}"]`).focus();
    });

    /* ── Cards tab ─────────────────────────────────────────────────────── */

    /* The value the user asked for wins over the server's while it is queued. */
    const queuedFreeze = (id) => queue.find((q) => q.type === 'freeze' && q.card === id);

    function renderCards() {
        $('#cardRows').innerHTML = db.accounts.map((c) => {
            const q = queuedFreeze(c.id);
            const frozen = q ? q.value : c.frozen;
            const state = q ? `<span class="status" data-state="queued">${esc(t('card.queued', 'Change queued'))}</span>`
                : frozen ? `<span class="status" data-state="frozen">${esc(t('card.frozen', 'Frozen'))}</span>` : '';
            return `<h2 class="section-header" id="card-${c.id}">${esc(c.name)} ${masked(c.mask)}</h2>
                <ul class="list group no-icons" aria-labelledby="card-${c.id}">
                    <li><div class="row kv"><span class="kv-label">${esc(t('card.type', 'Type'))}</span><span class="kv-value">${esc(KINDS[c.kind])}</span></div></li>
                    <li><label class="row pressable">
                        <span class="row-body"><span class="row-headline is-plain">${esc(t('card.freeze', 'Freeze card'))}</span>${state}</span>
                        <input class="switch" type="checkbox" role="switch" data-freeze="${c.id}" ${frozen ? 'checked' : ''}>
                    </label></li>
                </ul>`;
        }).join('');
    }

    /* ── Pushed screens ────────────────────────────────────────────────── */

    const kv = (label, value, cls, celled) => `<div class="row kv"><dt>${esc(label)}</dt><dd class="${cls || ''}">${celled ? fig(value) : esc(value)}</dd></div>`;

    /* Fills a pushed page from its segment. Returns false if the thing it was
       showing no longer exists - a queued payment that was refused, say. */
    function fillPage(page) {
        const [kind, id] = page.dataset.seg.split(':');
        const body = $('.page-body', page);
        let title;
        if (kind === 'all') {
            title = t('all.title', 'Transactions');
            const list = allTx().filter((x) => !x.mirror);
            body.innerHTML = list.length ? txGroups(list, page.dataset.path) : `<div class="empty">
                <p class="empty-title">${esc(t('tx.emptyTitle', 'No transactions yet'))}</p>
                <p class="empty-body">${esc(t('tx.emptyBody', 'Pay money in using your account number and sort code, and it shows up here.'))}</p></div>`;
        } else if (kind === 'acct') {
            const a = acct(id);
            if (!a) return false;
            title = a.name;
            const list = allTx().filter((x) => x.account === a.id);
            body.innerHTML = `
                <section class="hero screen">
                    <p class="hero-label">${esc(t('acct.available', 'Available balance'))}</p>
                    <p class="hero-figure">${figure(a.balance)}</p>
                    ${a.frozen ? `<span class="status" data-state="frozen">${esc(t('card.frozenLong', 'Card frozen'))}</span>` : ''}
                </section>
                <h2 class="section-header">${esc(t('acct.details', 'Account details'))}</h2>
                <dl class="list kv-list">
                    ${kv(t('acct.number', 'Account number'), a.number, 'mono break')}
                    ${kv(t('acct.sort', 'Sort code'), a.sort, 'mono break')}
                    ${kv(t('acct.card', 'Card'), `${KINDS[a.kind]} •••• ${a.mask}`, '', true)}
                    ${a.rate ? kv(t('acct.rate', 'Interest (AER)'), fmtPercent.format(a.rate), '', true) : ''}
                </dl>
                ${list.length ? txGroups(list, page.dataset.path) : `<div class="empty">
                    <p class="empty-title">${esc(t('acct.emptyTitle', 'No transactions on this account yet'))}</p>
                    <p class="empty-body">${esc(t('acct.emptyBody', 'Money paid in with the number and sort code above shows up here.'))}</p></div>`}`;
        } else {
            const x = findTx(id);
            if (!x) return false;
            const a = acct(x.account);
            title = x.amount > 0 ? t('tx.titleIn', 'Money in') : t('tx.titleOut', 'Payment');
            body.innerHTML = `
                <section class="hero screen">
                    <p class="hero-name">${esc(x.name)}</p>
                    <p class="hero-figure amount" data-sign="${x.amount > 0 ? 'in' : 'out'}">${fig(signed(x.amount))}</p>
                    ${statusHtml(x.status, true)}
                </section>
                <h2 class="section-header">${esc(t('tx.details', 'Details'))}</h2>
                <dl class="list kv-list">
                    ${kv(t('tx.when', 'When'), fmtFull.format(x.ts), '', true)}
                    ${kv(t('tx.account', 'Card'), a ? `${a.name} •••• ${a.mask}` : '', '', true)}
                    ${kv(t('tx.category', 'Category'), CATS[x.cat] || CATS.other)}
                    ${x.ref ? kv(t('tx.reference', 'Reference'), x.ref, 'mono break') : ''}
                </dl>
                ${x.status === 'queued' ? `<p class="section-footer">${esc(t('tx.queuedNote', 'This payment has not been sent. It goes when you are back online, and nothing has left your account yet.'))}</p>` : ''}
                ${x.ref ? `<div class="inline-actions"><button class="btn-text" type="button" data-action="copy" data-value="${esc(x.ref)}">${esc(t('tx.copy', 'Copy reference'))}</button></div>` : ''}`;
        }
        page.dataset.title = title;
        $('.nav-title', page).textContent = title;
        return true;
    }

    function renderBanners() {
        const n = queue.length;
        const time = fmtTime.format(ui.fetchedAt);
        let text = '';
        if (isOffline()) {
            text = t('offline.base', 'Offline. Showing balances from {time}.', { time });
            if (n) text += ' ' + plural('offline.queued', n, { one: '{n} change is waiting to send.', other: '{n} changes are waiting to send.' });
        } else if (ui.draining && n) {
            text = plural('offline.sending', n, { one: 'Back online. Sending {n} change.', other: 'Back online. Sending {n} changes.' });
        }
        $$('.offline-banner').forEach((b) => {
            b.hidden = !text;
            const el = $('.offline-text', b);
            if (el.textContent !== text) el.textContent = text;
        });
        const off = $('#demoOffline');
        off.setAttribute('aria-pressed', String(ui.demoOffline));
        off.textContent = ui.demoOffline ? 'Back online' : 'Go offline';

        /* The badge is decoration; the count lives in the tab's name. */
        const badge = $('#homeBadge');
        badge.hidden = !notices.length;
        badge.textContent = String(notices.length);
        $('#homeBadgeName').textContent = notices.length
            ? ', ' + plural('badge', notices.length, { one: '{n} payment not sent', other: '{n} payments not sent' })
            : '';
    }

    function refresh() {
        renderHome();
        renderAnalytics();
        renderCards();
        renderBanners();
        updateAmountHelp();
        /* An item that disappeared while its screen was open: step back out. */
        const gone = $$('.page:not([data-root]):not(.is-leaving)').some((p) => !fillPage(p));
        if (gone) render(current, { animate: false, replaceUrl: true });
    }

    /* ── Routing ───────────────────────────────────────────────────────────
       The hash holds the whole stack - #/home/acct:everyday/tx:t1 - so a
       reload, a deep link and the browser's own back all land in a stack that
       makes sense, with its parents underneath. Three pushes deep at most. */

    let current = { tab: null, segs: [] };
    let depth = 0;                 // pushes we made, so Back can use history
    const tabStacks = store.get('stacks', {});

    const pathOf = (tab, segs) => '#/' + [tab].concat(segs).join('/');
    function parse(hash) {
        const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
        return TABS.includes(parts[0]) ? { tab: parts[0], segs: parts.slice(1) } : null;
    }
    function validate(route) {
        const segs = [];
        if (route.tab === 'home' || route.tab === 'analytics') {
            for (const seg of route.segs.slice(0, 2)) {
                const [kind, id] = seg.split(':');
                const first = segs.length === 0;
                const home = route.tab === 'home';
                if (kind === 'all' && first && home) segs.push(seg);
                else if (kind === 'acct' && first && home && acct(id)) segs.push(seg);
                else if (kind === 'tx' && findTx(id) && (first || segs[0] === 'all' || segs[0] === 'acct:' + findTx(id).account)) { segs.push(seg); break; }
                else break;
            }
        }
        return { tab: route.tab, segs };
    }

    function addPage(stack, seg, path, animate) {
        const below = $$('.page:not(.is-leaving)', stack).pop();
        const page = $('#tplPage').content.firstElementChild.cloneNode(true);
        page.dataset.seg = seg;
        page.dataset.path = path;
        if (!fillPage(page)) return null;
        const backLabel = below.dataset.title;
        $('.nav-back-label', page).textContent = backLabel;
        $('.nav-back', page).setAttribute('aria-label', t('nav.back', 'Back to {title}', { title: backLabel }));
        if (animate) page.classList.add('is-off');
        stack.appendChild(page);
        watchPage(page);
        if (animate) { page.getBoundingClientRect(); page.classList.remove('is-off'); }
        return page;
    }

    function removePage(page, animate) {
        if (!animate) { page.remove(); return; }
        page.classList.add('is-leaving', 'is-off');
        const done = () => page.remove();
        page.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 450);
    }

    function render(route, opts) {
        const o = Object.assign({ animate: true, replaceUrl: false }, opts);
        route = validate(route);
        const stack = stackOf(route.tab);
        const sameTab = current.tab === route.tab;
        const pages = $$('.page:not([data-root]):not(.is-leaving)', stack);
        let keep = 0;
        while (keep < pages.length && keep < route.segs.length && pages[keep].dataset.seg === route.segs[keep]) keep++;

        pages.slice(keep).reverse().forEach((p, i) => removePage(p, o.animate && sameTab && i === 0));
        let path = pathOf(route.tab, route.segs.slice(0, keep));
        route.segs.slice(keep).forEach((seg, i, arr) => {
            path += '/' + seg;
            addPage(stack, seg, path, o.animate && sameTab && i === arr.length - 1);
        });

        current = route;
        document.documentElement.dataset.tab = route.tab;
        $$('.tab', tabBar).forEach((a) => {
            if (a.dataset.tab === route.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        /* Only the top page of the visible stack is in play. */
        $$('.stack').forEach((s) => {
            const livePages = $$('.page:not(.is-leaving)', s);
            livePages.forEach((p, i) => { p.inert = !(s === stack && i === livePages.length - 1); });
        });
        document.title = `${topPage().dataset.title} - Brindle`;

        /* Saved on change: where they are, and what is under it. */
        tabStacks[route.tab] = route.segs;
        store.set('stacks', tabStacks);
        store.set('route', route);
        const want = pathOf(route.tab, route.segs);
        if (o.replaceUrl && location.hash !== want) {
            try { history.replaceState(null, '', want); } catch (_e) { location.replace(want); }
        }
        placeSnackbar();
    }

    const topPage = () => $$('.page:not(.is-leaving)', stackOf(current.tab)).pop();

    function navigate(path, replace) {
        if (path === location.hash) { render(parse(path)); return; }
        if (replace) location.replace(path); else location.hash = path;
    }

    window.addEventListener('hashchange', () => {
        const before = current;
        const route = parse(location.hash) || { tab: before.tab || 'home', segs: [] };
        const pushed = route.tab === before.tab && route.segs.length > before.segs.length;
        const popped = route.tab === before.tab && route.segs.length < before.segs.length;
        if (pushed) depth++;
        if (popped) depth = Math.max(0, depth - 1);
        const from = pathOf(before.tab, before.segs);
        render(route, { replaceUrl: true });

        /* Focus follows the navigation: into the new screen on a push, back to
           the thing that was opened on a pop. */
        if (pushed) $('.nav-title', topPage()).focus({ preventScroll: true });
        else if (popped) {
            const link = $$('a', topPage()).find((a) => a.getAttribute('href') === from);
            (link || $('[tabindex="-1"]', topPage())).focus({ preventScroll: true });
        }
    });

    function goBack() {
        const parent = pathOf(current.tab, current.segs.slice(0, -1));
        if (depth > 0) {
            /* The entry under this one is the parent, so the browser's back
               and this control are the same thing. */
            const was = location.hash;
            history.back();
            setTimeout(() => { if (location.hash === was) location.replace(parent); }, 350);
        } else {
            /* Arrived by reload or deep link: there is no entry underneath, so
               step to the parent that was synthesised. */
            location.replace(parent);
        }
    }

    tabBar.addEventListener('click', (e) => {
        const a = e.target.closest('.tab');
        if (!a) return;
        e.preventDefault();
        const tab = a.dataset.tab;
        if (tab === current.tab) {
            /* The platform convention: the current tab goes to its root, and
               at the root it scrolls to the top. */
            if (current.segs.length) { depth = 0; navigate(pathOf(tab, []), true); }
            else $('.scroller', rootOf(tab)).scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
            return;
        }
        /* Each tab comes back the way it was left. */
        navigate(pathOf(tab, tabStacks[tab] || []), true);
    });

    /* ── Bars that grow with the text ──────────────────────────────────────
       Both bar heights are measured, because a row that grows with the font
       setting is no use under a bar that assumed it would not. */

    const hasRO = 'ResizeObserver' in window;
    function watchPage(page) {
        const scroller = $('.scroller', page);
        const nav = $('.nav-bar', page);
        const large = $('.large-title', page);
        if (hasRO) new ResizeObserver(() => page.style.setProperty('--nav-h', nav.offsetHeight + 'px')).observe(nav);
        let raf = 0;
        let saveTimer = 0;
        const update = () => {
            raf = 0;
            page.toggleAttribute('data-scrolled', scroller.scrollTop > 0);
            if (large) page.toggleAttribute('data-collapsed', large.getBoundingClientRect().bottom <= nav.getBoundingClientRect().bottom);
        };
        scroller.addEventListener('scroll', () => {
            if (!raf) raf = requestAnimationFrame(update);
            if (page.hasAttribute('data-root')) { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveAnchor(page), 150); }
        }, { passive: true });
        update();
    }

    /* Scroll position is saved as the item at the top, not as a pixel offset:
       the list above it may be a different length next launch. */
    function saveAnchor(page) {
        const tab = page.closest('.stack').dataset.tab;
        const navBottom = $('.nav-bar', page).getBoundingClientRect().bottom;
        const scroller = $('.scroller', page);
        const anchors = store.get('anchors', {});
        const first = scroller.scrollTop > 0 && $$('[data-anchor]', page).find((el) => el.getBoundingClientRect().bottom > navBottom);
        if (first) anchors[tab] = { id: first.dataset.anchor, off: Math.round(first.getBoundingClientRect().top - navBottom) };
        else delete anchors[tab];
        store.set('anchors', anchors);
    }
    function restoreAnchors() {
        const anchors = store.get('anchors', {});
        TABS.forEach((tab) => {
            const a = anchors[tab];
            const page = rootOf(tab);
            const el = a && $$('[data-anchor]', page).find((x) => x.dataset.anchor === a.id);
            if (!el) return;
            const navBottom = $('.nav-bar', page).getBoundingClientRect().bottom;
            $('.scroller', page).scrollTop += el.getBoundingClientRect().top - navBottom - a.off;
        });
    }

    /* ── Snackbar ──────────────────────────────────────────────────────── */

    let snackTimer = null;
    let snackExpire = null;
    function placeSnackbar() {
        /* Above whatever is pinned at the bottom of the screen on top. */
        const bar = current.tab ? $('.action-bar', topPage()) : null;
        device.style.setProperty('--snack-bottom', (tabBar.offsetHeight + (bar ? bar.offsetHeight : 0)) + 'px');
    }
    function hideSnack(expired) {
        clearTimeout(snackTimer);
        snackbar.classList.remove('is-open');
        const fn = snackExpire;
        snackExpire = null;
        if (expired && fn) fn();
    }
    function showSnack(text, onUndo, onExpire) {
        if (snackExpire) { const fn = snackExpire; snackExpire = null; fn(); }
        clearTimeout(snackTimer);
        placeSnackbar();
        $('#snackbarText').textContent = text;
        const undo = $('#snackbarUndo');
        undo.hidden = !onUndo;
        undo.onclick = () => { snackExpire = null; hideSnack(false); onUndo(); };
        snackExpire = onExpire || null;
        snackbar.classList.add('is-open');
        const tick = () => {
            /* It does not leave while somebody is on it. */
            if (snackbar.matches(':hover') || snackbar.contains(document.activeElement)) snackTimer = setTimeout(tick, 2000);
            else hideSnack(true);
        };
        snackTimer = setTimeout(tick, 7000);
    }

    /* ── Sheets ────────────────────────────────────────────────────────────
       One at a time. Rises from the bottom edge, dismissed by drag, by the
       scrim, by Escape, and by a control you can see. */

    let openSheetEl = null;
    let sheetOpener = null;
    let busy = false;

    function setBackgroundInert(on) {
        stacksEl.inert = on;
        tabBar.inert = on;
        snackbar.inert = on;
    }

    function openSheet(sheet, opts) {
        const o = opts || {};
        if (openSheetEl) return;
        openSheetEl = sheet;
        sheetOpener = o.opener || document.activeElement;
        hideSnack(true);
        sheet.hidden = false;
        if (o.restoring) sheet.classList.add('is-dragging');   // no entrance on relaunch
        sheet.getBoundingClientRect();
        sheet.classList.add('is-open');
        scrim.classList.add('is-open');
        if (o.restoring) { sheet.getBoundingClientRect(); sheet.classList.remove('is-dragging'); }
        setBackgroundInert(true);
        if (!o.restoring) (o.focus || $('.sheet-title', sheet)).focus({ preventScroll: true });
    }

    function closeSheet() {
        const sheet = openSheetEl;
        if (!sheet || busy) return;
        openSheetEl = null;
        sheet.classList.remove('is-open', 'is-dragging');
        sheet.style.transform = '';
        scrim.classList.remove('is-open');
        scrim.style.opacity = '';
        setBackgroundInert(false);
        if (sheet.id === 'sendSheet') store.del('sheet');
        const done = () => { if (openSheetEl !== sheet) sheet.hidden = true; };
        sheet.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 400);
        const back = sheetOpener && document.contains(sheetOpener) && !sheetOpener.closest('[inert]') ? sheetOpener : $('[tabindex="-1"]', topPage());
        back.focus({ preventScroll: true });
    }

    scrim.addEventListener('click', closeSheet);
    $$('.sheet').forEach((sheet) => {
        sheet.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-close]')) closeSheet(); });

        /* Focus stays inside the sheet, and Escape closes it. */
        sheet.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
            if (e.key !== 'Tab') return;
            const items = $$('button, input, select, a[href]', sheet).filter((el) => !el.disabled && el.tabIndex >= 0 && el.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            const at = document.activeElement;
            if (e.shiftKey && (at === first || !items.includes(at))) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (at === last || !sheet.contains(at))) { e.preventDefault(); first.focus(); }
        });

        /* Drag down to dismiss - a shortcut for the Cancel or Done you can
           see. The sheet tracks the finger, then either leaves or settles. */
        const handle = $('.sheet-drag', sheet);
        let startY = 0;
        let lastY = 0;
        let lastT = 0;
        let velocity = 0;
        let dragging = false;
        handle.addEventListener('pointerdown', (e) => {
            if (busy || e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
            dragging = true;
            startY = lastY = e.clientY;
            lastT = e.timeStamp;
            velocity = 0;
            handle.setPointerCapture(e.pointerId);
            sheet.classList.add('is-dragging');
        });
        handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dy = Math.max(0, e.clientY - startY);
            const dt = e.timeStamp - lastT;
            if (dt > 0) velocity = (e.clientY - lastY) / dt;
            lastY = e.clientY;
            lastT = e.timeStamp;
            sheet.style.transform = `translateY(${dy}px)`;
            scrim.style.opacity = String(Math.max(0, 1 - dy / sheet.offsetHeight));
        });
        const end = (e) => {
            if (!dragging) return;
            dragging = false;
            const dy = Math.max(0, e.clientY - startY);
            sheet.classList.remove('is-dragging');
            if (e.type === 'pointerup' && (dy > sheet.offsetHeight * 0.25 || velocity > 0.6)) closeSheet();
            else { sheet.style.transform = ''; scrim.style.opacity = ''; }
        };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    });

    /* The keyboard. The layout viewport does not change when it opens, so no
       stylesheet can do this: the visual viewport says how much of the bottom
       is covered, and the sheet - with its submit button - rides above it. */
    if (window.visualViewport) {
        const vv = window.visualViewport;
        const onViewport = () => {
            const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
            device.style.setProperty('--kb', kb + 'px');
            $$('.sheet').forEach((s) => s.classList.toggle('has-keyboard', kb > 80));
            const a = document.activeElement;
            if (kb > 80 && a && a.closest('.sheet') && a.matches('input, select')) a.scrollIntoView({ block: 'nearest' });
        };
        vv.addEventListener('resize', onViewport);
        vv.addEventListener('scroll', onViewport);
    }

    /* ── The short sheet: notifications, month, account details ────────── */

    const infoSheet = $('#infoSheet');
    function openInfo(kind, opener) {
        const body = $('#infoBody');
        let title;
        if (kind === 'inbox') {
            title = t('inbox.title', 'Notifications');
            body.innerHTML = db.inbox.length ? `<ul class="list no-icons">${db.inbox.map((n) => `<li><div class="row">
                <span class="row-body"><span class="row-headline is-plain"><b>${esc(n.title)}</b></span>
                <span class="row-subhead is-wrap">${esc(n.body)}</span>
                ${n.read ? '' : `<span class="status" data-state="pending">${esc(t('inbox.new', 'New'))}</span>`}</span></div></li>`).join('')}</ul>`
                : `<div class="empty"><p class="empty-title">${esc(t('inbox.empty', 'Nothing new'))}</p></div>`;
            /* Opening the list is reading it. */
            db.inbox.forEach((n) => { n.read = true; });
            saveServer();
        } else if (kind === 'period') {
            title = t('period.title', 'Month');
            body.innerHTML = `<div class="list no-icons" role="radiogroup" aria-labelledby="infoTitle">${[0, 1, 2].map((back) => {
                const p = periodOf(back);
                return `<label class="row pressable"><span class="row-body"><span class="row-headline is-plain">${esc(p.label)}</span></span>
                    <input class="radio" type="radio" name="period" value="${back}" ${back === ui.period ? 'checked' : ''}></label>`;
            }).join('')}</div>`;
        } else {
            const a = acct('everyday');
            title = t('add.title', 'Add money');
            body.innerHTML = `<p class="section-footer">${esc(t('add.body', 'Send a bank transfer to these details from any other account. It usually arrives within two hours.'))}</p>
                <dl class="list kv-list">
                    ${kv(t('add.name', 'Name'), 'Morgan Ellery')}
                    ${kv(t('acct.number', 'Account number'), a.number, 'mono break')}
                    ${kv(t('acct.sort', 'Sort code'), a.sort, 'mono break')}
                </dl>
                <div class="inline-actions"><button class="btn-text" type="button" data-action="copy" data-label="${esc(t('add.copy', 'Copy account details'))}" data-value="${esc(`Morgan Ellery, ${a.number}, ${a.sort}`)}">${esc(t('add.copy', 'Copy account details'))}</button></div>`;
        }
        $('#infoTitle').textContent = title;
        openSheet(infoSheet, { opener });
        if (kind === 'inbox') renderHome();
    }
    infoSheet.addEventListener('change', (e) => {
        if (e.target.name !== 'period') return;
        ui.period = Number(e.target.value);
        ui.selected = -1;
        store.set('period', ui.period);
        renderAnalytics();
        announce(t('period.set', 'Showing {period}.', { period: periodOf(ui.period).label }));
    });
    $('#bellBtn').addEventListener('click', (e) => openInfo('inbox', e.currentTarget));
    $('#periodBtn').addEventListener('click', (e) => openInfo('period', e.currentTarget));
    $('#addBtn').addEventListener('click', (e) => openInfo('add', e.currentTarget));

    /* ── Send money ────────────────────────────────────────────────────── */

    const sendSheet = $('#sendSheet');
    const form = $('#sendForm');
    const people = $('#people');
    const fAmount = $('#fAmount');
    const fFrom = $('#fFrom');
    const submit = $('#sendSubmit');
    const submitLabel = $('#sendSubmitLabel');
    const sendStatus = $('#sendStatus');
    const QUICK = [1000, 2000, 5000, 10000];
    let payeeId = '';

    function fillSend() {
        people.innerHTML = db.payees.map((p) => `<button class="person" type="button" role="radio" aria-checked="false" tabindex="-1" data-payee="${p.id}"
            aria-label="${esc(t('send.person', '{name}, account ending {mask}', { name: p.name, mask: p.mask }))}">
            ${mark(p.name)}<span class="person-tick">${icon('check')}</span></span>
            <span class="person-name">${esc(p.short)}</span></button>`).join('');
        fFrom.innerHTML = db.accounts.map((a) => `<option value="${a.id}">${esc(a.name)} (•••• ${esc(a.mask)})</option>`).join('');
        $('#fAmountAffix').textContent = SYMBOL;
        fAmount.placeholder = (0).toFixed(2).replace('.', DECIMAL);
        $('#chips').innerHTML = QUICK.map((p) => `<button class="chip" type="button" aria-pressed="false" data-quick="${p}">${fig(fmtMoney0.format(p / 100))}</button>`).join('');
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', DECIMAL, '0', 'del'];
        $('#keypad').innerHTML = keys.map((k) => (k === 'del'
            ? `<button class="key" type="button" tabindex="-1" data-key="del" aria-label="${esc(t('key.del', 'Delete last digit'))}">${icon('delete')}</button>`
            : `<button class="key" type="button" tabindex="-1" data-key="${k}"${k === DECIMAL ? ` aria-label="${esc(t('key.point', 'Decimal point'))}"` : ''}>${k}</button>`)).join('');
    }

    function setPayee(id, focus) {
        payeeId = db.payees.some((p) => p.id === id) ? id : '';
        const buttons = $$('.person', people);
        buttons.forEach((b, i) => {
            const on = b.dataset.payee === payeeId;
            b.setAttribute('aria-checked', String(on));
            /* A radio group is one tab stop: the chosen one, or the first. */
            b.tabIndex = on || (!payeeId && i === 0) ? 0 : -1;
            if (on && focus) b.focus();
            if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
        });
        if (payeeId) setError(people, '');
    }

    function updateAmountHelp() {
        const a = acct(fFrom.value) || D().accounts[0];
        $('#fAmountHelp').textContent = ui.private
            ? t('send.availableHidden', '{account}: balance hidden', { account: a.name })
            : t('send.available', '{account} has {amount} available', { account: a.name, amount: money(a.balance) });
    }

    /* Accepts the locale's decimal separator, and a dot. Returns pence. */
    function parseAmount(raw) {
        let s = String(raw).trim().replace(/\s/g, '');
        if (SYMBOL) s = s.split(SYMBOL).join('');
        if (DECIMAL !== '.') s = s.split('.').join('').replace(DECIMAL, '.'); else s = s.replace(/,/g, '');
        if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
        return Math.round(parseFloat(s) * 100);
    }

    function syncAmount() {
        /* Browsers without field-sizing get the width from the text. */
        fAmount.style.width = Math.max(4, fAmount.value.length + 0.5) + 'ch';
        const p = parseAmount(fAmount.value);
        $$('[data-quick]').forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.quick) === p)));
    }

    const readDraft = () => ({ payee: payeeId, amount: fAmount.value, from: fFrom.value });
    const isDirty = () => Boolean(payeeId || fAmount.value.trim());
    function writeDraft(d) {
        setPayee(d && d.payee ? d.payee : '', false);
        fAmount.value = d && d.amount ? d.amount : '';
        fFrom.value = d && d.from && acct(d.from) ? d.from : db.accounts[0].id;
        $('#sendClear').hidden = !isDirty();
        syncAmount();
        updateAmountHelp();
    }
    /* Persisted on change - not on a timer, and not only on close. */
    function saveDraft() {
        if (isDirty()) store.set('draft', readDraft()); else store.del('draft');
        $('#sendClear').hidden = !isDirty();
        syncAmount();
    }

    function setError(field, msg) {
        const err = $('#' + field.id + 'Err');
        if (!err) return;
        err.hidden = !msg;
        err.textContent = msg || '';
        if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }
    function checkPayee() {
        const msg = payeeId ? '' : t('send.errPayee', 'Choose who to pay.');
        setError(people, msg);
        return !msg;
    }
    function checkAmount(allowEmpty) {
        const raw = fAmount.value.trim();
        const a = acct(fFrom.value);
        let msg = '';
        if (!raw) msg = allowEmpty ? '' : t('send.errAmountEmpty', 'Enter an amount.');
        else {
            const p = parseAmount(raw);
            if (!(p > 0)) msg = t('send.errAmount', 'Enter an amount above {zero}, like {example}.', { zero: money(0), example: money(1250) });
            else if (a && p > a.balance) msg = t('send.errFunds', 'That is more than {account} has: {amount} is available.', { account: a.name, amount: money(a.balance) });
        }
        setError(fAmount, msg);
        return !msg;
    }
    function clearErrors() {
        setError(people, '');
        setError(fAmount, '');
        sendStatus.hidden = true;
        sendStatus.textContent = '';
    }

    function setBusy(on) {
        busy = on;
        submit.disabled = on;
        submit.setAttribute('aria-busy', String(on));
        /* The label is replaced in place; the button keeps its width. */
        submitLabel.textContent = on ? t('send.sending', 'Sending') : t('send.submit', 'Send money');
        $$('button, input, select', $('.sheet-body', sendSheet)).forEach((f) => { f.disabled = on; });
    }

    function openSend(opts) {
        const o = opts || {};
        if (openSheetEl) return;
        clearErrors();
        writeDraft(store.get('draft', null));
        store.set('sheet', true);
        /* A mouse or keyboard user lands on the first thing to do. On touch,
           focusing the field would throw the system keyboard up over the
           keypad before they have read the sheet. */
        const fine = matchMedia('(pointer: fine)').matches;
        const first = !payeeId ? $('.person[tabindex="0"]', people) : fAmount;
        openSheet(sendSheet, { restoring: o.restoring, opener: o.opener || $('#sendBtn'), focus: fine ? first : $('#sendTitle') });
    }

    async function submitSend() {
        if (busy) return;                       // a double tap sends once
        clearErrors();
        const okPayee = checkPayee();
        const okAmount = checkAmount(false);
        if (!okPayee || !okAmount) { (okPayee ? fAmount : $('.person[tabindex="0"]', people)).focus(); return; }

        const payee = db.payees.find((p) => p.id === payeeId);
        const p = {
            type: 'payment', id: 'p' + Date.now().toString(36), payee: payee.id, name: payee.name,
            amount: parseAmount(fAmount.value), from: fFrom.value, ref: '', ts: Date.now(),
        };
        const vars = { amount: money(p.amount), name: p.name };

        if (isOffline()) {
            /* Queued, and said to be queued - not drawn as sent. No balance
               moves until the server has answered (pack/04-lifecycle.md). */
            queue.push(p);
            saveQueue();
            store.del('draft');
            closeSheet();
            refresh();
            const msg = t('snack.queued', '{amount} to {name} is queued. It sends when you are back online.', vars);
            announce(msg);
            showSnack(msg, () => {
                queue = queue.filter((q) => q.id !== p.id);
                saveQueue();
                refresh();
                announce(t('snack.unqueued', 'Queued payment to {name} removed.', vars));
            });
            return;
        }

        setBusy(true);
        await wait(900);
        const res = serverSend(p);
        setBusy(false);

        if (!res.ok) {
            /* The error at the final step: say what happened, keep the input. */
            sendStatus.textContent = t('send.failed', 'Not sent. {reason} Nothing has left your account.', { reason: res.reason });
            sendStatus.hidden = false;
            submit.focus();
            return;
        }

        store.del('draft');
        closeSheet();
        refresh();
        /* For a few seconds the payment can still be recalled, so it is a
           snackbar with an undo. Once that passes there is no undo, and the
           row's own state is all the confirmation it gets. */
        const msg = t('snack.sent', '{amount} to {name} is pending.', vars);
        announce(msg);
        showSnack(msg, () => {
            if (serverCancel(p.id)) {
                refresh();
                announce(t('snack.cancelled', 'Payment to {name} cancelled. {amount} is back in your account.', vars));
            }
        }, () => settle(p.id));
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); submitSend(); });
    fAmount.addEventListener('input', saveDraft);
    fFrom.addEventListener('change', () => { saveDraft(); updateAmountHelp(); checkAmount(true); });
    /* Validate on blur, and never an error for a field they have not filled. */
    fAmount.addEventListener('blur', () => checkAmount(true));

    people.addEventListener('click', (e) => {
        const b = e.target.closest('.person');
        if (!b) return;
        setPayee(b.dataset.payee, false);
        saveDraft();
    });
    people.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const ids = db.payees.map((p) => p.id);
        const at = Math.max(0, ids.indexOf(document.activeElement.dataset.payee));
        setPayee(ids[(at + step + ids.length) % ids.length], true);
        saveDraft();
    });

    /* Chips and keys edit the field's value and say so with an input event,
       so everything that listens to the field hears them too. They never take
       focus: a tap on a key must not raise the system keyboard. */
    function setAmount(value) {
        fAmount.value = value;
        fAmount.dispatchEvent(new Event('input', { bubbles: true }));
        setError(fAmount, '');
    }
    let keyAnnounce = 0;
    $('#chips').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-quick]');
        if (!chip) return;
        setAmount((Number(chip.dataset.quick) / 100).toFixed(2).replace('.', DECIMAL));
        announce(t('send.amountSet', 'Amount {amount}.', { amount: money(Number(chip.dataset.quick)) }));
    });
    $('#keypad').addEventListener('pointerdown', (e) => { if (e.target.closest('.key')) e.preventDefault(); });
    $('#keypad').addEventListener('click', (e) => {
        const key = e.target.closest('.key');
        if (!key) return;
        const k = key.dataset.key;
        let v = fAmount.value;
        const [whole, frac] = v.split(DECIMAL);
        if (k === 'del') v = v.slice(0, -1);
        else if (k === DECIMAL) { if (!v.includes(DECIMAL)) v = (v || '0') + DECIMAL; }
        else if (frac !== undefined) { if (frac.length < 2) v += k; }
        else if (whole === '0') v = k;
        else if (whole.length < 6) v += k;
        setAmount(v);
        /* Said once the typing pauses, not once per key. */
        clearTimeout(keyAnnounce);
        keyAnnounce = setTimeout(() => announce(v ? t('send.amountSet', 'Amount {amount}.', { amount: SYMBOL + v }) : t('send.amountEmpty', 'Amount cleared.')), 700);
    });

    $('#sendBtn').addEventListener('click', () => openSend());
    $('#sendClear').addEventListener('click', () => {
        store.del('draft');
        writeDraft(null);
        clearErrors();
        announce(t('send.cleared', 'Draft cleared.'));
        $('.person[tabindex="0"]', people).focus();
    });

    /* ── Offline, the queue, and coming back ───────────────────────────── */

    async function drain() {
        if (ui.draining || isOffline() || !queue.length) { renderBanners(); return; }
        ui.draining = true;
        hideSnack(true);            // its undo was for a queue that is now being sent
        renderBanners();
        let sent = 0;
        let refused = 0;
        while (queue.length && !isOffline()) {
            await wait(800);
            if (isOffline() || !queue.length) break;
            const item = queue.shift();
            saveQueue();
            if (item.type === 'freeze') {
                const c = db.accounts.find((x) => x.id === item.card);
                if (c) c.frozen = item.value;
                saveServer();
                sent++;
            } else {
                const res = serverSend(item);
                if (res.ok) {
                    sent++;
                    setTimeout(() => settle(item.id), 5000);
                } else {
                    /* Refused after queueing. The row goes back to not
                       existing, and a notice says which payment and why -
                       the user has done other things since. */
                    refused++;
                    const a = db.accounts.find((x) => x.id === item.from);
                    notices.push({ id: item.id, amount: item.amount, name: item.name, account: a ? a.name : '', reason: res.reason, draft: { payee: item.payee, amount: (item.amount / 100).toFixed(2).replace('.', DECIMAL), from: item.from } });
                    saveNotices();
                }
            }
            refresh();
        }
        ui.draining = false;
        ui.fetchedAt = Date.now();
        refresh();
        if (refused) announce(plural('drain.refused', refused, { one: '{n} queued payment was not sent. Details are on the Home tab.', other: '{n} queued payments were not sent. Details are on the Home tab.' }));
        else if (sent) announce(plural('drain.sent', sent, { one: 'Back online. {n} queued change was sent.', other: 'Back online. {n} queued changes were sent.' }));
    }

    function connectivityChanged() {
        if (!isOffline()) ui.fetchedAt = queue.length ? ui.fetchedAt : Date.now();
        refresh();
        if (isOffline()) announce(t('offline.announce', 'You are offline. Balances are from {time}.', { time: fmtTime.format(ui.fetchedAt) }));
        else drain();
    }
    window.addEventListener('online', connectivityChanged);
    window.addEventListener('offline', connectivityChanged);

    /* Coming back after a while: same place, data refreshed underneath, and
       the old figure labelled as old until the new one lands. No polling -
       nothing here runs while the screen is not visible. */
    let hiddenAt = 0;
    async function refetch() {
        if (isOffline() || ui.refreshing || ui.view !== 'ready') return;
        ui.refreshing = true;
        $('#balanceMeta').textContent = balanceMeta();
        await wait(1200);
        ui.refreshing = false;
        ui.fetchedAt = Date.now();
        $('#balanceMeta').textContent = balanceMeta();   // same rows, same heights: nothing moves
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) hiddenAt = Date.now();
        else if (hiddenAt && Date.now() - hiddenAt > 5 * 60e3) refetch();
    });

    /* ── Everything else that is tappable ──────────────────────────────── */

    function setPrivate(on) {
        ui.private = on;
        store.set('private', on);
        refresh();
        announce(on ? t('privacy.on', 'Balances hidden.') : t('privacy.off', 'Balances shown.'));
    }

    async function loadTransactions(ms) {
        ui.view = 'loading';
        refresh();
        await wait(ms);
        if (ui.view !== 'loading') return;
        ui.view = 'ready';
        ui.fetchedAt = Date.now();
        refresh();
        showCard(ui.card, true);
        announce(t('tx.loaded', 'Transactions loaded.'));
    }

    device.addEventListener('click', (e) => {
        if (e.target.closest('.nav-back')) { goBack(); return; }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        if (action === 'retry') loadTransactions(1500);
        else if (action === 'add') openInfo('add', el);
        else if (action === 'copy') {
            /* The control's own state says it worked; no toast for this. */
            const label = el.dataset.label || t('tx.copy', 'Copy reference');
            const done = (ok) => {
                el.textContent = ok ? t('tx.copied', 'Copied') : t('tx.copyFailed', 'Could not copy');
                announce(ok ? t('tx.copiedLong', 'Copied.') : t('tx.copyFailedLong', 'It could not be copied.'));
                setTimeout(() => { if (document.contains(el)) el.textContent = label; }, 2000);
            };
            try { navigator.clipboard.writeText(el.dataset.value).then(() => done(true), () => done(false)); } catch (_e) { done(false); }
        } else if (action === 'notice-dismiss' || action === 'notice-edit') {
            const n = notices.find((x) => x.id === el.dataset.id);
            notices = notices.filter((x) => x.id !== el.dataset.id);
            saveNotices();
            refresh();
            if (action === 'notice-edit' && n) { store.set('draft', n.draft); openSend(); }
            else $('[tabindex="-1"]', topPage()).focus({ preventScroll: true });
        }
    });

    $('#privacyBtn').addEventListener('click', () => setPrivate(!ui.private));

    stacksEl.addEventListener('change', (e) => {
        if (e.target.id === 'privacySwitch') { setPrivate(e.target.checked); return; }
        const id = e.target.dataset.freeze;
        if (!id) return;
        const c = db.accounts.find((x) => x.id === id);
        const value = e.target.checked;
        const vars = { name: c.name };
        if (isOffline()) {
            /* Toggling back before it was sent cancels the queued change. */
            queue = queue.filter((q) => !(q.type === 'freeze' && q.card === id));
            if (value !== c.frozen) queue.push({ type: 'freeze', id: 'f' + Date.now().toString(36), card: id, value });
            saveQueue();
            announce(t('card.queuedLong', 'Change to the {name} card is queued until you are back online.', vars));
        } else {
            /* Optimistic, because all three conditions hold: it nearly always
               works, nothing depends on it yet, and the switch undoes it. */
            c.frozen = value;
            saveServer();
            announce(value ? t('card.frozenSaid', 'The {name} card is frozen.', vars) : t('card.unfrozenSaid', 'The {name} card is unfrozen.', vars));
        }
        refresh();
        const again = $(`[data-freeze="${id}"]`);
        if (again) again.focus({ preventScroll: true });
    });

    /* ── Demo controls (outside the phone) ─────────────────────────────── */

    $('#demoOffline').addEventListener('click', () => { ui.demoOffline = !ui.demoOffline; connectivityChanged(); });
    $$('[data-demo]').forEach((b) => b.addEventListener('click', () => {
        const what = b.dataset.demo;
        if (what === 'slow') loadTransactions(2500);
        else if (what === 'away') { if (ui.view !== 'ready') { ui.view = 'ready'; refresh(); } refetch(); }
        else if (what === 'reset') { store.clear(); location.replace(location.pathname); }
        else { ui.view = what; refresh(); showCard(ui.card, true); }
    }));

    /* ── Launch ────────────────────────────────────────────────────────────
       Everything below runs synchronously before the first paint: the route,
       each tab's stack, the scroll anchors, the card that was showing, and
       the send sheet if it was open. */

    $('#statusTime').textContent = fmtTime.format(Date.now());
    fillSend();
    renderHome();
    renderAnalytics();
    renderCards();
    renderBanners();
    $$('.page[data-root]').forEach(watchPage);
    if (hasRO) new ResizeObserver(() => { device.style.setProperty('--tabbar-h', tabBar.offsetHeight + 'px'); placeSnackbar(); }).observe(tabBar);

    const initial = parse(location.hash) || store.get('route', null) || { tab: 'home', segs: [] };
    TABS.forEach((tab) => {
        if (tab !== initial.tab && (tabStacks[tab] || []).length) { current = { tab, segs: [] }; render({ tab, segs: tabStacks[tab] }, { animate: false }); }
    });
    current = { tab: TABS.includes(initial.tab) ? initial.tab : 'home', segs: [] };
    render({ tab: current.tab, segs: initial.segs || [] }, { animate: false, replaceUrl: true });
    restoreAnchors();
    const startCard = ui.card;
    ui.card = -1;
    showCard(startCard, true);
    updateAmountHelp();
    if (store.get('sheet', false) && current.tab === 'home' && !current.segs.length) openSend({ restoring: true });
    if (!isOffline()) drain();
})();
