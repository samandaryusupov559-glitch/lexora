/* ================= JONLI SHAHAR (onlayn, Lexora ichida) ================= */
const LIVE = { fixSeen: {}, on: false, players: new Map(), chat: [], seen: new Set(), loaded: false, pt: 0, sx: 0, sz: 0, sr: 0, progT: 0, heroLabel: null, bub: null };
const ONLINE = () => !!(EMBED && window.parent !== window && LX && LX.online);
const toParent = m => { try { window.parent.postMessage(m, location.origin); } catch (e) {} };
const PHRASES = {
  English: ['Hello! How are you?', 'My name is ...', 'Where are you from?', 'Nice to meet you!', 'What do you do?', 'See you later!'],
  Russian: ['Привет! Как дела?', 'Меня зовут ...', 'Откуда ты?', 'Приятно познакомиться!', 'Чем ты занимаешься?', 'Пока!'],
  German: ['Hallo! Wie geht\'s?', 'Ich heiße ...', 'Woher kommst du?', 'Freut mich!', 'Was machst du?', 'Bis später!'],
  Turkish: ['Merhaba! Nasılsın?', 'Benim adım ...', 'Nerelisin?', 'Memnun oldum!', 'Ne iş yapıyorsun?', 'Görüşürüz!'],
  Korean: ['안녕하세요! 잘 지내세요?', '제 이름은 ...입니다.', '어느 나라 사람이에요?', '만나서 반갑습니다!', '무슨 일을 하세요?', '또 만나요!'],
  Chinese: ['你好！你好吗？', '我叫……', '你是哪国人？', '很高兴认识你！', '你做什么工作？', '再见！'],
  Japanese: ['こんにちは！お元気ですか？', '私の名前は……です。', 'どこから来ましたか？', 'はじめまして！', 'お仕事は何ですか？', 'またね！'],
  Spanish: ['¡Hola! ¿Cómo estás?', 'Me llamo ...', '¿De dónde eres?', '¡Mucho gusto!', '¿A qué te dedicas?', '¡Hasta luego!']
};
/* tashqi ko'rinish: o'yinchi tanlagan (lk) yoki uid dan olingan */
const lookOf = (uid, lk) => avOpts(lk ? avClean(lk) : avFromUid(uid));
const lkOfMe = () => AVK.map(k => S.av ? S.av[k] : 0);
function applyHeroLook() { if (!S.av && LX && LX.uid) { S.av = avFromUid(LX.uid); rebuildHero(); } }
function bubbleOf(root, text, y) {
  const old = root.userData.bub; if (old) { root.remove(old); }
  const s = labelSprite(text.length > 44 ? text.slice(0, 43) + '…' : text, '#fffbe8', '#171a29');
  s.position.y = y; root.add(s); root.userData.bub = s; root.userData.bubT = 6.5;
}
function addRemote(p) {
  const c = buildChar(lookOf(p.uid, p.lk)), lab = labelSprite(p.name || '?', 'rgba(23,26,41,0.88)', '#ffffff');
  lab.position.y = 3.0; c.root.add(lab); scene.add(c.root); c.root.position.set(p.x, 0, p.z);
  const r = { uid: p.uid, c, tx: p.x, tz: p.z, tr: p.r || 0, walk: 0, lk: JSON.stringify(p.lk || null) };
  LIVE.players.set(p.uid, r); return r;
}
function onPlayers(list) {
  const ids = new Set();
  (list || []).forEach(p => {
    if (!p || !p.uid || (LX && p.uid === LX.uid)) return;
    ids.add(p.uid);
    let r = LIVE.players.get(p.uid);
    if (r && p.lk && JSON.stringify(p.lk) !== r.lk) { const q = r.c.root.position.clone(); scene.remove(r.c.root); LIVE.players.delete(p.uid); r = null; p.x = q.x; p.z = q.z; }
    if (!r) r = addRemote(p);
    r.tx = +p.x || 0; r.tz = +p.z || 0; r.tr = +p.r || 0;
  });
  for (const [uid, r] of LIVE.players) if (!ids.has(uid)) { scene.remove(r.c.root); LIVE.players.delete(uid); }
  $('#cOnline').textContent = (LIVE.players.size + 1) + ' online';
}
function onChat(list) {
  const mine = LX && LX.uid;
  list = (list || []).slice(-60);
  if (LIVE.loaded) list.forEach(m => {
    if (!LIVE.seen.has(m.id)) {
      const r = m.uid === mine ? { c: hero } : LIVE.players.get(m.uid);
      if (r && LIVE.on) bubbleOf(r.c.root, m.text, 3.75);
    }
  });
  list.forEach(m => { if (LIVE.loaded && m.fix && m.uid === mine && !LIVE.fixSeen[m.id]) toast('Ustoz xatoni tuzatdi: ' + m.fix); if (m.fix) LIVE.fixSeen[m.id] = 1; LIVE.seen.add(m.id); });
  LIVE.loaded = true; LIVE.chat = list; renderChat();
}
function renderChat() {
  const log = $('#cLog'), stick = log.scrollTop + log.clientHeight >= log.scrollHeight - 40, mine = LX && LX.uid;
  log.innerHTML = LIVE.chat.map(m => '<div class="m' + (m.uid === mine ? ' me' : '') + '"><b>' + esc(m.name || '?') + '</b> ' + esc(m.text) + (m.fix ? '<div class="fx">' + esc(m.fix) + '</div>' : '') + '</div>').join('') || '<div class="m"><i>Hali xabar yo\'q. Birinchi bo\'lib salom bering!</i></div>';
  if (stick) log.scrollTop = log.scrollHeight;
}
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== window.parent) return;
  const d = e.data; if (!d) return;
  if (d.type === 'hj-players') onPlayers(d.list);
  else if (d.type === 'hj-chat-list') onChat(d.list);
});
function enterLive() {
  if (!ONLINE()) return;
  if (!store.get('hj_avatar', null)) { openAvatar(enterLive); return; }
  S.started = true; S.mode = 'play'; hideOv(); $('#av').classList.add('hidden'); LIVE.on = true; LIVE.loaded = LIVE.loaded && true;
  app.classList.add('live'); $('#hud').classList.remove('hidden'); $('#chat').classList.remove('hidden');
  player.pos.set((Math.random() - 0.5) * 8, 0, 30); player.rot = Math.PI; camYaw = 0;
  applyHeroLook();
  if (!LIVE.heroLabel) { LIVE.heroLabel = labelSprite((LX.name || 'Siz'), '#f2b035', '#171a29'); LIVE.heroLabel.position.y = 3.0; hero.root.add(LIVE.heroLabel); }
  $('#cRoom').textContent = 'Shahar: ' + (LX.lang || 'English');
  const ph = PHRASES[LX.lang] || PHRASES.English;
  $('#cPhr').innerHTML = ph.map(p => '<button type="button" class="chip" data-p="' + esc(p) + '">' + esc(p) + '</button>').join('');
  renderChat(); onPlayers([...LIVE.players.values()].map(r => ({ uid: r.uid, name: '', x: r.tx, z: r.tz, r: r.tr })));
  LIVE.pt = 99; toast('Yozish uchun T yoki Enter bosing');
  const h = $('#hint'); h.classList.remove('hidden'); h.style.opacity = 1; setTimeout(() => { h.style.opacity = 0; }, 9000);
}
function exitLive() {
  LIVE.on = false; app.classList.remove('live'); $('#chat').classList.add('hidden'); $('#cIn').blur();
  for (const [uid, r] of LIVE.players) r.c.root.visible = false;
  if (locked()) document.exitPointerLock();
  showTitle();
}
$('#cExit').addEventListener('click', exitLive);
$('#cToggle').addEventListener('click', () => { $('#chat').classList.toggle('min'); });
$('#cPhr').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { const i = $('#cIn'); i.value = b.dataset.p; i.focus(); const k = i.value.indexOf('...'); if (k >= 0) i.setSelectionRange(k, k + 3); } });
$('#cForm').addEventListener('submit', e => {
  e.preventDefault(); const i = $('#cIn'), t = i.value.trim().slice(0, 200);
  if (!t) return; toParent({ type: 'hj-chat', text: t }); i.value = '';
});
$('#bFull').addEventListener('click', () => { try { if (document.fullscreenElement) document.exitFullscreen(); else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement); } catch (x) {} });
$('#bFeed').addEventListener('click', () => { if (locked()) document.exitPointerLock(); $('#fb').classList.remove('hidden'); $('#fbIn').focus(); });
$('#fbNo').addEventListener('click', () => $('#fb').classList.add('hidden'));
$('#fbYes').addEventListener('click', () => {
  const t = $('#fbIn').value.trim().slice(0, 600); if (!t) return;
  if (ONLINE()) toParent({ type: 'hj-feed', text: t });
  $('#fbIn').value = ''; $('#fb').classList.add('hidden'); toast('Rahmat! Fikringiz ustozga yuborildi.');
});
function scheduleProg() {
  if (!ONLINE()) return;
  clearTimeout(LIVE.progT);
  LIVE.progT = setTimeout(() => {
    const weak = Object.entries(S.stats).map(([w, s]) => ({ w, miss: s.miss || 0, ok: s.ok || 0 })).filter(x => x.miss > 0).sort((a, b) => (b.miss - b.ok) - (a.miss - a.ok)).slice(0, 15);
    toParent({ type: 'hj-prog', level: S.level, saved: savedCount(), chapter: Math.min(S.chapter, CHAPTERS.length), weak, mistakes: Object.values(S.stats).reduce((a, s) => a + (s.miss || 0), 0) });
  }, 2500);
}
function tickBubble(root, dt) { if (root.userData.bub) { root.userData.bubT -= dt; if (root.userData.bubT <= 0) { root.remove(root.userData.bub); root.userData.bub = null; } } }
function liveUpdate(dt) {
  tickBubble(hero.root, dt);
  for (const [uid, r] of LIVE.players) {
    const root = r.c.root; root.visible = LIVE.on; tickBubble(root, dt);
    const dx = r.tx - root.position.x, dz = r.tz - root.position.z, d = Math.hypot(dx, dz), k = 1 - Math.exp(-dt * 7);
    if (d > 12) { root.position.x = r.tx; root.position.z = r.tz; } else { root.position.x += dx * k; root.position.z += dz * k; }
    const mv = d > 0.08;
    const tr = mv ? Math.atan2(dx, dz) : r.tr;
    root.rotation.y += angDiff(root.rotation.y, tr) * Math.min(1, dt * 8);
    r.walk += dt * (mv ? 9 : 0);
    const sw = mv ? Math.sin(r.walk) * 0.75 : 0, P = r.c.P;
    P.legL.rotation.x = sw; P.legR.rotation.x = -sw; P.armL.rotation.x = -sw * 0.9; P.armR.rotation.x = sw * 0.9;
    r.c.g.position.y = mv ? Math.abs(Math.sin(r.walk)) * 0.07 : Math.sin(T * 2 + r.walk) * 0.015;
  }
  LIVE.pt += dt;
  if (LIVE.on && ONLINE() && (S.mode === 'play' || S.mode === 'dialog') && LIVE.pt > 0.5) {
    const moved = Math.hypot(player.pos.x - LIVE.sx, player.pos.z - LIVE.sz) > 0.15 || Math.abs(angDiff(player.rot, LIVE.sr)) > 0.25;
    if (moved || LIVE.pt > 8) { LIVE.pt = 0; LIVE.sx = player.pos.x; LIVE.sz = player.pos.z; LIVE.sr = player.rot; toParent({ type: 'hj-presence', x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2), r: +player.rot.toFixed(2), lk: lkOfMe() }); }
  }
}
