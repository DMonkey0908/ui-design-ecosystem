/* ==========================================================================
   SHELL — the runtime half of erp-shell.css. Load it at the end of <body>.

   It owns four things and nothing about the page inside the frame:

     - the sidebar toggle, persisted under `app.sidebar.collapsed` - the same
       key the pre-paint script in page-template.html reads
     - `is-resizing`, so the grid does not animate during a window drag
     - the already-active nav item, which must not navigate
     - the topbar menus: open, close, Escape, outside click, arrow keys

   No dependencies and no build step. Every storage call is wrapped, because
   localStorage throws outright in some privacy modes.
   ========================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var shell = document.querySelector('.erp-shell');
    if (!shell) return;

    /* ── Sidebar ─────────────────────────────────────────────────────────
       Above 820px the toggle collapses a sidebar that is open by default and
       remembers it. Below, the sidebar is compact by default and the toggle
       expands it for this visit only. */
    var toggle = shell.querySelector('[data-toggle-sidebar]');
    var narrow = window.matchMedia('(max-width: 820px)');

    /* The pre-paint class sits on <html>; the runtime class sits on the
       shell. Bring them level once, then move them together. */
    if (root.classList.contains('sb-collapsed')) shell.classList.add('is-collapsed');

    function syncToggle() {
        if (!toggle) return;
        var open = narrow.matches
            ? shell.classList.contains('is-expanded')
            : !shell.classList.contains('is-collapsed');
        toggle.setAttribute('aria-expanded', String(open));
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            if (narrow.matches) {
                shell.classList.toggle('is-expanded');
            } else {
                var collapsed = shell.classList.toggle('is-collapsed');
                root.classList.toggle('sb-collapsed', collapsed);
                try {
                    localStorage.setItem('app.sidebar.collapsed', collapsed ? '1' : '0');
                } catch (_e) { /* storage unavailable */ }
            }
            syncToggle();
        });
        narrow.addEventListener('change', syncToggle);
        syncToggle();
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        shell.classList.add('is-resizing');
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { shell.classList.remove('is-resizing'); }, 150);
    });

    /* A full navigation to the current URL re-runs every page script and
       throws away unsaved state. */
    shell.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('.nav-item[aria-current="page"]');
        if (link) e.preventDefault();
    });

    /* ── Topbar menus ────────────────────────────────────────────────────
       Any topbar control with aria-controls pointing at a .dropdown. `inert`
       and the stylesheet's `visibility` both keep a closed menu out of the
       tab order; either alone would do, and older browsers only have one. */
    var open = null;

    function closeMenu(returnFocus) {
        if (!open) return;
        var m = open;
        open = null;
        m.panel.classList.remove('is-open');
        m.panel.setAttribute('inert', '');
        m.trigger.setAttribute('aria-expanded', 'false');
        if (returnFocus) m.trigger.focus();
    }

    function menuItems(panel) {
        return Array.prototype.slice.call(panel.querySelectorAll('[role="menuitem"]'));
    }

    shell.querySelectorAll('.topbar [aria-controls]').forEach(function (trigger) {
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!panel) return;
        panel.setAttribute('inert', '');

        trigger.addEventListener('click', function () {
            var wasOpen = open && open.panel === panel;
            closeMenu(false);
            if (wasOpen) return;
            panel.removeAttribute('inert');
            panel.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            open = { panel: panel, trigger: trigger };
            var first = menuItems(panel)[0];
            if (first) first.focus();
        });

        panel.addEventListener('keydown', function (e) {
            var items = menuItems(panel);
            if (!items.length) return;
            var i = items.indexOf(document.activeElement);
            var to = null;
            if (e.key === 'ArrowDown') to = items[(i + 1) % items.length];
            else if (e.key === 'ArrowUp') to = items[(i - 1 + items.length) % items.length];
            else if (e.key === 'Home') to = items[0];
            else if (e.key === 'End') to = items[items.length - 1];
            else if (e.key === 'Tab') { e.preventDefault(); closeMenu(true); return; }
            if (to) { e.preventDefault(); to.focus(); }
        });
    });

    document.addEventListener('click', function (e) {
        if (!open) return;
        if (open.panel.contains(e.target) || open.trigger.contains(e.target)) return;
        closeMenu(false);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && open) closeMenu(true);
    });
})();
