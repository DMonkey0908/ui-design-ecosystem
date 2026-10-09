/* Kestrow demo. Everything here enhances: the page reads, navigates and
   submits without it. No scroll listeners; observers only. */
(function () {
    'use strict';

    var doc = document;
    var header = doc.querySelector('.header');
    var hasIO = 'IntersectionObserver' in window;

    /* ---- Header: transparent at the top, plated once the page scrolls ---- */
    var sentinel = doc.querySelector('.scroll-sentinel');
    if (hasIO && sentinel) {
        new IntersectionObserver(function (entries) {
            header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
        }).observe(sentinel);
    } else {
        header.classList.add('is-scrolled');
    }

    /* ---- Reveals: once, never again on the way back up ---- */
    var reveals = doc.querySelectorAll('.reveal');
    if (hasIO) {
        var revealer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { revealer.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---- Mobile menu: a real disclosure with a focus trap ---- */
    var menuBtn = doc.querySelector('.menu-btn');
    var nav = doc.getElementById('site-nav');
    var compact = window.matchMedia('(max-width: 59.99em)');

    function menuIsOpen() { return menuBtn.getAttribute('aria-expanded') === 'true'; }

    function setMenu(open, returnFocus) {
        menuBtn.setAttribute('aria-expanded', String(open));
        header.classList.toggle('menu-open', open);
        if (open) {
            var first = nav.querySelector('a');
            if (first) first.focus();
        } else if (returnFocus) {
            menuBtn.focus();
        }
    }

    menuBtn.addEventListener('click', function () { setMenu(!menuIsOpen(), false); });

    nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && menuIsOpen()) setMenu(false, false);
    });

    doc.addEventListener('click', function (e) {
        if (menuIsOpen() && !header.contains(e.target)) setMenu(false, false);
    });

    doc.addEventListener('keydown', function (e) {
        if (!menuIsOpen()) return;
        if (e.key === 'Escape') {
            setMenu(false, true);
            return;
        }
        if (e.key !== 'Tab') return;
        var items = [menuBtn].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
            e.preventDefault();
            first.focus();
        } else if (items.indexOf(doc.activeElement) === -1) {
            e.preventDefault();
            first.focus();
        }
    });

    function onBreakpoint() { if (!compact.matches && menuIsOpen()) setMenu(false, false); }
    if (compact.addEventListener) compact.addEventListener('change', onBreakpoint);
    else if (compact.addListener) compact.addListener(onBreakpoint);

    /* ---- Range buttons carry their series into the form ---- */
    var seriesInput = doc.getElementById('f-series');
    var seriesNote = doc.getElementById('series-note');
    doc.querySelectorAll('[data-series]').forEach(function (link) {
        link.addEventListener('click', function () {
            var series = link.getAttribute('data-series');
            seriesInput.value = series;
            seriesNote.textContent = 'Sizing within the ' + series + ' range. We will say so if another range fits better.';
            seriesNote.hidden = false;
        });
    });

    /* ---- Lead form: validate on blur, error beside the field ---- */
    var form = doc.getElementById('size-form');
    var done = doc.getElementById('form-done');
    var doneText = doc.getElementById('form-done-text');
    var status = doc.getElementById('form-status');
    var again = doc.getElementById('form-again');
    form.setAttribute('novalidate', '');

    function toNumber(v) { return Number(String(v).trim().replace(',', '.')); }

    var rules = {
        'f-liquid': function (v) {
            return v.trim().length >= 2 ? '' :
                'Name the liquid, for example "sulphuric acid 98%". It decides the wetted materials.';
        },
        'f-flow': function (v) {
            var n = toNumber(v);
            return v.trim() !== '' && isFinite(n) && n > 0 ? '' :
                'Enter the flow as a number in m³/h, for example 40.';
        },
        'f-head': function (v) {
            var n = toNumber(v);
            return v.trim() !== '' && isFinite(n) && n > 0 ? '' :
                'Enter the head as a number in metres, for example 55.';
        },
        'f-email': function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' :
                'Enter the address to send the selection to, for example name@plant.com.';
        }
    };

    function check(input) {
        var message = rules[input.id](input.value);
        var err = doc.getElementById(input.id + '-err');
        if (message) {
            input.setAttribute('aria-invalid', 'true');
            err.textContent = message;
            err.hidden = false;
        } else {
            input.removeAttribute('aria-invalid');
            err.textContent = '';
            err.hidden = true;
        }
        return !message;
    }

    var inputs = Object.keys(rules).map(function (id) { return doc.getElementById(id); });

    inputs.forEach(function (input) {
        input.addEventListener('blur', function () {
            /* An untouched empty field is not an error yet. */
            if (input.value !== '' || input.hasAttribute('aria-invalid')) check(input);
        });
        input.addEventListener('input', function () {
            /* Clear a shown error as soon as it is fixed; never raise one mid-typing. */
            if (input.hasAttribute('aria-invalid') && !rules[input.id](input.value)) check(input);
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = inputs.filter(function (input) { return !check(input); });
        if (bad.length) {
            status.textContent = bad.length === 1 ?
                'One field needs attention before this can be sent.' :
                bad.length + ' fields need attention before this can be sent.';
            bad[0].focus();
            return;
        }
        status.textContent = '';
        var v = function (id) { return doc.getElementById(id).value.trim(); };
        doneText.textContent = v('f-liquid') + ', ' + v('f-flow') + ' m³/h at ' + v('f-head') +
            ' m. An applications engineer will send the selection, its curve and a firm price to ' +
            v('f-email') + ' within one working day.';
        form.hidden = true;
        done.hidden = false;
        done.focus();
    });

    again.addEventListener('click', function () {
        form.reset();
        seriesInput.value = '';
        seriesNote.hidden = true;
        done.hidden = true;
        form.hidden = false;
        doc.getElementById('f-liquid').focus();
    });
})();
