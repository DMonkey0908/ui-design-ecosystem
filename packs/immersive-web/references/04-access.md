# Access - keyboard, touch, reduced motion and failure

A `<canvas>` is one opaque rectangle to everything that is not a pair of eyes
and a pointer. It has no text, no structure, no focus order and no states.
Whatever the scene lets a sighted visitor with a mouse find out, somebody else
has to be able to find out another way.

Core's `10-visual-language.md` requires that path. This file is the form it
takes here, and the three inputs that most often break it.

## The scene shows four things. Each has a home in HTML.

| The scene conveys | A visitor who cannot see or drag it gets | Where |
|---|---|---|
| **What it looks like** | A described poster image, and the photographs | The `alt` on the poster; the gallery |
| **Size and proportion** | Dimensions, as figures with units | A `<dl>` or table beside the scene |
| **Options and their effect** | The option names, the current choice, and what it changed | Form controls, and a live summary |
| **Parts and where they are** | The parts, named, in order, each with its explanation | Hotspot buttons, or a list |

Run down the left column for the scene being built. Anything it conveys that
the right column does not deliver is the gap.

## The canvas itself

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

## Options are a form

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

## Every view is a button

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

## Touch: the page owns vertical

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

## Reduced motion

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

## When there is no scene

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

## Four passes before calling it done

1. **Keyboard only.** Tab through the page. Reach every option and every view;
   confirm focus is always visible on the stage; confirm nothing was reachable
   only by dragging.
2. **Reduced motion on.** Load, change view, scroll a chaptered stage. Nothing
   should travel.
3. **Script off.** The page should be a good page with a picture on it.
4. **A phone, one thumb.** Scroll from the top to the footer without lifting
   off the scene. If the page stops, the scene took the scroll.
