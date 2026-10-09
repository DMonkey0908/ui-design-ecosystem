/* ==========================================================================
   MAIN - everything on the critical path. The engine is not in it: three.js
   and the model are imported by scene-mount.js, after first paint, when the
   frame is near the viewport.

   The page works before this file runs and if it never does. What it adds:
   the configurator's arithmetic, and the scene.
   ========================================================================== */

import { mountWhenWanted } from './scene-mount.js';

const LOCALE = document.documentElement.lang || 'en';

/* ---- The product, as data ------------------------------------------------ */

const BASE = { price: 2180, weight: 58, lead: 5 };

const OPTIONS = {
  finish: {
    pebble: { label: 'Pebble grey', code: '7032', token: '--finish-pebble', price: 0, lead: 5 },
    orange: { label: 'Signal orange', code: '2004', token: '--finish-orange', price: 60, lead: 15 },
    graphite: { label: 'Graphite', code: '7024', token: '--finish-graphite', price: 60, lead: 15 },
  },
  mount: {
    b35: { label: 'flange and feet', code: 'B35', price: 0, weight: 0, feet: true },
    b5: { label: 'flange only', code: 'B5', price: -45, weight: -2.6, feet: false },
  },
  shaft: {
    keyed: { label: 'keyed shaft', code: 'K', key: true },
    smooth: { label: 'smooth shaft', code: 'S', key: false },
  },
};

/* Whole sentences, in one place, so a translation replaces this object. */
const TEXT = {
  summary: ({ finish, mount, shaft, weight, lead }) =>
    `${finish}, ${mount}, ${shaft}. ${weight} kg, ships in ${lead} working days.`,
  cutOn: 'Cutaway on. A quarter of the housing is removed, showing the stator windings, the rotor and the fan.',
  cutOff: 'Cutaway off. The housing is closed.',
  mailSubject: (code) => `Quote request ${code}`,
};

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const kilos = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat(LOCALE);

/* ---- Header: transparent only while the top of the stage is under it ----- */

const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
if (header && hero) {
  const atTop = () => header.toggleAttribute('data-top', window.scrollY < 8);
  atTop();
  window.addEventListener('scroll', atTop, { passive: true });
}

/* ---- The configurator ------------------------------------------------------ */

const form = document.getElementById('configure');
const summary = document.getElementById('summary');
const sceneStatus = document.getElementById('scene-status');
const state = { cut: false };
let handle = null;

function choice() {
  const data = new FormData(form);
  return {
    finish: OPTIONS.finish[data.get('finish')] || OPTIONS.finish.pebble,
    mount: OPTIONS.mount[data.get('mount')] || OPTIONS.mount.b35,
    shaft: OPTIONS.shaft[data.get('shaft')] || OPTIONS.shaft.keyed,
  };
}

/* What the scene needs to know, from the same form the text is written from. */
function sceneOptions() {
  const c = choice();
  const finish = getComputedStyle(document.documentElement).getPropertyValue(c.finish.token).trim();
  return { finish, feet: c.mount.feet, key: c.shaft.key, cut: state.cut };
}

function bind(name, value) {
  for (const el of document.querySelectorAll(`[data-bind="${name}"]`)) el.textContent = value;
}

function writeChoice() {
  const c = choice();
  const price = BASE.price + c.finish.price + c.mount.price;
  const weight = kilos.format(BASE.weight + c.mount.weight);
  const lead = whole.format(Math.max(BASE.lead, c.finish.lead));
  const code = `KD132-7K5-${c.mount.code}-${c.shaft.code}-${c.finish.code}`;

  summary.textContent = TEXT.summary({
    finish: c.finish.label, mount: c.mount.label, shaft: c.shaft.label, weight, lead,
  });
  bind('price', money.format(price));
  bind('weight', weight);
  bind('lead', lead);
  bind('code', code);
  for (const a of document.querySelectorAll('[data-bind-href="mail"]')) {
    a.href = `mailto:sales@kordane.example?subject=${encodeURIComponent(TEXT.mailSubject(code))}`;
  }
}

if (form) {
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', () => {
    writeChoice();                                            // the text, whether or not there is a scene
    if (handle) handle.set((motor) => motor.apply(sceneOptions()));   // one redraw
  });
  writeChoice();    // a reload can restore other radios than the markup's defaults
}

/* ---- The scene -------------------------------------------------------------- */

const frame = document.getElementById('scene');

if (frame) {
  const bar = frame.querySelector('.scene-progress');
  const hint = frame.querySelector('.scene-hint');
  const views = frame.querySelector('.scene-views');
  const viewButtons = [...frame.querySelectorAll('button[data-view]')];
  const cutButton = frame.querySelector('button[data-cut]');
  const spots = [...frame.querySelectorAll('.hotspot')];
  let anchors = {};

  const note = (spot) => document.getElementById(spot.getAttribute('aria-controls'));
  const closeSpot = (spot) => {
    spot.setAttribute('aria-expanded', 'false');
    note(spot).hidden = true;
  };

  /* Hotspots are HTML. Each frame says where they go, and which face away. */
  const placeSpots = ({ toScreen }) => {
    const w = frame.clientWidth, h = frame.clientHeight;
    for (const spot of spots) {
      const a = anchors[spot.dataset.spot];
      if (!a) continue;
      const p = toScreen(a.at, a.normal);
      const inside = p.x > 40 && p.x < w - 40 && p.y > 24 && p.y < h - 24;
      const show = inside && p.facing > a.min && (!a.cutOnly || state.cut);
      if (!show && spot.getAttribute('aria-expanded') === 'true') closeSpot(spot);
      spot.hidden = !show;
      spot.style.setProperty('--x', `${Math.round(p.x)}px`);
      spot.style.setProperty('--y', `${Math.round(p.y)}px`);
    }
  };

  const pressView = (name) => {
    for (const b of viewButtons) b.setAttribute('aria-pressed', String(b.dataset.view === name));
  };

  mountWhenWanted(frame, {
    auto: true,                                               // the one hero scene
    build: async (THREE) => {
      const { buildMotor } = await import('./motor.js');
      const motor = buildMotor(THREE, sceneOptions());
      anchors = motor.anchors;
      return motor;
    },
    views: {
      hero: [1, 0.36, 0.66],
      front: [0.12, 0.12, 1],
      side: [1, 0.12, 0.02],
      back: [0.2, 0.2, -1],
      top: [0.001, 1, 0.12],
    },
    fit: 0.8,
    lift: 0.08,                                               // room under the model for the view bar
    posterAspect: 3 / 2,
    environment: 0.8,
    shadows: true,
    onProgress: (p) => bar && bar.style.setProperty('--scene-progress', p),
    onFrame: placeSpots,
    onInteract: () => {
      pressView(null);                                        // a drag has left the named view
      if (hint) hint.remove();                                // one hint, once
    },
    onReady: (h) => {
      handle = h;
      if (hint) hint.hidden = false;
      window.__scene = h;                                     // for reading renderer.info from the console
    },
  });

  views.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || !handle) return;

    if (button.dataset.view) {
      handle.view(button.dataset.view);                       // a cut, never a tween
      pressView(button.dataset.view);
    } else if (button === cutButton) {
      state.cut = !state.cut;
      cutButton.setAttribute('aria-pressed', String(state.cut));
      handle.set((motor) => motor.apply(sceneOptions()));
      sceneStatus.textContent = state.cut ? TEXT.cutOn : TEXT.cutOff;
    }
  });

  for (const spot of spots) {
    spot.addEventListener('click', () => {
      const open = spot.getAttribute('aria-expanded') === 'true';
      for (const other of spots) closeSpot(other);
      if (!open) {
        spot.setAttribute('aria-expanded', 'true');
        note(spot).hidden = false;
      }
    });
  }

  frame.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = spots.find((s) => s.getAttribute('aria-expanded') === 'true');
    if (!open) return;
    closeSpot(open);
    open.focus();
  });
}
