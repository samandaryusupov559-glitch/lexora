/* Lexora <-> Hoshimjon (Lexora City) bridge. Runs in the Lexora page; the game runs in a same-origin iframe and has no Firebase.
   Game -> bridge: hj-ready, hj-presence, hj-chat, hj-prog, hj-feed, hj-buy, hj-voice, hj-sig-send. Bridge -> game: lexora-user, hj-players, hj-chat-list, hj-sig.
   Voice chat: audio goes straight between players (WebRTC); only the short offer/answer messages pass through Firestore (hjsig). */
(function (g) {
  const dayKey = () => new Date().toISOString().slice(0, 10);
  const num = v => { v = +v; return isFinite(v) ? Math.max(-200, Math.min(200, Math.round(v * 100) / 100)) : 0; };
  const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  function start(o) {
    const db = o.db, u = o.user, origin = o.origin || location.origin, room = u.lang, croom = room + '_' + dayKey();
    const unsubs = []; let lastList = [], lastChat = 0, lastPres = 0, listening = false, players = [], timer = null, stopped = false, sigUnsub = null, sigN = 0, sigT = 0;
    const sigSeen = new Set();
    const frame = () => o.frame && o.frame();
    const post = m => { const f = frame(); if (f && f.contentWindow) f.contentWindow.postMessage(m, origin); };
    const safe = p => { try { return Promise.resolve(p).catch(() => {}); } catch (e) { return Promise.resolve(); } };
    const sendPlayers = () => { const now = Date.now(); post({ type: 'hj-players', list: players.filter(p => p && p.uid !== u.uid && now - (p.ts || 0) < 25000) }); };
    function listen() {
      if (listening) return; listening = true;
      unsubs.push(db.collection('hjplayers').where('room', room).onSnapshot(q => { players = q.docs.map(d => d.data()); sendPlayers(); }, () => {}));
      unsubs.push(db.collection('hjchat').where('room', croom).onSnapshot(q => {
        const list = q.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-60);
        lastList = list.map(m => ({ id: m.id, uid: m.uid, name: m.name, text: m.text, ts: m.ts, fix: m.fix || '' }));
        post({ type: 'hj-chat-list', list: lastList });
      }, () => {}));
      timer = setInterval(sendPlayers, 5000);
    }
    function sigOn() {
      if (sigUnsub || stopped) return;
      sigUnsub = db.collection('hjsig').where('to', u.uid).onSnapshot(q => {
        q.docs.forEach(d => {
          if (sigSeen.has(d.id)) return; sigSeen.add(d.id); if (sigSeen.size > 400) sigSeen.clear();
          const x = d.data() || {}; safe(db.doc('hjsig/' + d.id).delete());
          if (Date.now() - (x.ts || 0) > 25000 || typeof x.from !== 'string' || (x.kind !== 'offer' && x.kind !== 'answer')) return;
          post({ type: 'hj-sig', from: x.from, kind: x.kind, sid: x.sid || '', sdp: x.sdp || '' });
        });
      }, () => {});
    }
    function sigOff() { if (sigUnsub) { try { sigUnsub(); } catch (e) {} sigUnsub = null; } }
    const hello = () => post({ type: 'lexora-user', hasPack: !!(o.hasPack && o.hasPack()), uid: u.uid, name: u.name, lang: u.lang, online: true, anon: !!u.anon });
    function onMsg(e) {
      const f = frame(); if (stopped || !f || e.source !== f.contentWindow || e.origin !== origin) return;
      const m = e.data; if (!m || typeof m.type !== 'string') return;
      const now = Date.now();
      if (m.type === 'hj-ready') { hello(); if (listening) { sendPlayers(); post({ type: 'hj-chat-list', list: lastList }); } else listen(); }
      else if (m.type === 'hj-presence') {
        if (now - lastPres < 400) return; lastPres = now;
        const lk = Array.isArray(m.lk) ? m.lk.slice(0, 6).map(v => Math.max(0, Math.min(15, v | 0))) : [];
        safe(db.doc('hjplayers/' + u.uid).set({ uid: u.uid, name: u.name, room, x: num(m.x), z: num(m.z), r: num(m.r), lk, vc: !!m.vc, ts: now }));
      } else if (m.type === 'hj-chat') {
        const text = str(m.text, 200); if (!text || now - lastChat < 800) return; lastChat = now;
        safe(db.collection('hjchat').doc().set({ uid: u.uid, name: u.name, room: croom, lang: room, text, ts: now }));
      } else if (m.type === 'hj-prog') {
        const weak = (Array.isArray(m.weak) ? m.weak : []).slice(0, 15).map(x => ({ w: str(x && x.w, 60), miss: Math.max(0, Math.min(999, x && x.miss | 0)), ok: Math.max(0, Math.min(999, x && x.ok | 0)) })).filter(x => x.w);
        safe(db.doc('hjprog/' + u.uid).set({ uid: u.uid, name: u.name, lang: room, level: Math.max(0, Math.min(2, m.level | 0)), saved: Math.max(0, Math.min(999, m.saved | 0)), chapter: Math.max(1, Math.min(99, m.chapter | 0)), mistakes: Math.max(0, Math.min(99999, m.mistakes | 0)), weak, ts: now }));
      } else if (m.type === 'hj-feed') {
        const text = str(m.text, 600); if (!text) return;
        safe(db.collection('hjfeed').doc().set({ uid: u.uid, name: u.name, lang: room, text, ts: now }));
      } else if (m.type === 'hj-stat') {
        const sid = String(m.sid || '').replace(/[^a-z0-9]/gi, '').slice(0, 12); if (!sid) return;
        const n = (v, mx) => Math.floor(Math.max(0, Math.min(mx || 999999, +v || 0))), t = (v, k) => String(v || '').slice(0, k);
        safe(db.doc('hjsessions/' + u.uid + '_' + sid).set({ uid: u.uid, name: u.name, lang: room, anon: !!u.anon, sid, device: t(m.device, 10), src: t(m.src, 40), ret: !!m.ret, start: n(m.start, 9e15), last: now,
          secs: n(m.secs), live: n(m.live), steps: n(m.steps), dialogs: n(m.dialogs), done: n(m.done), mistakes: n(m.mistakes), saved: n(m.saved), chat: n(m.chat), fb: n(m.fb), peers: n(m.peers, 999), av: !!m.av, chapter: n(m.chapter, 99), level: n(m.level, 2) }, { merge: true }));
      } else if (m.type === 'hj-voice') { if (m.on) sigOn(); else sigOff();
      } else if (m.type === 'hj-sig-send') {
        const to = str(m.to, 128), sid = str(m.sid, 24), sdp = typeof m.sdp === 'string' ? m.sdp.slice(0, 20000) : '';
        if (!to || to === u.uid || !sdp || (m.kind !== 'offer' && m.kind !== 'answer')) return;
        if (now - sigT > 10000) { sigT = now; sigN = 0; } if (++sigN > 30) return;   // at most 30 messages per 10 s
        safe(db.collection('hjsig').doc().set({ from: u.uid, to, kind: m.kind, sid, sdp, ts: now }));
      } else if (m.type === 'hj-buy') { if (o.onBuy) o.onBuy(); }
    }
    window.addEventListener('message', onMsg);
    return {
      refresh: hello,
      stop() { stopped = true; sigOff(); window.removeEventListener('message', onMsg); unsubs.splice(0).forEach(f => { try { f(); } catch (e) {} }); clearInterval(timer); safe(db.doc('hjplayers/' + u.uid).delete()); }
    };
  }
  g.HJBridge = { start, dayKey };
})(window);
