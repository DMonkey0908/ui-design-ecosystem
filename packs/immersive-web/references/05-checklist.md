# Domain review checklist

Run **`core/99-review.md` first** - tokens, type, layout, state, feedback,
input, accessibility, motion. Nothing there is waived by this domain, and its
visual-language section holds the three questions every 3D scene is asked
before any of the ones below.

This file is what a page built around a scene needs on top.

## Checklist

### Before there is a scene
- [ ] The three questions in `02-scene.md` have written answers: the verb, why
      it could not be recorded, what the visitor learns.
- [ ] The answer was not "watch it". If it was, this is a video.
- [ ] The page was reviewed with the scene absent: the poster in the frame, or
      the empty frame at its ratio if the poster had yet to be captured from
      the scene.
- [ ] There is one scene on the page.

### The page without the scene
- [ ] With script disabled: headline, what it is, the facts, the price and the
      primary action are all present and working.
- [ ] The poster is a real `<img>` with `width`, `height`, `alt` and
      `fetchpriority="high"`.
- [ ] The poster is a render of the scene's opening frame, not a different
      photograph.
- [ ] The frame reserves its box with `aspect-ratio`; nothing moves when the
      image or the canvas arrives.
- [ ] No text, label, price or navigation is drawn by the renderer.

### Staging
- [ ] Text is in its own lane or on an opaque plate. Nothing is set directly on
      the render, and no plate is translucent or blurred.
- [ ] On a phone the headline is above the scene.
- [ ] The stage surface is used for the scene's section only; long-form content
      is on the page surface.
- [ ] A scroll-driven scene uses chapters on native scroll. No scroll-jacking,
      no smooth-scroll library owning the page.
- [ ] Buttons on the stage use the stage accent with the dark label.
- [ ] On a wide screen the stage colour reaches both edges; only its content is
      capped.

### Loading
- [ ] The engine is a dynamic import. Nothing from three.js is in the page's
      main bundle.
- [ ] Only the hero scene mounts itself; every other scene waits for its
      button.
- [ ] Neither the model nor the engine is preloaded in the `<head>`.
- [ ] Progress is a line on the scene frame. There is no full-screen loader.
- [ ] The canvas is revealed after its first frame has been drawn.
- [ ] Decoders are self-hosted, and only the ones the model needs are loaded.

### Budget
- [ ] Critical path under 350KB; script on it under 30KB.
- [ ] Engine, loader and controls under 250KB compressed.
- [ ] Model under 2MB. Triangles, draw calls and texture count read from
      `renderer.info`, not estimated, and within `03-budget.md`. The draw-call
      figure includes the shadow pass.
- [ ] Texture format chosen by GPU memory, not file size; no 4096px textures.
- [ ] Pixel ratio capped at 2, and 1.5 on a coarse pointer.
- [ ] No animation loop. Frames are drawn on change only.
- [ ] `powerPreference` is not `'high-performance'`.
- [ ] Measured on a warm mid-range phone on a throttled connection.

### Input
- [ ] A thumb can scroll from the top of the page to the footer without lifting
      off the scene.
- [ ] `touch-action: pan-y` is set on the canvas after the controls are
      constructed.
- [ ] Wheel zoom is off outside full-screen mode. Pinch-zoom of the page works.
- [ ] Every view a drag can reach is a button in the view bar. So is a toggle
      that changes the picture and not the order - a cutaway, an exploded
      state.
- [ ] Every option is a form control outside the canvas, with a text label
      beside any swatch.
- [ ] Hotspots are HTML buttons with visible labels, in reading order, and hide
      when their point faces away.
- [ ] All of the above are at least 44px.

### Access
- [ ] The canvas has `role="img"` and a label naming the object and how to
      operate it. It has no `tabindex`.
- [ ] Scene state exists as text in a status region and updates with the scene.
- [ ] Dimensions and specifications the scene shows are also written beside it.
- [ ] With reduced motion: damping off, views cut, no entrance move, no scrub.
      The scene code checks the preference itself.
- [ ] Focus is visible on the stage, including on a selected option.

### Failure
- [ ] No WebGL, reduced data, a failed model and a lost context all end on the
      poster, with no error message.
- [ ] `webglcontextlost` calls `preventDefault()`, and the scene returns on
      restore.
- [ ] The load button ships `hidden`, and script reveals it only when the scene
      can mount.
- [ ] In a single-page app, leaving the route calls `dispose()`.

## Failure modes specific to this domain

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

## Refusals

The table under *What this pack deliberately refuses* lists what this pack pushes back on - the percentage preloader, the
whole site in the canvas, a scene per section, scroll-jacking, auto-rotation,
real-time for a fixed fly-through, mouse-follow parallax, the unoptimised
model, WebGPU for its own sake, a 3D hero for a subject that is not spatial -
and what to offer instead. Name the cost, offer the alternative, then build
whatever is decided, and record the decision so nobody re-litigates it.
