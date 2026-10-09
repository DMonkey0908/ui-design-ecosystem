# Immersive web - UI design system

This project uses the `immersive-web` UI design system. The rules are on disk
next to this file, under `ui/`. **This file is the index, not the system.**

## Applies whenever you are about to

- create, style or lay out **any** user interface — a page, a screen, a
  component, a view
- change how an existing interface **looks**: spacing, colour, type, density,
  states, motion, layout
- add or restyle a **chart**, table, form, dialog, menu, toast or empty state
- answer "make this look better / more professional / cleaner"
- review or critique a UI, someone else's or your own

It applies to any stack — HTML and CSS, React, Vue, Svelte, Tailwind, SwiftUI,
Flutter, a design token file. The rules are about the interface, not the
framework.

It does **not** apply to work that never reaches a screen: build config, data
layers, tests of non-visual logic.

## Do this before writing the first line

1. **Check the tokens.** If the project has a token or theme file, use it. If it
   does not, create one before you write a colour — a hex typed into a component
   is the first step of every palette that later has ninety of them.
2. **Name the surface** you are working on: chrome, canvas, content, floating.
   The treatment follows from the surface, not from the component's name.
3. **Read the reference for what you are building** if it is not already in
   context. A partial memory of a spacing scale produces something almost right,
   which is harder to spot than something obviously wrong.
4. **Write the code.**
5. **Run the review checklist** before reporting the work done.

## Never do these, whatever the request

They are cheap to get right and expensive to retrofit, and every one of them
has shipped from an assistant that had the rules available and did not apply
them.

- Ship an accent colour with a single value when the interface has both light
  and dark surfaces.
- Write a raw colour outside the token file.
- Leave a figure without `font-variant-numeric: tabular-nums`.
- Remove a focus outline without replacing it.
- Use colour as the only signal for a state.
- Put information or an action behind hover alone. On a touchscreen it is not
  awkward, it is absent.
- Show a spinner for work that finishes in under 300ms, or leave one spinning
  past a second where a skeleton at the real dimensions belongs.
- Animate without honouring `prefers-reduced-motion`, including the end state.
- Start a value axis anywhere but zero when magnitude is being compared.

## When the request conflicts with a rule

Name the cost in one sentence, offer the nearest thing that works, then build
whatever is decided — it is their product. Do not silently comply, and do not
refuse.

Two exceptions are not negotiable, because their cost lands on someone who is
not in the room: the accessibility minimums, and the chart honesty rules. For
those, build the compliant version and say why.

## Say what you applied

When UI work is done, state in one line which pack and which rules shaped it.
A user who cannot see that this system is active cannot tell it from your
default behaviour, and cannot correct it.

---

## Read the file before you write the code

Opening one reference costs a single tool call. Working from a
half-remembered spacing scale produces something *almost* right, which is
harder for a reviewer to catch than something obviously wrong - and it is
what this system exists to prevent. Do not answer from this index.

### Core - true for any interface

| File | Holds |
|---|---|
| `ui/core/01-tokens.md` | Tokens |
| `ui/core/02-typography.md` | Typography |
| `ui/core/03-layout.md` | Layout |
| `ui/core/04-motion.md` | Motion |
| `ui/core/05-accessibility.md` | Accessibility |
| `ui/core/06-i18n.md` | Internationalisation |
| `ui/core/07-charts.md` | Charts |
| `ui/core/08-feedback.md` | Feedback |
| `ui/core/09-input.md` | Input |
| `ui/core/10-visual-language.md` | Visual language |
| `ui/core/99-review.md` | Review |

### Pack - this domain

| File | Holds |
|---|---|
| `ui/pack/01-surfaces.md` | Surfaces, palette and scales |
| `ui/pack/02-scene.md` | The scene - whether to build it, and how to stage it |
| `ui/pack/03-budget.md` | Budget - bytes, frames, loading and the device |
| `ui/pack/04-access.md` | Access - keyboard, touch, reduced motion and failure |
| `ui/pack/05-checklist.md` | Domain review checklist |

### Assets

| File | What it is |
|---|---|
| `ui/assets/theme.css` | the token file - load first |
| `ui/assets/scene.css` | the scene frame, its four states, the stage layout, hotspots and the plate |
| `ui/assets/scene-mount.js` | the reference mount in plain three.js, for a glTF or a model built in code - lazy import, capped pixel ratio, render on demand, a per-frame hook for hotspots, context loss, disposal |

Finish by running `ui/core/99-review.md` and `ui/pack/05-checklist.md`.

---

## The thesis, so you know what you are applying

**One scene, that the visitor drives, on a page that was already finished
before the scene arrived.**

Three clauses, and each one is a decision somebody else makes differently.

**One scene.** The engine is paid for once. The reference mount in this pack,
bundled against three.js r186, is 215KB compressed before a single model has
loaded - and the five real-time sites surveyed for this pack sent between 224KB
and 1.3MB of script on the first request. That is the entire budget, and it
buys one stage. A second canvas is a second context, a second set of textures
in memory and a second thing that can be lost when a phone switches apps.

**That the visitor drives.** If the camera follows a path nobody can change, it
is a recording, and a recording is cheaper as a video. The largest product
pages surveyed agree: Apple's AirPods Max page and Polestar's Polestar 4 page
have no canvas in their HTML and no 3D engine in the scripts they request -
three and seven `<video>` elements respectively, and over a hundred images
each. Real time earns its bytes only
when the visitor can do what no recording could: turn it to the side they care
about, open it, change its colour.

**On a page that was already finished.** Every surveyed site with something to
sell kept its headline in the HTML: the three.js Journey course page carries
3,054 words and an `<h1>` before any script runs; Lusion, a studio that sells
exactly this kind of work, carries 385 and an `<h1>`. The two that did not -
Active Theory at six words and Igloo at two - are showpieces whose product is
the scene itself. A page that exists to be found, read and acted on cannot make
that bet.

This is a thesis the other packs reject. `consumer-web` caps JavaScript at a
figure this pack exceeds before it has drawn anything, and tells you to start
from no framework. `erp` would call the whole scene decoration, and for an
operator on their two-hundredth visit it would be right.

**If the visitor cannot steer it, you are in the wrong pack: ship a video. If
the viewport is the whole product - a game, an editor, an atlas someone works
in for an hour - you are also in the wrong pack, because there the page-first
rule is backwards.**

**Designed for a finger on a held device.** Also reached with a mouse or trackpad at desk distance. Interactive targets are at least 44px. The method is in `09-input.md`; this is what this domain assumes.

## Hard rules - apply even before you open anything

- Use the project token file. Never write a raw colour outside it; if there is no token file, create one first.
- An accent needs one value per surface. A colour chosen to read on a light surface disappears on a dark one.
- `font-variant-numeric: tabular-nums` on every figure - tables, tiles, axis labels, tooltips.
- Never remove a focus outline without replacing it. Always `:focus-visible`, never `:focus`.
- Colour is never the only signal for a state. Pair it with an icon, a label or a position.
- Never put information or an action behind hover alone - a touchscreen has no hover, so it is absent rather than awkward.
- Match the waiting affordance to the wait: nothing under 300ms, a skeleton at real dimensions past a second, cancellable progress past five.
- `min-width: 0` on grid and flex children that can hold wide content; `minmax(0, 1fr)` on tracks.
- Honour `prefers-reduced-motion`, and state the end value explicitly - `opacity: revert` yields 1, not your value.
- Start a value axis at zero whenever magnitude is compared.
- Say which rules shaped the result when you are done.

## Not for

- a marketing or landing page with no real-time scene - use the consumer-web pack, whose JavaScript budget this pack spends several times over
- games and full-screen 3D applications - editors, CAD viewers, anatomy atlases a user works in for an hour; there the viewport is the product and the page-first rule here is wrong
- internal tools, admin panels and dashboards - use the erp pack; a scene is decoration to an operator on their two-hundredth visit
- installed mobile apps - use the mobile-app pack
- a fixed camera fly-through nobody can steer - that is a video, and it should be shipped as one
- charts and data visualisation, including 3D charts - core's chart rules cover them and a perspective axis breaks them

<!-- Generated by tools/build.mjs from core/ and packs/immersive-web/. Do not edit. -->
