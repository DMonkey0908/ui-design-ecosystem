# Research

Where the evidence for a rule comes from, and where to look before writing a
pack.

The bar in this repo is a **reason, not a preference** — ideally something
somebody watched break. That bar is easy to state and hard to meet at 11pm with
a half-written reference file, which is when a rule quietly becomes a taste.
This file is the shortlist that makes meeting it cheaper.

## What to look at, and what each one is good for

Ranked by how much a pack author can actually use them.

### Shipping products, as flows

**[Mobbin](https://mobbin.com)** — screenshots of real iOS, Android and web
apps, organised by *flow* rather than by screen: onboarding, checkout, search,
settings, empty states, permission prompts.

This is the one that matters, because it shows what shipped after the
constraints landed. A pack thesis is a claim about what a domain has to do; the
strongest way to test it is fifteen products in that domain, and whether they
agree with you.

Look at the unglamorous flows. Every product looks considered on its marketing
page and reveals itself at "you have no invoices yet", "your card expired", and
"this took eight seconds".

### Craft at the high end

**[Godly](https://godly.website)** and **[Land-book](https://land-book.com)** —
curated web design, heavy on typography, grid and WebGL.

Use these for *how far a treatment can be pushed*, not for what to build. They
are selected for distinctiveness, which is the right criterion for a portfolio
and the wrong one for a back-office tool that somebody sits in for eight hours.

**[Awwwards](https://www.awwwards.com)** and **[FWA](https://thefwa.com)** —
the same caveat, one notch further. Useful for seeing where interaction
technique is going. Do not source density, information hierarchy or form design
here.

### The industry systems

Read these for **structure and vocabulary**, not for values — their values
belong to their brand, and copying them is how a product ends up looking like a
Material template with a different accent.

| System | Best at |
|---|---|
| [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) | Input ergonomics per device class, stated as constraints rather than suggestions. The reference for anything touch, watch, TV or spatial. |
| [Material Design 3](https://m3.material.io) | Token architecture, elevation, motion specs. The most complete public worked example of a token system. |
| [Shopify Polaris](https://polaris.shopify.com) | Writing in interfaces. Error messages, empty states, button labels — the part most systems skip. |
| [Atlassian Design System](https://atlassian.design) | Dense, long-session product UI. Closest public relative of what `erp` is about. |
| [Untitled UI](https://www.untitledui.com) | Component coverage and naming, as a checklist against gaps. |

### What not to use

**Dribbble and Pinterest.** Not because the work is bad, but because the
selection pressure is wrong: a shot is optimised to be legible as a thumbnail
in a feed, with invented data, no empty state, no error state, no long strings,
no eleventh row. Sourcing an interface from them produces a design that has
never met a user or a database.

## Case studies worth reading properly

Four products where a specific decision is visible in the outcome. Each is
listed with the pack thesis it supports, because that is what a pack author
needs from it.

### Stripe — the customer is the integrator

The decision: in online payments, the person whose opinion decides the sale is
not the one typing a card number, it is the engineer integrating the API. So
developer experience *is* the product's user experience — documentation you can
execute in the browser, error codes that name the cause and link the fix rather
than apologising.

**Supports:** a developer-tools pack, and the general principle that a domain's
real user is sometimes not its end user. Also the best public example of error
messages written as though somebody has to act on them.

### Monzo and Revolut — friction, applied asymmetrically

The decision: strip friction out of the ninety-nine everyday actions with
silent biometric auth, and then deliberately **put it back** in front of the
irreversible ones. A transaction map with the merchant's own logo; balance
changes announced the moment they happen; Pots, which are a savings product
made comprehensible by being drawn as containers.

**Supports:** a fintech thesis that `consumer-web` would reject outright, since
that pack exists to remove friction. "Friction is a feature, applied
asymmetrically" is falsifiable, and another domain argues with it, which is
what a thesis has to be.

### Craft — block architecture with no perceptible latency

The decision: every unit of the document is a block that can be dragged,
nested and restructured without a visible delay, and the formatting controls
appear at the cursor rather than in a chrome bar. The editor never takes the
user's attention away from the text to ask for it back.

**Supports:** a writing-tool or document pack, and — for any pack — the
argument that contextual controls beat a permanent toolbar once the surface is
about content.

### Procreate Dreams — invent the interaction from the hardware

The decision: rather than shrink a desktop animation timeline onto a tablet,
work out what the hardware is actually good at. "Performing" records the
trajectory of a finger dragging an object in real time and turns it into
keyframes — an interaction that has no desktop equivalent because it needs
direct touch to exist.

**Supports:** every device-class pack, and the strongest available argument
against porting an interaction model across form factors. The lesson is not
"use gestures", it is: *ask what this hardware does that no other hardware
does, before deciding what the screen looks like.*

## A measured survey: real-time 3D on public pages

The evidence behind the `immersive-web` pack. Nineteen public pages were
fetched once, on 8 October 2026, the way a browser makes its first request;
the HTML was read before any script ran, and every script the HTML references
directly was downloaded, compressed and searched as text.

Five pages running a real-time scene, chosen across the three page types the
pack covers:

| Page | Kind | Words in the HTML | `<h1>` | Script, compressed | What was found |
|---|---|---|---|---|---|
| threejs-journey.com | Course sales | 3,054 | yes | 224KB | Three canvases as accents on an HTML page. Reduced motion checked only inside a confetti library. |
| human.biodigital.com | Anatomy application | 11 | no | 1,303KB | Own engine, WebGL 2 with a WebGPU probe. Pixel ratio clamped between a minimum and a maximum. Sets `aria-label` and `aria-describedby` on the canvas. Reduced motion checked. |
| lusion.co | Studio | 385 | yes | 490KB | three.js r158. A preloader with a percentage counter. Reads core count for device tiering. No reduced-motion check found. |
| bruno-simon.com | Portfolio, as a driving game | 566 | no | 1,154KB | three.js r183 on `WebGPURenderer`. Pixel ratio capped at 2. Draco and KTX2. No reduced-motion check found. |
| nothing.tech, Phone (3) | Product | 95 | yes | 407KB | `<model-viewer>` with a `.glb` from the CMS. No canvas in the HTML. Reduced motion checked. |

Four pages that mark the edges:

| Page | Words in the HTML | Script, compressed | Why it matters |
|---|---|---|---|
| apple.com, AirPods Max | 3,534 | 365KB | No canvas and no 3D engine: 3 `<video>` elements and 157 images. The product looks 3D and is not rendered. |
| polestar.com, Polestar 4 | 1,668 | 479KB | The same decision: 7 `<video>` elements, 105 images. |
| activetheory.net | 6 | 173KB | The `<noscript>` reads "Please enable javascript". |
| igloo.inc | 2 | 6KB | A title and a loader. |

The remaining ten - Sketchfab, GitHub, Stripe, modelviewer.dev, Utsubo, IKEA,
Porsche's configurator, Rivian, GANT and Fairphone - were measured the same way
and are not tabulated; they supported the pattern without adding to it.

**Where they agree.** Every page with something to sell kept its headline in
the HTML. Every team whose pixel-ratio handling could be read had capped it.
Nobody running an engine was anywhere near a normal page's script budget.

**Where they disagree, and the side the pack takes.** Whether the largest
product pages should be real time at all (Apple and Polestar say no; the pack
says only when the visitor steers). Whether the visitor waits for the scene
before seeing the page (Lusion says yes; the pack says never). Whether reduced
motion reaches the scene (three of five do not appear to; the pack requires
it).

**What this survey cannot say.** The script figure counts only files the HTML
references, so anything imported later is missing and every number is a floor.
"Not found" in minified code is weak evidence of absence. Nothing here measured
frame rate, memory or battery on a device - the pack's device budgets are
chosen starting values, and say so. One fetch on one day is a snapshot of
sites that redesign often.

A second measurement backs the pack's byte budget: its own reference mount,
bundled against three.js r186.1, is 2KB on the critical path and 213KB behind
it, with the optional Draco and KTX2 decoders adding 101KB and 281KB.

## Using this when writing a pack

1. **Find five products in the domain**, in Mobbin or in use. Not the famous
   one — five, including at least one that is unfashionable and well-used.
2. **Write down where they agree.** Agreement across five competitors is
   usually a constraint rather than a convention, and constraints are what a
   thesis is made of.
3. **Write down where they disagree, and pick a side.** This is the pack. A
   thesis nobody could argue with is core, or it is nothing —
   [`AUTHORING.md`](AUTHORING.md) has the test.
4. **Find the failure.** For each rule, name what breaks without it. If you
   cannot, it is a preference; either find the failure or drop the rule.
