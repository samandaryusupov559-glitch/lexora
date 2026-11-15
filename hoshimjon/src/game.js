(function () {
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
function speak(t) {
  try {
    const u = new SpeechSynthesisUtterance(String(t).replace(/[{}]/g, ''));
    u.lang = 'en-US'; u.rate = 0.9;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  } catch (e) {}
}
let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 3600);
}

/* ================= HOLAT ================= */
/* Lexora ichida (iframe) yoki lexoralc.uz da ishlaganda practice pack ilovadagi xaridga bog'lanadi.
   Boshqa joyda (masalan, ko'rib chiqish sahifasida) sinash uchun demo tugmasi qoladi. */
const EMBED = /[?&]embed=1/.test(location.search);
const HOSTED = /(^|\.)lexoralc\.uz$|\.github\.io$|^localhost$|^127\./.test(location.hostname);
const DEMO = !EMBED && !HOSTED;
let LX = null;              // ilovadan kelgan {hasPack, uid}
const SKEY = () => 'hj_saved' + (LX && LX.uid && !LX.anon ? '_' + LX.uid : '');
const S = {
  mode: 'title',            // title | story | play | dialog | summary | catalog | end
  chapter: 1, hearts: 3, mistakes: 0,
  saved: store.get('hj_saved', {}),
  hasPack: DEMO ? store.get('hj_pack', false) : false,
  showUz: false, started: false,
  stats: {}, level: 1, topics: {}      // moslashuv: so'z statistikasi, daraja (0 oson, 1 o'rta, 2 qiyin), suhbat mavzulari
};
let D = null;               // joriy suhbat
function persist() { scheduleProg(); store.set(SKEY(), S.saved); store.set(SKEY() + '_prog', { stats: S.stats, level: S.level, topics: S.topics }); if (DEMO) store.set('hj_pack', S.hasPack); }
function loadProg() {
  const p = store.get(SKEY() + '_prog', {});
  S.stats = p.stats || {}; S.level = typeof p.level === 'number' ? p.level : 1; S.topics = p.topics || {};
  S.showUz = S.level === 0;
}
loadProg();
const LEVEL_NAMES = ['Oson', "O'rta", 'Qiyin'];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function nodeKeys(node) { return (node.say.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1)).filter(k => LEX[k]); }
function note(node, ok) {
  if (node.memo) return;
  nodeKeys(node).forEach(k => { const s = S.stats[k] || (S.stats[k] = { ok: 0, miss: 0 }); if (ok) s.ok++; else s.miss++; });
  persist();
}
const weakness = k => { const s = S.stats[k] || { ok: 0, miss: 0 }; return (s.miss - s.ok) * 10 - s.ok; };
/* Noor: saqlangan so'zlardan, avval xato qilinganlardan boshlab, 3 savollik takrorlash */
function reviewTree() {
  const pick = Object.keys(S.saved).filter(k => LEX[k]).map(k => [k, weakness(k) + Math.random()]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  const all = Object.keys(LEX), tree = {};
  pick.forEach((k, i) => {
    const right = LEX[k].uz;
    const others = shuffle(all.filter(x => x !== k && LEX[x].uz !== right)).slice(0, 2).map(x => LEX[x].uz);
    const last = i === pick.length - 1;
    tree['n' + (i + 1)] = {
      say: (i ? 'Next one. ' : "Let's review your words. ") + 'What does {' + k + '} mean?', uz: "'" + k + "' nimani anglatadi?",
      choices: shuffle([{ t: right, uz: '', ok: true, next: last ? 'END' : 'n' + (i + 2) }].concat(others.map(o => ({ t: o, uz: '', ok: false, why: "To'g'ri javob: " + right + '. ' + LEX[k].g }))))
    };
  });
  return tree;
}
function savedCount() { return Object.keys(S.saved).filter(k => LEX[k]).length; }

/* ================= THREE: SAHNA ================= */
const app = $('#app'), canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
(function sky() {
  const cv = document.createElement('canvas'); cv.width = 2; cv.height = 256;
  const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#2f3d86'); gr.addColorStop(0.42, '#c8718f'); gr.addColorStop(0.74, '#f6a96b'); gr.addColorStop(1, '#fbd39a');
  g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  scene.background = new THREE.CanvasTexture(cv);
  scene.fog = new THREE.Fog(0xf2b184, 45, 135);
})();
scene.add(new THREE.HemisphereLight(0xffd9b0, 0x56664a, 0.95));
const sun = new THREE.DirectionalLight(0xffb870, 1.1);
sun.position.set(40, 32, 26); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 1, far: 160 });
sun.shadow.bias = -0.0006;
scene.add(sun);

const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.88, metalness: 0 }, o || {}));
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = rng(77);

/* ---- zamin, yo'llar ---- */
(function ground() {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), M(0x7fae6a));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  const road = M(0x5a5d6a);
  const r1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 150), road); r1.rotation.x = -Math.PI / 2; r1.position.y = 0.02; r1.receiveShadow = true; scene.add(r1);
  const r2 = new THREE.Mesh(new THREE.PlaneGeometry(150, 8), road); r2.rotation.x = -Math.PI / 2; r2.position.y = 0.021; r2.receiveShadow = true; scene.add(r2);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(10, 48), M(0xdccdaa)); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; plaza.receiveShadow = true; scene.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(9.2, 10, 48), M(0xb9845a)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; scene.add(ring);
  const dash = M(0xf1e8cf);
  for (let z = -66; z <= 66; z += 6) { if (Math.abs(z) < 11) continue; const d = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.6), dash); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.03, z); scene.add(d); }
  for (let x = -66; x <= 66; x += 6) { if (Math.abs(x) < 11) continue; const d = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3), dash); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.03, 0); scene.add(d); }
})();

/* ---- binolar ---- */
const boxes = [];      // to'g'ri to'rtburchak to'siqlar
const circles = [];    // dumaloq to'siqlar
function signTex(text, bg, fg) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
  g.fillStyle = fg; g.font = 'bold 60px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 68);
  return new THREE.CanvasTexture(cv);
}
const FACE = { pz: [0, 0, 1], px: [Math.PI / 2, 1, 0], nx: [-Math.PI / 2, -1, 0], nz: [Math.PI, 0, -1] };
function addBuilding(o) {
  const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = FACE[o.face][0];
  const mk = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  mk(new THREE.BoxGeometry(o.w, o.h, o.d), M(o.color), 0, o.h / 2, 0);
  mk(new THREE.BoxGeometry(o.w + 0.3, 0.5, o.d + 0.3), M(0x8d7f6c), 0, 0.25, 0);
  const rh = o.rh || 2.4;
  const rg = new THREE.Group(); rg.scale.set((o.w / 2 + 0.7) / 0.7071, rh, (o.d / 2 + 0.7) / 0.7071); rg.position.y = o.h + rh / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), M(o.roof)); cone.rotation.y = Math.PI / 4; cone.castShadow = true; rg.add(cone); g.add(rg);
  if (o.sign) {
    mk(new THREE.BoxGeometry(1.7, 2.7, 0.25), M(0x5a3a28), 0, 1.35, o.d / 2 + 0.02);
    mk(new THREE.BoxGeometry(o.w * 0.5, 0.14, 1.5), M(o.awning || 0xc8452f), 0, 3.1, o.d / 2 + 0.7).rotation.x = 0.22;
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(o.w * 0.8, 6.4), 1.5), new THREE.MeshBasicMaterial({ map: signTex(o.sign, '#2a2230', '#f6d37a') }));
    sp.position.set(0, 4.1, o.d / 2 + 0.06); g.add(sp);
  }
  const glass = M(0xffe7a6, { emissive: 0xffc866, emissiveIntensity: 0.55, roughness: 0.4 });
  const rows = o.h > 6 ? [2.3, 5.3, 7.4] : [2.4];
  rows.forEach((y, ri) => {
    const cols = o.sign && ri === 0 ? [-1, 1] : [-1, 0, 1];
    cols.forEach(c => mk(new THREE.BoxGeometry(1.4, 1.3, 0.16), glass, c * o.w * 0.3, y, o.d / 2 + 0.02));
  });
  scene.add(g);
  const sw = (o.face === 'pz' || o.face === 'nz');
  const hx = (sw ? o.w : o.d) / 2, hz = (sw ? o.d : o.w) / 2;
  boxes.push({ x0: o.x - hx, x1: o.x + hx, z0: o.z - hz, z1: o.z + hz });
  const f = FACE[o.face];
  return { front(dist) { return { x: o.x + f[1] * (o.d / 2 + dist), z: o.z + f[2] * (o.d / 2 + dist) }; } };
}
const market = addBuilding({ x: -12, z: -14, w: 9, d: 8, h: 4.6, color: 0xe2a27a, roof: 0x9b3b2c, face: 'px', sign: 'MARKET', awning: 0xc8452f });
const cafe = addBuilding({ x: 12, z: -14, w: 9, d: 8, h: 4.6, color: 0x7cb7c4, roof: 0x2f5d6b, face: 'nx', sign: 'CAFE', awning: 0xf2b035 });
const hotel = addBuilding({ x: 14, z: 17, w: 12, d: 10, h: 9, color: 0xe9d8b4, roof: 0x6b4a8a, face: 'nx', sign: 'HOSTEL', awning: 0x6b4a8a, rh: 3 });
const library = addBuilding({ x: -13, z: 16, w: 10, d: 8, h: 6, color: 0xb7a2d1, roof: 0x4a3d6b, face: 'px', sign: 'LIBRARY', awning: 0x3f9a62 });
[[-32, -4, 'px', 0xd9b08c], [-32, 14, 'px', 0xc9a3a3], [-32, -24, 'px', 0xa9c4a0], [32, 2, 'nx', 0xe3c98f], [32, -22, 'nx', 0xa6b9d6], [32, 26, 'nx', 0xd6a58f], [-12, 36, 'nz', 0xc7b79a], [14, 38, 'nz', 0xb9a6c4], [-14, -38, 'pz', 0xd8b58a], [12, -40, 'pz', 0xb5c9a3]]
  .forEach(([x, z, f, c]) => addBuilding({ x, z, w: 8, d: 7, h: 4.6, color: c, roof: [0x9b3b2c, 0x6a4a3a, 0x445a7a][Math.floor(rand() * 3)], face: f }));

/* ---- favvora ---- */
const fountain = new THREE.Group();
(function () {
  const stone = M(0xcfc8b8);
  const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; fountain.add(m); return m; };
  add(new THREE.CylinderGeometry(3, 3.2, 0.7, 28), stone, 0.35);
  fountain.water = add(new THREE.CylinderGeometry(2.55, 2.55, 0.12, 28), M(0x59c1e0, { emissive: 0x1a5a77, emissiveIntensity: 0.35, transparent: true, opacity: 0.92 }), 0.7);
  add(new THREE.CylinderGeometry(0.35, 0.45, 2, 12), stone, 1.5);
  add(new THREE.CylinderGeometry(1.2, 0.5, 0.3, 18), stone, 2.5);
  add(new THREE.SphereGeometry(0.4, 14, 10), M(0x59c1e0, { emissive: 0x1a5a77, emissiveIntensity: 0.4 }), 2.85);
  scene.add(fountain);
  circles.push({ x: 0, z: 0, r: 3.3 });
})();

/* ---- daraxtlar, chiroqlar, skameyka, bulutlar ---- */
const NPC_SPOTS = [[-5.6, -14], [5.6, -14], [6.6, 17], [-7, 7.5], [-6.6, 16], [4.6, -4.4]];
(function trees() {
  const trunk = M(0x6b4a30), leaf1 = M(0x3f8a4f), leaf2 = M(0x58a35a);
  let n = 0, tries = 0;
  while (n < 55 && tries < 800) {
    tries++;
    const x = (rand() - 0.5) * 112, z = (rand() - 0.5) * 112;
    if (Math.abs(x) < 7 || Math.abs(z) < 7 || Math.hypot(x, z) < 13) continue;
    if (boxes.some(b => x > b.x0 - 3.5 && x < b.x1 + 3.5 && z > b.z0 - 3.5 && z < b.z1 + 3.5)) continue;
    if (NPC_SPOTS.some(p => Math.hypot(p[0] - x, p[1] - z) < 5)) continue;
    const s = 0.8 + rand() * 0.7, g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1.7, 8), trunk); t.position.y = 0.85; t.castShadow = true; g.add(t);
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.8, 8), leaf1); c1.position.y = 2.8; c1.castShadow = true; g.add(c1);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.3, 8), leaf2); c2.position.y = 4.1; c2.castShadow = true; g.add(c2);
    scene.add(g); circles.push({ x, z, r: 0.6 * s }); n++;
  }
})();
(function lamps() {
  const pole = M(0x2c2f3a), bulb = new THREE.MeshBasicMaterial({ color: 0xffe3a0 });
  const spots = [];
  [-36, -26, 24, 34].forEach(z => { spots.push([5.4, z], [-5.4, z]); });
  [-36, -26, 24, 34].forEach(x => { spots.push([x, 5.4], [x, -5.4]); });
  spots.forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8), pole); p.position.set(x, 2.1, z); p.castShadow = true; scene.add(p);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), bulb); b.position.set(x, 4.4, z); scene.add(b);
  });
})();
(function bench() {
  const g = new THREE.Group(); g.position.set(-9.2, 0, 7.2); g.rotation.y = Math.PI / 2 + 0.5;
  const wood = M(0x8a5a3a), iron = M(0x2c2f3a);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.7), wood); seat.position.y = 0.6; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.12), wood); back.position.set(0, 1, -0.3); back.castShadow = true; g.add(back);
  [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), iron); l.position.set(s, 0.3, 0); g.add(l); });
  scene.add(g); circles.push({ x: -9.2, z: 7.2, r: 1.2 });
})();
const clouds = [];
(function () {
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff1e0, transparent: true, opacity: 0.85, fog: false });
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    for (let j = 0; j < 4; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 2, 10, 8), mat); s.position.set(j * 4 - 6, rand() * 1.5, rand() * 3); s.scale.y = 0.55; g.add(s); }
    g.position.set((rand() - 0.5) * 220, 42 + rand() * 12, (rand() - 0.5) * 200);
    scene.add(g); clouds.push(g);
  }
})();

/* ================= PERSONAJLAR ================= */
function plaidTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#a8302b'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#1b181d';
  for (let i = 0; i < 128; i += 64) { g.globalAlpha = 0.9; g.fillRect(i, 0, 28, 128); g.fillRect(0, i, 128, 28); }
  g.globalAlpha = 1; g.fillStyle = '#e8d9bf';
  for (let i = 0; i < 128; i += 64) { g.fillRect(i + 40, 0, 3, 128); g.fillRect(0, i + 40, 128, 3); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6); return t;
}
function knitTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#eadfc9'; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, 'rgba(120,100,70,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(120,100,70,.35)'); g.fillStyle = gr; g.fillRect(x, 0, 8, 128); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); return t;
}
function buildChar(opt) {
  const o = Object.assign({ skin: 0xf0bf9b, hair: 0x2b1d17, shirt: 0x3b6ea5, pants: 0x2b2d36, shoe: 0xf3f3f3, hairStyle: 'short', hat: null, apron: null, backpack: false, plaid: false, hood: false, scale: 1 }, opt);
  const g = new THREE.Group(), P = {};
  const mk = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; (parent || g).add(m); return m; };
  const skin = M(o.skin), hair = M(o.hair), pants = M(o.pants), shoeM = M(o.shoe);
  const shirt = o.plaid ? new THREE.MeshStandardMaterial({ map: plaidTex(), roughness: 0.9 }) : M(o.shirt);
  [-1, 1].forEach(s => {
    const L = new THREE.Group(); L.position.set(s * 0.21, 0.62, 0); g.add(L);
    mk(new THREE.CylinderGeometry(0.18, 0.16, 0.56, 10), pants, 0, -0.28, 0, L);
    mk(new THREE.BoxGeometry(0.34, 0.17, 0.5), shoeM, 0, -0.58, 0.07, L);
    P[s < 0 ? 'legL' : 'legR'] = L;
  });
  mk(new THREE.CylinderGeometry(0.44, 0.48, 0.78, 14), shirt, 0, 1.0, 0);
  if (o.plaid) mk(new THREE.BoxGeometry(0.34, 0.62, 0.06), M(0xf4f1ea), 0, 1.02, 0.46);
  if (o.hood) { const h = mk(new THREE.SphereGeometry(0.3, 12, 10), M(0x5b5f6b), 0, 1.42, -0.3); h.scale.set(1.3, 0.8, 0.8); }
  if (o.apron) mk(new THREE.BoxGeometry(0.62, 0.7, 0.07), M(o.apron), 0, 0.96, 0.47);
  [-1, 1].forEach(s => {
    const A = new THREE.Group(); A.position.set(s * 0.6, 1.3, 0); g.add(A);
    mk(new THREE.CylinderGeometry(0.14, 0.13, 0.56, 10), shirt, 0, -0.27, 0, A);
    mk(new THREE.SphereGeometry(0.14, 10, 8), skin, 0, -0.6, 0, A);
    P[s < 0 ? 'armL' : 'armR'] = A;
  });
  if (o.backpack) {
    const bp = M(0x8a5a3a), dk = M(0x5a3a28);
    mk(new THREE.BoxGeometry(0.66, 0.78, 0.32), bp, 0, 1.0, -0.46);
    mk(new THREE.BoxGeometry(0.68, 0.18, 0.34), dk, 0, 1.38, -0.46);
    mk(new THREE.BoxGeometry(0.4, 0.3, 0.1), dk, 0, 0.85, -0.66);
    [-1, 1].forEach(s => mk(new THREE.BoxGeometry(0.1, 0.7, 0.04), dk, s * 0.27, 1.1, 0.44));
  }
  const head = new THREE.Group(); head.position.y = 1.9; g.add(head); P.head = head;
  const sk = mk(new THREE.SphereGeometry(0.6, 24, 18), skin, 0, 0, 0, head); sk.scale.y = 0.95;
  [-1, 1].forEach(s => mk(new THREE.SphereGeometry(0.11, 10, 8), skin, s * 0.6, -0.02, 0, head));
  const eye = M(0x3a2015), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach(s => {
    const e = mk(new THREE.SphereGeometry(0.095, 12, 10), eye, s * 0.21, 0.02, 0.53, head); e.scale.z = 0.55;
    mk(new THREE.SphereGeometry(0.03, 8, 6), white, s * 0.21 + 0.03, 0.06, 0.575, head);
    const br = mk(new THREE.BoxGeometry(0.17, 0.04, 0.04), hair, s * 0.21, 0.2, 0.54, head); br.rotation.z = -s * 0.12;
    const ch = mk(new THREE.SphereGeometry(0.09, 10, 8), M(0xf3907f), s * 0.34, -0.1, 0.49, head); ch.scale.set(1, 0.7, 0.3);
  });
  mk(new THREE.SphereGeometry(0.05, 8, 6), M(0xdea07e), 0, -0.07, 0.6, head);
  P.mouth = mk(new THREE.SphereGeometry(0.07, 10, 8), M(0x7a2b2b), 0, -0.24, 0.55, head); P.mouth.scale.set(1.5, 0.5, 0.4);
  if (o.hairStyle !== 'bald') {
    const hc = mk(new THREE.SphereGeometry(0.63, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), hair, 0, 0.06, -0.02, head); hc.rotation.x = -0.45;
    [-0.36, -0.18, 0, 0.18, 0.36].forEach(x => mk(new THREE.SphereGeometry(0.14, 10, 8), hair, x, 0.39 - Math.abs(x) * 0.35, 0.45, head));
    if (o.hairStyle === 'long') { const lg = mk(new THREE.SphereGeometry(0.62, 16, 12), hair, 0, -0.25, -0.28, head); lg.scale.set(1, 1.25, 0.75); }
    if (o.hairStyle === 'ponytail') { mk(new THREE.SphereGeometry(0.2, 10, 8), hair, 0, 0.1, -0.68, head); const tl = mk(new THREE.ConeGeometry(0.16, 0.7, 8), hair, 0, -0.25, -0.78, head); tl.rotation.x = Math.PI; }
  }
  if (o.hat === 'beanie') {
    const hat = new THREE.Group(); head.add(hat); P.hat = hat;
    const knit = new THREE.MeshStandardMaterial({ map: knitTex(), roughness: 1 });
    const cap = mk(new THREE.SphereGeometry(0.68, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), knit, 0, 0.15, -0.03, hat); cap.scale.y = 0.95; cap.rotation.x = -0.1;
    const brim = mk(new THREE.TorusGeometry(0.58, 0.12, 10, 28), knit, 0, 0.33, -0.04, hat); brim.rotation.x = Math.PI / 2 - 0.1;
    mk(new THREE.SphereGeometry(0.42, 14, 10), knit, 0, 0.62, -0.34, hat);
  }
  if (o.hat === 'chef') {
    const wm = M(0xf6f1e4);
    mk(new THREE.CylinderGeometry(0.42, 0.44, 0.5, 16), wm, 0, 0.78, 0, head);
    mk(new THREE.SphereGeometry(0.5, 14, 10), wm, 0, 1.12, 0, head);
  }
  if (o.hat === 'flatcap') {
    const cm = M(0x6b5f50);
    const c = mk(new THREE.CylinderGeometry(0.7, 0.68, 0.16, 20), cm, 0, 0.4, 0, head);
    mk(new THREE.BoxGeometry(0.7, 0.05, 0.38), cm, 0, 0.33, 0.62, head).rotation.x = 0.2;
    c.scale.z = 0.95;
  }
  g.scale.setScalar(o.scale);
  P.mats = { shirt, hair, skin, pants };
  const root = new THREE.Group(); root.add(g);
  return { root, g, P };
}
function labelSprite(text, bg, fg) {
  const fs = 40, cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  ctx.font = 'bold ' + fs + 'px Arial, sans-serif';
  const w = Math.ceil(ctx.measureText(text).width) + 44; cv.width = w; cv.height = fs + 28;
  const c2 = cv.getContext('2d'); c2.font = 'bold ' + fs + 'px Arial, sans-serif';
  c2.fillStyle = bg; c2.beginPath(); c2.roundRect ? c2.roundRect(2, 2, w - 4, cv.height - 4, 22) : c2.rect(2, 2, w - 4, cv.height - 4); c2.fill();
  c2.fillStyle = fg; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(text, w / 2, cv.height / 2 + 2);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, fog: false }));
  sp.scale.set(w / 120, cv.height / 120, 1); return sp;
}
function markerSprite() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#f2b035'; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#171a29'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#171a29'; g.font = 'bold 84px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, fog: false }));
  sp.scale.set(1.1, 1.1, 1); return sp;
}

/* ---- O'yinchi qahramoni (sozlanadi) ---- */
function hashN(s) { let h = 2166136261; s = String(s || 'x'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const AVP = {
  skin: [0xf6d3b5, 0xf1c09b, 0xd5a16d, 0xb9825b, 0x855339, 0x5c3a26],
  hair: [0x24222a, 0x2b1d17, 0x5a3a22, 0xb07a3b, 0xd9b66a, 0xd4d2cf, 0xa83a3a],
  style: ['short', 'long', 'ponytail', 'bald'],
  shirt: [0xe05d5d, 0x3b6ea5, 0x58a55c, 0xe8a548, 0x8a63c9, 0x2f9e9a, 0xd9709f, 0xf3f3f3],
  pants: [0x2b2d36, 0x3a4a6b, 0x6b5a45, 0x4a6b4f, 0x7a3b3b],
  hat: [null, 'beanie', 'flatcap']
};
const AVK = ['skin', 'hair', 'style', 'shirt', 'pants', 'hat'];
const AVL = { skin: 'Teri rangi', hair: 'Soch rangi', style: 'Soch uslubi', shirt: 'Ust kiyim', pants: 'Shim', hat: 'Bosh kiyim' };
const avFromUid = uid => { const h = hashN(uid); return { skin: h % 6, hair: (h >> 3) % 7, style: (h >> 6) % 3, shirt: (h >> 9) % 8, pants: (h >> 12) % 5, hat: 0 }; };
const avClean = a => { const o = {}; AVK.forEach((k, i) => { const n = AVP[k].length, v = Array.isArray(a) ? a[i] : a && a[k]; o[k] = Number.isInteger(v) && v >= 0 && v < n ? v : 0; }); return o; };
const avOpts = a => ({ skin: AVP.skin[a.skin], hair: AVP.hair[a.hair], hairStyle: AVP.style[a.style], shirt: AVP.shirt[a.shirt], pants: AVP.pants[a.pants], hat: AVP.hat[a.hat] });
S.av = store.get('hj_avatar', null); if (S.av) S.av = avClean(S.av);
const hero = buildChar(avOpts(S.av || { skin: 1, hair: 1, style: 0, shirt: 1, pants: 0, hat: 0 }));
function rebuildHero() {
  const old = hero.root, pos = old.position.clone(), rot = old.rotation.y; scene.remove(old);
  Object.assign(hero, buildChar(avOpts(S.av))); hero.root.position.copy(pos); hero.root.rotation.y = rot; scene.add(hero.root);
  if (typeof LIVE !== 'undefined' && LIVE.heroLabel) hero.root.add(LIVE.heroLabel);
}
scene.add(hero.root);
const player = { pos: new THREE.Vector3(0, 0, 32), rot: Math.PI, walkT: 0, talking: false };

/* ---- NPClar: 3D modellar (GLB). Model yuklanguncha oddiy shakldagi nusxa turadi ---- */
const PLACE = {
  farid: () => market.front(2.4), maya: () => cafe.front(2.4), elena: () => hotel.front(2.4),
  leo: () => ({ x: -7, z: 7.5 }), noor: () => library.front(2.4), keeper: () => ({ x: 4.6, z: -4.4 })
};
const NPC_SCALE = 1.08;
const NPC = NPCS.map(def => {
  const p = PLACE[def.id]();
  const root = new THREE.Group(); root.position.set(p.x, 0, p.z); root.rotation.y = Math.atan2(-p.x, -p.z);
  const body = new THREE.Group(); root.add(body);
  const c = buildChar(def.look); body.add(c.root);
  const label = labelSprite(def.name, 'rgba(23,26,41,.85)', '#f7edd8'); label.position.y = 3.0; root.add(label);
  const marker = markerSprite(); marker.position.y = 4.0; marker.visible = false; root.add(marker);
  scene.add(root); circles.push({ x: p.x, z: p.z, r: 0.7 });
  return { def, pos: new THREE.Vector3(p.x, 0, p.z), root, body, fallback: c.root, label, marker, markerY: 4.0,
    rig: { head: c.P.head, mouth: c.P.mouth, mouthBase: 0.5, armR: c.P.armR }, baseRot: root.rotation.y, phase: Math.random() * 6 };
});
function rigModel(model) {
  model.updateMatrixWorld(true);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true });   // modelda normal yo'q: tekis soyalash
  const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });
  const all = new THREE.Box3();
  const info = meshes.map(m => {
    m.material = mat; m.castShadow = true; m.receiveShadow = true;
    const b = new THREE.Box3().setFromObject(m); all.union(b);
    return { m, y: (b.min.y + b.max.y) / 2, name: (m.name || '').toLowerCase() };
  });
  const NECK = 1.45;
  const headG = new THREE.Group(); headG.position.set(0, NECK, 0); model.add(headG);
  const eyes = info.filter(i => /eye_white|iris|pupil|eye_glint/.test(i.name));
  const mouth = info.filter(i => /smile|mouth|lip/.test(i.name));
  const mid = arr => arr.reduce((a, i) => a + i.y, 0) / Math.max(1, arr.length);
  const eyesG = new THREE.Group(), mouthG = new THREE.Group();
  eyesG.position.set(0, (eyes.length ? mid(eyes) : 1.83) - NECK, 0);
  mouthG.position.set(0, (mouth.length ? mid(mouth) : 1.6) - NECK, 0);
  headG.add(eyesG); headG.add(mouthG);
  model.updateMatrixWorld(true);
  eyes.forEach(i => eyesG.attach(i.m)); mouth.forEach(i => mouthG.attach(i.m));
  info.forEach(i => { if (i.m.parent !== eyesG && i.m.parent !== mouthG && i.y > NECK + 0.07 && !/neck|shoulder/.test(i.name)) headG.attach(i.m); });
  const group = new THREE.Group(); group.scale.setScalar(NPC_SCALE); group.add(model);
  return { group, top: all.max.y, rig: { head: headG, eyes: eyesG, mouth: mouthG, mouthBase: 1 } };
}
function loadModels() {
  if (!THREE.GLTFLoader) return;
  const loader = new THREE.GLTFLoader();
  NPC.forEach(n => {
    loader.load('models/' + n.def.file, gltf => {
      try {
        const m = rigModel(gltf.scene);
        n.body.remove(n.fallback); n.body.add(m.group); n.rig = m.rig;
        n.label.position.y = m.top * NPC_SCALE + 0.4; n.markerY = n.label.position.y + 0.95;
      } catch (e) { /* model xato bo'lsa oddiy nusxa qoladi */ }
    }, undefined, () => {});
  });
}
loadModels();
const npcById = id => NPC.find(n => n.def.id === id);

/* ================= KIRISH ================= */
const keys = {};
window.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { if (e.key === 'Escape') e.target.blur(); return; }
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys[k] = true;
  if (S.mode === 'play' && LIVE.on && (k === 't' || (k === 'Enter' && !nearestNpc()))) { e.preventDefault(); if (locked()) document.exitPointerLock(); $('#chat').classList.remove('min'); $('#cIn').focus(); return; }
  if (S.mode === 'play' && (k === 'e' || k === 'Enter')) { const n = nearestNpc(); if (n) openDialog(n); }
  if (S.mode === 'dialog') {
    if (k === 'Escape') closeDialog();
    if (k >= '1' && k <= '9') choose(parseInt(k, 10) - 1);
  }
  if (S.mode === 'catalog' && k === 'Escape') closeCatalog();
});
window.addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joy = $('#joy'), stick = $('#stick'); let jid = null; const jv = { x: 0, y: 0 };
function moveJoy(e) {
  const r = joy.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const m = r.width / 2 - 10, d = Math.hypot(dx, dy); if (d > m) { dx *= m / d; dy *= m / d; }
  stick.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; jv.x = dx / m; jv.y = -dy / m;
}
joy.addEventListener('pointerdown', e => { jid = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (x) {} moveJoy(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === jid) moveJoy(e); });
const endJoy = e => { if (e.pointerId === jid) { jid = null; jv.x = jv.y = 0; stick.style.transform = 'translate(0,0)'; } };
joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);
let camYaw = 0, camPitch = 0.5, drag = null, zoom = 9.5;
const locked = () => document.pointerLockElement === canvas;
canvas.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
canvas.addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id) {
    drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    camYaw -= (e.clientX - drag.x) * 0.006; camPitch = clamp(camPitch + (e.clientY - drag.y) * 0.004, 0.05, 1.35);
    drag.x = e.clientX; drag.y = e.clientY;
  }
});
const endDrag = e => {
  if (drag && e.pointerId === drag.id) {
    // sichqoncha bilan bir marta bosish: kursor yashirinadi va sichqoncha harakati kamerani aylantiradi (Esc: chiqish)
    if (e.type === 'pointerup' && e.pointerType === 'mouse' && drag.moved < 6 && S.mode === 'play' && !locked() && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch (x) {} }
    drag = null;
  }
};
document.addEventListener('mousemove', e => { if (locked() && S.mode === 'play') { camYaw -= e.movementX * 0.0032; camPitch = clamp(camPitch + e.movementY * 0.0028, 0.05, 1.35); } });
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = clamp(zoom + e.deltaY * 0.01, 4.5, 18); }, { passive: false });
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

function nearestNpc() {
  let best = null, bd = 3.8;
  for (const n of NPC) { const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z); if (d < bd) { bd = d; best = n; } }
  return best;
}
function collide(p, r) {
  for (const b of boxes) {
    const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      else {
        const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z, m = Math.min(l, rr, t, bt);
        if (m === l) p.x = b.x0 - r; else if (m === rr) p.x = b.x1 + r; else if (m === t) p.z = b.z0 - r; else p.z = b.z1 + r;
      }
    }
  }
  for (const c of circles) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
    if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
  }
}

/* ================= KAMERA VA SIKL ================= */
const focus = new THREE.Vector3(0, 2, 20); let camDist = 10, T = 0;
function resize() {
  const r = app.getBoundingClientRect(); const w = Math.max(280, r.width), h = Math.max(280, r.height);
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe(app); else window.addEventListener('resize', resize);
resize();

function updateCamera(dt) {
  if (S.mode !== 'play' && locked()) document.exitPointerLock();
  let tx, ty, tz, dist = 10, pitch = camPitch;
  if (S.mode === 'title' || S.mode === 'story' || S.mode === 'summary' || S.mode === 'end' || S.mode === 'catalog' && !S.started) {
    camYaw += dt * 0.1; tx = 0; ty = 2.5; tz = 0; dist = 34; pitch = 0.33;
  } else if (S.mode === 'avatar') {
    camYaw += dt * 0.5; player.rot = camYaw; tx = player.pos.x; ty = 1.9; tz = player.pos.z; dist = 6; pitch = 0.16;
  } else if (S.mode === 'dialog' && D) {
    const mx = (player.pos.x + D.npc.pos.x) / 2, mz = (player.pos.z + D.npc.pos.z) / 2;
    tx = mx; ty = camera.aspect < 1 ? -0.6 : 0.0; tz = mz; dist = camera.aspect < 1 ? 10.5 : 8.6; pitch = 0.2;
    const a = Math.atan2(D.npc.pos.x - player.pos.x, D.npc.pos.z - player.pos.z);
    const y1 = a + Math.PI / 2, y2 = a - Math.PI / 2;
    const tgt = Math.abs(angDiff(camYaw, y1)) < Math.abs(angDiff(camYaw, y2)) ? y1 : y2;
    camYaw += angDiff(camYaw, tgt) * Math.min(1, dt * 3);
  } else { tx = player.pos.x; ty = 1.6; tz = player.pos.z; dist = zoom; }
  const k = 1 - Math.exp(-dt * 6);
  focus.x += (tx - focus.x) * k; focus.y += (ty - focus.y) * k; focus.z += (tz - focus.z) * k;
  camDist += (dist - camDist) * k;
  camera.position.set(focus.x + Math.sin(camYaw) * Math.cos(pitch) * camDist, focus.y + Math.sin(pitch) * camDist, focus.z + Math.cos(camYaw) * Math.cos(pitch) * camDist);
  if (camera.position.y < 1.2) camera.position.y = 1.2;
  camera.lookAt(focus);
}

function update(dt) {
  T += dt;
  const P = hero.P;
  let moving = 0;
  if (S.mode === 'play') {
    if (keys.q) camYaw += dt * 1.8; if (keys.r) camYaw -= dt * 1.8;
    let ix = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + jv.x;
    let iz = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0) + jv.y;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const mag = Math.min(1, len);
    if (mag > 0.08) {
      const run = keys.Shift ? 1.7 : 1, spd = 5.4 * run * mag;
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      let dx = fx * iz + rx * ix, dz = fz * iz + rz * ix; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
      player.pos.x += dx * spd * dt; player.pos.z += dz * spd * dt;
      collide(player.pos, 0.55);
      player.pos.x = clamp(player.pos.x, -58, 58); player.pos.z = clamp(player.pos.z, -58, 58);
      player.rot += angDiff(player.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 14);
      moving = mag * run; player.walkT += dt * (8 + 3 * run);
    }
  }
  if (S.mode === 'dialog' && D) {
    const a = Math.atan2(D.npc.pos.x - player.pos.x, D.npc.pos.z - player.pos.z);
    player.rot += angDiff(player.rot, a) * Math.min(1, dt * 6);
  }
  hero.root.position.set(player.pos.x, 0, player.pos.z); hero.root.rotation.y = player.rot;
  const sw = Math.sin(player.walkT) * 0.75 * Math.min(1, moving);
  P.legL.rotation.x = sw; P.legR.rotation.x = -sw; P.armL.rotation.x = -sw * 0.9; P.armR.rotation.x = sw * 0.9;
  hero.g.position.y = moving ? Math.abs(Math.sin(player.walkT)) * 0.07 : Math.sin(T * 2) * 0.015;
  P.mouth.scale.y = D && D.heroTalk ? 0.5 + Math.abs(Math.sin(T * 14)) * 1.0 : 0.5;
  if (moving === 0) { P.legL.rotation.x *= 0.8; P.legR.rotation.x *= 0.8; }

  const active = CHAPTERS[S.chapter - 1] && npcById(CHAPTERS[S.chapter - 1].npc);
  for (const n of NPC) {
    const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z);
    let tr = n.baseRot;
    if (d < 9 && S.mode !== 'title') tr = Math.atan2(player.pos.x - n.pos.x, player.pos.z - n.pos.z);
    n.root.rotation.y += angDiff(n.root.rotation.y, tr) * Math.min(1, dt * 5);
    n.body.position.y = Math.sin(T * 1.8 + n.phase) * 0.02;
    const talking = D && D.npc === n && D.npcTalk, r = n.rig;
    if (r.head) r.head.rotation.x = talking ? Math.sin(T * 8) * 0.07 : Math.sin(T * 1.2 + n.phase) * 0.02;
    if (r.mouth) r.mouth.scale.y = talking ? r.mouthBase * (0.7 + Math.abs(Math.sin(T * 13)) * 1.1) : r.mouthBase;
    if (r.eyes) r.eyes.scale.y = ((T + n.phase) % 4.3) < 0.12 ? 0.1 : 1;
    if (r.armR) r.armR.rotation.x = talking ? -0.6 + Math.sin(T * 5) * 0.2 : 0;
    n.marker.visible = (S.mode === 'play' || S.mode === 'dialog') && n === active && S.started;
    n.marker.position.y = n.markerY + Math.sin(T * 3) * 0.18;
  }
  fountain.water.position.y = 0.7 + Math.sin(T * 2) * 0.012;
  clouds.forEach(c => { c.position.x += dt * 0.6; if (c.position.x > 130) c.position.x = -130; });
  liveUpdate(dt);
  updateCamera(dt);
  updateHud();
}
const arrow = $('#arrow'), dist = $('#dist'), promptBtn = $('#prompt');
function updateHud() {
  if (S.mode !== 'play' && S.mode !== 'dialog') { promptBtn.classList.add('hidden'); return; }
  const ch = CHAPTERS[S.chapter - 1];
  if (ch) {
    const t = npcById(ch.npc), dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z;
    const f = dx * -Math.sin(camYaw) + dz * -Math.cos(camYaw), r = dx * Math.cos(camYaw) + dz * -Math.sin(camYaw);
    arrow.style.transform = 'rotate(' + Math.atan2(r, f) + 'rad)';
    dist.textContent = Math.round(Math.hypot(dx, dz)) + ' m';
  }
  if (S.mode === 'play') {
    const n = nearestNpc();
    if (n) { promptBtn.textContent = 'Gaplashish: ' + n.def.name + ' (E)'; promptBtn.classList.remove('hidden'); promptBtn._n = n; }
    else promptBtn.classList.add('hidden');
  } else promptBtn.classList.add('hidden');
}
promptBtn.addEventListener('click', () => { if (S.mode === 'play' && promptBtn._n) openDialog(promptBtn._n); });
const clock = new THREE.Clock();
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), 0.05); update(dt); renderer.render(scene, camera); }

/* ================= HUD ================= */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1 5.6 3 2-2 3.6-3 5.6-3 3.4 0 5.5 3.4 4 6.8C19.5 16.4 12 21 12 21z"/></svg>';
function renderHearts() {
  $('#hearts').innerHTML = [0, 1, 2].map(i => HEART.replace('<svg', '<svg class="' + (i < S.hearts ? '' : 'off') + '"')).join('');
}
function renderHud() {
  renderHearts();
  $('#wCount').textContent = savedCount();
  const ch = CHAPTERS[S.chapter - 1];
  $('#obj').innerHTML = ch ? '<small>Qism ' + ch.n + ' / ' + CHAPTERS.length + '</small><b>' + esc(ch.title) + '</b><span>' + esc(ch.goal) + '</span>' : '<small>Final</small><b>Qalpoqcha topildi</b>';
}
$('#bWords').addEventListener('click', () => { if (S.mode === 'play') openCatalog(() => { hideOv(); S.mode = 'play'; }); });

/* ================= SUHBAT ================= */
const dLog = $('#dLog'), dCard = $('#dCard'), dChoices = $('#dChoices');
function rich(text) {
  return esc(text).replace(/\{([^}]+)\}/g, (m, k) => {
    const kk = k.replace(/&#39;/g, "'");
    return '<button class="w' + (S.saved[kk] ? ' saved' : '') + '" data-w="' + esc(kk) + '">' + k + '</button>';
  });
}
function openDialog(npc) {
  const def = npc.def, run = def.chapter === S.chapter;
  let tree, adv = false, startId = 'n1';
  const tops = (typeof TOPICS !== 'undefined' && TOPICS[def.id]) || [], done = S.topics[def.id] || 0;
  if (def.id === 'noor' && savedCount() >= 3) tree = reviewTree();
  else if (def.chapter === 0) {
    if (done >= 1 && tops[done - 1]) tree = tops[done - 1].tree; else tree = def.tree;
    adv = done === 0 || !!tops[done - 1];
  } else if (run) {
    tree = Object.assign({}, def.tree);
    const old = Object.keys(S.saved).filter(k => LEX[k] && S.saved[k].ch > 0 && S.saved[k].ch < S.chapter).sort((a, b) => weakness(b) - weakness(a));
    if (old.length) {
      tree.n0 = { memo: true, say: 'Nice to see you again! Do you still remember {' + old[0] + '}?', uz: "Yana ko'rishganimdan xursandman! '" + old[0] + "' so'zini hali eslaysizmi?", choices: [{ t: 'Yes, I do.', uz: 'Ha, eslayman.', ok: true, next: 'n1' }] };
      startId = 'n0';
    }
  } else if (def.chapter < S.chapter && tops[done]) { tree = tops[done].tree; adv = true; }
  else {
    const i = def.idle;
    tree = { n1: { say: i.say, uz: i.uz, choices: [{ t: i.reply, uz: i.replyUz, ok: true, next: 'END' }] } };
  }
  trk('dialogs');
  D = { npc, tree, id: startId, run, adv, locked: false, npcTalk: false, heroTalk: false, nodeMiss: false };
  $('#dlg').classList.toggle('hard', S.level === 2);
  S.mode = 'dialog';
  $('#dName').textContent = def.name; $('#dRole').textContent = def.role;
  dLog.innerHTML = ''; dCard.classList.add('hidden'); dChoices.innerHTML = '';
  $('#dlg').classList.remove('hidden'); $('#hint').classList.add('hidden'); app.classList.add('in-dlg');
  syncUz();
  showNode();
}
function syncUz() { $('#dlg').classList.toggle('show-uz', S.showUz); $('#dUz').classList.toggle('on', S.showUz); $('#dUz').textContent = S.showUz ? 'Tarjima: yoqiq' : 'Tarjima'; }
$('#dUz').addEventListener('click', () => { S.showUz = !S.showUz; syncUz(); });
$('#dClose').addEventListener('click', () => closeDialog());
function logRow(kind, html, uz, speakText) {
  const row = document.createElement('div'); row.className = 'row ' + kind;
  const b = document.createElement('div'); b.className = 'bub'; b.innerHTML = html;
  if (speakText) { const s = document.createElement('button'); s.className = 'spk'; s.textContent = 'Tinglash'; s.addEventListener('click', () => speak(speakText)); b.appendChild(s); }
  row.appendChild(b);
  if (uz) { const u = document.createElement('div'); u.className = 'uzl'; u.textContent = uz; row.appendChild(u); }
  dLog.appendChild(row); dLog.scrollTop = dLog.scrollHeight;
}
function showNode() {
  const node = D.tree[D.id]; D.nodeMiss = false;
  D.npcTalk = true; setTimeout(() => { if (D) D.npcTalk = false; }, 1500);
  logRow('npc', rich(node.say), node.uz, node.say);
  renderChoices(node);
}
function renderChoices(node) {
  dChoices.innerHTML = '';
  node.choices.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'choice';
    b.innerHTML = '<span class="k">' + (i + 1) + '</span>' + esc(c.t) + '<small>' + esc(c.uz) + '</small>';
    b.addEventListener('click', () => choose(i));
    dChoices.appendChild(b);
  });
}
function choose(i) {
  if (S.mode !== 'dialog' || !D || D.locked) return;
  const node = D.tree[D.id], c = node.choices[i]; if (!c) return;
  const btn = dChoices.querySelectorAll('.choice')[i];
  if (!btn || btn.disabled) return;
  if (c.ok) {
    if (!D.nodeMiss) note(node, true);
    D.locked = true; D.heroTalk = true; setTimeout(() => { if (D) D.heroTalk = false; }, 1400);
    logRow('me', esc(c.t), c.uz, c.t); dChoices.innerHTML = '';
    setTimeout(() => {
      if (!D) return;
      D.locked = false;
      if (c.next === 'END') endDialog(true); else { D.id = c.next; showNode(); }
    }, 750);
  } else {
    if (!D.nodeMiss) { D.nodeMiss = true; note(node, false); trk('mistakes'); }
    btn.classList.add('wrong'); btn.disabled = true;
    const w = document.createElement('div'); w.className = 'why'; w.textContent = c.why; btn.after(w);
    if (D.run) {
      S.hearts = Math.max(0, S.hearts - 1); S.mistakes++; renderHearts();
      if (S.hearts <= 0) { D.locked = true; setTimeout(exhausted, 900); }
    }
  }
}
function exhausted() {
  if (!D) return;
  logRow('sys', "Kuchingiz tugadi. Dam olib, suhbatni qaytadan boshlaysiz.");
  dChoices.innerHTML = '<button class="choice" id="again"><span class="k">1</span>Qaytadan boshlash</button>';
  $('#again').addEventListener('click', () => {
    S.hearts = 3; S.mistakes = 0; renderHearts();
    D.id = 'n1'; D.locked = false; dLog.innerHTML = ''; dCard.classList.add('hidden'); showNode();
  });
}
function closeDialog() { endDialog(false); }
function endDialog(done) {
  if (done && D) trk('done');
  const wasRun = D && D.run && D.npc.def.chapter === S.chapter, after = D && D.npc.def.afterEnd;
  if (done && D && D.adv) { S.topics[D.npc.def.id] = (S.topics[D.npc.def.id] || 0) + 1; persist(); }
  $('#dlg').classList.add('hidden'); dCard.classList.add('hidden'); app.classList.remove('in-dlg');
  D = null; S.mode = 'play';
  if (done && wasRun) completeChapter();
  else if (done && after === 'catalog') openCatalog(() => { hideOv(); S.mode = 'play'; });
}
dLog.addEventListener('click', e => { const b = e.target.closest('.w'); if (b) showCard(b.dataset.w); });
function showCard(k) {
  const e = LEX[k]; if (!e) return;
  const saved = !!S.saved[k];
  dCard.innerHTML = '<div class="wc-top"><b>' + esc(k) + '</b><button class="chip" data-a="say">Tinglash</button></div><button class="x" data-a="close" aria-label="Yopish">&times;</button>'
    + '<div class="wc-uz">' + esc(e.uz) + '</div><div class="wc-g">' + esc(e.g) + '</div><div class="wc-ex">' + esc(e.ex) + '</div>'
    + '<button class="save' + (saved ? ' on' : '') + '" data-a="save">' + (saved ? "Saqlandi. Olib tashlash" : "So'zni saqlash") + '</button>';
  dCard.classList.remove('hidden'); dCard.dataset.k = k;
  dLog.scrollTop = dLog.scrollHeight;
}
dCard.addEventListener('click', e => {
  const a = e.target.dataset.a, k = dCard.dataset.k; if (!a) return;
  if (a === 'close') dCard.classList.add('hidden');
  if (a === 'say') speak(k);
  if (a === 'save') { toggleSave(k, D && D.run ? D.npc.def.chapter : 0); showCard(k); }
});
function toggleSave(k, ch) {
  if (S.saved[k]) delete S.saved[k]; else { S.saved[k] = { ch: ch || 0 }; trk('saved'); }
  persist(); $('#wCount').textContent = savedCount();
  document.querySelectorAll('#dLog .w').forEach(b => { if (b.dataset.w === k) b.classList.toggle('saved', !!S.saved[k]); });
}

/* ================= EKRANLAR ================= */
const ov = $('#ov');
/* ---- Qahramonni sozlash ---- */
let avBack = null;
function swatchHex(k, i) { const v = AVP[k][i]; return v == null ? null : '#' + v.toString(16).padStart(6, '0'); }
function renderAvatarPanel() {
  const a = S.av;
  $('#avBody').innerHTML = AVK.map(k => '<div class="av-row"><span>' + AVL[k] + '</span><div class="av-opts">' + AVP[k].map((v, i) => {
    const hex = swatchHex(k, i), label = k === 'style' ? ['Qisqa', 'Uzun', 'Quyruq', 'Kal'][i] : k === 'hat' ? ['Yo\'q', 'Qalpoq', 'Kepka'][i] : '';
    return '<button type="button" class="sw' + (label ? ' tx' : '') + (a[k] === i ? ' on' : '') + '" data-k="' + k + '" data-i="' + i + '"' + (hex && !label ? ' style="background:' + hex + '"' : '') + ' aria-label="' + AVL[k] + ' ' + (i + 1) + '">' + label + '</button>';
  }).join('') + '</div></div>').join('');
}
function openAvatar(back) {
  avBack = back || null; if (!S.av) S.av = avFromUid(LX && LX.uid || String(Math.random())); rebuildHero();
  player.pos.set(0, 0, 32); S.mode = 'avatar'; hideOv(); $('#hud').classList.add('hidden'); $('#chat').classList.add('hidden');
  renderAvatarPanel(); $('#av').classList.remove('hidden');
}
function closeAvatar() { $('#av').classList.add('hidden'); store.set('hj_avatar', S.av); const b = avBack; avBack = null; if (b) b(); else showTitle(); }
$('#avBody').addEventListener('click', e => {
  const b = e.target.closest('.sw'); if (!b) return;
  S.av[b.dataset.k] = +b.dataset.i; rebuildHero(); renderAvatarPanel();
});
$('#avRand').addEventListener('click', () => { S.av = avFromUid(String(Math.random())); rebuildHero(); renderAvatarPanel(); });
$('#avOk').addEventListener('click', closeAvatar);
function showOv(html) { ov.innerHTML = html; ov.classList.remove('hidden'); ov.scrollTop = 0; }
function hideOv() { ov.classList.add('hidden'); ov.innerHTML = ''; }
function showTitle() {
  S.mode = 'title'; $('#hud').classList.add('hidden'); $('#hint').classList.add('hidden'); $('#chat').classList.add('hidden'); $('#av').classList.add('hidden'); app.classList.remove('live');
  const on = ONLINE();
  showOv('<div class="scr"><div class="t-right" style="max-width:640px"><p class="eyebrow">Jonli 3D til shahri</p>'
    + '<h1>Lexora <span>City</span></h1>'
    + '<p class="lead">Shaharda boshqa o\'yinchilar bilan o\'zingiz o\'rganayotgan tilda gaplashing, NPClar bilan mashq qiling va yangi so\'zlarni saqlang. Saqlangan so\'zlar katalogga tushadi.</p>'
    + (EMBED ? '' : '<div class="join"><input id="jName" maxlength="20" placeholder="Ismingiz (nik)" value="' + esc(store.get('hj_nick', '') === 'Mehmon' ? '' : store.get('hj_nick', '')) + '"><select id="jLang">' + PUB_LANGS.map(l => '<option' + (l === store.get('hj_lang', 'English') ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><button class="btn primary" data-act="join">Jonli shaharga kirish</button></div>')
    + '<div class="btns">' + (EMBED && on ? '<button class="btn primary" data-act="live">Jonli shaharga kirish' + (LX && LX.lang ? ' (' + esc(LX.lang) + ')' : '') + '</button>' : '')
    + '<button class="btn" data-act="avatar">Qahramonni sozlash</button>'
    + '<button class="btn" data-act="start">Missiyalar (yakka)</button><button class="btn" data-act="catalog">So\'zlar katalogi (' + savedCount() + ')</button></div>'
    + (EMBED ? '' : '<p class="note" style="margin-top:14px">O\'yin anonim foydalanish statistikasini yig\'adi (vaqt, bosilgan joylar, xatolar). Chat ochiq: shaxsiy ma\'lumot yozmang.</p>')
    + '</div></div>');
}
function beginPlay() {
  S.started = true; S.mode = 'play'; hideOv();
  $('#hud').classList.remove('hidden'); renderHud();
  const h = $('#hint'); h.classList.remove('hidden'); h.style.opacity = 1; setTimeout(() => { h.style.opacity = 0; }, 12000);
}
function chapterKeys(ch) { return collectKeys(npcById(CHAPTERS[ch - 1].npc).def); }
function completeChapter() {
  S.mode = 'summary';
  const ch = CHAPTERS[S.chapter - 1], keys_ = chapterKeys(S.chapter);
  const stars = S.mistakes <= 1 ? 3 : S.mistakes <= 3 ? 2 : 1;
  const lv0 = S.level;
  if (stars === 3) S.level = Math.min(2, S.level + 1); else if (stars === 1) S.level = Math.max(0, S.level - 1);
  S.showUz = S.level === 0; persist();
  const lvNote = S.level > lv0 ? "Yaxshi natija. Keyingi qismda savollar qiyinroq bo'ladi." : S.level < lv0 ? "Keyingi qismda tarjimalar yordam beradi." : '';
  const mine = keys_.filter(k => S.saved[k]), rest = keys_.filter(k => !S.saved[k]);
  showOv('<div class="scr"><div class="card"><p class="eyebrow" style="color:#c98a12">Qism ' + ch.n + ' tugadi</p><h2>' + esc(ch.title) + '</h2>'
    + '<div class="stars">' + [1, 2, 3].map(i => '<span class="' + (i <= stars ? '' : 'off') + '">&#9733;</span>').join('') + '</div>'
    + '<p>Xatolar: ' + S.mistakes + '. Saqlagan so\'zlaringiz katalogga qo\'shildi.</p>'
    + '<p class="note">Daraja: <b>' + LEVEL_NAMES[S.level] + '</b>. ' + lvNote + '</p>'
    + '<div class="sub">Saqlangan so\'zlar (' + mine.length + ')</div><div class="chips">' + (mine.length ? mine.map(k => '<span class="cw on">' + esc(k) + '</span>').join('') : '<span class="note">Hali saqlanmagan.</span>') + '</div>'
    + (rest.length ? '<div class="sub">Bu qismdagi boshqa so\'zlar</div><div class="chips">' + rest.map(k => '<span class="cw"><button data-act="addw" data-k="' + esc(k) + '">+ ' + esc(k) + '</button></span>').join('') + '</div><button class="btn sm dark" data-act="addall">Hammasini katalogga qo\'shish</button>' : '')
    + '<div class="row-b"><button class="btn" data-act="catalog">So\'zlar katalogi</button><button class="btn primary" data-act="nextch">' + (S.chapter < CHAPTERS.length ? 'Keyingi qism' : 'Davom etish') + '</button></div></div></div>');
}
function showEnd() {
  S.mode = 'end'; $('#hud').classList.add('hidden');
  showOv('<div class="scr"><div class="card"><p class="eyebrow" style="color:#c98a12">Final</p><h2>Barcha missiyalar tugadi</h2>'
    + '<p>Siz bozorda, kafede, hostelda va ko\'chada gaplashdingiz. Endi jonli shaharda boshqa o\'yinchilar bilan mashq qiling.</p>'
    + '<p>Siz <b>' + savedCount() + '</b> ta so\'z va ibora saqladingiz. Ularni katalogda takrorlang.</p>'
    + '<div class="row-b"><button class="btn primary" data-act="catalog">So\'zlar katalogi</button><button class="btn" data-act="restart">Qaytadan o\'ynash</button></div></div></div>');
}
function restart() {
  S.chapter = 1; S.hearts = 3; S.mistakes = 0;
  player.pos.set(0, 0, 32); player.rot = Math.PI; camYaw = 0; S.started = false;
  showTitle();
}
function nextChapter() {
  if (S.chapter >= CHAPTERS.length) { S.chapter = CHAPTERS.length + 1; showEnd(); return; }
  S.chapter++; S.hearts = 3; S.mistakes = 0; S.mode = 'play'; hideOv(); renderHud();
}

/* ---- Katalog va Practice pack ---- */
let catBack = null, catTab = 'words';
const PK = { fc: 0, flip: false, q: 0, score: 0, items: null, answered: false };
function openCatalog(back) { catBack = back; S.mode = 'catalog'; catTab = 'words'; renderCatalog(); }
function closeCatalog() { const b = catBack; catBack = null; if (b) b(); }
const GROUPS = [[1, 'Qism 1. Ovqat topish'], [2, 'Qism 2. Ish topish'], [3, 'Qism 3. Tunash joyi'], [4, "Qism 4. Shaharni bilish"], [0, 'Boshqa suhbatlar']];
function wordItem(k) {
  const e = LEX[k];
  return '<div class="wi"><b>' + esc(k) + '</b><span class="u">' + esc(e.uz) + '</span><div class="g">' + esc(e.g) + '</div><div class="e">' + esc(e.ex) + '</div><button class="rm" data-act="rm" data-k="' + esc(k) + '" aria-label="Olib tashlash">&times;</button></div>';
}
function renderCatalog() {
  const ks = Object.keys(S.saved).filter(k => LEX[k]);
  let body = '';
  if (catTab === 'words') {
    if (!ks.length) body = '<div class="lock"><h3>Katalog hozircha bo\'sh</h3><p>Suhbat paytida sariq chiziqli so\'zlar ustiga bosing va "So\'zni saqlash" tugmasini bosing.</p></div>';
    else body = GROUPS.map(g => { const arr = ks.filter(k => (S.saved[k].ch || 0) === g[0]); return arr.length ? '<div class="sub">' + g[1] + ' (' + arr.length + ')</div><div class="wl">' + arr.map(wordItem).join('') + '</div>' : ''; }).join('');
  } else body = renderPack(ks);
  showOv('<div class="scr"><div class="card cat"><div class="row-b" style="justify-content:space-between;margin:0"><h2 style="margin:0">So\'zlar katalogi</h2><button class="btn sm dark" data-act="closecat">Yopish</button></div>'
    + '<p class="note" style="margin-top:4px">Saqlangan so\'zlar: ' + ks.length + '</p>'
    + '<div class="tabs"><button class="tab' + (catTab === 'words' ? ' on' : '') + '" data-act="tab" data-t="words">So\'zlar</button><button class="tab' + (catTab === 'pack' ? ' on' : '') + '" data-act="tab" data-t="pack">Practice pack</button></div>' + body + '</div></div>');
}
function renderPack(ks) {
  if (!S.hasPack) return '<div class="lock"><h3>Practice pack yopiq</h3><p>Saqlagan so\'zlaringizdan tayyor mashq to\'plami: flashcard va bo\'sh joyni to\'ldirish testi, hammasi bir joyda.</p>'
    + (DEMO ? '<button class="btn primary" data-act="buypack">Practice packni sotib olish (demo)</button><p class="note">Bu demo: tugma paketni sinash uchun ochadi. Haqiqiy sotuv Lexora do\'konida.</p>'
      : '<button class="btn primary" data-act="buyshop">Lexora do\'konidan olish</button><p class="note">Practice pack Lexora do\'konida sotiladi. Sotib olingach, bu yerda avtomatik ochiladi.</p>') + '</div>';
  if (ks.length < 2) return '<div class="lock"><h3>Practice pack tayyor</h3><p>Mashq tuzish uchun kamida 2 ta so\'z saqlang.</p></div>';
  PK.fc = clamp(PK.fc, 0, ks.length - 1);
  const k = ks[PK.fc], e = LEX[k];
  let html = '<div class="sub">1. Flashcard (' + (PK.fc + 1) + ' / ' + ks.length + ')</div><div class="fc"><div class="fc-card" data-act="flip">'
    + (PK.flip ? esc(e.uz) + '<small>' + esc(e.g) + '</small><em>' + esc(e.ex) + '</em>' : esc(k) + '<small>Javobni ko\'rish uchun bosing</small>') + '</div></div>'
    + '<div class="row-b"><button class="btn sm" data-act="fcp">Oldingi</button><button class="btn sm" data-act="fcn">Keyingi</button><button class="btn sm" data-act="fcs">Tinglash</button></div>';
  if (!PK.items) PK.items = buildQuiz(ks);
  html += '<div class="sub" style="margin-top:18px">2. Bo\'sh joyni to\'ldiring</div>';
  if (PK.q >= PK.items.length) html += '<p class="qs">Natija: ' + PK.score + ' / ' + PK.items.length + '</p><button class="btn sm dark" data-act="qre">Qaytadan</button>';
  else {
    const it = PK.items[PK.q];
    html += '<p class="qs">' + esc(it.sentence) + '</p><div class="note" style="margin:-6px 0 10px">Ma\'nosi: ' + esc(it.uz) + '</div><div class="opts">' + it.opts.map(o => '<button class="opt" data-act="gf" data-v="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div><div class="note">' + (PK.q + 1) + ' / ' + PK.items.length + '</div>';
  }
  html += '<div class="sub" style="margin-top:18px">3. Nusxa</div><button class="btn sm dark" data-act="copy">Hamma so\'zlarni nusxalash</button><span class="note" id="cpmsg"></span>';
  return html;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function buildQuiz(ks) {
  const all = Object.keys(LEX);
  return shuffle(ks).slice(0, 8).map(k => {
    const re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    const pool = shuffle(ks.filter(x => x !== k).concat(shuffle(all.filter(x => x !== k && !ks.includes(x))))).slice(0, 2);
    return { k, sentence: LEX[k].ex.replace(re, '_____'), uz: LEX[k].uz, opts: shuffle([k].concat(pool)) };
  });
}
ov.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, ks = Object.keys(S.saved).filter(k => LEX[k]);
  if (a === 'start') beginPlay();
  else if (a === 'join') joinPublic();
  else if (a === 'avatar') openAvatar(showTitle);
  else if (a === 'live') enterLive();
  else if (a === 'catalog') { const m = S.mode; openCatalog(() => { if (m === 'title') showTitle(); else if (m === 'summary') completeChapter(); else if (m === 'end') showEnd(); else { hideOv(); S.mode = 'play'; } }); }
  else if (a === 'closecat') closeCatalog();
  else if (a === 'tab') { catTab = t.dataset.t; renderCatalog(); }
  else if (a === 'rm') { toggleSave(t.dataset.k, 0); renderCatalog(); }
  else if (a === 'addw') { toggleSave(t.dataset.k, S.chapter); completeChapter(); }
  else if (a === 'addall') { chapterKeys(S.chapter).forEach(k => { if (!S.saved[k]) S.saved[k] = { ch: S.chapter }; }); persist(); $('#wCount').textContent = savedCount(); completeChapter(); }
  else if (a === 'nextch') nextChapter();
  else if (a === 'restart') restart();
  else if (a === 'buyshop') { if (EMBED && window.parent !== window) window.parent.postMessage({ type: 'hj-buy' }, location.origin); else location.href = '../'; }
  else if (a === 'buypack') { S.hasPack = true; persist(); PK.items = null; renderCatalog(); toast("Demo: Practice pack ochildi"); }
  else if (a === 'flip') { PK.flip = !PK.flip; renderCatalog(); }
  else if (a === 'fcn') { PK.fc = (PK.fc + 1) % ks.length; PK.flip = false; renderCatalog(); }
  else if (a === 'fcp') { PK.fc = (PK.fc - 1 + ks.length) % ks.length; PK.flip = false; renderCatalog(); }
  else if (a === 'fcs') speak(ks[PK.fc]);
  else if (a === 'qre') { PK.items = null; PK.q = 0; PK.score = 0; renderCatalog(); }
  else if (a === 'gf') {
    if (PK.answered) return; PK.answered = true;
    const it = PK.items[PK.q], ok = t.dataset.v === it.k; if (ok) PK.score++;
    ov.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.v === it.k) b.classList.add('good'); else if (b === t) b.classList.add('bad'); });
    setTimeout(() => { PK.q++; PK.answered = false; if (catTab === 'pack' && S.mode === 'catalog') renderCatalog(); }, 900);
  }
  else if (a === 'copy') {
    const txt = ks.map(k => k + ' - ' + LEX[k].uz + '\n   ' + LEX[k].ex).join('\n');
    const msg = $('#cpmsg');
    try { navigator.clipboard.writeText(txt).then(() => { msg.textContent = ' Nusxalandi.'; }, () => { msg.textContent = ' Nusxalab bo\'lmadi.'; }); } catch (x) { msg.textContent = ' Nusxalab bo\'lmadi.'; }
  }
});

/* ================= BOSHLASH ================= */
window.addEventListener('message', e => {
  if (e.origin !== location.origin) return;
  const d = e.data; if (!d || d.type !== 'lexora-user') return;
  LX = { hasPack: !!d.hasPack, uid: String(d.uid || '').replace(/[^\w-]/g, '').slice(0, 64), name: String(d.name || '').slice(0, 30), lang: String(d.lang || 'English').slice(0, 20), online: !!d.online, anon: !!d.anon };
  applyHeroLook();
  S.saved = store.get(SKEY(), {}); loadProg(); S.hasPack = LX.hasPack; $('#wCount').textContent = savedCount();
  if (S.mode === 'catalog') renderCatalog(); else if (S.mode === 'title') showTitle();
});
if (EMBED && window.parent !== window) { try { window.parent.postMessage({ type: 'hj-ready' }, location.origin); } catch (e) {} }
const hot = window.claude && window.claude.hot;
function start(d) {
  d = d || {};
  if (d.saved) S.saved = Object.assign({}, S.saved, d.saved);
  if (typeof d.hasPack === 'boolean') S.hasPack = S.hasPack || d.hasPack;
  renderHearts();
  if (d.started && d.chapter) { S.chapter = d.chapter; if (S.chapter > CHAPTERS.length) { S.chapter = CHAPTERS.length; } beginPlay(); }
  else showTitle();
}
if (hot && hot.snapshot) hot.snapshot(() => ({ saved: S.saved, hasPack: S.hasPack, chapter: S.chapter, started: S.started && S.chapter <= CHAPTERS.length }));
/*__LIVE__*/
frame();
if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
window.__game = { S, player, NPC, LIVE };
})();
