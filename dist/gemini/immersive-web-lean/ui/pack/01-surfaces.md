# Surfaces, palette and scales

The concrete values. Core (`01-tokens`, `02-typography`, `04-motion`) holds the
method and the reasoning; this file holds what this domain picked.

## Surface assignment

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

## The token file

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

### The pairs, computed

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

## Colours inside the model

The token file is the interface's palette. A material's base colour - in a
`.glb` or in a function that builds the model - is product data, like a pixel
in a photograph, and stays with the model.

The exception is a finish the visitor chooses. It is drawn twice, as the swatch
beside its name and as the paint on the model, so it is one token that both
read. Typed in two places, the swatch and the product drift apart.

## Nothing in this table covers text on the render

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

## Type

One family and a monospace, as core has it. A scene is already the page's
voice; a display face beside it is a second voice.

```css
--font:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace;
```

Inter is named, not shipped. The stack falls through to the system face until
the project self-hosts one file - the "one font" in the page's budget in
`03-budget.md`. A link to a font CDN is a second origin on the critical path.

| Step | Size | Line height | Used for |
|---|---|---|---|
| `--t-hero` | `clamp(2.5rem, 4.5vw, 3.75rem)` | 1.0 | The one headline beside the scene |
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

The hero step is sized for that lane, not for the viewport. At 5rem a 28rem
column holds about ten characters, and a headline that names the product
breaks into a word a line.

Dimensions, weights and prices beside a model are `--font-mono` with tabular
figures: they change as the visitor configures, and they are compared.

## Space

| Token | Value | Where |
|---|---|---|
| `--gap-section` | `clamp(4rem, 10vw, 8rem)` | Between sections, and the stage's own block padding |
| `--gap-block` | `2rem` | Between blocks; the gutter between the text lane and the scene |
| `--gap-item` | `1rem` | Between options, between view buttons and the frame edge |
| `--gap-tight` | `0.5rem` | Swatch to label, between view buttons |
| `--pad-page` | `clamp(1.25rem, 5vw, 2.5rem)` | Horizontal page padding |
| `--header-h` | `4rem` | The floating header. The hero stage pads its top by this and one block, and its bottom by half a section: the full gap at both ends puts the view bar under the fold of a laptop |

Content max-width **1280px**. The scene may run to the viewport edge; text
never does. The stage's surface always does: `.stage` caps its content with
padding, not a `max-width`, or the stage colour stops at 1280px with the page
showing either side.

## The scene frame

| Token | Value | Why |
|---|---|---|
| `--scene-ratio` | `4 / 3` | Reserved on the frame before the image or the engine arrives, so neither moves the page when it lands. Change it per model; never leave it out. If it changes at a breakpoint, the mount widens the field of view in a frame narrower than the poster, so the canvas still shows what the poster showed. |
| `--stage-h` | `min(100svh, 56rem)` | A full-height stage, in `svh` so a phone's collapsing address bar does not resize the canvas - and with it the render target - on every scroll. |
| `--target` | `44px` | View buttons, options, the load button, hotspots. |
| `--stem` | `1.25rem` | How far a hotspot's pill stands off the point it names. |

## Radii

```
8px     inputs, small controls
12px    buttons, option rows
20px    plates, the scene frame
999px   view buttons, swatches, the load button
```

## Elevation

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

## Motion

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

## Focus

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
