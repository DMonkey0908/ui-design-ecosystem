/* ==========================================================================
   SCENE MOUNT - ported from the immersive-web skill's assets/scene-mount.js.
   One scene, mounted over a page that is already finished without it.

   Kept from the reference, unchanged in behaviour: the four frame states, the
   lazy engine import, the pixel-ratio cap, render on demand with no animation
   loop, zoom and pan off, touch-action: pan-y, context loss, the
   reduced-motion check, disposal.

   Changed, because this page has no model file and has hotspots:
     - `build(THREE)` replaces `src` and the glTF loader. It returns
       { object, lights?, ... } and that whole value is what `set()` receives.
     - `views`, `fit` and `lift` are options, not constants.
     - `onReady(handle)`, so an auto-mounted scene can hand its handle back.
     - `onFrame({ toScreen })` after every draw, to place HTML over the canvas.
     - `onInteract()` when a drag starts.
     - `posterAspect`: narrower frames widen the field of view, so the canvas
       always shows what the poster shows.
     - `shadows` switches the shadow map on for the model's one casting light.

   `three` resolves through the import map in index.html.
   ========================================================================== */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const COARSE = matchMedia('(pointer: coarse)');

/* Named camera positions, as a direction from the model's centre. A visitor
   who cannot drag reaches every one of these from a button. */
const VIEWS = {
  front: [0, 0.15, 1],
  side: [1, 0.15, 0],
  back: [0, 0.15, -1],
  top: [0, 1, 0.001],
  hero: [0.7, 0.35, 1],
};

/** True when mounting is worth attempting at all. False is not an error. */
export function canMount() {
  if (!('WebGL2RenderingContext' in window)) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  return true;
}

/**
 * Mount when the frame comes near the viewport - or when the visitor asks.
 *
 *   auto: true   the one hero scene. Mounts itself once it is nearly on screen.
 *   auto: false  every other scene. Waits for the button.
 */
export function mountWhenWanted(frame, options = {}) {
  const button = frame.querySelector('.scene-load');
  let handle = null;
  const start = () => { handle = handle || mountScene(frame, options); return handle; };

  if (!canMount()) {
    if (button) button.hidden = true;        // never offer what cannot be delivered
    return { start: () => null };
  }

  if (button) {
    button.hidden = false;                   // it ships hidden: without script it would be a dead control
    button.addEventListener('click', start, { once: true });
  }

  if (options.auto) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      // After first paint has settled, not in competition with it.
      (window.requestIdleCallback || setTimeout)(start);
    }, { rootMargin: '200px' });
    io.observe(frame);
  }

  return { start };
}

/**
 * Load the engine, build the model, then hand the frame over to the canvas.
 * Resolves to a handle: { view, set, info, dispose }.
 */
export async function mountScene(frame, {
  build,
  views = VIEWS,
  initialView = 'hero',
  fit = 1.4,                 // 1.4 leaves room below the model for the view bar
  lift = 0,                  // raise the model in the frame, as a fraction of its radius
  fov = 35,
  posterAspect = 0,
  environment = 1,
  shadows = false,           // one shadow-casting light, if the model brings it
  onProgress,
  onReady,
  onFrame,
  onInteract,
} = {}) {
  const canvas = frame.querySelector('.scene-canvas');
  frame.dataset.state = 'loading';

  let renderer;
  try {
    const [THREE, { OrbitControls }, { RoomEnvironment }] =
      await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/environments/RoomEnvironment.js'),
      ]);
    if (onProgress) onProgress(0.6);

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,                       // the stage colour comes from CSS, in one place
      powerPreference: 'default',        // 'high-performance' wakes the discrete GPU on a laptop
    });

    // The cap is the single largest performance lever in this file. A 3x phone
    // at full ratio shades nine pixels for every one CSS pixel.
    const cap = COARSE.matches ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));

    // Keeps a product's colours where its photographs put them, where the
    // filmic curves shift hue in the highlights.
    renderer.toneMapping = THREE.NeutralToneMapping;
    if (shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

    // Lighting from a generated room: no HDR file to download.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = environment;

    const built = await build(THREE);
    const model = built.object;
    scene.add(model);
    if (built.lights) scene.add(built.lights);
    if (onProgress) onProgress(0.9);

    // Frame the model whatever units it was built in.
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2 || 1;
    const distance = radius / Math.sin((fov * Math.PI) / 360) * fit;
    centre.y -= radius * lift;
    camera.near = distance / 100;
    camera.far = distance * 10;

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(centre);
    controls.enablePan = false;
    // Wheel and pinch stay with the page. Zoom is a button, or nothing: an
    // enabled wheel-zoom swallows the scroll of everyone passing through.
    controls.enableZoom = false;
    controls.enableDamping = !REDUCED.matches;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;
    // OrbitControls sets touch-action: none, which makes the canvas a hole in
    // the page that a thumb cannot scroll across. Give vertical back.
    canvas.style.touchAction = 'pan-y';

    // ---- HTML over the canvas --------------------------------------------
    const probe = new THREE.Vector3();
    const toward = new THREE.Vector3();
    const api = {
      /** A model-space point as CSS pixels in the frame, and how far it faces the camera. */
      toScreen(point, normal) {
        probe.set(point[0], point[1], point[2]);
        let facing = 1;
        if (normal) {
          toward.copy(camera.position).sub(probe).normalize();
          const len = Math.hypot(normal[0], normal[1], normal[2]) || 1;
          facing = (toward.x * normal[0] + toward.y * normal[1] + toward.z * normal[2]) / len;
        }
        probe.project(camera);
        return {
          x: (probe.x * 0.5 + 0.5) * frame.clientWidth,
          y: (-probe.y * 0.5 + 0.5) * frame.clientHeight,
          facing,
        };
      },
    };

    // ---- Render on demand ------------------------------------------------
    // No animation loop. A frame is drawn when something changed, and while
    // damping is still settling. Idle costs nothing, which is the point.
    let queued = false;
    let frames = 0;
    const paint = () => {
      renderer.render(scene, camera);
      frames += 1;
      if (onFrame) onFrame(api);
    };
    const draw = () => {
      queued = false;
      controls.update();                 // while damping, this fires 'change' again
      paint();
    };
    const invalidate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    };
    controls.addEventListener('change', invalidate);
    if (onInteract) controls.addEventListener('start', onInteract);

    const fit2 = () => {
      const { clientWidth: w, clientHeight: h } = frame;
      if (!w || !h) return;
      renderer.setSize(w, h, false);     // false: CSS owns the layout size
      const aspect = w / h;
      camera.aspect = aspect;
      // A frame narrower than the poster keeps the poster's horizontal framing.
      camera.fov = posterAspect && aspect < posterAspect
        ? (Math.atan(Math.tan((fov * Math.PI) / 360) * posterAspect / aspect) * 360) / Math.PI
        : fov;
      camera.updateProjectionMatrix();
      invalidate();
    };
    fit2();                              // now, so the first frame is the right size
    const resize = new ResizeObserver(fit2);
    resize.observe(frame);

    const view = (name) => {
      const dir = views[name];
      if (!dir) return;
      camera.position.set(dir[0], dir[1], dir[2]).normalize().multiplyScalar(distance).add(centre);
      camera.lookAt(centre);
      controls.update();
      invalidate();
    };
    view(initialView);

    // ---- Context loss ----------------------------------------------------
    // Routine on a phone: an app switch or memory pressure is enough. Fall
    // back to the image the page already had, and come back quietly.
    const onLost = (e) => { e.preventDefault(); frame.dataset.state = 'poster'; };
    const onRestored = () => { frame.dataset.state = 'ready'; invalidate(); };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const onMotionPref = () => { controls.enableDamping = !REDUCED.matches; };
    REDUCED.addEventListener('change', onMotionPref);

    // Draw once before revealing, so the swap from image to canvas is not a flash.
    paint();
    if (onProgress) onProgress(1);
    frame.dataset.state = 'ready';

    const handle = {
      view,
      /** Apply a change to the model, then redraw. `fn` receives what build() returned. */
      set(fn) { fn(built, THREE); invalidate(); },
      /** What the last frame cost. Read it, do not estimate it. */
      info() {
        const { render, memory } = renderer.info;
        return {
          drawCalls: render.calls,
          triangles: render.triangles,
          geometries: memory.geometries,
          textures: memory.textures,
          pixelRatio: renderer.getPixelRatio(),
          frames,
        };
      },
      /** Call on route change. three.js frees nothing on its own. */
      dispose() {
        resize.disconnect();
        REDUCED.removeEventListener('change', onMotionPref);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        controls.dispose();
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          for (const m of [].concat(o.material || [])) {
            for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
            m.dispose();
          }
        });
        scene.environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        frame.dataset.state = 'poster';
      },
    };
    if (onReady) onReady(handle);
    return handle;
  } catch (err) {
    // No WebGL, a blocked script, a build that throws: all the same outcome.
    if (renderer) renderer.dispose();
    frame.dataset.state = 'failed';
    console.warn('scene: staying on the poster -', err);
    return null;
  }
}
