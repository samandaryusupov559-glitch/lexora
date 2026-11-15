/* ===== KENG DUNYO: mashinalar, qushlar, yurib gaplashadigan aholi (build.py game.js ga qo'shadi) ===== */
const RES = [];                 // shahar aholisi (yuradi, gaplashadi, suhbatga chiqadi)
const WORLD_CARS = [], WORLD_BIRDS = [];

/* ---- mashinalar ---- */
const carGeo = { body: new THREE.BoxGeometry(1.2, 0.55, 2.5), cab: new THREE.BoxGeometry(1.0, 0.5, 1.25), roof: new THREE.BoxGeometry(0.95, 0.08, 1.1),
  wheel: new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), lamp: new THREE.BoxGeometry(0.28, 0.14, 0.06) };
const carWheel = M(0x1d1f27), carGlass = M(0x9ec9dc, { roughness: 0.3 }), carHead = new THREE.MeshBasicMaterial({ color: 0xfff0b0 }), carTail = new THREE.MeshBasicMaterial({ color: 0xd8342c });
const CAR_COLORS = [0xd8453b, 0x2f6fb0, 0xf2b035, 0x3f9a62, 0xe9e9ee, 0x6b4a8a, 0x2b2d36, 0xe07a3c];
function makeCar(color) {
  const g = new THREE.Group(), body = M(color, { roughness: 0.55 });
  const mk = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  mk(carGeo.body, body, 0, 0.58, 0); mk(carGeo.cab, carGlass, 0, 1.08, -0.15); mk(carGeo.roof, body, 0, 1.36, -0.15);
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => { const w = mk(carGeo.wheel, carWheel, sx * 0.62, 0.32, sz * 0.8); w.rotation.z = Math.PI / 2; });
  [-1, 1].forEach(s => { mk(carGeo.lamp, carHead, s * 0.38, 0.62, 1.26); mk(carGeo.lamp, carTail, s * 0.38, 0.62, -1.26); });
  return g;
}
function loopPos(h, s) {                        // kvadrat halqa bo'ylab (soat miliga qarshi)
  const L = 2 * h; s = ((s % (4 * L)) + 4 * L) % (4 * L);
  const k = Math.floor(s / L), u = s - k * L;
  if (k === 0) return { x: -h + u, z: -h, dx: 1, dz: 0 };
  if (k === 1) return { x: h, z: -h + u, dx: 0, dz: 1 };
  if (k === 2) return { x: h - u, z: h, dx: -1, dz: 0 };
  return { x: -h, z: h - u, dx: 0, dz: -1 };
}
(function cars() {
  [[50.3, 1], [53.7, -1]].forEach(([h, dir], li) => {
    const P = 8 * h, cnt = 4;
    for (let i = 0; i < cnt; i++) {
      const g = makeCar(CAR_COLORS[(li * 3 + i * 2) % CAR_COLORS.length]); scene.add(g);
      WORLD_CARS.push({ g, h, dir, s: i * P / cnt + li * 17, v: 0, vmax: 7 + li, lane: li, P });
    }
  });
  const park = (x, z, yaw) => {          // to'xtab turgan mashina (to'siq)
    const g = makeCar(CAR_COLORS[Math.floor(rw() * CAR_COLORS.length)]); g.position.set(x, 0, z); g.rotation.y = yaw; scene.add(g);
    const along = Math.abs(Math.sin(yaw)) < 0.5;
    boxes.push(along ? { x0: x - 0.65, x1: x + 0.65, z0: z - 1.3, z1: z + 1.3 } : { x0: x - 1.3, x1: x + 1.3, z0: z - 0.65, z1: z + 0.65 });
  };
  [[3.2, 19], [-3.2, 31], [3.2, -22], [-3.2, -41], [3.2, 66], [-3.2, -70], [3.2, 84], [-3.2, 92]].forEach(([x, z]) => park(x, z, x > 0 ? 0 : Math.PI));
  [[22, 3.2], [36, -3.2], [-24, 3.2], [-44, -3.2], [68, 3.2], [-76, -3.2], [86, -3.2]].forEach(([x, z]) => park(x, z, z > 0 ? Math.PI / 2 : -Math.PI / 2));
})();

/* ---- qushlar ---- */
(function birds() {
  const cols = [0xf3f3f3, 0x3a3d4a, 0x8a6a4a, 0xd9c9a0];
  const bodyG = new THREE.BoxGeometry(0.22, 0.18, 0.5), wingG = new THREE.BoxGeometry(0.75, 0.03, 0.3), beakG = new THREE.ConeGeometry(0.05, 0.14, 4);
  const beak = new THREE.MeshBasicMaterial({ color: 0xf0a030 });
  for (let f = 0; f < 6; f++) {
    const cx = (rw() - 0.5) * 120, cz = (rw() - 0.5) * 120, r0 = 14 + rw() * 36, h0 = 13 + rw() * 10, w = (0.12 + rw() * 0.1) * (rw() < 0.5 ? 1 : -1);
    const mat = M(cols[f % cols.length], { roughness: 0.7 });
    for (let k = 0; k < 5; k++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(bodyG, mat));
      const bk = new THREE.Mesh(beakG, beak); bk.rotation.x = Math.PI / 2; bk.position.z = 0.3; g.add(bk);
      const wl = new THREE.Group(), wr = new THREE.Group();
      const a = new THREE.Mesh(wingG, mat); a.position.x = -0.38; wl.add(a);
      const b = new THREE.Mesh(wingG, mat); b.position.x = 0.38; wr.add(b);
      g.add(wl); g.add(wr); scene.add(g);
      WORLD_BIRDS.push({ g, wl, wr, cx, cz, r: r0 + k * 1.6, h: h0 + (k % 3) * 1.2, a: rw() * 6.28 + k * 0.06, w, ph: rw() * 6 });
    }
  }
})();

/* ---- shahar aholisi: yurish, uchrashish, gaplashish ---- */
const RES_NAMES = ['Anna', 'Timur', 'Lola', 'Kenji', 'Sara', 'Omar', 'Mei', 'Diego', 'Nodira', 'Jack', 'Aysel', 'Pavel', 'Hana', 'Ali', 'Zara', 'Ben', 'Lina', 'Rustam'];
const CHAT = {
  English: [["Hi! Nice day, isn't it?", "Yes, it's very sunny!", "Where are you going?", "To the market. See you!"], ["Good morning! How are you?", "I'm fine, thanks. And you?", "Great! I love this city.", "Me too!"], ["Do you like coffee?", "Yes, I like it with milk.", "Let's go to the cafe!", "Good idea!"]],
  Russian: [["Привет! Хороший день, правда?", "Да, очень солнечно!", "Куда ты идёшь?", "На рынок. Пока!"], ["Доброе утро! Как дела?", "Хорошо, спасибо. А у тебя?", "Отлично! Я люблю этот город.", "Я тоже!"], ["Ты любишь кофе?", "Да, с молоком.", "Пойдём в кафе!", "Хорошая идея!"]],
  German: [["Hallo! Schönes Wetter heute, oder?", "Ja, es ist sehr sonnig!", "Wohin gehst du?", "Zum Markt. Bis später!"], ["Guten Morgen! Wie geht's?", "Gut, danke. Und dir?", "Super! Ich liebe diese Stadt.", "Ich auch!"], ["Magst du Kaffee?", "Ja, mit Milch.", "Lass uns ins Café gehen!", "Gute Idee!"]],
  Turkish: [["Merhaba! Bugün hava güzel, değil mi?", "Evet, çok güneşli!", "Nereye gidiyorsun?", "Pazara. Görüşürüz!"], ["Günaydın! Nasılsın?", "İyiyim, teşekkürler. Sen?", "Harika! Bu şehri seviyorum.", "Ben de!"], ["Kahve sever misin?", "Evet, sütlü severim.", "Kafeye gidelim!", "İyi fikir!"]],
  Korean: [["안녕하세요! 날씨가 좋네요.", "네, 정말 맑아요!", "어디에 가세요?", "시장에 가요. 안녕히 가세요!"], ["좋은 아침이에요! 잘 지내세요?", "네, 잘 지내요. 당신은요?", "좋아요! 저는 이 도시가 좋아요.", "저도요!"], ["커피 좋아하세요?", "네, 우유를 넣어서 좋아해요.", "카페에 가요!", "좋은 생각이에요!"]],
  Chinese: [["你好！今天天气真好。", "是啊，阳光很好！", "你去哪儿？", "去市场。再见！"], ["早上好！你好吗？", "我很好，谢谢。你呢？", "太好了！我喜欢这座城市。", "我也是！"], ["你喜欢咖啡吗？", "喜欢，我喜欢加牛奶的。", "我们去咖啡馆吧！", "好主意！"]],
  Japanese: [["こんにちは！いい天気ですね。", "はい、とても晴れていますね！", "どこへ行きますか？", "市場へ行きます。またね！"], ["おはようございます！お元気ですか？", "はい、元気です。あなたは？", "よかった！この町が好きです。", "私もです！"], ["コーヒーは好きですか？", "はい、ミルク入りが好きです。", "カフェに行きましょう！", "いいですね！"]],
  Spanish: [["¡Hola! Hace buen día, ¿verdad?", "¡Sí, hace mucho sol!", "¿Adónde vas?", "Al mercado. ¡Hasta luego!"], ["¡Buenos días! ¿Cómo estás?", "Bien, gracias. ¿Y tú?", "¡Genial! Me encanta esta ciudad.", "¡A mí también!"], ["¿Te gusta el café?", "Sí, con leche.", "¡Vamos a la cafetería!", "¡Buena idea!"]]
};
const CHAT_UZ = [["Salom! Bugun havo yaxshi, shunday emasmi?", "Ha, juda quyoshli!"], ["Xayrli tong! Ahvolingiz qanday?", "Yaxshi, rahmat. O'zingizchi?"], ["Qahvani yoqtirasizmi?", "Ha, sut bilan yoqtiraman."]];
const chatLang = () => (LX && LX.lang && CHAT[LX.lang]) ? LX.lang : 'English';

const LANES = [];
[6.6, -6.6].forEach(c => { LANES.push({ ax: 'z', c, a: 14, b: 92 }, { ax: 'z', c, a: -14, b: -92 }, { ax: 'x', c, a: 14, b: 92 }, { ax: 'x', c, a: -14, b: -92 }); });
(function residents() {
  let ni = 0;
  LANES.forEach((ln, li) => {
    ln.res = []; ln.phase = 'wander'; ln.timer = 6 + rw() * 10; ln.line = 0; ln.conv = null;
    for (let k = 0; k < 2; k++) {
      const pick = a => a[Math.floor(rw() * a.length)];
      const look = { skin: pick(AVP.skin), hair: pick(AVP.hair), hairStyle: pick(AVP.style), shirt: pick(AVP.shirt), pants: pick(AVP.pants), hat: pick(AVP.hat), backpack: rw() < 0.2 };
      const c = buildChar(look), root = new THREE.Group(); root.add(c.root);
      const name = RES_NAMES[ni++ % RES_NAMES.length];
      const label = labelSprite(name, 'rgba(23,26,41,.8)', '#f7edd8'); label.position.y = 3.0; label.visible = false; root.add(label);
      const t0 = ln.a + (ln.b - ln.a) * (0.15 + 0.7 * rw());
      const r = { def: { id: 'res', name, role: 'Shahar aholisi', chapter: 0 }, pos: new THREE.Vector3(), root, c, label, lane: ln, t: t0, tgt: t0, wait: rw() * 4, walk: rw() * 6, spd: 1.3 + rw() * 0.5, rot: 0, phase: rw() * 6, arrived: true };
      placeRes(r); root.rotation.y = r.rot; scene.add(root); RES.push(r); ln.res.push(r);
    }
  });
})();
function placeRes(r) { const ln = r.lane; if (ln.ax === 'z') r.pos.set(ln.c, 0, r.t); else r.pos.set(r.t, 0, ln.c); r.root.position.copy(r.pos); }
function resDef(r) {            // suhbat daraxti: tanlangan tilda qisqa salomlashuv
  const L = CHAT[chatLang()], i = Math.floor(Math.random() * L.length), u = CHAT_UZ[i];
  r.def.tree = { n1: { say: L[i][0], uz: u[0], choices: [{ t: L[i][1], uz: u[1], ok: true, next: 'END' }] } };
}

function worldUpdate(dt) {
  /* quyosh va soyalar o'yinchi bilan birga ko'chadi */
  if (!worldUpdate.sunInit) { scene.add(sun.target); worldUpdate.sunInit = true; }
  sun.target.position.set(player.pos.x, 0, player.pos.z); sun.position.set(player.pos.x + 40, 32, player.pos.z + 26);

  /* mashinalar: oldidagi mashina yoki odam bo'lsa sekinlashadi */
  const blockers = RES.map(r => r.pos).concat([player.pos]);
  WORLD_CARS.forEach(c => {
    const p = loopPos(c.h, c.dir * c.s), hd = { x: p.dx * c.dir, z: p.dz * c.dir };
    let stop = false;
    for (const b of blockers) { const ax = b.x - p.x, az = b.z - p.z, f = ax * hd.x + az * hd.z, sd = Math.abs(ax * hd.z - az * hd.x); if (f > 0.5 && f < 5 && sd < 1.6) { stop = true; break; } }
    for (const o of WORLD_CARS) { if (o === c || o.lane !== c.lane) continue; const gap = ((o.s - c.s) % c.P + c.P) % c.P; if (gap < 6) { stop = true; break; } }
    c.v += ((stop ? 0 : c.vmax) - c.v) * Math.min(1, dt * (stop ? 4 : 1.2));
    c.s += c.v * dt;
    const q = loopPos(c.h, c.dir * c.s);
    c.g.position.set(q.x, 0, q.z); c.g.rotation.y = Math.atan2(q.dx * c.dir, q.dz * c.dir);
  });

  /* qushlar */
  WORLD_BIRDS.forEach(b => {
    b.a += b.w * dt;
    const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r, tx = -Math.sin(b.a) * Math.sign(b.w), tz = Math.cos(b.a) * Math.sign(b.w);
    b.g.position.set(x, b.h + Math.sin(T * 0.8 + b.ph) * 0.8, z); b.g.rotation.y = Math.atan2(tx, tz);
    const f = Math.sin(T * 9 + b.ph) * 0.7; b.wl.rotation.z = -f; b.wr.rotation.z = f;
  });

  /* aholi */
  const inDlg = S.mode === 'dialog' && D ? D.npc : null;
  RES.forEach(r => { const d = Math.hypot(r.pos.x - player.pos.x, r.pos.z - player.pos.z); r.label.visible = d < 14 && S.mode !== 'title'; tickBubble(r.root, dt); });
  LANES.forEach(ln => {
    const A = ln.res[0], B = ln.res[1], dir = Math.sign(ln.b - ln.a), bothFrozen = ln.res.some(r => r === inDlg);
    if (!bothFrozen) ln.timer -= dt;
    if (ln.phase === 'wander' && ln.timer <= 0) {
      const m = ln.a + (ln.b - ln.a) * (0.25 + 0.5 * rw());
      A.tgt = m - dir * 0.9; B.tgt = m + dir * 0.9; ln.phase = 'meet'; ln.timer = 40;
    } else if (ln.phase === 'meet') {
      if (Math.abs(A.t - A.tgt) < 0.15 && Math.abs(B.t - B.tgt) < 0.15) {
        ln.phase = 'chat'; ln.line = 0; ln.timer = 0.4; ln.conv = CHAT[chatLang()][Math.floor(rw() * 3)];
      } else if (ln.timer <= 0) { ln.phase = 'wander'; ln.timer = 8; }
    } else if (ln.phase === 'chat' && ln.timer <= 0) {
      if (ln.line >= ln.conv.length) { ln.phase = 'wander'; ln.timer = 14 + rw() * 14; }
      else { const sp = ln.line % 2 ? B : A; bubbleOf(sp.root, ln.conv[ln.line], 3.7); ln.line++; ln.timer = 3.4; }
    }
    ln.res.forEach(r => {
      if (r === inDlg) { r.moving = 0; return; }
      let moving = 0;
      if (ln.phase === 'wander' || ln.phase === 'meet') {
        if (ln.phase === 'wander' && Math.abs(r.t - r.tgt) < 0.15) {
          r.wait -= dt; if (r.wait <= 0) { r.tgt = ln.a + (ln.b - ln.a) * rw(); r.wait = 1 + rw() * 4; }
        } else if (Math.abs(r.t - r.tgt) >= 0.15) {
          const sgn = Math.sign(r.tgt - r.t), step = Math.min(Math.abs(r.tgt - r.t), r.spd * (ln.phase === 'meet' ? 1.3 : 1) * dt);
          r.t += sgn * step; moving = 1;
          const dx = ln.ax === 'x' ? sgn : 0, dz = ln.ax === 'z' ? sgn : 0; r.rot = Math.atan2(dx, dz);
        }
      }
      if (ln.phase === 'chat') { const o = r === A ? B : A; r.rot = Math.atan2(o.pos.x - r.pos.x, o.pos.z - r.pos.z); }
      r.moving = moving; r.walk += dt * 7 * moving;
      placeRes(r);
    });
  });
  RES.forEach(r => {
    const P = r.c.P, moving = r.moving || 0;
    if (inDlg === r) r.rot = Math.atan2(player.pos.x - r.pos.x, player.pos.z - r.pos.z);
    r.root.rotation.y += angDiff(r.root.rotation.y, r.rot) * Math.min(1, dt * 8);
    const sw = Math.sin(r.walk) * 0.7 * moving;
    P.legL.rotation.x = sw; P.legR.rotation.x = -sw; P.armL.rotation.x = -sw * 0.9; P.armR.rotation.x = sw * 0.9;
    r.c.g.position.y = moving ? Math.abs(Math.sin(r.walk)) * 0.06 : Math.sin(T * 1.8 + r.phase) * 0.015;
    const talking = (r.root.userData.bub && true) || (inDlg === r && D.npcTalk);
    P.mouth.scale.y = talking ? 0.5 + Math.abs(Math.sin(T * 12 + r.phase)) * 0.9 : 0.5;
  });
}
