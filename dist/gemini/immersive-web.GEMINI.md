# Immersive web - UI design system

Context file for Gemini (Gemini CLI, Code Assist, Gems). Place at a repo root
as `GEMINI.md`, or in `~/.gemini/GEMINI.md` to apply it everywhere. For a Gem,
paste the whole file into the Instructions field.

**Apply this when the work is:**

- a product page where the visitor rotates, opens or configures the product in 3D
- a company, studio or portfolio site whose hero is an interactive scene
- a course or explainer page for a subject that is spatial - anatomy, mechanics, architecture, geography
- a request for three.js, WebGL, WebGPU, React Three Fiber, model-viewer, a GLB embed or a scroll-driven 3D section
- a question about whether something should be real-time 3D, a pre-rendered video or a still
- a 3D page that is slow, hot, blank on a phone, or failing an accessibility or performance review

**Do not apply it to:**

- a marketing or landing page with no real-time scene - use the consumer-web pack, whose JavaScript budget this pack spends several times over
- games and full-screen 3D applications - editors, CAD viewers, anatomy atlases a user works in for an hour; there the viewport is the product and the page-first rule here is wrong
- internal tools, admin panels and dashboards - use the erp pack; a scene is decoration to an operator on their two-hundredth visit
- installed mobile apps - use the mobile-app pack
- a fixed camera fly-through nobody can steer - that is a video, and it should be shipped as one
- charts and data visualisation, including 3D charts - core's chart rules cover them and a perspective axis breaks them

---

# Part 0 - Activation

### Applies whenever you are about to

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

### Do this before writing the first line

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

### Never do these, whatever the request

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

### When the request conflicts with a rule

Name the cost in one sentence, offer the nearest thing that works, then build
whatever is decided — it is their product. Do not silently comply, and do not
refuse.

Two exceptions are not negotiable, because their cost lands on someone who is
not in the room: the accessibility minimums, and the chart honesty rules. For
those, build the compliant version and say why.

### Say what you applied

When UI work is done, state in one line which pack and which rules shaped it.
A user who cannot see that this system is active cannot tell it from your
default behaviour, and cannot correct it.

---

# Part 1 - Domain

A design system for public pages built around a real-time 3D scene: a product
the visitor can turn over and configure, a company site whose hero is an object
rather than a photograph, a course page for a subject that only makes sense in
three dimensions. It is written against three.js, and holds equally for React
Three Fiber, `<model-viewer>` and Spline, which draw the same triangles.

The visitor is still a stranger who owes the page nothing. What changes is that
this page has decided to spend several times a normal page's budget on one
thing, and now has to make that one thing worth it on a mid-range phone.

### The domain thesis

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

### What this pack adds on top of core

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

### Overrides

None. Nothing here contradicts a core rule, and it is worth saying why, because
two look as though they should.

Core's duration bands govern motion that plays over time. A scene the visitor
drags has no duration - the hand is the easing - so the bands are not
overridden, they simply have nothing to say about it. Everything in the HTML
layer still obeys them.

Core says movement is never linear. A scroll position mapped onto a camera path
is linear in the scroll and eased by the finger that produces it. This pack
does not default to that technique anyway; see `02-scene.md`.

### Non-negotiables

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

### What this pack deliberately refuses

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

### Getting started on a new project

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

---

# Part 2 - Core (applies to any interface)

## Tokens

A token system is a promise that a colour appears in exactly one place. Every
rule below protects that promise; break one and you are back to grepping hexes.

### One file, loaded first

Tokens live in a single stylesheet loaded before everything else. Downstream
files may define their own tokens **in terms of** it — `--chart-series:
var(--accent)` — and may never define a literal.

```
theme.css      ← the palette, and nothing else
shell.css      ← layout, written entirely in theme tokens
page.css       ← one screen, written in both
```

If a colour is needed that no token covers, **add a token**. Ninety one-off hex
values is not a palette; it is a search problem with a stylesheet around it.

### Every accent needs one value per surface

This is the rule most often missed, and it produces a bug that survives review
because the colour is technically correct.

A brand colour picked to read as text on white will disappear on near-black,
and the reverse. So an accent is never one value:

```css
--accent:         #b3121b;  /* on light content */
--accent-on-dark: #f2555e;  /* the same brand, lifted to read on dark chrome */
```

The classic failure: a dark sidebar whose active item is painted in the
light-surface accent. It passes a brand check and is invisible in use. If a pack
has both a light and a dark surface — and most do somewhere, even if only in a
menu — it needs both values.

Same logic applies to semantic colours the moment they appear on two surfaces.

### In a dark theme, depth is luminance

A shadow is a darker area. On a light surface that reads as height; on a dark
surface there is nothing left to darken, so the shadow is invisible and every
layer collapses into the same plane — a menu that looks painted onto the panel
behind it, a dialog with no edge.

The mechanism that replaces it: **the higher a surface sits, the lighter it
gets.** Define the steps as tokens, in one place, so elevation is a scale rather
than a per-component guess.

```css
--surface-0: …;   /* the base — the page or workspace  */
--surface-1: …;   /* raised: cards, panels             */
--surface-2: …;   /* floating: menus, popovers, sheets */
--surface-3: …;   /* transient: dialogs, toasts        */
```

Derive each step by mixing a small, increasing amount of white into the base
rather than picking four unrelated greys. Picked by hand, the steps drift out
of order the first time someone adds a fifth, and a floating layer ends up
darker than the panel under it.

Two rules that come with it:

- **Not pure black for a large surface.** Maximum contrast against white text
  makes the text bloom and smear at the edges, which is why long sessions on it
  are tiring. Start from a very dark grey and let the scale climb from there.
- **Keep the shadows anyway, and make them do the second job.** A shadow on a
  dark surface still separates a floating layer from what it covers, even where
  it cannot signal height. Elevation is carried by luminance; containment is
  still carried by the shadow.

A pack states the actual values. What is not domain-negotiable is the direction:
in a dark theme, up is lighter.

### Alpha steps are tokens too

Focus rings, glows, hover washes, chart fills and hatch patterns all want the
accent at partial opacity. Define the steps once:

```css
--accent-a08: rgba(179, 18, 27, 0.08);
--accent-a12: rgba(179, 18, 27, 0.12);
--accent-a18: rgba(179, 18, 27, 0.18);
--accent-a25: rgba(179, 18, 27, 0.25);
--accent-a35: rgba(179, 18, 27, 0.35);
```

Hand-tuning opacity per component is how two focus rings end up subtly
different. Pick the steps, then only ever reach for a step.

Note the maintenance cost: these carry the accent's RGB literally, so
rebranding means recomputing them. That is the price of supporting browsers
without a relative-colour path; if your targets all support `color-mix()` or
relative `rgb(from …)`, derive them instead and the cost disappears.

### Semantic colours must not collide with the accent

If the accent is red, an error painted in accent red is indistinguishable from a
primary button — the user cannot tell "this failed" from "click me". Push danger
somewhere the accent is not:

```css
--accent:        #b3121b;   /* deep crimson */
--state-danger:  #ef3b3b;   /* brighter, more orange */
```

The general form: **the accent means "act here", semantics mean "this is the
situation".** When one hue tries to carry both, it carries neither.

The same applies in reverse. If the accent is green, success needs to move. If
the accent is blue, the conventional blue "info" state needs to become a
neutral — a second blue competing for attention with nothing to say is just
noise.

### Naming

Name by **role**, not by appearance or by where it first appeared.

| Good | Bad | Why |
|---|---|---|
| `--content-bg` | `--white` | The white surface goes grey in a dark theme and the name lies. |
| `--text-muted` | `--grey-400` | The ramp position is an implementation detail. |
| `--accent-on-dark` | `--light-red` | Says what it is for, not what it looks like. |
| `--border-strong` | `--border-2` | A number is not a meaning. |

Three steps is usually enough for a text ramp — primary, secondary, muted. A
fourth gets used inconsistently because nobody can tell it from the third.

### Rebranding must be a bounded operation

A pack should be able to state its rebranding procedure in under six steps. If
it cannot, colour has leaked out of the token file. The shape:

1. Change the accent block.
2. Recompute the per-surface accent values — never skip this one.
3. Recompute the alpha steps from the new RGB.
4. Re-check semantic separation: does danger still read as distinct?
5. Re-check contrast on the accent's text pairings.

### Contrast is a constraint, not a preference

Body text needs 4.5:1 against its surface; large text and UI boundaries need
3:1. Check the accent against **every** surface it lands on, not just the one it
was designed against — that check is what surfaces the missing second accent
value before a user does.

A brand colour that fails contrast as body text can still be correct as a
fill behind white text, or as a 3px rail. Demote it rather than lighten the
whole brand.

## Typography

### One family, plus a monospace

A second display family has to earn itself against the cost: another network
request, another fallback to tune, another set of metrics that shifts layout as
it swaps. Most interfaces are better served by one well-chosen family across
five weights.

A monospace is not optional wherever users read or copy identifiers — keys,
paths, hashes, IDs, SKUs, error codes. Proportional digits and a proportional
`l/1/I` make those unreliable to read aloud or transcribe.

Always ship a system fallback stack, and match its metrics roughly, or the page
reflows when the webfont lands.

### Base size is a domain decision; the unit is not

Pick the base `font-size` on `body` from what the domain needs — a dense
operational tool and a reading-first marketing page have genuinely different
answers, and that value belongs in the pack.

What core fixes is **which unit sizes what**:

- **Shell and chrome in `em`**, so the frame scales with the base and a density
  change is one edit.
- **Content in `rem`**, so a card nested in a panel nested in a sidebar never
  inherits a surprise. A component sized in `em` three levels deep is a bug
  waiting for a refactor.
- **Never `px` for type.** It ignores the user's browser setting, which for
  anyone who has enlarged their default is not a style choice but an
  accessibility one.

### Build the scale from the roles you actually have

Do not adopt a modular scale and then hunt for uses. List the roles the
interface needs, then assign a size to each. A typical set:

```
metadata / table headers / tile labels     smallest
field labels / secondary buttons / tooltips
body / table cells / buttons               ← the workhorse
inputs / definition values
section and card titles
the one big number                          (tiles, KPIs)
page heading
```

Seven steps covers almost everything. If a design needs a ninth, two of the
existing ones are probably doing the same job.

Weights, and what they mean, stay consistent across the set: regular for
user-entered text, medium for navigation, semibold for labels and buttons, bold
for titles and values. Reserve the heaviest weight for one thing — usually badge
counts — so it keeps its emphasis.

### The label is quieter than the value

In any form or data view, the label is reference material and the value is the
content. Size and weight should say so: a smaller, lighter, greyer label above a
larger, darker value. Reversing this is common and it makes a thirty-field form
exhausting to scan, because the eye keeps landing on words it already knows.

### Measure

Cap running prose at roughly **65–75 characters** per line (`max-width: 72ch` is
a good default). Beyond that the eye loses the line return.

This matters most for the text people skip: help notes, empty-state
explanations, field hints. Those are exactly the strings that get written as one
long grey line across a 1600px container and are then never read.

### Numerals

```css
font-variant-numeric: tabular-nums;
```

On **every** figure: table cells, KPI values, axis labels, tooltip rows,
counters, timers, prices. Proportional digits have different widths, so a column
of numbers shifts sideways every time a value updates, and a live-updating
counter visibly jitters.

This is the highest value-per-character line in the whole system.

Where a number is compared by magnitude, right-align it. Left-aligned figures
put the significant digits at inconsistent positions and defeat scanning.

### Truncation

Decide per element, and decide before the string arrives:

- **Never wrap** navigation labels, table headers, or anything in a fixed-height
  row. Wrapping changes the row height and the whole layout reflows.
- **Ellipsis** for names in constrained cells, with the full value reachable —
  a `title` attribute at minimum, a tooltip if it matters.
- **`overflow-wrap: anywhere`** for identifiers, file names and URLs. They
  contain no spaces, so the default breaking rules will push them straight out
  of their container.

## Layout

### The two traps that eat an afternoon

Both come from the same default and both look like a mystery until you know
them.

#### `min-width: auto` on grid and flex children

A grid or flex item will not shrink below its content's intrinsic width. So one
wide table, one long unbroken identifier, one `<pre>` block — and the item
widens its track, the container overflows, and something else gets pushed off
screen. In an app shell, the thing pushed off screen is the navigation.

```css
.main { min-width: 0; }                              /* the fix */
.grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }  /* not 1fr */
```

`1fr` is shorthand for `minmax(auto, 1fr)`, which carries the same default.
Write `minmax(0, 1fr)` habitually; there is no case where the `auto` form is
what you wanted.

#### A scroll container that is also a clip container

`overflow: hidden` on one axis and `auto` on the other still clips. Anything
that deliberately bleeds outside its box — a glow, a focus ring, a shadow, a
tooltip — will be cut at that edge. Either give the bleeding element room inside
the padding box, or move it out of the scroll container entirely.

### Sticky, not fixed, for app frames

A `position: fixed` bar leaves the flow, so the layout no longer knows it exists
and you start hand-maintaining offsets. `position: sticky` keeps it in flow and
lets the grid keep doing the work.

Fixed is right for things that genuinely float free of the document: a modal, a
toast, a menu anchored to the viewport rather than to its parent. A menu inside
a flex toolbar in particular must be fixed or absolute-outside, because the flex
container will clip it.

### Stylesheet order is part of the architecture

```
tokens → shell/layout → component → page
```

Each layer may consume the previous layer's tokens and may not reach forward.
When a page stylesheet needs to override a component, that is a signal the
component is missing a variant — not a licence for `!important`.

### Restore state before the first paint

Any state read from storage that affects **layout or visibility** must be
applied to the root element inline in `<head>`, before the stylesheets. A
collapsed sidebar, a hidden role-gated section, a chosen language, a theme.

Applied after paint, the user watches the interface correct itself on every
single navigation. It reads as a broken page rather than a restored preference.

```html
<script>
  try {
    if (localStorage.getItem('app.nav.collapsed') === '1')
      document.documentElement.classList.add('nav-collapsed');
  } catch (_e) { /* storage can throw outright, not just return null */ }
</script>
```

Every read gets its own `try/catch`. `localStorage` **throws** in some privacy
configurations rather than returning null, and an uncaught error here runs
before any stylesheet, so it blanks the page.

Consequence worth planning for: the class lands on the root element, while
runtime toggles usually set a class on a container. Every affected rule then
needs both selectors. Decide which element owns the state up front and keep it
consistent, or the duplicate-selector list grows without bound.

### Responsive: decide what each breakpoint is for

A breakpoint list is only maintainable if each entry has a stated job. Give each
one a reason, in the stylesheet:

```
1024px   secondary identity drops away, primary actions stay
820px    navigation switches to its compact form
640px    edge-anchored panels span the viewport
520px    multi-column forms become single-column
```

Two principles that survive every domain:

- **Never remove functionality at a smaller size — change its form.** If
  navigation collapses to icons, it is still navigation. If it disappears behind
  a control the user has not been taught, it is gone.
- **Let containers scroll rather than squeezing their contents.** A table
  crushed to fit is unreadable; a table in a scrolling wrapper is merely wide.

Container queries are the better tool wherever a component's layout depends on
its own width rather than the viewport's — a card in a sidebar and the same card
in a full-width panel. Reach for them before adding a fifth viewport breakpoint.

### Reserve space before content arrives

Anything async — an image, a chart, a list, a count — gets its dimensions
reserved before it loads. Otherwise the page reflows under the cursor and a user
mid-click hits the wrong thing.

Reserve with an aspect ratio, a min-height, or a skeleton at the real
dimensions. A spinner in a zero-height box guarantees a jump.

## Motion

This file is about movement the interface chooses: what moves, how fast, and
how it eases. What the interface owes a user *while they wait* — busy states,
spinners, skeletons, progress — is a different problem with a different clock,
and it lives in `08-feedback.md`.

### Duration comes from repetition count, not from taste

The right question is never "does this feel nice once". It is "how many times a
day does a user sit through this". A 400ms transition on a control someone
touches twice a session is a pleasure; the same 400ms on a row hover in a table
they scan all day is friction they cannot name but do feel.

| Band | For |
|---|---|
| **~120ms** | Hover and active on repeated elements: rows, list items, menu entries. |
| **~150ms** | The standard state change — colour, background, border. |
| **~160–200ms** | Something appearing or dismissing: menu, popover, toast. |
| **~200–250ms** | Something travelling a distance, or a layout dimension changing. |
| **~300ms+** | A one-off entrance. One per screen, at most. |

A pack may shift the whole set — a consumer app can afford more expression than
an operations console — but the **ordering** holds everywhere: repeated
interactions are always the fastest thing on the screen.

### Easing

- `ease` (or `ease-out`) for a state change. It is not worth a custom curve.
- A custom ease-out for anything that travels:
  `cubic-bezier(0.22, 0.61, 0.36, 1)`. Fast departure, soft arrival.
- **Never `linear`** for movement. It reads mechanical, because nothing physical
  moves at a constant speed.
- **Never `ease-in`** alone for something arriving. It starts slow, which reads
  as lag before it reads as motion.

### Pick the movement that explains the change

Left to default, everything fades. A fade is the one transition that carries no
information: it says something replaced something else and nothing about how the
two are related. The result is an interface where the user re-reads the screen
after every state change, because nothing told them what survived it.

Choose from a small vocabulary instead. Each entry answers a different question
the user is about to ask.

| Movement | What it tells the user | Use it when |
|---|---|---|
| **Transformation** | This is still the same object, doing a different job. | A submit button becoming a progress state, then a result. |
| **Parenting** | These two things are bound — one drives the other. | A header shrinking as its content scrolls; a panel tracking a drag. |
| **Masking** | The thing you selected is the thing that opened. | A summary expanding into its detail view. |
| **Offset and delay** | These arrived as a sequence, and this is its order. | A list or grid populating — a small stagger, not a per-item show. |
| **Obscuration** | This layer is now on top; what is behind it is out of play. | Dialogs, sheets, a global search overlay. |
| **Value change** | The number moved, and by roughly this much. | A total updating after an action the user just took. |

Two notes that are easy to get wrong:

- **Value change requires `tabular-nums`.** An animated figure without it
  reflows on every frame, which is the digit-jitter failure in `02-typography.md`
  at sixty frames a second. And animate it only where the *change* is the
  message — a dashboard whose every tile counts up on load has turned reading
  into waiting.
- **Masking is a promise about identity.** If the panel that opens is not the
  thing that was clicked, the transition has lied, and the user hunts for what
  they actually selected.

The rest — parallax, depth-of-field, cards flipping to reveal a back face — are
legitimate and are decoration. They earn a place when the movement *is* the
content, and they are the first thing to cut under `prefers-reduced-motion`.

### Animate the cheap properties

`transform` and `opacity` are composited — they do not trigger layout or paint.
Everything else can, and the cost scales with how many elements are doing it at
once. One row changing background under the cursor is free; five hundred rows
staggering in on a paint property is a visibly slow page.

```css
/* good */   transition: opacity .16s ease, transform .16s ease;
/* costly */ transition: height .16s ease, top .16s ease, width .16s ease;
```

For a menu, animate `opacity` and `transform` and toggle `pointer-events` —
never animate `display`, which cannot transition and will simply snap.

To collapse something of unknown height, animate `grid-template-rows` from
`0fr` to `1fr`, or `max-height` to a known bound. Both beat measuring in
JavaScript.

### Reduced motion, done correctly

Ship the global guard:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

Near-zero rather than `none`, so `animationend` and `transitionend` handlers
still fire. Code that waits for one of those events to clean up will hang
forever against `animation: none`.

**Then check every animation that starts from a hidden state.** The guard kills
the animation; it does not supply the end state. An element with `opacity: 0`
plus a fade-in is now permanently invisible.

```css
/* WRONG — `revert` rolls back to the browser default of 1, not your value */
@media (prefers-reduced-motion: reduce) { .thing { opacity: revert; } }

/* RIGHT — state the value you actually want */
@media (prefers-reduced-motion: reduce) { .thing { animation: none; opacity: 1; } }
```

This one is worth grepping for. `revert` looks like it means "put my stylesheet
value back" and it does not — it rolls back to the previous cascade origin,
which for most properties is the user-agent default.

### What reduced motion means, and does not

It means: no large travel, no parallax, no spin, no bounce, no autoplay. Users
who set it may get motion sickness or migraines from movement.

It does not mean: no feedback. A colour change, an opacity change, and an
instant state swap are all fine and still tell the user their click registered.
Stripping all feedback leaves an interface that feels dead and unresponsive,
which is a different accessibility failure.

### Never animate on resize

Layout transitions plus a window drag equals a visibly lagging interface. If a
container has `transition: width`, a resize animates every intermediate frame.
Suspend layout transitions while resizing, or scope them to the property the
user's own action changes.

## Accessibility

Not a compliance pass at the end. Every item here is cheaper to build in than to
retrofit, and several of them are the same work as building it correctly.

### Focus

```css
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- **`:focus-visible`, never `:focus`.** A mouse click on a button should not
  leave a ring behind; a Tab onto it must.
- **Never `outline: none` without a replacement.** If the default ring clashes,
  draw a better one. Removing it strands keyboard users with no idea where they
  are.
- **Inset the offset** (`outline-offset: -2px`) where an element sits flush in a
  cell or against a container edge, or the ring gets clipped and reads as a
  partial line.
- The ring must clear 3:1 against **both** the element and what surrounds it.
  On a dark chrome surface this is usually the per-surface accent value, not the
  base one.

### Keyboard

Every interactive thing is reachable and operable without a mouse. The common
misses:

- **Custom controls built from `<div>`.** If it clicks, it needs `tabindex="0"`,
  a role, and Enter/Space handling. Using the real element instead —
  `<button>`, `<a>`, `<input>` — gets all of that for free and is almost always
  the better answer.
- **Tab order following the DOM, not the visual layout.** CSS reordering
  (`order`, `grid-area`, `row-reverse`) does not move focus order. If they
  disagree, fix the DOM.
- **Focus traps in dialogs** — focus moves in on open, cycles inside, returns to
  the trigger on close, and Escape closes.
- **No keyboard path to data that is only hoverable.** A tooltip carrying
  information the user needs is not an accessible tooltip.

For a composite widget — a chart, a grid, a tree — the expected set is arrow
keys to move, Home/End for the extremes, Escape to dismiss.

### Semantics before ARIA

The first rule of ARIA is not to use ARIA. A native element already announces
its role, state and keyboard behaviour; an ARIA reimplementation announces
whatever you remembered.

Where ARIA is genuinely needed:

- **Label your landmarks.** Multiple `<nav>` elements are indistinguishable
  without `aria-label`. Same for `<aside>` and multiple `<section>`s.
- **`aria-current="page"`** on the active navigation item. A CSS class is
  styling; this is the announcement. Ship both.
- **`aria-live="polite"`** on regions that change without a page load: filter
  result counts, save confirmations, validation summaries. Without it, a screen
  reader user acts and hears nothing.
- **`aria-expanded`, `aria-haspopup`, `aria-controls`** on disclosure triggers.
- **An accessible name on every icon-only control.** In a tool people are
  trained on, an unlabelled icon is a support ticket; to a screen reader it is
  "button".

Keep a visually-hidden utility for names that must exist without showing:

```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}
```

Note that `display: none` and `visibility: hidden` remove an element from the
accessibility tree entirely — which is right for decoration, wrong for a label.

### Colour is never the only signal

Roughly 8% of men have a red-green colour vision deficiency, and a screenshot
pasted into a black-and-white report has none at all. Every state that colour
indicates also needs a shape, an icon, a position or a word.

The test: **print the screen in greyscale.** Anything that becomes ambiguous was
relying on hue alone.

This applies hardest to the two places it is most tempting: a red row versus a
green row with otherwise identical text, and a multi-series chart legend.

### Contrast

4.5:1 for body text, 3:1 for large text and for the boundaries of interactive
elements. Check the accent against **every** surface it lands on.

Placeholder text, disabled labels and "subtle" grey-on-grey metadata are where
this fails most often — and disabled controls still need to be readable, because
a user has to understand what is unavailable.

#### When the background is not a colour

A contrast ratio is measured against what is actually behind the glyphs. Put
text over a photograph, a video, a gradient or a blurred backdrop and the ratio
is no longer one number — it changes as the image changes, and a check that
passed against the sample asset fails against the one a user uploads.

Nothing about the text can fix this reliably; a heavier weight raises legibility
but not the measured ratio. What works is putting something between them: a
scrim over the whole image, or a solid plate behind the text block. Then check
the worst case the background can reach, not the one in the mock.

### Target size

See `09-input.md`. The floor is 24×24 CSS pixels with the standard's spacing
exception, it is one of the minimums a pack may raise and may not lower, and the
usual fix is padding the control rather than enlarging what is drawn inside it.

### Preferences beyond reduced motion

Three system preferences are exposed, and most interfaces honour one of them.

```css
@media (prefers-reduced-transparency: reduce) { … }   /* blur and see-through */
@media (prefers-contrast: more)              { … }    /* borders and ratios   */
@media (forced-colors: active)               { … }    /* the system's palette */
```

- **Reduced transparency** is set by people for whom a translucent surface with
  moving content behind it is unreadable. Honouring it means an opaque
  fallback — the same fallback you already need for browsers without
  `backdrop-filter`, so it costs one extra media query, not a second design.
- **Increased contrast** wants stated boundaries. Surfaces separated only by a
  one-step luminance difference need a real border here.
- **Forced colours** replaces your palette outright. Anything encoded purely as
  a background colour disappears; test that state is still legible when every
  colour you chose is gone. `forced-color-adjust` should be reserved for the few
  places where a colour carries meaning that cannot be re-expressed.

### Motion and vestibular safety

See `04-motion.md`. The rule that gets broken: honouring
`prefers-reduced-motion` by killing the animation without supplying the end
state, so an element that faded in is now permanently invisible.

### Zoom and reflow

The content must work at 200% zoom and at a 320px-wide viewport without
horizontal scrolling of the page as a whole. This is why type is sized in `rem`
and not `px`, and why individual containers — not the page — are the things that
scroll horizontally.

### Forms

- A real `<label>` associated with every control. Placeholder text is not a
  label: it vanishes on input, exactly when a user needs to check what they are
  filling in.
- Errors announced, not only coloured. Tie the message to the field with
  `aria-describedby`, and mark the field `aria-invalid`.
- Never disable submit without saying what is missing.
- Group related controls in a `<fieldset>` with a `<legend>` — this is what
  makes a set of radios announce as one question.

## Internationalisation

Retrofitting this is one of the most expensive things you can do to a front end,
because it touches every string and every fixed width. Building it in costs
almost nothing.

### Mark nodes, do not template strings

```html
<span data-i18n="nav.settings">Settings</span>
<input data-i18n-attr="placeholder:filter.file_ph" placeholder="Search file name">
<p data-i18n-html="help.body">Text with <b>markup</b></p>
```

The source language **stays in the HTML**. That is the point: the page is
readable, reviewable and testable without the translation layer running, and a
missing key degrades to real text rather than to `nav.settings`.

The same discipline applies with a framework. `t('nav.settings')` with no
fallback means every missing key is a visible defect in production; give the
call a default and the worst case is an untranslated word.

### Guard against the language flash

A dictionary applied after first paint means a Vietnamese user sees English,
then watches it change. It reads as a bug on every navigation.

```html
<script>
  try {
    var p = JSON.parse(localStorage.getItem('app.preferences') || '{}');
    var lang = p.language || 'en';
    document.documentElement.lang = lang;
    if (lang !== 'en') document.documentElement.classList.add('i18n-pending');
  } catch (_e) {}
</script>
<style>
  html.i18n-pending [data-i18n],
  html.i18n-pending [data-i18n-html] { visibility: hidden; }
</style>
```

Inline, in `<head>`, before the stylesheets — see `03-layout.md`. Hide only the
marked nodes, so layout still settles and only the text waits. And make sure the
class is always removed, including on a failed dictionary load, or the interface
stays blank.

`document.documentElement.lang` is not cosmetic: it drives hyphenation, quote
marks, font selection for CJK, and how a screen reader pronounces the page.

### Budget width

English is one of the more compact languages in a UI. German compounds and
Vietnamese diacritics both run long; Russian and Finnish longer still.

- **Roughly 35% headroom** on labels, buttons and nav items. Short strings
  expand proportionally more than long ones — a 5-character word can double.
- **Never let a fixed-height row wrap.** Truncate with an ellipsis and keep the
  full value reachable.
- **Test at the real extremes**, not with the English string. A pseudo-locale
  that pads every string 40% and adds diacritics surfaces every overflow in one
  pass.
- **Icon-plus-label beats label-only** in tight chrome, because the icon carries
  meaning while the label is compressing.

### Never concatenate a sentence

```js
// breaks in every language with different word order or gendered agreement
msg = count + ' of ' + total + ' ' + noun + ' match';

// translatable as one unit
t('filter.match', '{{n}} of {{all}} outputs match', { n: count, all: total });
```

Plurals are not a suffix. Arabic has six plural categories, Polish three,
Japanese one. Use the platform's plural rules (`Intl.PluralRules`, ICU
MessageFormat) rather than `n === 1 ? x : x + 's'`.

### Format with the locale, never by hand

```js
new Intl.NumberFormat(locale).format(1234.5);
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
new Intl.RelativeTimeFormat(locale).format(-3, 'day');
```

Decimal separators, thousands grouping, date order and first day of week all
vary. Hand-formatting `DD/MM/YYYY` produces a date that half the world reads as
a different day — and in an operational tool that is a real error, not a
cosmetic one.

Keep timestamps in UTC in the data layer and format at the edge, in the user's
zone.

### Right-to-left

If Arabic, Hebrew, Farsi or Urdu are plausible, the cost of being RTL-ready now
is roughly zero, and retrofitting is a full layout pass.

- Use **logical properties** throughout: `margin-inline-start`,
  `padding-inline`, `inset-inline-end`, `border-start-start-radius`. They flip
  automatically; `left`/`right` do not.
- `text-align: start` and `end`, not `left` and `right`.
- Directional icons — arrows, chevrons, back buttons — need to mirror. Icons
  depicting objects do not.
- Numbers and embedded Latin text stay left-to-right inside RTL text; let the
  browser's bidi algorithm handle it rather than forcing direction.

### What is not translated

Be explicit, because translators will otherwise ask or guess: product names,
identifiers, SKUs, file names, code samples, log output, and enum values that
appear in an API. Mark them so they are skipped.

## Charts

A chart is a claim about data. These rules keep the claim honest and keep the
numbers reachable; a pack layers its own density, palette and interaction style
on top.

### Honesty

**Start a value axis at zero whenever magnitude is being compared** — bars,
area fills, anything read by size. A truncated axis makes a 3% difference look
like a doubling. In a screen someone forwards to a customer, that is a
misstatement, not a style choice.

Line charts tracking a narrow range around a large value are the legitimate
exception: zero-basing a temperature series destroys the signal. When you
truncate, say so on the axis.

Other ways a chart lies, all easy to ship by accident:

- **Dual y axes.** Two scales chosen independently can make any two series
  appear correlated. Use two stacked charts sharing an x axis.
- **Inconsistent scales across small multiples.** If panels are compared,
  they share one scale.
- **Area or radius encoding a value linearly.** Doubling a circle's radius
  quadruples its area, and the eye reads area.
- **Uneven time buckets** drawn at even spacing.

### Round the scale, leave headroom

```js
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * p;
}
const yMax = niceMax(Math.max(...values) * 1.08);
```

Four intervals and five labels covers most plots. Compact the labels (`1.2k`,
`340k`) — full precision on an axis is noise, and the exact figure belongs in
the tooltip and the table.

Grid lines on the value axis only; lines on the category axis add ink without
helping anyone read a value. For a 1px line, `shape-rendering: crispEdges` plus
a `+0.5` offset puts it on a device pixel instead of blurring across two.

### Handle the degenerate cases explicitly

Every one of these has shipped as a blank chart or a crash:

- **One point** — centre it; a line path needs a nudged duplicate or it renders
  nothing.
- **Zero points** — an empty state, not an empty axis.
- **All values identical** — a flat line at a sensible scale, not a divide-by-zero.
- **All zeroes** — a real axis, not `yMax = 0`.
- **One outlier 100× the rest** — say something, or offer a log scale. Do not
  silently flatten the other 99 points.
- **More points than pixels** — downsample deliberately, so the shape survives.

### Interaction

Hit test with **one transparent rectangle over the plot** and a nearest-point
lookup, not a handler per mark. Per-mark handlers mean the user must hit a 4px
circle to read a value.

```js
const nearest = (clientX) => {
  const r  = svg.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * viewBoxWidth;   // rescale!
  let best = 0;
  pts.forEach((p, i) => { if (Math.abs(p[0] - px) < Math.abs(pts[best][0] - px)) best = i; });
  return best;
};
```

That rescale is mandatory whenever the SVG is `width: 100%` with a fixed
`viewBox` — client pixels and user units are different spaces, and skipping it
produces a tooltip that drifts further from the cursor the wider the window gets.

Draw individual markers only while they stay distinguishable — roughly 60
points. Past that they merge into a caterpillar and the hover indicator carries
it.

### Accessibility is not optional here

A chart usually carries data that exists nowhere else on the page.

- `role="img"` on the SVG with an `aria-label` that states what it shows and how
  many points — not "chart".
- The plot is keyboard-operable: `tabindex="0"` on the hit area, arrow keys to
  step, Home/End for the extremes, Escape to dismiss the readout.
- **Ship the numbers as a real table.** In a `<details>` underneath if space is
  tight.

```html
<details>
  <summary>Show as table</summary>
  <table>…</table>
</details>
```

That table is the only way a screen reader user — or anyone who needs an exact
figure, or wants to copy the data — gets it at all. It costs one element, and it
doubles as the export surface. It is also the most commonly skipped item in this
whole system.

### Series colour

| Series | Approach |
|---|---|
| 1 | The accent. Done. |
| 2–5 | A categorical ramp that stays distinguishable in greyscale and under red-green colour vision deficiency. |
| 6+ | The chart is the wrong form. Use a sorted table, small multiples, or let the user choose which series to show. |

Never encode a category in colour alone — pair it with a direct label, a
position, or a mark shape. Direct labels at the end of each line beat a legend
whenever they fit: a legend forces the eye to travel and hold a mapping in
memory.

For sequential data use a single hue, light to dark. For diverging data anchor
the midpoint at something meaningful and say what it is.

### Gradient fills that mean something

If an area fill is more than decoration, anchor its gradient to the **value
scale**, not to the shape:

```js
{ gradientUnits: 'userSpaceOnUse', x1: 0, y1: y(yMax), x2: 0, y2: y(0) }
```

The default `objectBoundingBox` stretches the ramp to fit the path's own
bounding box, so a series peaking at 40k and one peaking at 400k both get an
identically dense top and the colour stops carrying information.

Put the opacity on the gradient **stops**, not on the path. A flat `opacity`
scales the whole shape down uniformly, which erases exactly the difference the
gradient was drawing.

### Library or hand-written

Hand-written SVG is the better default for a line, a bar set, an area or a
sparkline: no dependency, no competing token system, no accessibility gaps you
did not choose.

Reach for a library when you need brushing and linking, zooming and panning,
geographic projection, force layouts, or more than a few thousand marks. Then
budget real time for restyling it to your tokens and fixing its keyboard
support — both are usually more work than the chart was.

## Feedback

`04-motion.md` governs how a thing moves once it is moving. This file governs
something else: what the interface owes the user **between the click and the
answer**, and how that debt grows with the wait.

The two get confused because both are measured in milliseconds. An animation
duration is a design choice. A response time is a fact you are handed, and the
only decision left is what to show while it elapses.

### The clock picks the affordance

Measure the work, then pick the row. Do not pick by how important the action
feels.

| Elapsed | Show |
|---|---|
| **< 100ms** | Nothing. The result is already there; it reads as direct manipulation. |
| **100 – 300ms** | The control's own busy state. No overlay, no spinner — the thing the user touched acknowledges the touch. |
| **300ms – 1s** | A spinner **inside the region that is about to change**, at the size of the thing it replaces. |
| **1s – 5s** | A skeleton at the real dimensions of the content. |
| **> 5s** | Determinate progress — a percentage or a count — and a way to cancel. |

Three of these go wrong constantly:

- **A spinner under 300ms makes the interface slower.** It appears, the user
  registers it, it vanishes. A flash of "waiting" where there was no wait reads
  as a stutter. If the work is usually fast and occasionally slow, delay the
  spinner by ~300ms rather than rendering it immediately.
- **A spinner past a second is an apology with no information.** It says
  something is happening and nothing about what or how long. A skeleton says
  both, because it has the shape of the answer.
- **Indeterminate progress past five seconds is abandonment.** A user who cannot
  tell 10% from 90% cannot decide whether to wait, and a bar that has been
  ambiguous for thirty seconds is indistinguishable from a hang.

A skeleton is only honest at the real dimensions. A generic grey box that
collapses into a different layout is a spinner with extra steps — see the
space-reservation rule in `03-layout.md`, which this is the same argument for.

### Why the bands break where they do

Under **100ms** a response is attributed to the user's own action. Past it, the
user perceives the system as a separate actor that is responding.

The **Doherty threshold** — roughly 400ms — is where the interaction stops being
a conversation and starts being a queue. Below it, attention stays on the task;
above it, attention leaves, and the cost is not the 400ms, it is the time the
user spends coming back.

This is why the bands tighten around the actions people repeat. A 900ms save on
something done once a day is nothing. The same 900ms on a filter someone
adjusts forty times an hour is the reason they stop adjusting it, and the
feature is dead without anyone filing a bug.

### An optimistic update needs all three

Rendering success before the server confirms it is correct for a like button
and wrong for a transfer. The test is not "is it fast" — it is whether all
three hold:

1. **It nearly always succeeds.** Not "should" — measured.
2. **Failure is cheap.** Nothing downstream has acted on the assumption.
3. **It can be reversed in the interface**, without a reload and without the
   user re-entering anything.

Delete all three and the cost is a user who believes something happened that
did not.

When it does fail, **the rollback is announced, not silent.** Reverting the
state and saying nothing produces the worst outcome available: the user saw it
work, looks again, and now distrusts every other state on the screen. Restore
the value, say what failed, and leave their input where they can retry it.

```
optimistic    → render the new state, keep the previous one
on failure    → restore it, surface the reason, preserve the user's input
never         → restore it and stay quiet
```

### Every interaction has four parts, and two are usually missing

A complete interaction — a toggle, a save, a drag, a pull-to-refresh — has the
same four parts. Work through them in order; the failures cluster in the two
nobody writes down.

| Part | Question it answers |
|---|---|
| **Trigger** | What starts this, and can the user tell it exists, what it does and what state it is in? |
| **Rules** | What is allowed, in what order, and what happens at the edges — empty, one item, too many, offline, already running, triggered twice? |
| **Feedback** | How does the user learn which rule just applied? Visual, audible or haptic. |
| **Loops and modes** | How long does it persist, does it repeat, and what does it look like the hundredth time? |

**Rules** is where the bugs live, because rules are invisible until one is
wrong. Double submission, an action fired on an item that vanished under it,
a confirm dialog that runs the action twice — none of these are feedback
problems.

**Loops and modes** is where the charm becomes the cost. A mode that changes
what the surrounding controls do must be visible and must be escapable, or the
user issues the right command into the wrong mode — and blames themselves.

### Design for the hundredth time, not the first

Any flourish attached to a repeated action is seen hundreds of times by the
people who use the product most. A confetti burst on the first invoice is a
gift; on the four-hundredth it is a delay standing between someone and their
job.

Two ways out, both better than removing it: decay it — full the first few
times, reduced after — or attach it to the milestone rather than to the
repetition. The rule in `04-motion.md` about repeated interactions being the
fastest thing on screen is the same principle applied to duration.

### Spend the attention at the peak and at the end

People do not remember an average. They remember the most intense moment of an
experience and how it ended, and they rate the whole against those two.

Practically, that redirects the polish budget:

- **The error at the final step outweighs everything before it.** A failure on
  confirm erases a flow that was pleasant up to that point, so the recovery path
  from the last step deserves more care than the entrance to the first.
- **Finish deliberately.** An action that completes by having the spinner stop
  has no ending. State what happened, what changed and what is next.
- **The worst moment is a design surface.** Waiting, empty, rejected, expired —
  these are the moments that get remembered, and they are usually the ones
  written last and fastest.

## Input

An interface is not shaped by its screen size. It is shaped by what the user is
pointing with, and how far away they are sitting.

A phone and a desktop browser at the same CSS width are not the same problem:
one has a pointer accurate to a pixel and a hover state, the other has a finger
roughly ten millimetres wide and no hover at all. Treating width as the variable
is how a "responsive" layout ends up with 28px icon buttons on a touchscreen.

This file holds the method. The numbers a domain settles on belong to its pack —
except the floor, which is an accessibility minimum and belongs to nobody.

### Target size follows the pointer, not the screen

Time to hit a target falls as the target grows and rises as it gets further
away. Two consequences, and they compound:

- **The less precise the input, the larger the target must be.** A mouse
  cursor is a point; a fingertip is a contact patch; a gaze cursor drifts
  continuously because the eye never holds still.
- **The further away the screen, the larger the target must be** — at
  arm's length a 40px control and a 60px control are different sizes, at three
  metres they are the same blur.

The ordering that holds everywhere:

```
fine pointer, close    smallest targets the domain can justify
coarse pointer, close  targets sized to a fingertip, with spacing between them
remote or gaze, far    targets sized to be identified before they are selected
```

**The floor is 24×24 CSS pixels**, from WCAG 2.2 Target Size (Minimum), and it
is not domain-negotiable — it is one of the accessibility minimums that cannot
be overridden, because the cost lands on someone who is not in the room. A
smaller control is allowed only where the standard's own exceptions apply: it
has 24px of clear spacing around it, or it is an inline target inside a
sentence.

Packs raise this floor. None may lower it.

**Spacing counts as much as size.** Two targets that each meet the minimum but
sit flush against each other produce mis-taps that read to the user as the
interface ignoring them — they hit the thing, something else happened. Gaps
between adjacent actions are part of the target, not decoration.

**The hit area is not the visual size.** A 16px icon can carry a 44px target by
padding the control or projecting the area with a pseudo-element. Growing the
hit area is almost always the right fix; growing the icon is almost never.

### Hover does not exist everywhere

Roughly half the world's sessions have no hover state at all, and the failure is
total rather than degraded: the content is not merely hard to reach, it is
unreachable.

**Never put information or an action behind hover alone.** A row's delete button
that appears on hover, a truncated cell whose full value is in a tooltip, a menu
that opens on hover — on touch these either do not exist or fire on the tap that
was meant to select something else.

Hover is a *refinement*, and the capability is detectable:

```css
/* the control exists and is reachable for everyone … */
.row-action { opacity: 1; }

/* … and only quietens itself where a hover state is actually available */
@media (hover: hover) and (pointer: fine) {
  .row-action { opacity: 0; }
  .row:hover .row-action,
  .row-action:focus-visible { opacity: 1; }
}
```

Query the **capability**, never the device. `pointer` and `hover` describe the
primary input; `any-pointer` and `any-hover` describe everything available. A
laptop with a touchscreen answers yes to both, a tablet with a keyboard changes
its answer when the user picks it up, and neither is an edge case.

The parallel keyboard rule is in `05-accessibility.md` — if a hover reveals
something, focus must reveal the same thing, and the same markup usually solves
both.

### On a desktop, the edges are infinite

A cursor cannot overshoot past the edge of the screen, so the four edges and
especially the four corners behave as targets of unbounded size — the user can
throw the pointer at them without aiming.

That is why system menus, close buttons and docks live there, and it is worth
spending: an action used constantly earns an edge. Nothing about this transfers
to touch, where the edges are the hardest places to reach and are already
claimed by system gestures.

### Reach is not uniform

Where a hand rests determines which part of the screen is cheap. On a held
device the anchor is the thumb, which sweeps an arc — near the bottom centre is
cheap, the far top corner requires regripping, and regripping while walking is
how phones get dropped.

The method, independent of any device:

- **Put the primary action where the hand already is.** Not where the visual
  hierarchy would like it.
- **Put destructive actions where the hand is not.** Distance is the cheapest
  confirmation there is, and it costs nothing to the people who are not about to
  make a mistake.
- **Never put a frequent action in the most expensive corner** just because that
  is where the convention on another form factor placed it.

### When focus is the only cursor

With a remote, a D-pad, a keyboard or a gaze, the user cannot point at a target.
They can only move from the current one — so focus is not a highlight, it is the
cursor, and it must be unmissable.

- **Give it weight.** At a distance a 2px outline is invisible; the focused item
  needs to change size, elevation or fill enough to be located from across a
  room. The 3:1 contrast requirement in `05-accessibility.md` is the floor, not
  the target.
- **Movement follows geometry, not source order.** If pressing right lands
  somewhere the user would not call right, the model is broken, and no amount of
  visual polish repairs it.
- **No dead ends and no traps.** Every focusable element is reachable from every
  other, and every container can be left in the direction the user entered it.
- **One unambiguous focus at all times.** Never zero — a screen that loads with
  nothing focused cannot be operated at all — and never two.

### Physical feedback is feedback

Where the hardware offers haptics, a short pulse confirms an action without
requiring the user to look. It is the cheapest confirmation available on a
device held in the hand, and the only one that survives glare.

Two rules: haptics **confirm**, they never **inform** — anything conveyed by a
buzz alone is lost to anyone who has them disabled — and they follow the same
restraint as motion. A device that vibrates on every scroll tick gets its
haptics turned off, taking the useful confirmations with them.

## Visual language

A visual language is the named style a surface is built in — the bento grid,
the heavy-bordered industrial look, translucent glass, an interactive 3D scene.

It is the one axis in this system that is neither core nor a pack. Core cannot
own it, because nothing here says a domain must be built in any particular
style. A pack cannot own it either, because the same style is available to
every domain: a bento grid works on a marketing page and on an operations
dashboard, and refusing it in one of them is a taste, not a thesis.

What *is* true everywhere is the pricing. Every one of these costs something
specific, in a place that is not obvious when you choose it, and each has one
or two rules that decide whether it survives contact with real content. That
is what this file holds.

### Price it before you adopt it

Four questions. If a style cannot answer all four, it is decoration that has
not been costed.

1. **What does it buy, in one sentence?** "It looks modern" is not an answer.
   "It lets six unequal things share a screen without a hierarchy argument" is.
2. **What does it cost in contrast?** Most of these styles put text somewhere
   the contrast ratio is not a fixed number — see the variable-background
   section of `05-accessibility.md`.
3. **What does it cost to render?** Per frame, on the worst device in the
   audience, not on the machine it was designed on.
4. **How does it degrade?** When the effect is unsupported, switched off by a
   system preference, or handed content twice as long as the mock — what is
   left, and is what is left usable?

The answer to 4 is the one that separates a style from a liability. A style
that degrades to something plain is a choice. A style that degrades to
unreadable was never a style, it was a dependency.

### The current set, and what each one needs to survive

#### Modular grid of unequal cells

Blocks of different sizes sharing one grid, sized by importance rather than by
uniformity. Cheap — native grid, no GPU cost — and the most useful of the set,
because it solves a real problem: presenting six things of unequal weight
without pretending they are equal.

What it needs:

- **A cell count with a floor and a ceiling.** Too few and there is no rhythm
  to read, just a grid; too many and nothing is dominant, which is the whole
  mechanism gone. Five to nine is the usual working range outside a dedicated
  data dashboard.
- **DOM order is reading order.** An asymmetric grid is exactly where source
  order and visual order drift apart, and it is invisible until a screen reader
  or a keyboard arrives — the tab-order rule in `05-accessibility.md`, in the
  layout most likely to break it.
- **One cell is clearly the largest**, and it holds the thing the screen is
  about. If every cell is nearly the same size, the format is doing nothing.
- **A stated collapse order.** At one column, the grid becomes a list, and the
  list order is a decision somebody has to make rather than whatever the source
  happened to be.

#### Heavy borders, hard shadows, saturated fills

Thick outlines, offset shadows with no blur, loud fills, geometric or
monospaced type. Costs nothing to render and buys distinctiveness in domains
where looking like everyone else is itself a problem.

What it needs:

- **Contrast checked on the fill, not on the palette.** Saturated backgrounds
  are where text contrast fails most reliably, and the brighter and more
  cheerful the fill, the worse it usually is.
- **A budget.** Applied to a whole long-session interface it is exhausting in a
  way people describe as "I just don't like using it". Applied to the primary
  action and one or two feature blocks it is a signature.
- **An answer for the states.** A style built on a single heavy border has
  nowhere obvious to put hover, focus and disabled, and they tend to get
  invented per component. Decide them once, with the border.

#### Translucent surfaces

A layer that blurs and tints what is behind it. Native to two desktop operating
systems and to spatial interfaces, which is why it reads as system-level rather
than decorative.

It is also the most fragile thing in this file, because its legibility depends
on content it does not control.

What it needs:

- **A fallback that is not optional.** Two of them, and they are the same
  fallback: browsers without backdrop blur, and users who have asked for
  reduced transparency (`05-accessibility.md`). An opaque surface with the same
  tint is the answer to both, so this is one extra rule rather than a second
  design.
- **Text on a plate, not on the blur.** The ratio changes as the background
  scrolls past. A local opaque layer behind the text block fixes the ratio; a
  heavier font weight only makes the failure look intentional.
- **A ceiling on how many layers stack.** Each blurred surface is a separate
  offscreen buffer, and the cost is per layer, per frame. Two translucent
  surfaces over one another is usually one too many.
- **Never over a live feed.** Video, a map, a chart that updates — the
  background changes without the user acting, so the text's legibility changes
  without the user acting.

#### Real-time 3D

An interactive scene the user can rotate, configure or scrub. The only style
here with a hard budget, and the only one that can make a device hot.

What it needs:

- **A frame budget, chosen from the target device**, with geometry and texture
  compression sized to hit it. This is a number agreed before modelling, not a
  problem discovered at integration.
- **A non-visual path to the same information.** A scene conveys size,
  material and configuration; someone who cannot see it still needs those, and
  a canvas element announces nothing.
- **A poster frame and a stated loading state.** Assets are heavy, so the
  screen has to be useful before they arrive — see the waiting rules in
  `08-feedback.md`.
- **Motion the user drives, not motion that plays.** Autoplaying camera
  movement is the exact class of motion `04-motion.md` says to drop under
  reduced motion, and a scene whose only affordance is that movement has
  nothing left when it goes.

#### Dark interfaces

Not a style — a second set of surface values, and it belongs to the token
system. `01-tokens.md` holds the two rules that decide whether it works: depth
is carried by luminance rather than shadow, and the base surface is not pure
black.

### When the request arrives by name

Users ask for these by name: *make it glassmorphism*, *give it that bento
look*. Treat the name as a description of an outcome they want, and the rules
above as the price.

The move is the one in the activation block: name the cost in a sentence, offer
the version that survives, then build whatever is decided.

- *"Glass cards over the dashboard"* → the data loses contrast, which on a
  dashboard is the entire budget. Offer glass on the chrome, where there is no
  data to lose, and flat surfaces under the numbers.
- *"The whole site in the heavy industrial style"* → fine for a landing page,
  punishing for a signup flow. Offer it on the hero and the primary action.
- *"A 3D product viewer"* → ask what the frame budget is on the cheapest phone
  in the analytics, before anything is modelled.

What is not negotiable is the same pair as everywhere else: the accessibility
minimums and the chart honesty rules. A style is never a reason to drop below
them, because the person who pays is not in the room.

### A pack's part in this

A pack does not own a visual language, and it may **refuse** one — with a
reason, in its refusals table, naming what the style costs *in that domain*.
"Glass on a data table costs contrast on the data, which is the whole budget"
is a domain argument. "Glass is out of fashion" is not.

If a pack adopts one as its default, that belongs in its thesis, with the
values in its palette file, because at that point it has stopped being a style
and become part of what the domain decided.

## Review

The universal pass. A pack adds its own domain checks on top; nothing here is
waived by any domain.

### Checklist

#### Tokens
- [ ] No raw colour outside the token file. `grep -n '#[0-9a-fA-F]\{3,8\}'` over
      the other stylesheets should come back empty.
- [ ] Every accent has a value per surface, and each is used on the right one.
- [ ] Semantic colours are distinguishable from the accent.
- [ ] Downstream tokens are defined in terms of the palette, not as literals.

#### Type
- [ ] Type sized in `rem`/`em`, never `px`.
- [ ] `tabular-nums` on every figure, in every location.
- [ ] Figures compared by magnitude are right-aligned.
- [ ] Prose capped near 72ch.
- [ ] Labels quieter than the values they label.

#### Layout
- [ ] `min-width: 0` on every grid or flex item that can hold wide content.
- [ ] Grid tracks use `minmax(0, 1fr)`.
- [ ] Containers scroll; content is not squeezed to fit.
- [ ] Nothing that bleeds outside its box is inside a clipping scroll container.
- [ ] Works at 320px wide and at 200% zoom without page-level horizontal scroll.
- [ ] Async content has its space reserved — no layout shift on load.

#### State
- [ ] Every interactive element has hover, focus-visible, active and disabled.
- [ ] Disabled elements do not respond to hover.
- [ ] State that drives styling is also in the DOM (`data-state`,
      `aria-current`, `aria-expanded`) so it is announced and assertable.
- [ ] State restored from storage is applied before the first paint.

#### Loading, empty, error
- [ ] The three empty cases are worded differently: nothing exists yet, a filter
      excluded everything, the request failed.
- [ ] "Nothing yet" says what creates the first item.
- [ ] Errors show what actually happened, not a generic apology.
- [ ] Async work shows determinate progress where the duration is knowable.

#### Feedback
- [ ] The waiting affordance matches the wait: nothing under 300ms, a skeleton
      at real dimensions past a second, cancellable progress past five.
- [ ] No spinner appears and vanishes inside 300ms.
- [ ] Every optimistic update is reversible in the interface, and a failed one
      announces the rollback instead of quietly undoing it.
- [ ] Double-triggering, an empty result and an item that disappeared mid-action
      all behave.
- [ ] A completion says what changed, rather than ending when a spinner stops.
- [ ] Nothing celebratory is attached to an action someone performs all day.

#### Input
- [ ] Targets clear 24×24px, or carry the spacing the exception requires.
- [ ] Adjacent actions are separated; nothing destructive sits against something
      routine.
- [ ] No information or action is behind hover alone; hover is inside
      `@media (hover: hover)` and focus reveals the same thing.
- [ ] Capability is queried (`pointer`, `hover`), never the device.
- [ ] Focus is locatable at the viewing distance the screen is used at, never
      absent and never duplicated.

#### Visual language
- [ ] Any named style in use has an answer for what happens when it is
      unsupported, switched off by a system preference, or handed twice the
      content.
- [ ] A translucent surface has an opaque fallback, and its text sits on a
      plate rather than on the blur.
- [ ] An asymmetric grid reads in DOM order, and has a stated single-column
      order.
- [ ] A 3D scene has a frame budget, a poster frame and a non-visual path to
      the same information.

#### Accessibility
- [ ] Nothing is mouse-only.
- [ ] Tab order matches the visual order.
- [ ] Landmarks are labelled; multiple `<nav>`s are distinguishable.
- [ ] Icon-only controls have accessible names.
- [ ] Changes without a page load are announced via a live region.
- [ ] Greyscale test passes — no state indicated by hue alone.
- [ ] Contrast: 4.5:1 body, 3:1 large text and interactive boundaries, including
      placeholders and disabled labels.
- [ ] Text over an image, video or blur has a scrim or plate, checked against
      the worst background it can be given.
- [ ] `prefers-reduced-transparency` and `prefers-contrast` are answered, not
      only `prefers-reduced-motion`.
- [ ] Dialogs trap focus, restore it on close, and close on Escape.

#### Motion
- [ ] Repeated interactions are the fastest thing on screen.
- [ ] Transitions that replace content say what survived — not everything is a
      fade.
- [ ] Animated figures carry `tabular-nums`.
- [ ] No property other than `transform` and `opacity` animates across many
      elements at once. One element under the cursor is free; five hundred
      rows entering is not.
- [ ] `prefers-reduced-motion` honoured, with end states stated explicitly —
      no `opacity: revert`.
- [ ] Nothing animates on resize.

#### Charts
- [ ] Value axis starts at zero where magnitude is compared, or the truncation
      is labelled.
- [ ] No dual y axes; small multiples share a scale.
- [ ] Degenerate cases handled: 0, 1, all-equal, all-zero, single outlier.
- [ ] Keyboard-steppable, with a table fallback.
- [ ] Series distinguishable in greyscale; categories never colour-only.

#### Internationalisation
- [ ] Strings marked, with the source language left in place as a fallback.
- [ ] No concatenated sentences; plurals via platform rules.
- [ ] Dates, numbers and relative times formatted via `Intl`.
- [ ] ~35% width headroom; nothing in a fixed-height row wraps.
- [ ] Translated pages do not flash the source language.
- [ ] Logical properties used if RTL is plausible.

### Failure modes

The ones that recur across every domain.

**The accent used on the wrong surface.** A brand colour chosen for one surface
applied to the other. Passes a brand review, invisible in use.

**`min-width: auto` blowing out a layout.** One wide table stretches its grid
track and pushes navigation off screen. The symptom looks like a broken
container; the cause is a default.

**State restored after first paint.** The interface visibly corrects itself on
every navigation. Reads as a bug, not as a preference.

**`opacity: revert` under reduced motion.** `revert` rolls back to the
user-agent default, not to your stylesheet value. Elements that faded in stay
invisible — or, worse, elements meant to be subtle become fully opaque.

**Proportional digits.** A column of numbers that ripples on every refresh. One
line of CSS, and nobody notices it is missing until it is fixed.

**Per-mark chart hit targets.** Users hunting a 4px circle to read a value.

**A truncated axis on a size comparison.** The chart overstates the difference,
and the screenshot outlives the conversation that would have qualified it.

**Colour as the only signal.** A red row and a green row with identical text.
Fails for ~8% of men and for every greyscale printout.

**`display: none` on something that needed a name.** Removed from the
accessibility tree, so the label it was carrying no longer exists.

**Placeholder text used as a label.** It disappears at the moment the user wants
to check what they are filling in.

**A style with no degraded state.** Translucency on a browser without backdrop
blur, a 3D scene that never loads, a heavy border under forced colours. The
screen does not look plainer — it stops working.

**A spinner where the wait did not need one.** It appears and vanishes inside a
third of a second, and the user reads the flash as a stutter in an interface
that was actually fast.

**An indeterminate spinner on a long wait.** It reports that something is
happening and nothing about what or how long, so at thirty seconds it is
indistinguishable from a hang.

**A silent optimistic rollback.** The user saw it succeed, looks again, and it
is gone. They now distrust every other state on the screen, which is a worse
outcome than never having shown success.

**An action that only exists on hover.** The row's delete button, the tooltip
carrying the full value. On touch it is not degraded, it is absent.

**Shadows carrying elevation on a dark surface.** There is nothing left to
darken, so every layer lands on the same plane and a menu looks painted onto the
panel behind it.

**Palette drift.** The most common way a system dies — not with a decision, but
with a page written in a hurry, shipping literals that exist nowhere in the
palette. It looks fine in isolation and wrong beside everything else. Audit for
literals on a schedule; the fix is always mechanical, and it never gets easier.

### When a request conflicts with a rule here

Name the cost, offer the nearest thing that works, then build what they decide.
Record the decision where the next person will find it, so it is not
re-litigated from scratch next quarter.

Two of these are not negotiable regardless, because the cost lands on someone
who is not in the room: **the honesty rules for charts**, and **the
accessibility minimums**. For those, offer the compliant alternative rather than
the requested version.

---

# Part 3 - Immersive web specifics

## Surfaces, palette and scales

The concrete values. Core (`01-tokens`, `02-typography`, `04-motion`) holds the
method and the reasoning; this file holds what this domain picked.

### Surface assignment

| Role | Treatment | Why |
|---|---|---|
| **canvas** | Two of them. The **stage** `#0c0e13`, and the **page** `#f5f6f8` | A lit object needs a backdrop that is not competing with it, and a spec table needs to be read. Those are different jobs, so they get different surfaces rather than one compromise. |
| **content** | HTML in a lane beside the scene, or on a plate over it | The render is a background nobody controls. Text set on it has whatever contrast the model's current angle gives it. |
| **chrome** | A floating header, transparent over the stage until scrolled, then a plate | There is no workspace to frame. |
| **floating** | Plates, the option picker, hotspot popovers: `--stage-2`, 20px radius, no shadow | On the stage, a layer is lifted by being lighter - see below. |
| **accent** | One blue, `#1d5fe0` on the page and `#8ab4ff` on the stage | The primary action and the selected option. Nothing in the scene itself. |
| **semantic** | Success, warning, danger - each with a stage value | Forms and scene status. |

**The stage is where the scene is, and nowhere else.** A page that is dark
throughout because one section holds a model has made every paragraph pay for
the model's lighting. Go to the stage for the scene, and come back to the page
for the specification, the curriculum and the price.

### The token file

Ships as `assets/theme.css`.

```css
:root {
  /* ----- Accent: one value per surface ----- */
  --accent:           #1d5fe0;   /* on the page */
  --accent-hover:     #174cb8;
  --accent-on-stage:  #8ab4ff;   /* the same accent, legible on the stage */

  --text-on-accent:        #ffffff;   /* label on the page-value fill */
  --text-on-accent-stage:  #0c0e13;   /* label on the stage-value fill */

  --accent-a35:        rgba(29, 95, 224, 0.35);
  --accent-stage-a35:  rgba(138, 180, 255, 0.35);

  /* ----- Stage ----- */
  --stage:    #0c0e13;
  --stage-2:  #151921;   /* plates, the option picker */
  --stage-3:  #1f2530;   /* hover, raised, selected */
  --plate:    var(--stage-2);

  --stage-text:    #f3f5f8;
  --stage-text-2:  #b3bac6;
  --stage-text-3:  #8e97a6;

  --stage-line:     rgba(255, 255, 255, 0.10);   /* structural */
  --stage-control:  #717b8c;                     /* the edge of a control */

  /* ----- Page ----- */
  --page:     #f5f6f8;
  --surface:  #ffffff;

  --text:    #0f1218;
  --text-2:  #4b5362;
  --text-3:  #636c7c;

  --line:     #e1e4ea;
  --control:  #858d9b;

  /* ----- Semantic ----- */
  --success: #1a7f45;   --success-on-stage: #4fd38a;
  --warning: #946200;   --warning-on-stage: #f2b93b;
  --danger:  #c4242f;   --danger-on-stage:  #ff7a7a;
}
```

#### The pairs, computed

Every text colour against every surface it lands on, and every control edge at
3:1. These are WCAG 2 contrast ratios calculated from the values above, not
read off a screen. Change a value and its rows are wrong until recomputed.

| Foreground | on `--stage` | on `--stage-2` | on `--stage-3` | Needs |
|---|---|---|---|---|
| `--stage-text` | 17.67 | 16.12 | 14.08 | 4.5 |
| `--stage-text-2` | 9.89 | 9.02 | 7.88 | 4.5 |
| `--stage-text-3` | 6.55 | 5.97 | 5.22 | 4.5 |
| `--accent-on-stage` | 9.24 | 8.43 | 7.36 | 4.5 |
| `--success-on-stage` | 10.13 | 9.24 | 8.07 | 4.5 |
| `--warning-on-stage` | 10.83 | 9.87 | 8.63 | 4.5 |
| `--danger-on-stage` | 7.65 | 6.97 | 6.09 | 4.5 |
| `--stage-control` (edge) | 4.52 | 4.12 | 3.60 | 3 |

| Foreground | on `--page` | on `--surface` | Needs |
|---|---|---|---|
| `--text` | 17.34 | 18.75 | 4.5 |
| `--text-2` | 7.16 | 7.74 | 4.5 |
| `--text-3` | 4.90 | 5.29 | 4.5 |
| `--accent` | 5.16 | 5.58 | 4.5 |
| `--success` | 4.66 | 5.04 | 4.5 |
| `--warning` | 4.85 | 5.24 | 4.5 |
| `--danger` | 5.33 | 5.77 | 4.5 |
| `--control` (edge) | 3.09 | 3.34 | 3 |

Labels on the accent fill: `--text-on-accent` on `--accent` is 5.58 and on
`--accent-hover` 7.60; `--text-on-accent-stage` on `--accent-on-stage` is 9.24.

**The label on the accent flips with the surface.** The stage accent is a light
blue, so its button label is dark; the page accent is a deep blue, so its label
is white. A primary button copied from the page onto the stage with its white
label kept is 2.09:1.

**`--control` on `--page` is 3.09.** That is the tightest pair in the file, and
it is tight on purpose rather than by accident: a darker control edge reads as
a heavy outline on a light form. It leaves no room to lighten the page.

### Nothing in this table covers text on the render

Every ratio above is against a flat surface. The scene is not one. A model's
highlight passes behind a caption as the visitor turns it, and the caption that
measured 12:1 against the stage is briefly 1.5:1 against a chrome bezel.

Core's `05-accessibility.md` has the rule for backgrounds that are not a
colour. Here it has exactly two acceptable forms:

1. **A lane.** The scene and the text occupy different columns, or different
   rows on a phone. Nothing overlaps. This is the default.
2. **A plate.** `--plate` is opaque. Text that must sit over the render sits on
   one.

```css
.plate {
  background: var(--plate);               /* opaque - the render cannot reach the text */
  color: var(--stage-text);
  border: 1px solid var(--stage-line);
  border-radius: var(--r-plate);
  padding: var(--gap-block);
}
```

A translucent or blurred plate is the tempting version, and it puts the
contrast back in the hands of the model. A gradient scrim under a headline is
the same mistake with a softer edge: it holds until the model is rotated to its
bright side.

### Type

One family and a monospace, as core has it. A scene is already the page's
voice; a display face beside it is a second voice.

```css
--font:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace;
```

| Step | Size | Line height | Used for |
|---|---|---|---|
| `--t-hero` | `clamp(2.5rem, 7vw, 5rem)` | 1.0 | The one headline beside the scene |
| `--t-h2` | `clamp(1.75rem, 4vw, 2.75rem)` | 1.15 | Chapter and section headings |
| `--t-h3` | `1.375rem` | 1.25 | Sub-headings, the option group title |
| `--t-lead` | `1.25rem` | 1.5 | The paragraph under a headline |
| `--t-body` | `1.0625rem` | 1.65 | Running text |
| `--t-small` | `0.9375rem` | 1.5 | Controls, option labels |
| `--t-caption` | `0.8125rem` | 1.5 | Captions, hotspot labels, dimensions |

Base is 16px. The text lane is `minmax(20rem, 28rem)` wide, and running text is
capped at `--measure: 60ch` - a little tighter than a text-only page would use,
because the eye is leaving the column for the scene and has to find its place
again each time it comes back.

Dimensions, weights and prices beside a model are `--font-mono` with tabular
figures: they change as the visitor configures, and they are compared.

### Space

| Token | Value | Where |
|---|---|---|
| `--gap-section` | `clamp(4rem, 10vw, 8rem)` | Between sections, and the stage's own block padding |
| `--gap-block` | `2rem` | Between blocks; the gutter between the text lane and the scene |
| `--gap-item` | `1rem` | Between options, between view buttons and the frame edge |
| `--gap-tight` | `0.5rem` | Swatch to label, between view buttons |
| `--pad-page` | `clamp(1.25rem, 5vw, 2.5rem)` | Horizontal page padding |

Content max-width **1280px**. The scene may run to the viewport edge; text
never does.

### The scene frame

| Token | Value | Why |
|---|---|---|
| `--scene-ratio` | `4 / 3` | Reserved on the frame before the image or the engine arrives, so neither moves the page when it lands. Change it per model; never leave it out. |
| `--stage-h` | `min(100svh, 56rem)` | A full-height stage, in `svh` so a phone's collapsing address bar does not resize the canvas - and with it the render target - on every scroll. |
| `--target` | `44px` | View buttons, options, the load button, hotspots. |

### Radii

```
8px     inputs, small controls
12px    buttons, option rows
20px    plates, the scene frame
999px   view buttons, swatches, the load button
```

### Elevation

On the stage there are no shadows; core's `01-tokens.md` explains why they have
nothing to darken. The three steps do the work: `--stage` behind, `--stage-2`
for anything floating, `--stage-3` for what is hovered or selected.

On the page there is one shadow, for a card that has to lift:

```css
--shadow-page: 0 12px 32px -12px rgba(15, 18, 24, 0.18);
```

A drop shadow under the 3D model is not elevation and is not in this file. It
is part of the scene's lighting - a contact shadow baked into the model's
ground plane or a single shadow-casting light - and its cost is in
`03-budget.md`.

### Motion

There are two kinds of movement on these pages, and only one of them has a
duration.

**Movement the visitor is producing** - dragging the model, scrolling a
chaptered stage - has no duration. The only tunable is damping, the short glide
after the finger lifts, and it is switched off under reduced motion.

**Movement the page produces** is HTML, and takes core's bands:

| Token | Duration | For |
|---|---|---|
| `--d-fast` | 150ms | Hover, focus, the selected option |
| `--d-state` | 250ms | A popover, a plate appearing |
| `--d-swap` | 400ms | The poster giving way to the canvas. Once per visit. |

A camera move between two named views is at most 600ms when it is animated at
all, and it is a cut under reduced motion. The reference mount cuts always: a
cut is never wrong, and a tween needs a render loop for its length.

### Focus

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}

.on-stage :focus-visible { outline-color: var(--accent-on-stage); }
```

The stage override is the per-surface accent rule doing its job. The page
accent is 3.46:1 against `--stage` and 2.76:1 against `--stage-3`: a ring that
just passes on the bare stage fails on the selected option, which is precisely
where a keyboard user's focus spends its time.

## The scene - whether to build it, and how to stage it

### Three questions, before anything is modelled

Ask them in this order. Each has an answer that ends the conversation, and
ending it here costs nothing.

**1. What can the visitor do to it?**

Name the verb. *Turn it. Open it. Change its colour. Take it apart. Walk
round it.* If the honest answer is "watch it", the scene is a recording and
should be shipped as one.

**2. Could a camera have recorded that?**

A fixed path - the product rising into view, a slow orbit, a fly-through of an
office - is a video. It will look better as one, because a video can be
rendered offline with lighting no phone can compute, and it weighs less than
the engine it replaces. Real time is for the cases where the path is the
visitor's: there are too many angles, options or combinations to pre-render.

**3. What does the visitor know afterwards that a photograph would not have
told them?**

*How thick it is. What the back looks like. How the hinge folds. Where the
valve sits behind the ventricle.* If nothing, the scene is atmosphere. That is
allowed - but it is then competing with a photograph on cost, and it loses.

| Answers | Build |
|---|---|
| A verb, not recordable, and something learned | Real-time scene. This pack. |
| A verb, but only one axis - "see it from every side" | An image sequence the visitor scrubs. 36 frames, no engine. |
| No verb | Video, with a poster. Or a still. |
| A verb, but only "see it in my room" | `<model-viewer>` with AR. Its whole job, and it needs no scene code. |

### What a scene is for, on each kind of page

This pack covers three kinds of page. The scene earns its place differently on
each, and is wrong differently on each.

#### A product page - review, showcase, configurator

The strongest case, because the scene answers what a buyer actually asks: what
is on the other side, how big is it, what does the other colour look like. A
controlled test by a fashion retailer across 400,000 visitors reported a 6.3%
lift in conversion from leading with 3D instead of photographs - and that
result was published by the company that supplied the viewer. Treat it as the
ceiling of what is evidenced; figures of 35% and above have no method behind
them.

- The scene shows **the product and nothing else**. No environment, no props,
  no floating particles. The object is the content.
- **Every option is a form control beside the scene**, and choosing one
  changes the model. The price and the specification update as text.
- **Photographs stay.** A render does not show texture, wear or scale against a
  hand. The scene is one item in the gallery, not a replacement for it.
- A **review** page needs one thing a shop page does not: named views that
  match the review's argument. "The port is on the wrong side" should be a
  button that turns the model to that port.

#### A company or studio site

The weakest commercial case and the commonest request. A visitor to a company
site wants to know what it does, whether it is credible and how to reach it,
and none of those is spatial.

- **One scene, in the hero, and it is the company's actual thing** - the
  product it makes, the building it designed, the part it machines. An
  abstract shape says only that the company bought a 3D hero.
- **The scene is beside the headline, never behind it.** See the lane rule in
  `01-surfaces.md`.
- Below the hero the page is an ordinary one, on the page surface: services,
  proof, contact. The scene does not follow the visitor down.
- A studio whose product *is* this kind of work is the exception that may put
  the scene first. Its visitors came to see it. Almost nobody else's did.

#### A course page

Split by one question: **is the subject spatial?**

If it is - anatomy, mechanics, architecture, chemistry, geography - the scene
is the lesson, and it is the best use of the technology on this list. A heart
that can be turned and opened teaches what four diagrams do not.

- The scene shows **one concept at a time**, with the parts named in HTML
  beside it and selectable from there.
- **Hotspots are the curriculum.** Each is a real button with a real label, in
  reading order.
- **The same facts are in the text.** A learner on a screen reader, or revising
  on a bus with the scene switched off, gets the same lesson.

If it is not - a course on writing, marketing, a programming language - there
is nothing to turn. The sales page for the best-known three.js course is
itself mostly HTML: 3,054 words and an `<h1>` before any script runs, with the
3D as an accent. If the course about 3D sells itself in text, a course about
copywriting does not need a rotating laptop.

### Staging: lanes

The scene and the words get separate space. This is the default layout and it
needs a reason to be anything else.

```html
<section class="stage on-stage">
  <div class="stage-text">
    <h1>The Kestrel chair, rebuilt from the frame out</h1>
    <p>Eight zones of tension in the back, and none of them is foam.</p>
    <a class="btn btn-primary" href="/buy">Configure yours</a>
  </div>

  <figure class="scene" data-state="poster">
    <img class="scene-poster" src="aeron-hero.avif" width="1200" height="900"
         alt="Kestrel chair in graphite, seen from the front left" fetchpriority="high">
    <canvas class="scene-canvas" role="img"
            aria-label="Kestrel chair, 3D view. Use the view buttons to turn it."></canvas>
    <div class="scene-progress" aria-hidden="true"></div>
    <button class="scene-load" type="button">View in 3D</button>
    <div class="scene-views" role="group" aria-label="View">
      <button type="button" data-view="front" aria-pressed="false">Front</button>
      <button type="button" data-view="side" aria-pressed="false">Side</button>
      <button type="button" data-view="back" aria-pressed="false">Back</button>
    </div>
  </figure>
</section>
```

Three things in that markup are load-bearing:

- **The image is a real `<img>` with dimensions and `fetchpriority="high"`.**
  It is the largest thing on the first screen, so it is what the browser times
  as the largest paint. The canvas arrives later and is never that element.
- **The text comes first in the source.** On a phone the lanes stack, and the
  headline has to be above the scene - a scene on top pushes the one sentence a
  stranger needs off the screen.
- **The frame has a state, and starts in `poster`.** Everything the visitor
  sees is driven from that attribute; see below.

`assets/scene.css` has the grid. Text lane `minmax(20rem, 28rem)`, scene lane
the rest, one column under 800px.

### The frame has four states

| `data-state` | The visitor sees | The page is |
|---|---|---|
| `poster` | The image, and a "View in 3D" button | Complete. This is the page. |
| `loading` | The image, and a 2px progress line on the frame's bottom edge | Complete, and still usable |
| `ready` | The canvas, cross-faded in over 400ms; the view bar | Complete, plus the scene |
| `failed` | The image. No button, no message. | Complete |

**`failed` shows no error.** The visitor was not promised a scene; they were
shown a product. A banner announcing that WebGL could not start explains a
problem they did not know they had, in words they cannot act on.

**Progress belongs to the frame.** Core's `08-feedback.md` picks the waiting
affordance by the clock; here the wait is seconds and the thing behind it is
already visible, so the affordance is a determinate line on the frame and
nothing over the page. A full-screen counter holds the headline hostage to the
model.

**The poster is a render of the scene's opening frame** - same camera, same
lighting, same crop. Then the swap is a cross-fade the eye reads as the picture
coming alive. A studio photograph as the poster makes the swap a jump cut to a
different object.

### Which scene mounts itself

- **The hero scene** mounts on its own, once the frame is near the viewport and
  the browser is idle. One per page.
- **Every other scene** waits for its button. A gallery of six products is six
  images and six buttons, and one engine on the first press.
- **Neither mounts** when the visitor has asked for reduced data, or the
  browser has no WebGL 2. Then the button is removed, because offering what
  cannot be delivered is worse than not offering it.

`03-budget.md` has the loading order behind this.

### Staging: chapters, not a scrub

A scene that changes as the page scrolls is the signature of this style, and
there are two ways to build it.

**A scrub** maps scroll position continuously onto a camera path. It draws a
frame for every scroll event, it needs the whole path authored, and it has no
meaning under reduced motion except "off".

**Chapters** keep the scene pinned while sections of text scroll past it, and
re-stage it once as each section arrives. This is the default here.

```html
<section class="stage stage--chapters on-stage">
  <figure class="scene" data-state="poster">…</figure>

  <div class="stage-text">
    <article class="chapter" data-view="front">
      <h2>The frame</h2>
      <p>Glass-filled nylon, in one piece.</p>
    </article>
    <article class="chapter" data-view="side">
      <h2>The tilt</h2>
      <p>The pivot sits at the hip, not under the seat.</p>
    </article>
  </div>
</section>
```

```js
const chapters = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) handle.view(e.target.dataset.view);   // one draw per chapter
  }
}, { rootMargin: '-45% 0px -45% 0px' });                        // fires at the viewport's middle

document.querySelectorAll('.chapter').forEach((c) => chapters.observe(c));
```

Why chapters win as a default:

- **They map onto headings the page already has.** Each chapter is an
  `<h2>` and a paragraph. With the scene deleted it is still an article.
- **They cost one frame per chapter**, not one per scroll event, so the
  render-on-demand rule survives.
- **They degrade without a decision.** Under reduced motion each re-stage is
  already a cut.
- **Native scroll is untouched.** Keyboard paging, find-in-page and anchor
  links keep working, because nothing has replaced the scrollbar.

A scrub is permitted when the continuous motion is the point - an exploded
view opening as the visitor scrolls - and then only on native scroll, with the
chaptered version as its reduced-motion form.

### Hotspots

A point on the model with something to say about it.

```html
<button class="hotspot" type="button" aria-expanded="false" aria-controls="spot-pivot">
  Tilt pivot
</button>
<div class="plate" id="spot-pivot" hidden>
  <p>Sits at the hip, so the seat and back move at different rates.</p>
</div>
```

- **A hotspot is an HTML button** positioned over the canvas each time a frame
  is drawn. Not a sprite in the scene picked by a raycast, which a keyboard
  cannot reach and a screen reader cannot see.
- **It has a visible text label**, not a bare pulsing dot. A dot says something
  is here and not what.
- **It hides when the point it marks faces away.** A label floating over the
  wrong side of the model is a lie about where the part is.
- **Its popover is a plate.** It opens over the render, so it is opaque.
- **Five at most on screen at once.** Past that they collide, and the scene has
  become a diagram that should have been drawn as one.

### Components this pack does not have

- **A preloader.** The poster is the loading state.
- **Scene-rendered text.** Headings, labels and prices are HTML.
- **A custom cursor.** It replaces a pointer the visitor's system and
  accessibility settings control, and does nothing on touch.
- **A sound toggle.** A page that needs one has autoplaying sound.
- **A "best viewed on desktop" notice.** If the phone cannot run the scene, the
  phone gets the poster, and the page must be good in that state.

## Budget - bytes, frames, loading and the device

Core's `10-visual-language.md` says a 3D scene needs a frame budget chosen from
the target device and agreed before modelling. This file is that budget, with
numbers, and the order things load in.

It is the file to open before the model is commissioned. Most of what is here
cannot be recovered afterwards: a 400,000-triangle model with fourteen
materials is not optimised in the browser, it is rebuilt.

### Two budgets, and they never mix

There is the page, and there is the scene. The page's budget is spent before
the scene is requested, and the scene's bytes are never allowed into it.

| | Budget | Loaded |
|---|---|---|
| **The page** - HTML, CSS, one font, the poster, the mount's entry point | under 350KB | Immediately |
| Poster image | under 150KB, AVIF or WebP | Immediately, `fetchpriority="high"` |
| Script on the critical path | under 30KB compressed | Deferred |
| **The scene** - engine, loaders, decoders, model | under 3MB | After first paint, when wanted |
| Engine, loader and controls | under 250KB compressed | Lazy |
| Decoders | 7KB by default; anything heavier is a line in the brief | Lazy, only what the model needs |
| The model | under 2MB | Lazy |

| Moment | Budget |
|---|---|
| Largest paint - the poster or the headline | under 2.5s on a mid-range phone on 4G |
| Layout shift when the canvas arrives | zero - the frame reserved its box |
| Mount started to `ready` | under 4s on the same phone. Past that, the scene should have waited for the button. |
| One frame | 16ms, and no frames at all while nothing changes |

#### Where these numbers come from

Stated plainly, because a budget whose origin nobody remembers gets argued
down the first time it is inconvenient.

**Measured.** `assets/scene-mount.js`, bundled and minified against three.js
r186:

| Chunk | Compressed |
|---|---|
| The entry point - everything on the critical path | 2KB |
| three.js core, as used by the mount | 188KB |
| `GLTFLoader` | 13KB |
| `OrbitControls` and the generated environment | 5KB |
| Meshopt decoder | 7KB |
| **The default mount, total** | **213KB** |
| Optional: Draco - its loader, decoder and wrapper | 101KB |
| Optional: KTX2 - its loader and the Basis transcoder | 281KB |

So the 250KB engine line is not a target to engineer towards - it is what a
minimal viewer costs, with 37KB to spare. A page over it has added something:
post-processing, physics, a second loader, a framework on top.

**Run, once, in one browser.** The same mount was driven in desktop Chrome with
a software renderer and a generated cube: it drew zero frames while idle, one
per view change, stopped drawing after a drag settled, left the wheel to the
page, rendered a 3x phone viewport at 1.5x, and went to the poster and back
across a forced context loss. It has not been run on a physical phone, in
Safari or in Firefox.

**Measured, on other people's sites.** Five public pages running a real-time
scene sent between 224KB and 1.3MB of compressed script on the first request,
counting only what the HTML references directly. The two heaviest were also the
two where the scene is the entire product.

**Chosen.** The model, triangle, draw-call and texture figures below are
starting values for a mid-range phone, not measurements of one. Replace them
with numbers from the cheapest device that matters in your own analytics, and
keep whichever is lower.

### The model

Agree these with whoever is building it, in writing, before they start.

| | Phone | Desktop |
|---|---|---|
| Triangles | 100,000 | 300,000 |
| Draw calls | 50 | 100 |
| Materials | 10 | 10 |
| Texture size | 1024px | 2048px |
| Textures | 8 | 8 |
| Shadow-casting lights | 1, or a baked contact shadow | 1 |
| Post-processing passes | 0 | 0, unless named in the brief |

**Draw calls, not triangles, are usually what is over.** A model exported
straight from a CAD or modelling tool has one mesh per part and one material
per mesh: three hundred draw calls for a chair. Merging meshes that share a
material is the largest single win available, and it is done in the modelling
tool or with a glTF optimiser, not in the browser.

**Do not estimate these. Read them.**

```js
const { render, memory } = renderer.info;
console.table({
  drawCalls: render.calls,
  triangles: render.triangles,
  geometries: memory.geometries,
  textures: memory.textures,
});
```

Print that after the first frame and put the output in the pull request. A
budget nobody measured is a wish.

### Compression is two separate decisions

Geometry and textures compress differently and cost differently to decode.
Deciding them together is how a 300KB model ends up behind 380KB of decoders.

#### Geometry

| Format | Decoder cost | Use when |
|---|---|---|
| Meshopt | 7KB | The default. Good ratios, and the decoder is nearly free. |
| Draco | 101KB | The model is geometry-heavy enough that Draco's better ratio saves more than its decoder costs - roughly, several megabytes of raw mesh. |
| None | 0 | The model is under about 200KB of geometry. The decoder would outweigh the saving. |

#### Textures

The file size of a texture and its cost on the device are unrelated numbers,
and the second is the one that loses a phone its WebGL context.

A JPEG, WebP or AVIF texture is small on the wire and is then decoded to raw
pixels in GPU memory. One 2048px texture is 2048 x 2048 x 4 bytes: 16MB, and
22MB with its mipmaps, whatever the file weighed. Eight of them is 180MB.

KTX2 textures stay compressed on the GPU, at roughly a quarter of that.

| Format | Decoder cost | GPU memory, one 2048px texture | Use when |
|---|---|---|---|
| WebP in the glTF | 0 | about 22MB | Up to two or three textures at 1024-2048px. Most single-product scenes. |
| KTX2 | 281KB | about 5.6MB | Many textures, or large ones. The transcoder is heavier than the entire engine, so it has to be buying memory, not bytes. |

**Halving a texture's size quarters its memory.** Before reaching for KTX2,
check whether the roughness map really needs to be 2048px. It almost never
does.

**Self-host the decoders.** The loaders' examples point at a third-party CDN.
That is a second origin to connect to in the middle of the scene's load, and a
script from someone else running in the page.

### Loading order

```
1  HTML, CSS, poster          first paint. The page is complete.
2  (idle, frame near screen)  import the engine          213KB
3  in parallel                decoder, if any  +  the model
4  first frame drawn          data-state = "ready", cross-fade
```

- **The poster is the only thing given priority.** Do not `preload` the model
  or the engine in the `<head>`: they would compete with the image that
  defines the largest paint, for the benefit of something the visitor may
  never scroll to.
- **The engine is a dynamic `import()`**, so a bundler splits it into its own
  chunk without being asked. A static `import * as THREE from 'three'` at the
  top of the page's main script puts 188KB in front of the headline.
- **The canvas is revealed after its first frame, not before.** Otherwise the
  poster fades out to an empty stage and the model pops in a moment later.

```js
import { mountWhenWanted } from './scene-mount.js';        // 2KB. The engine is not in it.

for (const frame of document.querySelectorAll('.scene')) {
  const bar = frame.querySelector('.scene-progress');
  mountWhenWanted(frame, {
    src: frame.dataset.model,
    auto: frame.hasAttribute('data-hero'),                 // one per page
    onProgress: (p) => bar && bar.style.setProperty('--scene-progress', p),
  });
}
```

### Pixel ratio

```js
const cap = matchMedia('(pointer: coarse)').matches ? 1.5 : 2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
```

The cost of a frame scales with the number of pixels shaded, and that scales
with the square of the ratio. A phone reporting 3 draws nine times the pixels
of a ratio of 1; capped at 1.5 it draws 2.25 times. Nobody can see the
difference on a model that is being turned, and everybody can feel 30 frames a
second.

Two of the surveyed sites cap it in code that could be read - one at exactly 2,
one between a configurable minimum and maximum.

**If the first interaction is still slow, lower the ratio before lowering
anything else.** Measure a handful of frames while the visitor drags; if they
average over 20ms, drop the ratio by a quarter and resize once. It is the only
quality setting that can be changed after load without re-downloading anything.

### Render on demand

There is no animation loop in this pack's mount. A frame is requested when the
controls report a change, and the controls keep reporting changes while damping
is still settling.

```js
let queued = false;

function draw() {
  queued = false;
  controls.update();                    // fires 'change' again while damping
  renderer.render(scene, camera);
}

function invalidate() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(draw);
}

controls.addEventListener('change', invalidate);
```

Everything that alters the picture calls `invalidate()`: a resize, a colour
change, a new view, a texture finishing its load. Nothing else draws.

The alternative - `renderer.setAnimationLoop(render)` - is what every tutorial
starts with, and it redraws an unchanged image sixty times a second for as long
as the tab is open. On a product page that is the visitor's battery spent on a
photograph.

The price is that **nothing in the scene may animate on its own**: no idle
rotation, no floating, no shimmering material. This pack was not going to allow
those anyway.

### The power hint

```js
new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
```

Three of the surveyed sites request `'high-performance'`. On a laptop with two
GPUs that wakes the discrete one for the life of the tab. For a game it is the
right call; for one chair on a product page it is a fan spinning up.

### When the context is lost

A phone takes the WebGL context away when memory is tight or the browser has
been in the background. It is routine, not exceptional, and reports of it on
iOS go back years.

```js
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();                   // without this the context is never restored
  frame.dataset.state = 'poster';       // the page had an image all along
});

canvas.addEventListener('webglcontextrestored', () => {
  frame.dataset.state = 'ready';
  invalidate();
});
```

The poster is still in the DOM under the canvas, so falling back is one
attribute. A page with no poster shows a black rectangle here, and its visitor
concludes the site is broken.

Staying inside the texture budget above is what keeps this from happening in
the first place.

### Leaving

three.js frees nothing when an object goes out of scope. Geometries, materials,
textures and the renderer itself each hold GPU memory until `dispose()` is
called on them.

On a multi-page site this does not matter: navigation destroys the page. In a
single-page app it matters on every route change, and the failure is slow -
the fifth product viewed is the one that loses the context.

```js
const handle = await mountScene(frame, { src });
// …on route change:
handle.dispose();
```

`assets/scene-mount.js` has the full walk: every geometry, every material,
every texture on every material, the environment, any decoder workers, the
controls, then the renderer.

### The same rules in other libraries

The budget does not change with the wrapper. Its weight does.

| | Plain three.js | React Three Fiber | `<model-viewer>` |
|---|---|---|---|
| Cost before a model | 213KB, measured | three.js plus React and the reconciler | 141KB as a module beside an existing three.js; 284KB standalone |
| Render on demand | The `invalidate` pattern above | `<Canvas frameloop="demand">` and `invalidate()` | Built in |
| Pixel ratio cap | `setPixelRatio(Math.min(dpr, cap))` | `<Canvas dpr={[1, 2]}>` | Built in |
| Lazy load | Dynamic `import()` | `React.lazy` around the canvas component | `loading="lazy"` |
| Poster | An `<img>` under the canvas | The same `<img>`, outside `<Canvas>` | `poster="…"` |
| Wait for the button | `mountWhenWanted(frame)` | Render the canvas on click | `reveal="manual"` and `dismissPoster()` |
| Keep the scroll | `touchAction = 'pan-y'`, zoom off | The same, on drei's `OrbitControls` | `touch-action="pan-y"`, `disable-zoom` |

**`<model-viewer>` is the right answer more often than it is chosen.** A page
that needs "turn it, and see it in my room" needs no scene code at all, and
gets the poster, lazy loading, the pixel-ratio cap and AR by writing
attributes.

**React Three Fiber belongs in a React site with real scene state** - a
configurator whose options live in the same store as the cart. It does not
belong on a static page, where it brings React along to turn a model.

### WebGPU

`WebGPURenderer` falls back to WebGL 2 where WebGPU is unavailable. That does
not make it the default here.

A product viewer is one model, a few materials and an orbit. It is nowhere near
the workloads the newer renderer exists for - compute shaders, hundreds of
thousands of instances, clustered lighting - and adopting it means two code
paths to test on every device. The three.js manual still recommends the WebGL
renderer for applications that only need WebGL 2.

Reach for it when the brief names something only it can do. Then it is a
feature with a cost, like any other, and the fallback path gets tested first.

### Measure on the phone

A development laptop with a discrete GPU will run anything. Test on a
mid-range Android phone, on a throttled connection, after the phone has been in
use for ten minutes - a cold device flatters every number in this file, because
a hot one has already slowed its processor down.

## Access - keyboard, touch, reduced motion and failure

A `<canvas>` is one opaque rectangle to everything that is not a pair of eyes
and a pointer. It has no text, no structure, no focus order and no states.
Whatever the scene lets a sighted visitor with a mouse find out, somebody else
has to be able to find out another way.

Core's `10-visual-language.md` requires that path. This file is the form it
takes here, and the three inputs that most often break it.

### The scene shows four things. Each has a home in HTML.

| The scene conveys | A visitor who cannot see or drag it gets | Where |
|---|---|---|
| **What it looks like** | A described poster image, and the photographs | The `alt` on the poster; the gallery |
| **Size and proportion** | Dimensions, as figures with units | A `<dl>` or table beside the scene |
| **Options and their effect** | The option names, the current choice, and what it changed | Form controls, and a live summary |
| **Parts and where they are** | The parts, named, in order, each with its explanation | Hotspot buttons, or a list |

Run down the left column for the scene being built. Anything it conveys that
the right column does not deliver is the gap.

### The canvas itself

```html
<canvas class="scene-canvas" role="img"
        aria-label="Kestrel chair, 3D view. Use the view buttons to turn it."></canvas>
```

- **`role="img"` and a label that says what it is and how to operate it.**
  Without a role a canvas is skipped silently, and its neighbours - a row of
  unexplained "Front / Side / Back" buttons - make no sense.
- **Not in the tab order.** The canvas takes no `tabindex`. A focus stop that
  accepts no keys is a dead end; the view bar beneath it is the keyboard's
  handle on the scene.
- **The label does not narrate.** State changes are announced by the summary
  below, not by rewriting the label, which most screen readers will not
  re-read.

### Options are a form

A configurator is a form whose preview happens to be 3D. Build the form.

```html
<form class="plate">
  <fieldset class="options">
    <legend>Frame colour</legend>

    <label class="option">
      <input type="radio" name="frame" value="graphite" checked>
      <span class="option-swatch" style="--swatch: var(--stage-3)"></span>
      Graphite
    </label>

    <label class="option">
      <input type="radio" name="frame" value="mineral">
      <span class="option-swatch" style="--swatch: var(--stage-text-2)"></span>
      Mineral
    </label>
  </fieldset>

  <p class="summary" role="status">Graphite frame. 18.4 kg.</p>
</form>
```

```js
form.addEventListener('change', () => {
  const choice = new FormData(form).get('frame');
  handle.set((model) => applyFrameColour(model, choice));   // one redraw
  summary.textContent = describe(choice);                    // announced, politely
});
```

- **Radio buttons, in a `fieldset`, with a `legend`.** Arrow keys move between
  them, the group is announced with its name, and the form still submits with
  the scene deleted.
- **The swatch is beside a name, never instead of one.** Two greys on a dark
  stage are indistinguishable to plenty of people who can see them. Core's
  rule on colour as the only signal applies to a colour picker more literally
  than to anything else.
- **The summary is a status region.** It is the one place the scene's state
  exists as text, and it changes when the scene does. Keep it to the choice and
  what the choice altered: weight, price, lead time.
- **Options never live in the scene.** A colour chip floating beside the model
  and picked by a raycast is a control with no name, no focus and no state.

### Every view is a button

```html
<div class="scene-views" role="group" aria-label="View">
  <button type="button" data-view="front" aria-pressed="true">Front</button>
  <button type="button" data-view="side" aria-pressed="false">Side</button>
  <button type="button" data-view="back" aria-pressed="false">Back</button>
</div>
```

```js
views.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-view]');
  if (!button) return;
  handle.view(button.dataset.view);
  for (const b of views.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String(b === button));
  }
});
```

Dragging is a path-based gesture, and a visitor who cannot perform one - on a
keyboard, a switch, a head pointer, or with a tremor - needs a single press
that reaches the same result. The view bar is that, and it is not a
concession: on a phone it is faster than dragging, and on a review page it is
how the text points at the model.

**The set of views is the set of things worth seeing.** If the back has the
ports, there is a Back button. If the visitor can open the lid by dragging,
there is an Open button.

### Touch: the page owns vertical

This is the failure that makes visitors leave, and it ships by default.

Orbit controls set `touch-action: none` on their canvas so that a drag rotates
the model. The side effect is that the canvas no longer scrolls the page. On a
phone the scene is the full width of the screen, so a thumb that lands on it
while scrolling moves the model and not the page - and if the scene is the full
height too, there is nowhere else to put the thumb.

```js
const controls = new OrbitControls(camera, canvas);
canvas.style.touchAction = 'pan-y';    // after construction: the controls just set 'none'
controls.enableZoom = false;           // or the wheel and the pinch are taken too
controls.enablePan = false;
```

| Gesture | Belongs to | Because |
|---|---|---|
| Vertical drag | The page | It is how the visitor leaves the scene |
| Horizontal drag | The scene | It turns the model, and the page has no use for it |
| Wheel, two-finger trackpad scroll | The page | With zoom on, the scene swallows the scroll of everyone passing through |
| Pinch | The browser | It is how someone with low vision enlarges the page. Never disable it. |
| Zoom into the model | Two buttons, or a "Closer" view | Explicit, reachable, and it traps nothing |

Turning a model only left and right loses less than it sounds: the views that
need a vertical angle - top, underneath - are in the view bar.

**A full-screen mode is the honest way to give every gesture to the scene.**
One button, a dialog holding the canvas, focus moved in, Escape and a visible
Close to leave. Inside it, vertical drag and pinch can orbit and zoom, because
the visitor chose to stop scrolling.

**One hint, once, in words.** "Drag to turn" as a caption on the frame,
removed after the first drag. Not an animated hand looping over the model:
that is autoplay, and it never stops for the visitor who is not going to drag.

### Reduced motion

Of the five real-time sites surveyed, a reduced-motion check was found on two.
On a third it appeared only inside a confetti library. On the remaining two,
none was found anywhere in the HTML, the scripts or the stylesheets the page
references.

Core's `04-motion.md` says what the preference means. Applied to a scene:

| With the preference set | |
|---|---|
| Dragging still turns the model | It is the visitor's own movement, at the visitor's own speed |
| Damping is off | The glide after release is motion nobody asked for |
| A view button cuts | No camera travel |
| A chaptered stage cuts at each chapter | It already does |
| A scrub falls back to chapters | Continuous camera travel tied to scroll is the textbook trigger |
| The poster-to-canvas swap is instant | |
| No entrance move | The scene appears in its resting pose |

```js
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

controls.enableDamping = !REDUCED.matches;
REDUCED.addEventListener('change', () => { controls.enableDamping = !REDUCED.matches; });
```

Listen for the change as well as reading it. The setting is often switched on
mid-visit, by someone who has just started to feel unwell.

**The CSS guard does not reach the canvas.** Core's global reduced-motion rule
shortens CSS transitions and animations. Camera movement is JavaScript writing
numbers into a matrix, and it will carry on exactly as before unless the scene
code checks the preference itself.

### When there is no scene

Not an edge case. Each row below is an ordinary visit.

| Situation | What happens | The visitor sees |
|---|---|---|
| Script failed or is blocked | Nothing mounts | The poster and the whole page |
| No WebGL 2 | `canMount()` is false; the button is removed | The poster |
| Reduced-data preference | The same | The poster |
| The model 404s or a decoder is blocked | State becomes `failed` | The poster |
| The context is lost mid-visit | State returns to `poster` until restored | The poster, then the scene again |
| A crawler | Reads the HTML | Everything that matters |

Every row ends in the same place, which is the reason to build the page first.
There is one fallback, it is the page, and it was reviewed before the scene
existed.

**A hidden "Load 3D" button must be hidden from everyone.** Use the `hidden`
attribute, not a class that only sets `opacity`. A button a screen reader can
still find, that does nothing, is worse than no button.

### Four passes before calling it done

1. **Keyboard only.** Tab through the page. Reach every option and every view;
   confirm focus is always visible on the stage; confirm nothing was reachable
   only by dragging.
2. **Reduced motion on.** Load, change view, scroll a chaptered stage. Nothing
   should travel.
3. **Script off.** The page should be a good page with a picture on it.
4. **A phone, one thumb.** Scroll from the top to the footer without lifting
   off the scene. If the page stops, the scene took the scroll.

## Domain review checklist

Run **`core/99-review.md` first** - tokens, type, layout, state, feedback,
input, accessibility, motion. Nothing there is waived by this domain, and its
visual-language section holds the three questions every 3D scene is asked
before any of the ones below.

This file is what a page built around a scene needs on top.

### Checklist

#### Before there is a scene
- [ ] The three questions in `02-scene.md` have written answers: the verb, why
      it could not be recorded, what the visitor learns.
- [ ] The answer was not "watch it". If it was, this is a video.
- [ ] The page was built and reviewed with the poster in place, before the
      scene was mounted.
- [ ] There is one scene on the page.

#### The page without the scene
- [ ] With script disabled: headline, what it is, the facts, the price and the
      primary action are all present and working.
- [ ] The poster is a real `<img>` with `width`, `height`, `alt` and
      `fetchpriority="high"`.
- [ ] The poster is a render of the scene's opening frame, not a different
      photograph.
- [ ] The frame reserves its box with `aspect-ratio`; nothing moves when the
      image or the canvas arrives.
- [ ] No text, label, price or navigation is drawn by the renderer.

#### Staging
- [ ] Text is in its own lane or on an opaque plate. Nothing is set directly on
      the render, and no plate is translucent or blurred.
- [ ] On a phone the headline is above the scene.
- [ ] The stage surface is used for the scene's section only; long-form content
      is on the page surface.
- [ ] A scroll-driven scene uses chapters on native scroll. No scroll-jacking,
      no smooth-scroll library owning the page.
- [ ] Buttons on the stage use the stage accent with the dark label.

#### Loading
- [ ] The engine is a dynamic import. Nothing from three.js is in the page's
      main bundle.
- [ ] Only the hero scene mounts itself; every other scene waits for its
      button.
- [ ] Neither the model nor the engine is preloaded in the `<head>`.
- [ ] Progress is a line on the scene frame. There is no full-screen loader.
- [ ] The canvas is revealed after its first frame has been drawn.
- [ ] Decoders are self-hosted, and only the ones the model needs are loaded.

#### Budget
- [ ] Critical path under 350KB; script on it under 30KB.
- [ ] Engine, loader and controls under 250KB compressed.
- [ ] Model under 2MB. Triangles, draw calls and texture count read from
      `renderer.info`, not estimated, and within `03-budget.md`.
- [ ] Texture format chosen by GPU memory, not file size; no 4096px textures.
- [ ] Pixel ratio capped at 2, and 1.5 on a coarse pointer.
- [ ] No animation loop. Frames are drawn on change only.
- [ ] `powerPreference` is not `'high-performance'`.
- [ ] Measured on a warm mid-range phone on a throttled connection.

#### Input
- [ ] A thumb can scroll from the top of the page to the footer without lifting
      off the scene.
- [ ] `touch-action: pan-y` is set on the canvas after the controls are
      constructed.
- [ ] Wheel zoom is off outside full-screen mode. Pinch-zoom of the page works.
- [ ] Every view a drag can reach is a button in the view bar.
- [ ] Every option is a form control outside the canvas, with a text label
      beside any swatch.
- [ ] Hotspots are HTML buttons with visible labels, in reading order, and hide
      when their point faces away.
- [ ] All of the above are at least 44px.

#### Access
- [ ] The canvas has `role="img"` and a label naming the object and how to
      operate it. It has no `tabindex`.
- [ ] Scene state exists as text in a status region and updates with the scene.
- [ ] Dimensions and specifications the scene shows are also written beside it.
- [ ] With reduced motion: damping off, views cut, no entrance move, no scrub.
      The scene code checks the preference itself.
- [ ] Focus is visible on the stage, including on a selected option.

#### Failure
- [ ] No WebGL, reduced data, a failed model and a lost context all end on the
      poster, with no error message.
- [ ] `webglcontextlost` calls `preventDefault()`, and the scene returns on
      restore.
- [ ] The load button is removed with `hidden` when the scene cannot mount.
- [ ] In a single-page app, leaving the route calls `dispose()`.

### Failure modes specific to this domain

**The six-word page.** Everything is in the canvas, and the HTML is a title and
a script tag. It is invisible to search, unreadable aloud, and blank for
anyone whose script failed. It also cannot be fixed late: the copy has to be
moved out of the scene one string at a time.

**The scroll trap.** A full-width scene on a phone, with the controls'
defaults. The thumb turns the model and the page does not move. Visitors read
it as the site being frozen.

**The preloader that holds the headline.** A counter climbs to 100 over a
blank stage while four megabytes arrive. The visitor does not yet know what the
site is, and has been asked to wait to find out.

**The loop that never idles.** `setAnimationLoop` left running for a model
nobody is touching. The phone gets warm, the battery graph gets steep, and
nothing on screen has changed.

**The 3x canvas.** No pixel-ratio cap. The scene runs at sixty frames on the
designer's laptop and twenty on the phone it was made for.

**The poster that is a different picture.** A studio photograph stands in for
the scene, then cuts to a render at another angle under other lighting. It
reads as a glitch, every time, on every visit.

**The headline on the highlight.** White text over the model, legible in the
mock because the model was dark where the text sat. Then the visitor turns it.

**The model from the modelling tool.** One mesh and one material per part,
4096px textures, forty megabytes. It was approved in a viewer on a
workstation.

**The transcoder heavier than the model.** KTX2 adopted for a scene with two
small textures: 281KB of decoder to save 200KB of images.

**The context that did not come back.** No `preventDefault()` on context loss
and no poster under the canvas. The visitor switches to another app, returns,
and finds a black rectangle where the product was.

**The swatch with no name.** Five circles of colour, picked by raycast inside
the scene. No label, no focus, no state; three of them indistinguishable on a
dark background.

**The leak on the fifth product.** A single-page shop that mounts a viewer per
product and disposes of none. It works in review, where nobody opens five.

**The scene that explains nothing.** An abstract form turning slowly beside a
company's name. It cost the whole budget and told the visitor only that the
company has a website.

### Refusals

`PACK.md` lists what this pack pushes back on - the percentage preloader, the
whole site in the canvas, a scene per section, scroll-jacking, auto-rotation,
real-time for a fixed fly-through, mouse-follow parallax, the unoptimised
model, WebGPU for its own sake, a 3D hero for a subject that is not spatial -
and what to offer instead. Name the cost, offer the alternative, then build
whatever is decided, and record the decision so nobody re-litigates it.

---

<!-- Generated by tools/build.mjs from core/ and packs/immersive-web/. Do not edit. -->
