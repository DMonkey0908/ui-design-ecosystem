# Demos

One page per pack, for the screenshots in the README. Each was built by an
assistant working only from the generated Claude skill in `dist/claude/`, the
way an installed skill would be used — not from `core/` or `packs/`.

These are showcases, not evals. Nothing here is scored the way
[`evals/`](../evals/) runs are, and the assistant was told which skill to use,
so they say nothing about whether a pack activates on its own.

Building them turned up defects in all four packs, since fixed at the source.
The demos predate those fixes: each carries its own workarounds in its copied
assets and will not match the current `dist/` line for line.

Every company, person, product and figure is invented.

| Demo | Pack | What it is | Open it |
|---|---|---|---|
| [`erp-finance/`](erp-finance/) | `erp` | Accounts-payable workbench for a finance operations console | `index.html`, straight from disk |
| [`consumer-manufacturer/`](consumer-manufacturer/) | `consumer-web` | Home page of a maker of sealless chemical pumps | `index.html`, straight from disk |
| [`mobile-finance/`](mobile-finance/) | `mobile-app` | Home screen of a banking app, at phone width | `index.html`, straight from disk |
| [`immersive-manufacturer/`](immersive-manufacturer/) | `immersive-web` | Product page around a 3D motor the visitor can turn and cut open | `npx serve demos/immersive-manufacturer` |

None of them makes a network request. `immersive-manufacturer` needs a local
server because browsers refuse module scripts from `file://`; opened from disk
it shows the page with its poster and no 3D. It vendors three.js r186 under
`vendor/three/`, with its licence.

## Things worth trying

- **`erp-finance`** — approve `AP-104427`: it is rigged to fail, to show the
  rollback. `?demo=empty` and `?demo=error` show the other table states.
- **`mobile-finance`** — `?state=loading|empty|error|offline`, or the controls
  beside the phone on a wide window. State is kept in `localStorage`; "Reset
  demo data" clears it.
- **`immersive-manufacturer`** — "Cutaway". The README screenshot is taken with
  it on, which is not the state the page opens in.

## What was not verified

All four were checked in headless Chrome on Windows only. None has been run on
a real phone, in Safari or Firefox, or with a screen reader. The
`prefers-contrast`, `forced-colors` and reduced-transparency rules are written
but were never rendered. The 3D scene was measured under software GL, so its
frame time on real hardware is unknown.

Dates in `erp-finance` are generated relative to today, so the page will drift
from its screenshot.
