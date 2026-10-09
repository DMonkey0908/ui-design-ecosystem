# Budget - bytes, frames, loading and the device

Core's `10-visual-language.md` says a 3D scene needs a frame budget chosen from
the target device and agreed before modelling. This file is that budget, with
numbers, and the order things load in.

It is the file to open before the model is commissioned. Most of what is here
cannot be recovered afterwards: a 400,000-triangle model with fourteen
materials is not optimised in the browser, it is rebuilt.

## Two budgets, and they never mix

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

### Where these numbers come from

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

## The model

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

**The shadow pass is inside the count.** `renderer.info.render.calls` adds up
every pass, and a shadow-casting light draws the model once more into its map:
fifteen meshes read as thirty. The budget is the figure as read, so the one
permitted light costs half of it. Ask for it with the mount's `shadows` option,
which sets `PCFShadowMap`. `PCFSoftShadowMap`, the type most tutorials name,
has been removed: three.js r186 logs a warning and falls back.

**A model built in code is held to the same table.** Give the mount
`build(THREE)` in place of `src`; it returns the object, and its one light if
it has one. There is no loader or decoder to pay for, and the merge is yours to
do: one mesh per material, not one per part.

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
budget nobody measured is a wish. The mount returns the same four from
`handle.info()`.

## Compression is two separate decisions

Geometry and textures compress differently and cost differently to decode.
Deciding them together is how a 300KB model ends up behind 380KB of decoders.

### Geometry

| Format | Decoder cost | Use when |
|---|---|---|
| Meshopt | 7KB | The default. Good ratios, and the decoder is nearly free. |
| Draco | 101KB | The model is geometry-heavy enough that Draco's better ratio saves more than its decoder costs - roughly, several megabytes of raw mesh. |
| None | 0 | The model is under about 200KB of geometry. The decoder would outweigh the saving. |

### Textures

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

## Loading order

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

const handles = new Map();                                 // frame -> handle, once its scene runs

for (const frame of document.querySelectorAll('.scene')) {
  const bar = frame.querySelector('.scene-progress');
  mountWhenWanted(frame, {
    src: frame.dataset.model,
    auto: frame.hasAttribute('data-hero'),                 // one per page
    onProgress: (p) => bar && bar.style.setProperty('--scene-progress', p),
  }).ready.then((handle) => handle && handles.set(frame, handle));
}
```

`ready` resolves whichever way the scene started - by itself or from its
button - and resolves to `null` when it cannot run. The `handle` in the
snippets of `02-scene.md` and `04-access.md` is this one, and is why each of
them checks it before using it.

## Pixel ratio

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

## Render on demand

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

## The power hint

```js
new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
```

Three of the surveyed sites request `'high-performance'`. On a laptop with two
GPUs that wakes the discrete one for the life of the tab. For a game it is the
right call; for one chair on a product page it is a fan spinning up.

## When the context is lost

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

## Leaving

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

## The same rules in other libraries

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

## WebGPU

`WebGPURenderer` falls back to WebGL 2 where WebGPU is unavailable. That does
not make it the default here.

A product viewer is one model, a few materials and an orbit. It is nowhere near
the workloads the newer renderer exists for - compute shaders, hundreds of
thousands of instances, clustered lighting - and adopting it means two code
paths to test on every device. The three.js manual still recommends the WebGL
renderer for applications that only need WebGL 2.

Reach for it when the brief names something only it can do. Then it is a
feature with a cost, like any other, and the fallback path gets tested first.

## Measure on the phone

A development laptop with a discrete GPU will run anything. Test on a
mid-range Android phone, on a throttled connection, after the phone has been in
use for ten minutes - a cold device flatters every number in this file, because
a hot one has already slowed its processor down.
