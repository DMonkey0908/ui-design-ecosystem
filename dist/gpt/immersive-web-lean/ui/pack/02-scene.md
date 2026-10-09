# The scene - whether to build it, and how to stage it

## Three questions, before anything is modelled

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

## What a scene is for, on each kind of page

This pack covers three kinds of page. The scene earns its place differently on
each, and is wrong differently on each.

### A product page - review, showcase, configurator

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
  hand. The scene is one item in the gallery, not a replacement for it. With
  no photographs yet, the page ships without a gallery: a still rendered from
  the same model answers none of what the photograph was there for.
- A **review** page needs one thing a shop page does not: named views that
  match the review's argument. "The port is on the wrong side" should be a
  button that turns the model to that port.

### A company or studio site

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

### A course page

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

## Staging: lanes

The scene and the words get separate space. This is the default layout and it
needs a reason to be anything else.

```html
<section class="stage stage--hero on-stage">
  <div class="stage-text">
    <h1>The Kestrel chair, rebuilt from the frame out</h1>
    <p>Eight zones of tension in the back, and none of them is foam.</p>
    <a class="btn btn-primary" href="/buy">Configure yours</a>
  </div>

  <figure class="scene" data-state="poster">
    <img class="scene-poster" src="kestrel-hero.avif" width="1200" height="900"
         alt="Kestrel chair in graphite, seen from the front left" fetchpriority="high">
    <canvas class="scene-canvas" role="img"
            aria-label="Kestrel chair, 3D view. Use the view buttons to turn it."></canvas>
    <div class="scene-progress" aria-hidden="true"></div>
    <button class="scene-load" type="button" hidden>View in 3D</button>
    <div class="scene-views" role="group" aria-label="View">
      <button type="button" data-view="front" aria-pressed="false">Front</button>
      <button type="button" data-view="side" aria-pressed="false">Side</button>
      <button type="button" data-view="back" aria-pressed="false">Back</button>
    </div>
  </figure>
</section>
```

Four things in that markup are load-bearing:

- **The image is a real `<img>` with dimensions and `fetchpriority="high"`.**
  It is the largest thing on the first screen, so it is what the browser times
  as the largest paint. The canvas arrives later and is never that element.
- **The text comes first in the source.** On a phone the lanes stack, and the
  headline has to be above the scene - a scene on top pushes the one sentence a
  stranger needs off the screen.
- **The frame has a state, and starts in `poster`.** Everything the visitor
  sees is driven from that attribute; see below.
- **The button ships `hidden`.** The mount reveals it once it knows the scene
  can be delivered. Visible in the HTML, it is a control that does nothing for
  everyone whose script failed - the visitors the poster exists for.

`assets/scene.css` has the grid. Text lane `minmax(20rem, 28rem)`, scene lane
the rest, one column under 800px. `.stage--hero` is the stage under the
floating header: it clears the header and no more, where the full section gap
would put the view bar and the option picker under the fold of a laptop.

## The frame has four states

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

With no modelling tool to render it from - a model built in code, or one that
arrives only as a `.glb` - the poster is a capture of the running canvas: mount
the scene, hide the view bar and the hotspots, and screenshot the frame at
twice its size. So the scene exists before its poster does. Until then the
frame holds its reserved box, and the page is reviewed in that state.

## Which scene mounts itself

- **The hero scene** mounts on its own, once the frame is near the viewport and
  the browser is idle. One per page.
- **Every other scene** waits for its button. A gallery of six products is six
  images and six buttons, and one engine on the first press.
- **Neither mounts** when the visitor has asked for reduced data, or the
  browser has no WebGL 2. Then the button stays hidden, because offering what
  cannot be delivered is worse than not offering it.

`03-budget.md` has the loading order behind this.

## Staging: chapters, not a scrub

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
    if (e.isIntersecting && handle) handle.view(e.target.dataset.view);   // one draw per chapter
  }
}, { rootMargin: '-45% 0px -45% 0px' });                        // fires at the viewport's middle

document.querySelectorAll('.chapter').forEach((c) => chapters.observe(c));
```

`handle` is what `mountWhenWanted(…).ready` resolved to - the loading snippet
in `03-budget.md` - and it stays `null` when there is no scene, which is why
every snippet that uses it checks first.

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

## Hotspots

A point on the model with something to say about it.

```html
<button class="hotspot" type="button" data-spot="pivot" aria-expanded="false" aria-controls="spot-pivot">
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
- **It stands off the point on a stem.** A pill centred on its anchor covers
  the part it names. `scene.css` draws it above the point, with a line down.

The mount says where each point is after every draw, and how squarely it faces
the camera:

```js
const SPOTS = { pivot: { at: [0, 0.42, -0.1], normal: [0, 0, -1] } };   // model space

mountWhenWanted(frame, {
  onFrame({ toScreen }) {
    for (const button of frame.querySelectorAll('.hotspot')) {
      const spot = SPOTS[button.dataset.spot];
      const { x, y, facing } = toScreen(spot.at, spot.normal);
      button.hidden = facing < 0;                       // the part is on the far side
      button.style.setProperty('--x', `${x}px`);
      button.style.setProperty('--y', `${y}px`);
    }
  },
});
```

## Components this pack does not have

- **A preloader.** The poster is the loading state.
- **Scene-rendered text.** Headings, labels and prices are HTML.
- **A custom cursor.** It replaces a pointer the visitor's system and
  accessibility settings control, and does nothing on touch.
- **A sound toggle.** A page that needs one has autoplaying sound.
- **A "best viewed on desktop" notice.** If the phone cannot run the scene, the
  phone gets the poster, and the page must be good in that state.
