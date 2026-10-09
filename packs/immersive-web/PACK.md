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
