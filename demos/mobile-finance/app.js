/* ==========================================================================
   Brindle - behaviour.

   What this file is for, in the order the pack cares about:

   1. The session ends without warning. The route (tab and the stack under
      it), each tab's own stack, the scroll anchor, the send draft and whether
      the sheet was open are all saved ON CHANGE and restored on launch.
      pack/04-lifecycle.md
   2. Offline is a normal condition. Balances stay on screen with their age,
      writes are queued and counted in ONE banner, and a write refused after
      queueing comes back as a notice that outlives a toast.
   3. A transfer is not optimistic (core/08-feedback.md). The button goes busy
      in place, and success is only drawn once the stand-in server says so.
   4. Every gesture has a visible equivalent: drag-to-dismiss has Cancel, and
      back has a control as well as the browser's own back.

   There is no server. `db` below stands in for one and is kept in
   localStorage so the demo survives a reload; nothing leaves the page.
   ========================================================================== */

(() => {
    'use strict';

    const LOCALE = document.documentElement.lang || 'en-GB';
    const CURRENCY = 'GBP';
    const TABS = ['accounts', 'cards', 'payments', 'you'];

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* Storage can throw outright, so every access is guarded. */
    const store = {
        get(k, d) { try { const v = localStorage.getItem('brindle.' + k); return v == null ? d : JSON.parse(v); } catch (_e) { return d; } },
        set(k, v) { try { localStorage.setItem('brindle.' + k, JSON.stringify(v)); } catch (_e) { /* private mode */ } },
        del(k) { try { localStorage.removeItem('brindle.' + k); } catch (_e) { /* private mode */ } },
        clear() { try { Object.keys(localStorage).filter((k) => k.startsWith('brindle.')).forEach((k) => localStorage.removeItem(k)); } catch (_e) { /* private mode */ } },
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
    const plural = (n, forms) => forms[pluralRules.select(n)] || forms.other;
    $$('[data-i18n]').forEach((el) => { const s = DICT[el.dataset.i18n]; if (s) el.textContent = s; });

    /* ── Formatting: always through Intl, never by hand ────────────────── */
    const fmtMoney = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
    const fmtSigned = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, signDisplay: 'exceptZero' });
    const fmtPercent = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 2 });
    const fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
    const fmtDay = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    const fmtShort = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
    const fmtFull = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
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

    /* ── The stand-in server ───────────────────────────────────────────── */

    const CATS = {
        eating: { icon: 'cup', label: t('cat.eating', 'Eating out') },
        transport: { icon: 'train', label: t('cat.transport', 'Transport') },
        income: { icon: 'in', label: t('cat.income', 'Income') },
        groceries: { icon: 'basket', label: t('cat.groceries', 'Groceries') },
        transfer: { icon: 'swap', label: t('cat.transfer', 'Transfer') },
        bills: { icon: 'bolt', label: t('cat.bills', 'Bills') },
        fun: { icon: 'ticket', label: t('cat.fun', 'Entertainment') },
        health: { icon: 'health', label: t('cat.health', 'Health') },
        housing: { icon: 'home', label: t('cat.housing', 'Housing') },
        savings: { icon: 'coins', label: t('cat.savings', 'Savings') },
    };
    const KINDS = {
        current: { icon: 'wallet', label: t('kind.current', 'Current account') },
        savings: { icon: 'coins', label: t('kind.savings', 'Savings account') },
    };

    function seed() {
        const now = Date.now();
        const ago = (min) => now - min * 6e4;
        const at = (days, h, m) => { const d = new Date(now - days * 864e5); d.setHours(h, m, 0, 0); return d.getTime(); };
        return {
            accounts: [
                { id: 'everyday', name: 'Everyday', kind: 'current', mask: '4417', number: '31904417', sort: '04-18-27', balance: 184642 },
                { id: 'rainy', name: 'Rainy day', kind: 'savings', mask: '9024', number: '60219024', sort: '04-18-27', rate: 0.031, balance: 244000 },
            ],
            tx: [
                { id: 't11', account: 'everyday', name: 'Halden Coffee', cat: 'eating', amount: -340, ts: ago(38), status: 'done', ref: 'HALDEN COFFEE 0931' },
                { id: 't12', account: 'everyday', name: 'Tomasz Nowak', cat: 'transfer', amount: 1800, ts: ago(96), status: 'done', ref: 'Cinema tickets' },
                { id: 't10', account: 'everyday', name: 'Northline Rail', cat: 'transport', amount: -1280, ts: ago(214), status: 'done', ref: 'NORTHLINE TKT 77104' },
                { id: 't09', account: 'everyday', name: 'Saltmarsh Studio Ltd', cat: 'income', amount: 284000, ts: at(1, 6, 2), status: 'done', ref: 'SALARY OCT' },
                { id: 't08', account: 'everyday', name: 'Corner Pantry', cat: 'groceries', amount: -2716, ts: at(1, 18, 47), status: 'done', ref: 'CORNER PANTRY 0214' },
                { id: 't07', account: 'everyday', name: 'Priya Raman', cat: 'transfer', amount: -4500, ts: at(1, 20, 15), status: 'done', ref: 'Dinner' },
                { id: 't06', account: 'everyday', name: 'Emberlight Energy', cat: 'bills', amount: -8600, ts: at(2, 7, 0), status: 'done', ref: 'DD EMBERLIGHT 5530921' },
                { id: 't05', account: 'everyday', name: 'Kestrel Cinema', cat: 'fun', amount: -1900, ts: at(2, 19, 32), status: 'done', ref: 'KESTREL CINEMA' },
                { id: 't04', account: 'everyday', name: 'Oak Street Pharmacy', cat: 'health', amount: -749, ts: at(3, 12, 20), status: 'done', ref: 'OAK ST PHARMACY' },
                { id: 't03', account: 'everyday', name: 'Rainy day', cat: 'savings', amount: -20000, ts: at(3, 9, 0), status: 'done', ref: 'Monthly saving' },
                { id: 't03m', account: 'rainy', name: 'From Everyday', cat: 'savings', amount: 20000, ts: at(3, 9, 0), status: 'done', ref: 'Monthly saving', mirror: true },
                { id: 't02', account: 'everyday', name: 'Alder Lettings', cat: 'housing', amount: -95000, ts: at(5, 8, 0), status: 'done', ref: 'RENT FLAT 3B' },
                { id: 't01', account: 'everyday', name: 'Wren & Fig Bakery', cat: 'eating', amount: -520, ts: at(5, 8, 41), status: 'done', ref: 'WREN AND FIG' },
                { id: 't00', account: 'rainy', name: 'Interest', cat: 'income', amount: 612, ts: at(8, 0, 5), status: 'done', ref: 'INTEREST SEP' },
            ],
            cards: [
                { id: 'debit', name: 'Everyday debit', mask: '4417', kind: t('card.physical', 'Physical card'), frozen: false },
                { id: 'virtual', name: 'Online shopping', mask: '7730', kind: t('card.virtual', 'Virtual card'), frozen: false },
            ],
            payees: [
                { id: 'priya', name: 'Priya Raman', mask: '2291' },
                { id: 'tomasz', name: 'Tomasz Nowak', mask: '6408' },
                { id: 'alder', name: 'Alder Lettings', mask: '1175' },
                /* Rigged: the stand-in server refuses this one, so the refusal
                   paths can be seen - inline when online, a notice when queued. */
                { id: 'oldflat', name: 'Old Flat Deposit', mask: '5002', closed: true },
            ],
            upcoming: [
                { id: 'u1', name: 'Kiln Yard Gym', cat: 'health', amount: -3200, ts: at(-5, 7, 0), note: t('up.dd', 'Direct Debit') },
                { id: 'u2', name: 'Emberlight Energy', cat: 'bills', amount: -8600, ts: at(-12, 7, 0), note: t('up.dd', 'Direct Debit') },
                { id: 'u3', name: 'Alder Lettings', cat: 'housing', amount: -95000, ts: at(-23, 7, 0), note: t('up.so', 'Standing order') },
            ],
        };
    }

    let db = store.get('server', null);
    if (!db || !db.accounts) { db = seed(); store.set('server', db); }
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
    const sheet = $('#sendSheet');
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

    /* ── Rendering ─────────────────────────────────────────────────────── */

    const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
    const chevron = '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron"/></svg>';

    /* A balance, or dots when the user has asked for them to be hidden. */
    const figure = (pence) => (ui.private
        ? `<span aria-hidden="true">••••</span><span class="sr-only">${esc(t('bal.hidden', 'Hidden'))}</span>`
        : esc(money(pence)));

    const STATUS = {
        pending: t('status.pending', 'Pending'),
        queued: t('status.queued', 'Queued'),
        done: t('status.done', 'Completed'),
    };
    const statusHtml = (state, always) => (state === 'done' && !always ? '' : `<span class="status" data-state="${state}">${esc(STATUS[state])}</span>`);

    function txRow(x, base) {
        const cat = CATS[x.cat] || CATS.transfer;
        return `<li><a class="row pressable" href="${base}/tx:${x.id}" data-anchor="${x.id}">
            <span class="row-icon" aria-hidden="true">${icon(cat.icon)}</span>
            <span class="row-body">
                <span class="row-headline">${esc(x.name)}</span>
                <span class="row-subhead"><span>${esc(cat.label)}</span><span class="sep fig">${fmtTime.format(x.ts)}</span></span>
                ${statusHtml(x.status)}
            </span>
            <span class="row-trail fig amount" data-sign="${x.amount > 0 ? 'in' : 'out'}">${esc(signed(x.amount))}</span>
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
        return groups.map((g, i) => `
            <h2 class="section-header is-sticky" id="day-${base.length}-${i}">${esc(dayLabel(g.key))}</h2>
            <ul class="list" aria-labelledby="day-${base.length}-${i}">${g.items.map((x) => txRow(x, base)).join('')}</ul>`).join('');
    }

    /* Skeleton rows at the real row dimensions: nothing moves when rows land. */
    const skeletonRow = `<li><div class="row" aria-hidden="true"><span class="row-icon skel"></span>
        <span class="row-body"><span class="skel skel-line"></span><span class="skel skel-line is-short"></span></span>
        <span class="skel skel-fig"></span></div></li>`;

    function accountRow(a) {
        const kind = KINDS[a.kind];
        return `<li><a class="row pressable" href="#/accounts/acct:${a.id}" data-anchor="acct-${a.id}">
            <span class="row-icon" aria-hidden="true">${icon(kind.icon)}</span>
            <span class="row-body">
                <span class="row-headline">${esc(a.name)}</span>
                <span class="row-subhead"><span>${esc(kind.label)}</span><span class="sep fig">•• ${esc(a.mask)}</span></span>
            </span>
            <span class="row-trail fig">${figure(a.balance)}</span>
            ${chevron}</a></li>`;
    }

    function balanceMeta() {
        const time = fmtTime.format(ui.fetchedAt);
        /* A stale figure with a timestamp is honest; one that looks live is not. */
        if (ui.view === 'loading') return t('bal.loading', 'Loading your accounts');
        if (isOffline()) return t('bal.asOf', 'Balance from {time}', { time });
        if (ui.refreshing) return t('bal.updating', 'Balance from {time}. Updating now.', { time });
        return t('bal.updated', 'Updated {time}', { time });
    }

    function renderAccounts() {
        const d = D();
        const loading = ui.view === 'loading';
        const region = $('#txRegion');

        $('#totalBalance').innerHTML = loading ? '<span class="skel"></span>' : figure(d.accounts.reduce((s, a) => s + a.balance, 0));
        $('#balanceMeta').textContent = balanceMeta();
        $('#accountRows').innerHTML = loading ? skeletonRow + skeletonRow : d.accounts.map(accountRow).join('');
        region.setAttribute('aria-busy', String(loading));

        if (loading) {
            region.innerHTML = `<p class="section-header is-sticky"><span class="sr-only">${esc(t('tx.loading', 'Loading transactions'))}</span><span class="skel skel-fig" aria-hidden="true"></span></p>
                <ul class="list">${skeletonRow.repeat(5)}</ul>`;
        } else if (ui.view === 'error') {
            /* What actually happened, and which kind of failure it was. */
            region.innerHTML = `<div class="empty">
                <p class="empty-title">${esc(t('tx.errorTitle', 'Transactions did not load'))}</p>
                <p class="empty-body">${esc(t('tx.errorBody', 'Brindle answered with an error (503), so this is not your connection. Your balances above are current and your money is not affected.'))}</p>
                <button class="btn btn-secondary" type="button" data-action="retry">${esc(t('tx.retry', 'Try again'))}</button></div>`;
        } else {
            const list = allTx().filter((x) => !x.mirror);
            region.innerHTML = list.length ? txGroups(list, '#/accounts') : `<div class="empty">
                <p class="empty-title">${esc(t('tx.emptyTitle', 'No transactions yet'))}</p>
                <p class="empty-body">${esc(t('tx.emptyBody', 'Pay money in using your account number and sort code, and it shows up here.'))}</p>
                <a class="btn btn-secondary" href="#/accounts/acct:everyday">${esc(t('tx.emptyAction', 'View account details'))}</a></div>`;
        }

        const btn = $('#privacyBtn');
        btn.textContent = ui.private ? t('accounts.show', 'Show') : t('accounts.hide', 'Hide');
        btn.setAttribute('aria-label', ui.private ? t('accounts.showLong', 'Show balances') : t('accounts.hideLong', 'Hide balances'));
        $('#privacySwitch').checked = ui.private;

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

    /* The value the user asked for wins over the server's while it is queued. */
    const queuedFreeze = (id) => queue.find((q) => q.type === 'freeze' && q.card === id);

    function renderCards() {
        $('#cardRows').innerHTML = `${db.cards.map((c) => {
            const q = queuedFreeze(c.id);
            const frozen = q ? q.value : c.frozen;
            const state = q ? `<span class="status" data-state="queued">${esc(t('card.queued', 'Change queued'))}</span>`
                : frozen ? `<span class="status" data-state="frozen">${esc(t('card.frozen', 'Frozen'))}</span>` : '';
            return `<h2 class="section-header" id="card-${c.id}"><span>${esc(c.name)}</span><span class="fig"> •• ${esc(c.mask)}</span></h2>
                <ul class="list group no-icons" aria-labelledby="card-${c.id}">
                    <li><div class="row kv"><span class="kv-label">${esc(t('card.type', 'Type'))}</span><span class="kv-value">${esc(c.kind)}</span></div></li>
                    <li><label class="row pressable">
                        <span class="row-body"><span class="row-headline is-plain">${esc(t('card.freeze', 'Freeze card'))}</span>${state}</span>
                        <input class="switch" type="checkbox" role="switch" data-card="${c.id}" ${frozen ? 'checked' : ''}>
                    </label></li>
                </ul>`;
        }).join('')}`;
    }

    function renderPayments() {
        $('#upcomingRows').innerHTML = db.upcoming.map((u) => `<li><div class="row">
            <span class="row-icon" aria-hidden="true">${icon((CATS[u.cat] || CATS.bills).icon)}</span>
            <span class="row-body"><span class="row-headline">${esc(u.name)}</span>
                <span class="row-subhead"><span>${esc(u.note)}</span><span class="sep fig">${esc(fmtShort.format(u.ts))}</span></span></span>
            <span class="row-trail fig">${esc(money(-u.amount))}</span></div></li>`).join('');
        $('#payeeRows').innerHTML = db.payees.map((p) => `<li><div class="row">
            <span class="row-icon" aria-hidden="true">${icon('swap')}</span>
            <span class="row-body"><span class="row-headline">${esc(p.name)}</span>
                <span class="row-subhead fig">•• ${esc(p.mask)}</span></span></div></li>`).join('');
    }

    const kv = (label, value, cls) => `<div class="row kv"><dt>${esc(label)}</dt><dd class="${cls || ''}">${esc(value)}</dd></div>`;

    /* Fills a pushed page from its segment. Returns false if the thing it was
       showing no longer exists - a queued payment that was refused, say. */
    function fillPage(page) {
        const [kind, id] = page.dataset.seg.split(':');
        const body = $('.page-body', page);
        let title;
        if (kind === 'acct') {
            const a = acct(id);
            if (!a) return false;
            title = a.name;
            const list = allTx().filter((x) => x.account === a.id);
            body.innerHTML = `
                <section class="hero screen">
                    <p class="balance-label">${esc(t('acct.available', 'Available balance'))}</p>
                    <p class="balance-figure fig">${figure(a.balance)}</p>
                </section>
                <h2 class="section-header">${esc(t('acct.details', 'Account details'))}</h2>
                <dl class="list kv-list">
                    ${kv(t('acct.number', 'Account number'), a.number, 'mono break')}
                    ${kv(t('acct.sort', 'Sort code'), a.sort, 'mono break')}
                    ${kv(t('acct.type', 'Type'), KINDS[a.kind].label)}
                    ${a.rate ? kv(t('acct.rate', 'Interest (AER)'), fmtPercent.format(a.rate), 'fig') : ''}
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
                    <p class="balance-figure fig amount" data-sign="${x.amount > 0 ? 'in' : 'out'}">${esc(signed(x.amount))}</p>
                    ${statusHtml(x.status, true)}
                </section>
                <h2 class="section-header">${esc(t('tx.details', 'Details'))}</h2>
                <dl class="list kv-list">
                    ${kv(t('tx.when', 'When'), fmtFull.format(x.ts), 'fig')}
                    ${kv(t('tx.account', 'Account'), a ? a.name : '')}
                    ${kv(t('tx.category', 'Category'), (CATS[x.cat] || CATS.transfer).label)}
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
            if (n) text += ' ' + t('offline.queued.' + pluralRules.select(n), plural(n, { one: '{n} change is waiting to send.', other: '{n} changes are waiting to send.' }), { n });
        } else if (ui.draining && n) {
            text = t('offline.sending.' + pluralRules.select(n), plural(n, { one: 'Back online. Sending {n} change.', other: 'Back online. Sending {n} changes.' }), { n });
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
        const badge = $('#accountsBadge');
        badge.hidden = !notices.length;
        badge.textContent = String(notices.length);
        $('#accountsBadgeName').textContent = notices.length
            ? ', ' + t('badge.' + pluralRules.select(notices.length), plural(notices.length, { one: '{n} payment not sent', other: '{n} payments not sent' }), { n: notices.length })
            : '';
    }

    function refresh() {
        renderAccounts();
        renderCards();
        renderBanners();
        updateAmountHelp();
        /* An item that disappeared while its screen was open: step back out. */
        const gone = $$('.page:not([data-root]):not(.is-leaving)').some((p) => !fillPage(p));
        if (gone) render(current, { animate: false, replaceUrl: true });
    }

    /* ── Routing ───────────────────────────────────────────────────────────
       The hash holds the whole stack - #/accounts/acct:everyday/tx:t07 - so a
       reload, a deep link and the browser's own back all land in a stack that
       makes sense, with its parents underneath. */

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
        if (route.tab === 'accounts') {
            for (const seg of route.segs.slice(0, 2)) {
                const [kind, id] = seg.split(':');
                const first = segs.length === 0;
                if (kind === 'acct' && first && acct(id)) segs.push(seg);
                else if (kind === 'tx' && findTx(id) && (first || segs[0] === 'acct:' + findTx(id).account)) { segs.push(seg); break; }
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
            const live = $$('.page:not(.is-leaving)', s);
            live.forEach((p, i) => { p.inert = !(s === stack && i === live.length - 1); });
        });
        const top = topPage();
        document.title = `${top.dataset.title} - Brindle`;

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
        const route = parse(location.hash) || { tab: before.tab || 'accounts', segs: [] };
        const pushed = route.tab === before.tab && route.segs.length > before.segs.length;
        const popped = route.tab === before.tab && route.segs.length < before.segs.length;
        if (pushed) depth++;
        if (popped) depth = Math.max(0, depth - 1);
        const from = pathOf(before.tab, before.segs);
        render(route, { replaceUrl: true });

        /* Focus follows the navigation: into the new screen on a push, back to
           the row that was opened on a pop. */
        if (pushed) $('.nav-title', topPage()).focus({ preventScroll: true });
        else if (popped) {
            const link = $$('a.row', topPage()).find((a) => a.getAttribute('href') === from);
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
            else {
                const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
                $('.scroller', rootOf(tab)).scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
            }
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
        const h = tabBar.offsetHeight + (bar ? bar.offsetHeight : 0);
        device.style.setProperty('--snack-bottom', h + 'px');
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
        snackTimer = setTimeout(tick, onUndo ? 7000 : 4000);
    }

    /* ── The send sheet ────────────────────────────────────────────────── */

    const form = $('#sendForm');
    const fPayee = $('#fPayee');
    const fAmount = $('#fAmount');
    const fFrom = $('#fFrom');
    const fRef = $('#fRef');
    const submit = $('#sendSubmit');
    const submitLabel = $('#sendSubmitLabel');
    const sendStatus = $('#sendStatus');
    let sheetOpen = false;
    let sheetOpener = null;
    let busy = false;

    function fillSelects() {
        fPayee.innerHTML = `<option value="">${esc(t('send.choose', 'Choose a payee'))}</option>`
            + db.payees.map((p) => `<option value="${p.id}">${esc(p.name)} (•• ${esc(p.mask)})</option>`).join('');
        fFrom.innerHTML = db.accounts.map((a) => `<option value="${a.id}">${esc(a.name)} (•• ${esc(a.mask)})</option>`).join('');
        $('#fAmountAffix').textContent = SYMBOL;
        fAmount.placeholder = (0).toFixed(2).replace('.', DECIMAL);
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

    const readDraft = () => ({ payee: fPayee.value, amount: fAmount.value, from: fFrom.value, ref: fRef.value });
    const isDirty = () => Boolean(fPayee.value || fAmount.value.trim() || fRef.value.trim());
    function writeDraft(d) {
        fPayee.value = d && d.payee ? d.payee : '';
        fAmount.value = d && d.amount ? d.amount : '';
        fFrom.value = d && d.from && acct(d.from) ? d.from : db.accounts[0].id;
        fRef.value = d && d.ref ? d.ref : '';
        $('#sendClear').hidden = !isDirty();
        updateAmountHelp();
    }
    /* Persisted on change - not on a timer, and not only on close. */
    function saveDraft() {
        if (isDirty()) store.set('draft', readDraft()); else store.del('draft');
        $('#sendClear').hidden = !isDirty();
    }

    function setError(field, msg) {
        const err = $('#' + field.id + 'Err');
        if (!err) return;
        err.hidden = !msg;
        err.textContent = msg || '';
        if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }
    function checkPayee() {
        const msg = fPayee.value ? '' : t('send.errPayee', 'Choose who to pay.');
        setError(fPayee, msg);
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
        setError(fPayee, '');
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
        [fPayee, fAmount, fFrom, fRef].forEach((f) => { f.disabled = on; });
    }

    function setBackgroundInert(on) {
        stacksEl.inert = on;
        tabBar.inert = on;
        snackbar.inert = on;
    }

    function openSheet(opts) {
        const o = opts || {};
        if (sheetOpen) return;
        sheetOpen = true;
        sheetOpener = o.restoring ? $('#sendBtn') : document.activeElement;
        hideSnack(true);
        clearErrors();
        writeDraft(store.get('draft', null));
        sheet.hidden = false;
        if (o.restoring) sheet.classList.add('is-dragging');   // no entrance on relaunch
        sheet.getBoundingClientRect();
        sheet.classList.add('is-open');
        scrim.classList.add('is-open');
        if (o.restoring) { sheet.getBoundingClientRect(); sheet.classList.remove('is-dragging'); }
        setBackgroundInert(true);
        store.set('sheet', true);
        /* A mouse or keyboard user lands in the first field. On touch that
           would throw the keyboard up before they have read the sheet. */
        if (!o.restoring) {
            const first = fPayee.value ? (fAmount.value ? fRef : fAmount) : fPayee;
            (matchMedia('(pointer: fine)').matches ? first : $('#sendTitle')).focus({ preventScroll: true });
        }
    }

    /* Closing never discards what was typed: the draft stays saved and comes
       back with the sheet. Discarding is a separate, explicit Clear. */
    function closeSheet() {
        if (!sheetOpen || busy) return;
        sheetOpen = false;
        sheet.classList.remove('is-open', 'is-dragging');
        sheet.style.transform = '';
        scrim.classList.remove('is-open');
        scrim.style.opacity = '';
        setBackgroundInert(false);
        store.del('sheet');
        const done = () => { if (!sheetOpen) sheet.hidden = true; };
        sheet.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 400);
        const back = sheetOpener && document.contains(sheetOpener) ? sheetOpener : $('#sendBtn');
        back.focus({ preventScroll: true });
    }

    async function submitSend() {
        if (busy) return;                       // a double tap sends once
        clearErrors();
        const okPayee = checkPayee();
        const okAmount = checkAmount(false);
        if (!okPayee || !okAmount) { (okPayee ? fAmount : fPayee).focus(); return; }

        const payee = db.payees.find((p) => p.id === fPayee.value);
        const p = {
            type: 'payment', id: 'p' + Date.now().toString(36), payee: payee.id, name: payee.name,
            amount: parseAmount(fAmount.value), from: fFrom.value, ref: fRef.value.trim(), ts: Date.now(),
        };
        const vars = { amount: money(p.amount), name: p.name };

        if (isOffline()) {
            /* Queued, and said to be queued - not drawn as sent. The balance
               does not move until the server has answered. */
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
        const msg = t('snack.sent', '{amount} to {name} is pending.', vars);
        announce(msg);
        showSnack(msg, () => {
            if (serverCancel(p.id)) {
                refresh();
                const done = t('snack.cancelled', 'Payment to {name} cancelled. {amount} is back in your account.', vars);
                announce(done);
                showSnack(done);
            }
        }, () => settle(p.id));
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); submitSend(); });
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', () => { saveDraft(); updateAmountHelp(); });
    /* Validate on blur, and never an error for a field they have not filled. */
    fAmount.addEventListener('blur', () => checkAmount(true));
    fPayee.addEventListener('change', () => { if (fPayee.value) setError(fPayee, ''); });
    fFrom.addEventListener('change', () => checkAmount(true));
    /* The return key advances, and on the last field it submits. */
    fAmount.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fRef.focus(); } });

    $('#sendBtn').addEventListener('click', () => openSheet());
    $('#sendCancel').addEventListener('click', closeSheet);
    scrim.addEventListener('click', closeSheet);
    $('#sendClear').addEventListener('click', () => {
        store.del('draft');
        writeDraft(null);
        clearErrors();
        announce(t('send.cleared', 'Draft cleared.'));
        fPayee.focus();
    });

    /* Focus stays inside the sheet, and Escape closes it. */
    sheet.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
        if (e.key !== 'Tab') return;
        const items = $$('button, input, select', sheet).filter((el) => !el.disabled && !el.hidden && el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement) || document.activeElement === $('#sendTitle'))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* Drag down to dismiss - a shortcut for Cancel, which is always visible.
       The sheet tracks the finger, then either leaves or settles back. */
    (() => {
        const handle = $('#sheetDrag');
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
            if (e.type === 'pointerup' && (dy > sheet.offsetHeight * 0.3 || velocity > 0.6)) closeSheet();
            else { sheet.style.transform = ''; scrim.style.opacity = ''; }
        };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    })();

    /* The keyboard. The layout viewport does not change when it opens, so no
       stylesheet can do this: the visual viewport says how much of the bottom
       is covered, and the sheet - with its submit button - rides above it. */
    if (window.visualViewport) {
        const vv = window.visualViewport;
        const onViewport = () => {
            const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
            device.style.setProperty('--kb', kb + 'px');
            sheet.classList.toggle('has-keyboard', kb > 80);
            const a = document.activeElement;
            if (kb > 80 && a && sheet.contains(a) && a.matches('input, select')) a.scrollIntoView({ block: 'nearest' });
        };
        vv.addEventListener('resize', onViewport);
        vv.addEventListener('scroll', onViewport);
    }
    sheet.addEventListener('focusin', (e) => {
        if (e.target.matches('input, select')) e.target.scrollIntoView({ block: 'nearest' });
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
                const c = db.cards.find((x) => x.id === item.card);
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
                    notices.push({ id: item.id, amount: item.amount, name: item.name, account: a ? a.name : '', reason: res.reason, draft: { payee: item.payee, amount: (item.amount / 100).toFixed(2).replace('.', DECIMAL), from: item.from, ref: item.ref } });
                    saveNotices();
                }
            }
            refresh();
        }
        ui.draining = false;
        ui.fetchedAt = Date.now();
        refresh();
        if (refused) announce(t('drain.refused.' + pluralRules.select(refused), plural(refused, { one: '{n} queued payment was not sent. Details are on the Accounts tab.', other: '{n} queued payments were not sent. Details are on the Accounts tab.' }), { n: refused }));
        else if (sent) announce(t('drain.sent.' + pluralRules.select(sent), plural(sent, { one: 'Back online. {n} queued change was sent.', other: 'Back online. {n} queued changes were sent.' }), { n: sent }));
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
        refresh();                               // same rows, same heights: nothing scrolls
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) hiddenAt = Date.now();
        else if (hiddenAt && Date.now() - hiddenAt > 5 * 60e3) refetch();
    });

    /* ── Everything tappable inside the stacks ─────────────────────────── */

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
        announce(t('tx.loaded', 'Transactions loaded.'));
    }

    stacksEl.addEventListener('click', (e) => {
        if (e.target.closest('.nav-back')) { goBack(); return; }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        if (action === 'retry') loadTransactions(1500);
        else if (action === 'copy') {
            /* The control's own state says it worked; no toast for this. */
            const done = (ok) => {
                const label = t('tx.copy', 'Copy reference');
                el.textContent = ok ? t('tx.copied', 'Copied') : t('tx.copyFailed', 'Could not copy');
                announce(ok ? t('tx.copiedLong', 'Reference copied.') : t('tx.copyFailedLong', 'The reference could not be copied.'));
                setTimeout(() => { if (document.contains(el)) el.textContent = label; }, 2000);
            };
            try { navigator.clipboard.writeText(el.dataset.value).then(() => done(true), () => done(false)); } catch (_e) { done(false); }
        } else if (action === 'notice-dismiss' || action === 'notice-edit') {
            const n = notices.find((x) => x.id === el.dataset.id);
            notices = notices.filter((x) => x.id !== el.dataset.id);
            saveNotices();
            refresh();
            if (action === 'notice-edit' && n) { store.set('draft', n.draft); $('#sendBtn').focus(); openSheet(); }
            else $('.nav-title', topPage()).focus({ preventScroll: true });
        }
    });

    $('#privacyBtn').addEventListener('click', () => setPrivate(!ui.private));

    stacksEl.addEventListener('change', (e) => {
        if (e.target.id === 'privacySwitch') { setPrivate(e.target.checked); return; }
        const id = e.target.dataset.card;
        if (!id) return;
        const c = db.cards.find((x) => x.id === id);
        const value = e.target.checked;
        const vars = { name: c.name };
        if (isOffline()) {
            /* Toggling back before it was sent cancels the queued change. */
            queue = queue.filter((q) => !(q.type === 'freeze' && q.card === id));
            if (value !== c.frozen) queue.push({ type: 'freeze', id: 'f' + Date.now().toString(36), card: id, value });
            saveQueue();
            announce(t('card.queuedLong', 'Change to {name} is queued until you are back online.', vars));
        } else {
            /* Optimistic, because all three conditions hold: it nearly always
               works, nothing depends on it yet, and the switch undoes it. */
            c.frozen = value;
            saveServer();
            announce(value ? t('card.frozenLong', '{name} is frozen.', vars) : t('card.unfrozenLong', '{name} is unfrozen.', vars));
        }
        refresh();
        const again = $(`[data-card="${id}"]`);
        if (again) again.focus({ preventScroll: true });
    });

    /* ── Demo controls (outside the phone) ─────────────────────────────── */

    $('#demoOffline').addEventListener('click', () => { ui.demoOffline = !ui.demoOffline; connectivityChanged(); });
    $$('[data-demo]').forEach((b) => b.addEventListener('click', () => {
        const what = b.dataset.demo;
        if (what === 'slow') loadTransactions(2500);
        else if (what === 'away') { if (ui.view !== 'ready') { ui.view = 'ready'; refresh(); } refetch(); }
        else if (what === 'reset') { store.clear(); location.replace(location.pathname); }
        else { ui.view = what; refresh(); }
    }));

    /* ── Launch ────────────────────────────────────────────────────────────
       Everything below runs synchronously before the first paint: the route,
       each tab's stack, the scroll anchors, and the sheet if it was open. */

    $('#statusTime').textContent = fmtTime.format(Date.now());
    fillSelects();
    renderPayments();
    renderAccounts();
    renderCards();
    renderBanners();
    $$('.page[data-root]').forEach(watchPage);
    if (hasRO) new ResizeObserver(() => { device.style.setProperty('--tabbar-h', tabBar.offsetHeight + 'px'); placeSnackbar(); }).observe(tabBar);

    const initial = parse(location.hash) || store.get('route', null) || { tab: 'accounts', segs: [] };
    TABS.forEach((tab) => {
        if (tab !== initial.tab && (tabStacks[tab] || []).length) { current = { tab, segs: [] }; render({ tab, segs: tabStacks[tab] }, { animate: false }); }
    });
    current = { tab: initial.tab, segs: [] };
    render(TABS.includes(initial.tab) ? initial : { tab: 'accounts', segs: [] }, { animate: false, replaceUrl: true });
    restoreAnchors();
    updateAmountHelp();
    if (store.get('sheet', false) && current.tab === 'accounts' && !current.segs.length) openSheet({ restoring: true });
    if (!isOffline()) drain();
})();
