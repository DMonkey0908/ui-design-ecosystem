/* ==========================================================================
   MOTOR - the KD-132, built from three.js geometry. There is no model file.

   Axis is Z, the output shaft points +Z, up is +Y. One unit is 100 mm, so the
   figures in the specification table are the figures of this model:
   shaft height 132 mm, flange 300 mm, shaft 38 x 80 mm.

   Everything is baked into one mesh per material per group, so the scene is a
   dozen draw calls whatever the part count. The groups are what the page can
   switch: the closed housing, the cutaway, the feet, the shaft key.

   Lazy: imported by main.js only after the engine has arrived.
   ========================================================================== */

const DEG = Math.PI / 180;

/* The cutaway removes one quarter of every revolved part. Angles are measured
   the way revolve() sweeps: 0 is straight down, 90 is +X, 180 is the top. */
const CUT_FROM = 55 * DEG;
const CUT_TO = 145 * DEG;

/* Where the HTML hotspots attach. `at` is a point just clear of the part,
   `normal` the way the part faces, `min` how square-on it must be to show. */
export const ANCHORS = {
  shaft: { at: [0, 0.19, 2.12], normal: [0, 0.2, 1], min: -0.35 },
  flange: { at: [-0.63, 1.36, 1.41], normal: [-0.3, 0.6, 0.8], min: -0.1 },
  terminal: { at: [0, 1.51, 0.15], normal: [0, 1, 0], min: -0.45 },
  fan: { at: [0, 1.16, -1.62], normal: [0, 1, -0.3], min: -0.4 },
  winding: { at: [0.52, 0.09, 0], normal: [1, 0.2, 0], min: 0.3, cutOnly: true },
};

export function buildMotor(THREE, initial = {}) {
  const { Matrix4, Vector3, Vector2, Shape } = THREE;

  /* ---- Materials: nine, and the paint is the only one that changes ------ */
  const std = (color, metalness, roughness) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const materials = {
    paint: std('#b9b8ab', 0.1, 0.55),
    cowl: std('#4a5059', 0.35, 0.5),
    steel: std('#c9ced6', 1, 0.24),
    alu: std('#d9dce0', 1, 0.42),
    dark: std('#0b0c0f', 0, 0.85),
    plastic: std('#8a9099', 0, 0.6),
    copper: std('#d07a3a', 1, 0.34),
    lam: std('#5d636d', 0.85, 0.5),
    cut: std('#c4c8ce', 0.1, 0.75),
  };

  /* ---- Buckets: positions and normals, appended to, never indexed ------- */
  const buckets = new Map();
  const bucket = (group, material) => {
    const key = `${group}:${material}`;
    if (!buckets.has(key)) buckets.set(key, { group, material, pos: [], nor: [] });
    return buckets.get(key);
  };

  /** Bake a three.js geometry into a bucket, moved by `matrix`. */
  const add = (group, material, geometry, matrix) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (matrix) g.applyMatrix4(matrix);
    const b = bucket(group, material);
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { b.pos.push(p[i]); b.nor.push(n[i]); }
    geometry.dispose();
    if (g !== geometry) g.dispose();
  };

  const at = (x, y, z) => new Matrix4().makeTranslation(x, y, z);
  const rotX = (a) => new Matrix4().makeRotationX(a);
  const rotZ = (a) => new Matrix4().makeRotationZ(a);
  const mul = (...m) => m.reduce((acc, x) => acc.multiply(x), new Matrix4());

  /**
   * Revolve profile runs about the Z axis. A run is a polyline of [radius, z];
   * normals are smooth inside a run and sharp between runs, which is what a
   * machined part looks like. Runs go anticlockwise round the section so the
   * surface faces out.
   */
  const revolve = (group, material, run, start = 0, length = Math.PI * 2) => {
    const b = bucket(group, material);
    const steps = Math.max(8, Math.round(72 * length / (Math.PI * 2)));
    const normals = run.map((_, i) => {
      let nr = 0, nh = 0;
      for (const k of [i - 1, i]) {
        if (k < 0 || k >= run.length - 1) continue;
        const dr = run[k + 1][0] - run[k][0];
        const dh = run[k + 1][1] - run[k][1];
        const len = Math.hypot(dr, dh) || 1;
        nr += dh / len; nh += -dr / len;
      }
      const len = Math.hypot(nr, nh) || 1;
      return [nr / len, nh / len];
    });
    const put = (phi, i) => {
      const s = Math.sin(phi), c = Math.cos(phi);
      b.pos.push(run[i][0] * s, -run[i][0] * c, run[i][1]);
      b.nor.push(normals[i][0] * s, -normals[i][0] * c, normals[i][1]);
    };
    for (let j = 0; j < steps; j++) {
      const p0 = start + (length * j) / steps;
      const p1 = start + (length * (j + 1)) / steps;
      for (let i = 0; i < run.length - 1; i++) {
        put(p0, i); put(p1, i); put(p0, i + 1);
        put(p1, i); put(p1, i + 1); put(p0, i + 1);
      }
    }
  };

  /** The flat face a cut leaves: the section itself, at one angle. */
  const cap = (group, material, contour, phi, facesForward) => {
    const b = bucket(group, material);
    const shape = new THREE.ShapeGeometry(new Shape(contour.map(([r, h]) => new Vector2(r, h))));
    const g = shape.toNonIndexed();
    const p = g.attributes.position.array;
    const s = Math.sin(phi), c = Math.cos(phi);
    const sign = facesForward ? 1 : -1;
    for (let t = 0; t < p.length; t += 9) {
      const order = facesForward ? [0, 2, 1] : [0, 1, 2];
      for (const v of order) {
        const r = p[t + v * 3], h = p[t + v * 3 + 1];
        b.pos.push(r * s, -r * c, h);
        b.nor.push(c * sign, s * sign, 0);
      }
    }
    shape.dispose(); g.dispose();
  };

  /**
   * A revolved solid that the cutaway slices. `runs` is [material, polyline]
   * pairs forming one closed section. Whole in the closed group; three
   * quarters of it, with both cut faces, in the open group.
   */
  const solid = (runs, capMaterial = 'cut') => {
    const contour = [];
    for (const [material, run] of runs) {
      revolve('closed', material, run);
      revolve('open', material, run, CUT_TO, Math.PI * 2 - (CUT_TO - CUT_FROM));
      for (const pt of run) {
        const last = contour[contour.length - 1];
        if (!last || last[0] !== pt[0] || last[1] !== pt[1]) contour.push(pt);
      }
    }
    cap('open', capMaterial, contour, CUT_FROM, true);
    cap('open', capMaterial, contour, CUT_TO, false);
  };

  /** A rectangle section, the commonest solid here. */
  const ring = (material, r0, r1, h0, h1, capMaterial) => solid([
    [material, [[r1, h0], [r1, h1]]],
    [material, [[r1, h1], [r0, h1]]],
    [material, [[r0, h1], [r0, h0]]],
    [material, [[r0, h0], [r1, h0]]],
  ], capMaterial);

  /** Which group a feature at a given angle round the axis belongs to. */
  const groupAt = (thetaDeg) => {
    const phi = ((thetaDeg + 90) % 360 + 360) % 360 * DEG;
    return phi > CUT_FROM - 0.02 && phi < CUT_TO + 0.02 ? 'closed' : 'always';
  };
  const polar = (r, thetaDeg, z) =>
    [r * Math.cos(thetaDeg * DEG), r * Math.sin(thetaDeg * DEG), z];

  const arc = (cr, ch, radius, fromDeg, toDeg, n = 8) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (fromDeg + ((toDeg - fromDeg) * i) / n) * DEG;
      return [cr + radius * Math.cos(a), ch + radius * Math.sin(a)];
    });

  /* ---- Housing and its fins ------------------------------------------- */
  ring('paint', 0.88, 1.0, -1.2, 1.2);

  const finShape = new Shape([
    new Vector2(-1.1, 0), new Vector2(1.1, 0), new Vector2(1.0, 0.15), new Vector2(-1.0, 0.15),
  ]);
  for (let k = 0; k < 48; k++) {
    const phi = k * 7.5 * DEG;
    if (Math.abs(phi - Math.PI) < 27 * DEG) continue;            // the terminal box sits here
    const er = new Vector3(Math.sin(phi), -Math.cos(phi), 0);
    const et = new Vector3(Math.cos(phi), Math.sin(phi), 0);
    const m = new Matrix4().makeBasis(new Vector3(0, 0, 1), er, et);
    m.setPosition(er.clone().multiplyScalar(0.985).addScaledVector(et, -0.0175));
    const inCut = phi > CUT_FROM + 0.02 && phi < CUT_TO - 0.02;
    add(inCut ? 'closed' : 'always', 'paint',
      new THREE.ExtrudeGeometry(finShape, { depth: 0.035, bevelEnabled: false }), m);
  }

  /* ---- Drive end: end shield, flange, spigot, bearing boss ------------- */
  solid([
    ['paint', [[1.03, 1.2], [1.03, 1.34]]],
    ['paint', [[1.03, 1.34], [1.5, 1.34]]],
    ['paint', [[1.5, 1.34], [1.5, 1.46]]],
    ['paint', [[1.5, 1.46], [1.48, 1.48]]],
    ['alu', [[1.48, 1.48], [1.17, 1.48]]],
    ['alu', [[1.17, 1.48], [1.17, 1.52]]],
    ['alu', [[1.17, 1.52], [0.46, 1.52]]],
    ['alu', [[0.46, 1.52], [0.46, 1.58]]],
    ['alu', [[0.46, 1.58], [0.44, 1.6]]],
    ['alu', [[0.44, 1.6], [0.21, 1.6]]],
    ['paint', [[0.21, 1.6], [0.21, 1.28]]],
    ['paint', [[0.21, 1.28], [0.88, 1.28]]],
    ['paint', [[0.88, 1.28], [0.88, 1.2]]],
    ['paint', [[0.88, 1.2], [1.03, 1.2]]],
  ]);

  for (const theta of [45, 135, 225, 315]) {                      // the four fixing holes
    const [x, y] = polar(1.33, theta, 0);
    add(groupAt(theta), 'dark', new THREE.CylinderGeometry(0.075, 0.075, 0.146, 20),
      mul(at(x, y, 1.41), rotX(Math.PI / 2)));
  }
  for (const theta of [0, 90, 180, 270]) {                        // end shield bolts
    const [x, y] = polar(0.8, theta, 0);
    add(groupAt(theta), 'steel', new THREE.CylinderGeometry(0.07, 0.07, 0.06, 6),
      mul(at(x, y, 1.55), rotX(Math.PI / 2)));
  }

  /* ---- Shaft ------------------------------------------------------------ */
  revolve('always', 'steel', [[0, -1.72], [0.12, -1.72]]);
  revolve('always', 'steel', [[0.12, -1.72], [0.12, -1.25]]);
  revolve('always', 'steel', [[0.12, -1.25], [0.19, -1.25]]);
  revolve('always', 'steel', [[0.19, -1.25], [0.19, 2.37]]);
  revolve('always', 'steel', [[0.19, 2.37], [0.16, 2.4]]);
  revolve('always', 'steel', [[0.16, 2.4], [0, 2.4]]);
  revolve('always', 'dark', [[0.045, 2.402], [0, 2.402]]);         // centre bore
  revolve('closed', 'dark', [[0.3, 1.602], [0.195, 1.602]]);       // shaft seal
  revolve('open', 'dark', [[0.3, 1.602], [0.195, 1.602]], CUT_TO, Math.PI * 2 - (CUT_TO - CUT_FROM));
  add('key', 'steel', new THREE.BoxGeometry(0.1, 0.1, 0.56), at(0, 0.2, 1.98));

  /* ---- Non-drive end: shield, fan and cowl ------------------------------ */
  ring('paint', 0.25, 1.03, -1.3, -1.2);

  solid([
    ['cowl', [[0.78, -1.98], [1.06, -1.98], ...arc(1.06, -1.88, 0.1, -90, 0).slice(1), [1.16, -1.12]]],
    ['cowl', [[1.16, -1.12], [1.13, -1.12]]],
    ['cowl', [[1.13, -1.12], [1.13, -1.86], ...arc(1.05, -1.86, 0.08, 0, -90).slice(1), [0.78, -1.94]]],
    ['cowl', [[0.78, -1.94], [0.78, -1.98]]],
  ], 'cowl');

  for (const [r0, r1] of [[0, 0.14], [0.27, 0.33], [0.45, 0.51], [0.63, 0.69]]) {   // the grille
    ring('cowl', r0, r1, -1.975, -1.945, 'cowl');
  }
  for (let k = 0; k < 8; k++) {
    const theta = 22.5 + k * 45;
    const [x, y] = polar(0.45, theta, 0);
    add(groupAt(theta), 'cowl', new THREE.BoxGeometry(0.72, 0.045, 0.03),
      mul(at(x, y, -1.96), rotZ(theta * DEG)));
  }
  for (const theta of [45, 135, 225, 315]) {                      // cowl fixing screws
    const [x, y] = polar(1.165, theta, 0);
    add(groupAt(theta), 'steel', new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6),
      mul(at(x, y, -1.32), rotZ((theta - 90) * DEG)));
  }

  revolve('always', 'plastic', [[0.12, -1.7], [0.3, -1.7]]);       // fan hub
  revolve('always', 'plastic', [[0.3, -1.7], [0.3, -1.47]]);
  revolve('always', 'plastic', [[0.95, -1.5], [0.95, -1.47]]);     // fan back plate
  revolve('always', 'plastic', [[0.95, -1.47], [0.19, -1.47]]);
  revolve('always', 'plastic', [[0.3, -1.5], [0.95, -1.5]]);
  for (let k = 0; k < 11; k++) {
    const theta = k * (360 / 11);
    const [x, y] = polar(0.63, theta, 0);
    add('always', 'plastic', new THREE.BoxGeometry(0.62, 0.03, 0.24),
      mul(at(x, y, -1.62), rotZ(theta * DEG)));
  }

  /* ---- Inside: only the cutaway shows these ----------------------------- */
  ring('lam', 0.56, 0.88, -0.72, 0.72, 'lam');                     // stator core
  for (const z of [-0.9, 0.9]) {                                   // end windings
    const coil = Array.from({ length: 21 }, (_, i) => {
      const a = (-90 + i * 18) * DEG;
      return [0.72 + 0.14 * Math.cos(a), z + 0.2 * Math.sin(a)];
    });
    revolve('open', 'copper', coil);                                // whole: a winding is not sliced
  }
  revolve('open', 'alu', [[0.19, -0.72], [0.53, -0.72]]);           // rotor
  revolve('open', 'alu', [[0.53, -0.72], [0.53, 0.72]]);
  revolve('open', 'alu', [[0.53, 0.72], [0.19, 0.72]]);
  for (let k = 0; k < 16; k++) {                                   // rotor bars, skewed
    const theta = k * 22.5;
    const [x, y] = polar(0.53, theta, 0);
    add('open', 'lam', new THREE.BoxGeometry(0.012, 0.05, 1.44),
      mul(at(x, y, 0), rotZ(theta * DEG), rotX(0.06)));
  }
  for (const [h0, h1] of [[-1.2, -1.04], [1.12, 1.28]]) {          // bearings
    revolve('open', 'steel', [[0.19, h0], [0.42, h0]]);
    revolve('open', 'steel', [[0.42, h0], [0.42, h1]]);
    revolve('open', 'steel', [[0.42, h1], [0.19, h1]]);
  }

  /* ---- Terminal box ------------------------------------------------------ */
  const roundedRect = (w, l, r) => {
    const s = new Shape();
    const x = w / 2, y = l / 2;
    s.moveTo(-x + r, -y);
    s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
    s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  };
  /* A slab with a rounded-rectangle plan, standing on y0. */
  const slab = (material, w, l, r, y0, height, zc, bevel = 0) => add('always', material,
    new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, l - bevel * 2, r), {
      depth: height - bevel * 2, curveSegments: 6,
      bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2,
    }),
    mul(at(0, y0 + bevel, zc), rotX(-Math.PI / 2)));

  slab('paint', 0.72, 0.84, 0.05, 0.86, 0.28, 0.15);              // pedestal
  slab('paint', 0.9, 1.1, 0.09, 1.1, 0.32, 0.15, 0.015);          // body
  slab('dark', 0.87, 1.07, 0.08, 1.415, 0.02, 0.15);              // gasket
  slab('paint', 0.94, 1.14, 0.1, 1.43, 0.08, 0.15, 0.02);         // lid
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {            // lid screws
    add('always', 'steel', new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12),
      at(sx * 0.37, 1.52, 0.15 + sz * 0.47));
  }
  for (const z of [-0.12, 0.42]) {                                 // cable glands
    add('always', 'steel', new THREE.CylinderGeometry(0.105, 0.105, 0.06, 6),
      mul(at(0.48, 1.26, z), rotZ(-Math.PI / 2)));
    add('always', 'cowl', new THREE.CylinderGeometry(0.075, 0.075, 0.14, 20),
      mul(at(0.58, 1.26, z), rotZ(-Math.PI / 2)));
    add('always', 'dark', new THREE.CylinderGeometry(0.045, 0.045, 0.004, 16),
      mul(at(0.652, 1.26, z), rotZ(-Math.PI / 2)));
  }

  /* ---- Lifting eye -------------------------------------------------------- */
  slab('paint', 0.34, 0.34, 0.06, 0.9, 0.17, -0.82);
  add('always', 'steel', new THREE.CylinderGeometry(0.075, 0.075, 0.05, 6), at(0, 1.095, -0.82));
  add('always', 'steel', new THREE.TorusGeometry(0.115, 0.036, 12, 32), at(0, 1.235, -0.82));

  /* ---- Feet ---------------------------------------------------------------- */
  for (const side of [-1, 1]) {
    const pts = [[0.42, -1.32], [1.2, -1.32], [1.2, -1.2], [0.98, -1.2], [0.78, -0.58], [0.42, -0.86]]
      .map(([x, y]) => new Vector2(x * side, y));
    add('feet', 'paint', new THREE.ExtrudeGeometry(new Shape(pts), {
      depth: 1.86, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1,
    }), at(0, 0, -0.93));
    for (const z of [-0.68, 0.68]) {
      add('feet', 'dark', new THREE.CylinderGeometry(0.065, 0.065, 0.124, 16), at(1.09 * side, -1.26, z));
    }
  }

  /* ---- Bake: one mesh per material per group ------------------------------ */
  const object = new THREE.Group();
  const groups = {};
  let triangles = 0;
  for (const b of buckets.values()) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    triangles += b.pos.length / 9;
    if (!groups[b.group]) { groups[b.group] = new THREE.Group(); object.add(groups[b.group]); }
    const mesh = new THREE.Mesh(geometry, materials[b.material]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    groups[b.group].add(mesh);
  }

  /* One light with a direction, for form. Everything else is the room. */
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight('#ffffff', 1.5);
  key.position.set(3.5, 6, 4.5);
  key.castShadow = true;                                           // the one shadow-casting light
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 1, far: 20 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight('#ffffff', 1.3);
  rim.position.set(4, 1.5, -5);
  lights.add(key, rim);

  /** Apply the page's choices. Every one is a visibility flag or one colour. */
  const apply = ({ finish, feet = true, key: keyed = true, cut = false } = {}) => {
    if (finish) materials.paint.color.set(finish);
    groups.closed.visible = !cut;
    groups.open.visible = cut;
    groups.feet.visible = feet;
    groups.key.visible = keyed;
  };
  apply(initial);

  return { object, lights, apply, anchors: ANCHORS, triangles };
}
