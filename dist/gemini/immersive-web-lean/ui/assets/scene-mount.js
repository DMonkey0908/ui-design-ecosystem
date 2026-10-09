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
       <button class="scene-load" type="button">View in 3D</button>
     </figure>

   The frame reports itself through data-state, and CSS does the rest:
     poster   the image. The page is complete in this state.
     loading  the image, plus progress. Still complete.
     ready    the canvas is drawn and the image is gone.
     failed   the image again, for good. Not an error the visitor has to read.
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

  if (button) button.addEventListener('click', start, { once: true });

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
 * Load the engine and the model, then hand the frame over to the canvas.
 * Resolves to a handle: { view, set, dispose }.
 */
export async function mountScene(frame, {
  src,
  // What the model was compressed with. Each one is a separate download, so
  // name only what this model needs - see 03-budget.md for what each costs.
  decoders = ['meshopt'],
  dracoPath = '/vendor/draco/',
  ktx2Path = '/vendor/basis/',
  initialView = 'hero',
  onProgress,
} = {}) {
  const canvas = frame.querySelector('.scene-canvas');
  frame.dataset.state = 'loading';

  let renderer;
  try {
    const [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }] =
      await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/environments/RoomEnvironment.js'),
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

    // Lighting from a generated room: no HDR file to download.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const loader = new GLTFLoader();
    const owned = [];                    // loaders holding workers, to dispose later
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
    const model = gltf.scene;
    scene.add(model);

    // Frame the model whatever units it was exported in.
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2 || 1;
    const distance = radius / Math.sin((camera.fov * Math.PI) / 360) * 1.4;   // room below the model for the view bar
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

    // ---- Render on demand ------------------------------------------------
    // No animation loop. A frame is drawn when something changed, and while
    // damping is still settling. Idle costs nothing, which is the point.
    let queued = false;
    const draw = () => {
      queued = false;
      controls.update();                 // while damping, this fires 'change' again
      renderer.render(scene, camera);
    };
    const invalidate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    };
    controls.addEventListener('change', invalidate);

    const fit = () => {
      const { clientWidth: w, clientHeight: h } = frame;
      if (!w || !h) return;
      renderer.setSize(w, h, false);     // false: CSS owns the layout size
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      invalidate();
    };
    fit();                               // now, so the first frame is the right size
    const resize = new ResizeObserver(fit);
    resize.observe(frame);

    const view = (name) => {
      const dir = VIEWS[name];
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
    renderer.render(scene, camera);
    frame.dataset.state = 'ready';

    return {
      view,
      /** Apply a change to the model, then redraw. `fn` receives the glTF scene. */
      set(fn) { fn(model, THREE); invalidate(); },
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
        for (const l of owned) l.dispose();
        renderer.dispose();
        frame.dataset.state = 'poster';
      },
    };
  } catch (err) {
    // No WebGL, a blocked decoder, a model that 404s: all the same outcome.
    if (renderer) renderer.dispose();
    frame.dataset.state = 'failed';
    console.warn('scene: staying on the poster -', err);
    return null;
  }
}
