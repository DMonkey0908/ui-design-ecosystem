---
name: immersive-web-design
description: Design, build, restyle or review public web pages built around a real-time 3D scene - three.js, WebGL, WebGPU, React Three Fiber, model-viewer or Spline. Use it whenever a page gets a 3D product viewer or configurator, a 3D hero, a scroll-driven scene, a rotating model, an exploded view or a glTF/GLB embed; when asked to make a site more immersive, interactive or 'like those award-winning 3D sites'; when deciding whether something should be real-time 3D, a video or an image at all; when a canvas is slow, hot, janky on a phone, blank on iOS, heavy to load or hurting LCP; when wiring poster images, lazy loading, pixel-ratio caps, Draco or KTX2 compression, context loss or disposal; or when a 3D page needs a keyboard path, reduced-motion behaviour or a fallback. Covers product review and showcase pages, company and studio sites, and course pages for spatial subjects. Not for games, full-screen 3D applications and editors, ordinary marketing pages with no scene, or admin tools.
---

# Immersive web

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

A design system for public pages built around a real-time 3D scene: a product
the visitor can turn over and configure, a company site whose hero is an object
rather than a photograph, a course page for a subject that only makes sense in
three dimensions. It is written against three.js, and holds equally for React
Three Fiber, `<model-viewer>` and Spline, which draw the same triangles.

The visitor is still a stranger who owes the page nothing. What changes is that
this page has decided to spend several times a normal page's budget on one
thing, and now has to make that one thing worth it on a mid-range phone.

## The domain thesis

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

## What this pack adds on top of core

Core's `10-visual-language.md` already prices real-time 3D and names the four
things it needs: a frame budget, a non-visual path, a poster frame and motion
the user drives. It leaves every number and every form open. This pack fills
them in:

- **When to build it at all.** `02-scene.md` has the test, and what each of
  the three page types this pack covers may use a scene for.
- **Surface assignment: a stage and a page.** A near-black stage the scene is
  lit against, and a light page for anything long. Text has its own lane beside
  the scene or an opaque plate over it.
- **The budget, as numbers.** Bytes on the critical path, bytes behind it,
  triangles, draw calls, pixel ratio per device class. `03-budget.md`.
- **The form of the non-visual path.** Options are real form controls outside
  the canvas, every camera position a drag can reach is also a button, and the
  facts the scene shows are written beside it. `04-access.md`.
- **Density: low, and one idea on the stage at a time.**
- **The component set is small on purpose**: the scene frame, the view bar, the
  option picker, the hotspot, the plate. No scene-rendered text, no
  scene-rendered navigation, no preloader.

## Overrides

None. Nothing here contradicts a core rule, and it is worth saying why, because
two look as though they should.

Core's duration bands govern motion that plays over time. A scene the visitor
drags has no duration - the hand is the easing - so the bands are not
overridden, they simply have nothing to say about it. Everything in the HTML
layer still obeys them.

Core says movement is never linear. A scroll position mapped onto a camera path
is linear in the scroll and eased by the finger that produces it. This pack
does not default to that technique anyway; see `02-scene.md`.

## Non-negotiables

Apply these without being asked.

- **The page is complete with the scene deleted.** Headline, what it is, the
  facts, the price, the action - in HTML, before the engine is requested. Three
  of the nineteen pages measured for this pack had under a dozen words in their
  HTML. A crawler, a screen reader and anyone whose script failed got a title.
- **The engine is never in the critical path.** It is imported when the frame
  nears the viewport, after first paint. The mount's own entry point is 2KB;
  the 213KB behind it waits.
- **The scene never takes the scroll.** Orbit controls disable touch scrolling
  on their canvas and consume the wheel event when zoom is on. Left as shipped,
  a full-width scene is a hole in the page that a thumb or a trackpad falls
  into and cannot get out of.
- **Nothing is rendered when nothing changed.** No animation loop. A frame is
  drawn on input and while damping settles. A looping render spends a phone's
  battery on a still image, and it is the difference between a warm device and
  a cool one.
- **Pixel ratio is capped.** At 2, and at 1.5 on a touch device. A 3x phone at
  full ratio shades nine pixels for each CSS pixel, for a difference nobody can
  see on a moving object.
- **No text in the canvas.** A label drawn by the renderer cannot be selected,
  translated, zoomed, searched or read aloud. Labels are HTML, positioned over
  the scene.
- **Everything the drag does, a button also does.** Every view and every
  option. Someone on a keyboard, a switch or a screen reader gets the same
  product.

## What this pack deliberately refuses

Say so briefly, offer the alternative, and build whatever is decided.

| Request | Cost | Offer instead |
|---|---|---|
| A loading screen with a percentage, before anything shows | The visitor waits for megabytes before learning what the site is. Lusion does this, and can afford to: its visitors came to see the scene | The poster and the headline at first paint; progress as a thin line on the scene frame only |
| The whole site inside the canvas - navigation, headings, copy | Six words of HTML. Nothing to index, select, translate or read aloud | An HTML page over one scene |
| A scene in every section | Each canvas is a context, with its own textures in memory. Phones drop contexts under pressure, and the budget is paid per scene | One persistent scene, re-staged as the page scrolls past it |
| Scroll-jacking, or a smooth-scroll library that owns the page | Breaks keyboard paging, find-in-page, anchor links and the reduced-motion setting, to change how momentum feels | Native scroll, and a sticky stage that changes per chapter |
| An auto-rotating model or a camera that drifts on its own | The render loop never idles, and it is the exact motion core tells you to drop | Still until touched. One entrance move, once |
| Real-time 3D for a fixed fly-through | The whole engine, to play something a video plays better | A pre-rendered video or image sequence, with a poster |
| Mouse-follow parallax as the interaction | Does not exist on a touchscreen, which is most of the audience | Drag to orbit, with a view bar |
| The model straight from the modelling tool | Tens of megabytes, 4K textures, hundreds of draw calls | Compressed geometry, 1-2K compressed textures, merged materials - `03-budget.md` |
| WebGPU, because it is the new renderer | A second code path to test, and no guarantee it is faster for a product viewer | `WebGLRenderer`, until a named feature needs otherwise |
| A 3D hero for a subject that is not spatial | The engine's weight, on a page whose job is to sell a course about writing | The instructor on video, or a real lesson |

If they hear the cost and still want it, build it. It is their product.

## Getting started on a new project

1. Answer the three questions at the top of `02-scene.md` before opening a
   modelling tool. Two of the three usual requests end at "that is a video".
2. Build the page first, with the poster image where the scene will go, and
   ship-check it in that state. This is the step that gets skipped, and it is
   the one the whole pack rests on.
3. Load `assets/theme.css`, then `assets/scene.css`. Swap the accent pair and
   recompute its rows in `01-surfaces.md`.
4. Agree the budget in `03-budget.md` with the model's author before they
   start: triangles, texture size, file size. It cannot be recovered afterwards.
5. Mount with `assets/scene-mount.js`, or port it. Then run `04-access.md` with
   the keyboard only, and again with reduced motion on.

## What this domain assumes about the input

**Designed for a finger on a held device.** Also reached with a mouse or trackpad at desk distance. Interactive targets are at least 44px. The method is in `09-input.md`; this is what this domain assumes.

## How to use this skill

Read **`core/`** for the rules that hold for any interface, and **`pack/`**
for what this domain decided. A pack file never repeats a core rule, so when
the two are both relevant you need both.

Start with `core/10-visual-language.md`, `core/05-accessibility.md`, `core/08-feedback.md`.

### Core - applies to every interface

| File | Holds |
|---|---|
| `core/01-tokens.md` | Tokens |
| `core/02-typography.md` | Typography |
| `core/03-layout.md` | Layout |
| `core/04-motion.md` | Motion |
| `core/05-accessibility.md` | Accessibility |
| `core/06-i18n.md` | Internationalisation |
| `core/07-charts.md` | Charts |
| `core/08-feedback.md` | Feedback |
| `core/09-input.md` | Input |
| `core/10-visual-language.md` | Visual language |
| `core/99-review.md` | Review |

### Pack - this domain

| File | Holds |
|---|---|
| `pack/01-surfaces.md` | Surfaces, palette and scales |
| `pack/02-scene.md` | The scene - whether to build it, and how to stage it |
| `pack/03-budget.md` | Budget - bytes, frames, loading and the device |
| `pack/04-access.md` | Access - keyboard, touch, reduced motion and failure |
| `pack/05-checklist.md` | Domain review checklist |

### Assets

| File | What it is |
|---|---|
| `assets/theme.css` | the token file - load first |
| `assets/scene.css` | the scene frame, its four states, the stage layout and the plate |
| `assets/scene-mount.js` | the reference mount in plain three.js - lazy import, capped pixel ratio, render on demand, context loss, disposal |

Before calling any work done, run `core/99-review.md` and then
`pack/05-checklist.md`.

<!-- Generated by tools/build.mjs from core/ and packs/immersive-web/. Do not edit. -->
