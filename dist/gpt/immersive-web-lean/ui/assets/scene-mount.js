/* ==========================================================================
   SCENE MOUNT - Immersive web. One scene, mounted over a page that is already
   finished without it.

   Plain three.js, no framework. `three` resolves through your bundler or an
   import map. Nothing here is imported until the frame is near the viewport,
   so the engine never sits in the critical path.

   Markup it expects (see scene.css for the styles, 02-scene.md for the why):

     <figure class="scene" data-state="poster">
       <img class="scene-poster" src="chair.avif" width="1200" height="900" alt="...">
       <canvas class="scene-canvas" role="img" aria-label="..."></canvas>
       <button class="scene-load" type="button" hidden>View in 3D</button>
     </figure>

   The button ships `hidden` and is revealed here, once the scene can be
   delivered. Without script it would be a control that does nothing.

   The frame reports itself through data-state, and CSS does the rest:
     poster   the image. The page is complete in this state.
     loading  the image, plus progress. Still complete.
     ready    the canvas is drawn and the image is gone.
     failed   the image again, for good. Not an error the visitor has to read.

   The model is either a file or a function:
     src            a glTF or GLB, loaded with the decoders it names
     build(THREE)   geometry made in code. Returns an Object3D, or
                    { object, lights? } - anything else on it is yours, and
                    comes back as the third argument of set().
   ========================================================================== */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const COARSE = matchMedia('(pointer: coarse)');

/* Named camera positions, as a direction from the model's centre. A visitor
   who cannot drag reaches every one of these from a button. Pass `views` to
   replace them: which way is "front" belongs to the model. */
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
 *
 * Returns { start, ready }. `ready` resolves to the handle once the scene is
 * running, however it was started - and to null if it cannot run, so the
 * caller's `if (handle)` is the whole of its error handling.
 */
export function mountWhenWanted(frame, options = {}) {
  const button = frame.querySelector('.scene-load');
  let handle = null;
  let resolve;
  const ready = new Promise((r) => { resolve = r; });
  const start = () => {
    if (!handle) { handle = mountScene(frame, options); handle.then(resolve); }
    return handle;
  };

  if (!canMount()) {
    if (button) button.hidden = true;        // never offer what cannot be delivered
    resolve(null);
    return { start: () => null, ready };
  }

  if (button) {
    button.hidden = false;                   // it ships hidden - see the markup above
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

  return { start, ready };
}

/**
 * Load the engine and the model, then hand the frame over to the canvas.
 * Resolves to a handle: { view, set, info, dispose }.
 */
export async function mountScene(frame, {
  src,
  build,
  // What the model was compressed with. Each one is a separate download, so
  // name only what this model needs - see 03-budget.md for what each costs.
  decoders = ['meshopt'],
  dracoPath = '/vendor/draco/',
  ktx2Path = '/vendor/basis/',
  views = VIEWS,
  initialView = 'hero',
  fit = 1.4,                 // distance, in bounding radii. 1.4 leaves room below for the view bar
  lift = 0,                  // raise the model in the frame, as a fraction of its radius
  shadows = false,           // switch the shadow map on for the model's one casting light
  onProgress,
  onFrame,                   // ({ toScreen }) after every draw - where HTML over the canvas is placed
  onInteract,                // a drag has started: the camera has left its named view
} = {}) {
  const canvas = frame.querySelector('.scene-canvas');
  const poster = frame.querySelector('.scene-poster');
  frame.dataset.state = 'loading';

  let renderer;
  try {
    const [THREE, { OrbitControls }, { RoomEnvironment }, { GLTFLoader }] =
      await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        // Geometry made in code needs no loader, so it does not pay for one.
        build ? {} : import('three/addons/loaders/GLTFLoader.js'),
      ]);

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
      renderer.shadowMap.type = THREE.PCFShadowMap;   // the soft variant is gone from current three.js
    }

    const scene = new THREE.Scene();
    const fov = 35;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

    // Lighting from a generated room: no HDR file to download.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const owned = [];                    // loaders holding workers, to dispose later
    let built = null;
    let model;

    if (build) {
      built = await build(THREE);
      model = built.isObject3D ? built : built.object;
      if (built.lights) scene.add(built.lights);
      if (onProgress) onProgress(1);
    } else {
      const loader = new GLTFLoader();
      if (decoders.includes('meshopt')) {
        const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
        loader.setMeshoptDecoder(MeshoptDecoder);
      }
      if (decoders.includes('draco')) {
        const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
        const draco = new DRACOLoader().setDecoderPath(dracoPath);
        loader.setDRACOLoader(draco);
        owned.push(draco);
      }
      if (decoders.includes('ktx2')) {
        const { KTX2Loader } = await import('three/addons/loaders/KTX2Loader.js');
        const ktx2 = new KTX2Loader().setTranscoderPath(ktx2Path).detectSupport(renderer);
        loader.setKTX2Loader(ktx2);
        owned.push(ktx2);
      }

      const gltf = await loader.loadAsync(src, (e) => {
        if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
      });
      model = gltf.scene;
    }
    scene.add(model);

    // Frame the model whatever units it was made in.
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
    // A hotspot is a button in the page. This is how it finds its place.
    const probe = new THREE.Vector3();
    const toward = new THREE.Vector3();
    const overlay = {
      /** A point on the model as CSS pixels in the frame, and how squarely
          `normal` faces the camera: 1 head-on, 0 edge-on, negative facing away. */
      toScreen(point, normal) {
        probe.set(point[0], point[1], point[2]);
        let facing = 1;
        if (normal) {
          toward.copy(camera.position).sub(probe).normalize();
          const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
          facing = (toward.x * normal[0] + toward.y * normal[1] + toward.z * normal[2]) / length;
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
    const paint = () => {
      renderer.render(scene, camera);
      if (onFrame) onFrame(overlay);
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

    // The poster's own proportions. A frame narrower than that - a square one
    // on a phone - widens the field of view, so the canvas shows what the
    // poster showed and the swap is still not a jump.
    const posterAspect = poster && poster.getAttribute('height') > 0
      ? poster.getAttribute('width') / poster.getAttribute('height')
      : 0;

    const resizeToFrame = () => {
      const { clientWidth: w, clientHeight: h } = frame;
      if (!w || !h) return;
      renderer.setSize(w, h, false);     // false: CSS owns the layout size
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = posterAspect && aspect < posterAspect
        ? (Math.atan(Math.tan((fov * Math.PI) / 360) * posterAspect / aspect) * 360) / Math.PI
        : fov;
      camera.updateProjectionMatrix();
      invalidate();
    };
    resizeToFrame();                     // now, so the first frame is the right size
    const resize = new ResizeObserver(resizeToFrame);
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
    frame.dataset.state = 'ready';

    return {
      view,
      /** Apply a change to the model, then redraw. `fn` receives the model,
          THREE, and whatever build() returned. */
      set(fn) { fn(model, THREE, built); invalidate(); },
      /** What the last frame cost. Read it; do not estimate it. */
      info() {
        const { render, memory } = renderer.info;
        return {
          drawCalls: render.calls,       // every pass: a shadow-casting light draws the model twice
          triangles: render.triangles,
          geometries: memory.geometries,
          textures: memory.textures,
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
          if (o.shadow && o.shadow.map) o.shadow.map.dispose();
          for (const m of [].concat(o.material || [])) {
            for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
            m.dispose();
          }
        });
        scene.environment.dispose();
        pmrem.dispose();
        for (const l of owned) l.dispose();
        renderer.dispose();
        frame.dataset.state = 'poster';
      },
    };
  } catch (err) {
    // No WebGL, a blocked decoder, a model that 404s, a build that throws:
    // all the same outcome.
    if (renderer) renderer.dispose();
    frame.dataset.state = 'failed';
    console.warn('scene: staying on the poster -', err);
    return null;
  }
}
