// Lexora Telegram bot on Cloud Functions for Firebase.
//
//  telegram (HTTPS)  — Telegram calls it for every message (webhook):
//      /start u_<code>  links a Lexora account (the site wrote tglink/<code> = {uid, at})
//      /start l_<id>    links a trial request (leads/<id>) so the bot can tell the person when a teacher is assigned
//      a Reply to a chat notification goes back into that Lexora chat
//      ?setup=<key>     (called by GitHub after each deploy) points Telegram at this function and saves the bot name
//  Firestore triggers — new chat messages, visitor questions, trial requests, assignments, lesson start, checked entries.
//
// Settings come from functions/.env, written by the GitHub workflow from the repository secrets:
//   TELEGRAM_TOKEN, SITE_URL, OWNER_EMAIL (and optionally REGION).
// Server-only collections (no client access in firestore.rules): tgChats/{chatId}, tgMsgs/{chatId_messageId}.
// tg/{uid} = {chatId, username, role, tid, owner, at}: the student/teacher can read their own (to know they are linked).

const crypto = require('crypto');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
// the database is in eur3, so the functions live next to it
setGlobalOptions({ region: process.env.REGION || 'europe-west1', maxInstances: 5, memory: '256MiB' });

const TOKEN = () => process.env.TELEGRAM_TOKEN || '';
const SITE = () => (process.env.SITE_URL || 'https://samandaryusupov559-glitch.github.io/lexora/').replace(/\/?$/, '/');
const OWNER = () => (process.env.OWNER_EMAIL || '').trim().toLowerCase();
// Telegram sends this header back on every webhook call; it is derived from the token, so no extra secret is needed
const hookSecret = () => crypto.createHash('sha256').update(TOKEN() + ':hook').digest('hex').slice(0, 48);
const setupKey = () => crypto.createHash('sha256').update(TOKEN() + ':setup').digest('hex');

/* ---------------- texts (uz / ru / en) ---------------- */
const T = {
  uz: {
    hello: 'Assalomu alaykum! Bu Lexora boti. Lexoradagi “Telegram’ni ulash” tugmasini bosing, shunda xabarlar shu yerga keladi.',
    linked: '✅ Lexora akkauntingiz ulandi. Yangi xabarlar, dars havolalari va tekshiruvlar endi shu yerga keladi.',
    expired: 'Havola eskirgan. Lexoraga qaytib “Telegram’ni ulash” tugmasini yana bosing.',
    leadOk: '✅ So‘rovingiz qabul qilindi. Ustoz biriktirilishi bilan shu yerga xabar beramiz.',
    leadNo: 'So‘rov topilmadi. Lexorada qaytadan so‘rov qoldiring.',
    invite: 'Assalomu alaykum, {name}! Lexora: so‘rovingiz tasdiqlandi. Ustozingiz: {teacher}. Darslarni boshlash uchun shu havola orqali ro‘yxatdan o‘ting:',
    signup: 'Ro‘yxatdan o‘tish', open: 'Lexorani ochish', join: 'Darsga kirish',
    msgFrom: '💬 {name}:', guest: '🌐 Sayt mehmoni {name} ({contact}):', replyHint: '↩ Javob berish uchun shu xabarga “Reply” qiling.',
    sent: '✅ Yuborildi.', notLinked: 'Avval Lexoradagi “Telegram’ni ulash” tugmasi orqali akkauntingizni ulang.', noReply: 'Bu xabarga javob yozib bo‘lmaydi. Lexoraning o‘zida yozing.',
    lead: '🆕 Sinov darsi so‘rovi: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 Sizga sinov darsi so‘rovi biriktirildi: {name} · {contact}\n{lang}',
    live: '🔴 {name} darsni boshladi.{label}', checked: '✅ Yozuvingiz tekshirildi: “{title}”.', revise: '✏️ Ustoz “{title}” yozuvini qayta yozishni so‘radi.',
  },
  ru: {
    hello: 'Здравствуйте! Это бот Lexora. Нажмите в Lexora кнопку «Подключить Telegram», и уведомления будут приходить сюда.',
    linked: '✅ Аккаунт Lexora подключён. Новые сообщения, ссылки на уроки и проверки теперь будут приходить сюда.',
    expired: 'Ссылка устарела. Вернитесь в Lexora и снова нажмите «Подключить Telegram».',
    leadOk: '✅ Заявка принята. Как только назначим преподавателя, напишем сюда.',
    leadNo: 'Заявка не найдена. Оставьте заявку в Lexora ещё раз.',
    invite: 'Здравствуйте, {name}! Lexora: ваша заявка подтверждена. Ваш преподаватель: {teacher}. Чтобы начать занятия, зарегистрируйтесь по ссылке:',
    signup: 'Зарегистрироваться', open: 'Открыть Lexora', join: 'Войти на урок',
    msgFrom: '💬 {name}:', guest: '🌐 Посетитель сайта {name} ({contact}):', replyHint: '↩ Чтобы ответить, сделайте «Ответить» (Reply) на это сообщение.',
    sent: '✅ Отправлено.', notLinked: 'Сначала подключите аккаунт кнопкой «Подключить Telegram» в Lexora.', noReply: 'На это сообщение нельзя ответить. Напишите в самой Lexora.',
    lead: '🆕 Заявка на пробный урок: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 Вам назначена заявка на пробный урок: {name} · {contact}\n{lang}',
    live: '🔴 {name} начал(а) урок.{label}', checked: '✅ Ваша запись проверена: «{title}».', revise: '✏️ Преподаватель просит переписать «{title}».',
  },
  en: {
    hello: 'Hello! This is the Lexora bot. Press “Connect Telegram” in Lexora and your notifications will come here.',
    linked: '✅ Your Lexora account is connected. New messages, lesson links and checked entries will come here.',
    expired: 'This link has expired. Go back to Lexora and press “Connect Telegram” again.',
    leadOk: '✅ Your request is received. We will write here as soon as a teacher is assigned.',
    leadNo: 'Request not found. Please send a new request on Lexora.',
    invite: 'Hello, {name}! Lexora: your request is confirmed. Your teacher is {teacher}. To start your lessons, sign up with this link:',
    signup: 'Sign up', open: 'Open Lexora', join: 'Join the lesson',
    msgFrom: '💬 {name}:', guest: '🌐 Site visitor {name} ({contact}):', replyHint: '↩ Reply to this message to answer.',
    sent: '✅ Sent.', notLinked: 'First connect your account with “Connect Telegram” in Lexora.', noReply: 'You cannot answer this message here. Please write in Lexora.',
    lead: '🆕 Trial request: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 A trial request was assigned to you: {name} · {contact}\n{lang}',
    live: '🔴 {name} has started the lesson.{label}', checked: '✅ Your entry was checked: “{title}”.', revise: '✏️ Your teacher asks you to rewrite “{title}”.',
  },
};
const FMT = { uz: { group: 'Guruh', ind: 'Individual' }, ru: { group: 'Группа', ind: 'Индивидуально' }, en: { group: 'Group', ind: 'Individual' } };
const L = lang => (T[lang] ? lang : 'uz');
const t = (lang, k, v = {}) => String(T[L(lang)][k] || T.uz[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v[n] == null ? '' : String(v[n])));
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const btn = (text, url) => ({ reply_markup: { inline_keyboard: [[{ text, url }]] } });
const okUrl = u => /^https:\/\/[^\s]+$/.test(String(u || ''));

/* ---------------- Telegram API ---------------- */
async function api(method, body) {
  if (!TOKEN()) { logger.warn('TELEGRAM_TOKEN is not set'); return { ok: false }; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN()}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!j.ok) logger.warn('telegram ' + method + ' failed', j.description);
    return j;
  } catch (e) { logger.error('telegram ' + method, e); return { ok: false }; }
}
// send to one chat; `ref` makes a Reply to this message go back into a Lexora chat
async function sendChat(chatId, text, extra = {}, ref = null) {
  const r = await api('sendMessage', { chat_id: chatId, text: clip(text, 4000), disable_web_page_preview: true, ...extra });
  if (r.ok && ref) await db.doc(`tgMsgs/${chatId}_${r.result.message_id}`).set({ ...ref, at: Date.now() });
  if (!r.ok && /blocked|deactivated|chat not found/i.test(r.description || '')) {   // they blocked the bot: forget the link
    const c = await db.doc('tgChats/' + chatId).get(); if (c.exists) { await db.doc('tg/' + c.data().uid).delete().catch(() => {}); await c.ref.delete(); }
  }
  return r;
}
async function langOf(uid) { try { const c = await db.doc('contacts/' + uid).get(); return L(c.exists ? c.data().lang : 'uz'); } catch (e) { return 'uz'; } }
async function sendUid(uid, build, ref) {
  const s = await db.doc('tg/' + uid).get(); if (!s.exists) return;
  const lang = await langOf(uid), m = build(lang);
  await sendChat(s.data().chatId, m.text, m.extra || {}, ref);
}
// everyone linked as this teacher (tid 'main' is the owner's own teacher profile)
async function sendTeacher(tid, build, ref, exceptUid) {
  const q = await db.collection('tg').where('tid', '==', tid || 'main').get();
  for (const d of q.docs) if (d.id !== exceptUid) await sendUid(d.id, build, ref);
}
async function sendOwner(build, ref, skipTid) {
  const q = await db.collection('tg').where('owner', '==', true).get();
  for (const d of q.docs) if (!(skipTid && d.data().tid === skipTid)) await sendUid(d.id, build, ref);
}
async function teacherName(tid) { try { const d = await db.doc('teachers/' + (tid || 'main')).get(); return (d.exists && d.data().name) || 'Lexora'; } catch (e) { return 'Lexora'; } }
const joinUrl = (tid, leadId) => SITE() + '#join=' + tid + (leadId ? '.' + leadId : '');

/* ---------------- webhook ---------------- */
exports.telegram = onRequest({ cors: false, invoker: 'public' }, async (req, res) => {
  if (req.method === 'GET') {
    if (req.query.setup && req.query.setup === setupKey()) {           // GitHub calls this after each deploy
      const me = await api('getMe', {});
      const url = /^https:\/\/[\w.-]+\/[\w-]+$/.test(String(req.query.hook || '')) ? String(req.query.hook) : `https://${req.get('host')}/telegram`;
      const hook = await api('setWebhook', { url, secret_token: hookSecret(), allowed_updates: ['message'], drop_pending_updates: false });
      if (me.ok) await db.doc('site/bot').set({ username: me.result.username, on: !!hook.ok, at: Date.now() });
      res.status(hook.ok ? 200 : 500).json({ ok: !!hook.ok, bot: me.ok ? me.result.username : null, url });
      return;
    }
    res.status(200).send('Lexora bot'); return;
  }
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== hookSecret()) { res.status(403).send('no'); return; }
  try { await onMessage(req.body && req.body.message); } catch (e) { logger.error('update failed', e); }
  res.status(200).send('ok');   // always 200, or Telegram keeps resending
});

async function onMessage(msg) {
  if (!msg || !msg.chat || msg.chat.type !== 'private' || typeof msg.text !== 'string') return;
  const chatId = msg.chat.id, text = msg.text.trim(), lang = L((msg.from && msg.from.language_code || '').slice(0, 2));
  const st = text.match(/^\/start(?:\s+(\S+))?/);
  if (st) {
    const p = st[1] || '';
    if (p.startsWith('u_')) return linkAccount(chatId, msg.from || {}, p.slice(2), lang);
    if (p.startsWith('l_')) return linkLead(chatId, msg.from || {}, p.slice(2), lang);
    return sendChat(chatId, t(lang, 'hello'), btn(t(lang, 'open'), SITE()));
  }
  const reply = msg.reply_to_message;
  if (!reply) {
    const c = await db.doc('tgChats/' + chatId).get();
    return sendChat(chatId, c.exists ? t(lang, 'noReply') : t(lang, 'notLinked'), btn(t(lang, 'open'), SITE()));
  }
  return answer(chatId, reply.message_id, text, lang);
}

async function linkAccount(chatId, from, code, lang) {
  if (!/^[\w-]{16,60}$/.test(code)) return sendChat(chatId, t(lang, 'expired'));
  const ref = db.doc('tglink/' + code), s = await ref.get();
  if (!s.exists || Date.now() - (s.data().at || 0) > 24 * 3600e3) { if (s.exists) await ref.delete(); return sendChat(chatId, t(lang, 'expired'), btn(t(lang, 'open'), SITE())); }
  const uid = s.data().uid; let user;
  try { user = await admin.auth().getUser(uid); } catch (e) { await ref.delete(); return sendChat(chatId, t(lang, 'expired')); }
  const email = String(user.email || '').toLowerCase();
  let role = 'student', tid = null, owner = false;
  if (email && email === OWNER() && user.emailVerified) { role = 'owner'; tid = 'main'; owner = true; }
  else if (email && user.emailVerified) { const sf = await db.doc('staff/' + email).get(); if (sf.exists && sf.data().tid) { role = 'staff'; tid = sf.data().tid; } }
  // one Lexora account per Telegram chat: an older link of this chat is replaced
  const old = await db.doc('tgChats/' + chatId).get();
  if (old.exists && old.data().uid !== uid) await db.doc('tg/' + old.data().uid).delete().catch(() => {});
  await db.doc('tg/' + uid).set({ chatId, username: from.username || '', first: from.first_name || '', role, tid, owner, at: Date.now() });
  await db.doc('tgChats/' + chatId).set({ uid, at: Date.now() });
  await ref.delete();
  return sendChat(chatId, t(await langOf(uid) || lang, 'linked'), btn(t(lang, 'open'), SITE()));
}

async function linkLead(chatId, from, id, lang) {
  if (!/^[\w-]{10,40}$/.test(id)) return sendChat(chatId, t(lang, 'leadNo'));
  const ref = db.doc('leads/' + id), s = await ref.get();
  if (!s.exists) return sendChat(chatId, t(lang, 'leadNo'), btn(t(lang, 'open'), SITE()));
  await ref.update({ tgChat: chatId, tgUser: from.username || '', tgLang: lang });
  const l = s.data();
  // already assigned: onLeadUpdated sees the new tgChat and sends the sign-up link
  if (!(l.tid && l.st !== 'joined')) await sendChat(chatId, t(lang, 'leadOk'));
}
async function sendInvite(l, id) {
  const lang = L(l.tgLang), teacher = await teacherName(l.tid);
  const r = await sendChat(l.tgChat, t(lang, 'invite', { name: String(l.name || '').split(' ')[0], teacher }) + '\n' + joinUrl(l.tid, id), btn(t(lang, 'signup'), joinUrl(l.tid, id)));
  if (r.ok) await db.doc('leads/' + id).update({ tgSent: l.tid });
}

// a Reply in Telegram goes back into the Lexora chat it came from
async function answer(chatId, replyTo, text, lang) {
  const [m, c] = await Promise.all([db.doc(`tgMsgs/${chatId}_${replyTo}`).get(), db.doc('tgChats/' + chatId).get()]);
  if (!c.exists) return sendChat(chatId, t(lang, 'notLinked'), btn(t(lang, 'open'), SITE()));
  if (!m.exists) return sendChat(chatId, t(lang, 'noReply'), btn(t(lang, 'open'), SITE()));
  const uid = c.data().uid, ref = m.data(), tgd = (await db.doc('tg/' + uid).get()).data() || {}, now = Date.now(), body = clip(text, 1000);
  if (ref.kind === 'dm') {
    const th = await db.doc('dm/' + ref.id).get(); if (!th.exists) return sendChat(chatId, t(lang, 'noReply'));
    const d = th.data();
    let by, name;
    if (d.uid === uid) { by = 's'; const j = await db.doc('journals/' + uid).get(); name = (j.exists && j.data().name) || d.name || 'Student'; }
    else if (tgd.owner || (tgd.tid && tgd.tid === d.tid)) { by = 't'; name = await teacherName(tgd.owner ? 'main' : tgd.tid); }
    else return sendChat(chatId, t(lang, 'noReply'));
    await db.collection(`dm/${ref.id}/msgs`).add({ uid, name: clip(name, 80), text: body, at: now, by, via: 'tg' });
    await th.ref.update({ lastAt: now, lastBy: by, lastText: clip(body.replace(/\s+/g, ' '), 140), [by === 's' ? 'rs' : 'rt']: now });
  } else if (ref.kind === 'g') {
    const ch = await db.doc('gchat/' + ref.id).get(); if (!ch.exists) return sendChat(chatId, t(lang, 'noReply'));
    if (!(tgd.owner || (tgd.tid && tgd.tid === ch.data().tid))) return sendChat(chatId, t(lang, 'noReply'));
    await db.collection(`gchat/${ref.id}/msgs`).add({ uid, name: clip(await teacherName(tgd.owner ? 'main' : tgd.tid), 80), text: body, at: now, by: 't', via: 'tg' });
    await ch.ref.update({ lastAt: now, lastBy: 't', lastText: clip(body.replace(/\s+/g, ' '), 140), rt: now });
  } else return sendChat(chatId, t(lang, 'noReply'));
  return sendChat(chatId, t(lang, 'sent'));
}

/* ---------------- notifications ---------------- */
// a chat message: tell the other side (messages written from Telegram are not echoed back)
exports.onDmMessage = onDocumentCreated('dm/{id}/msgs/{m}', async ev => {
  const m = ev.data && ev.data.data(); if (!m) return;
  const th = await db.doc('dm/' + ev.params.id).get(); if (!th.exists) return;
  const d = th.data(), build = lang => ({ text: t(lang, 'msgFrom', { name: m.name || '' }) + '\n' + clip(m.text, 3000) + '\n\n' + t(lang, 'replyHint'), extra: btn(t(lang, 'open'), SITE()) });
  if (m.by === 's') await sendTeacher(d.tid, build, { kind: 'dm', id: ev.params.id }, m.uid);
  else if (m.by === 't') await sendUid(d.uid, build, { kind: 'dm', id: ev.params.id });
});

// a site visitor's question: the assigned teacher, or the owner
exports.onGuestMessage = onDocumentCreated('gchat/{id}/msgs/{m}', async ev => {
  const m = ev.data && ev.data.data(); if (!m || m.by !== 'g') return;
  const ch = await db.doc('gchat/' + ev.params.id).get(); if (!ch.exists) return;
  const c = ch.data(), build = lang => ({ text: t(lang, 'guest', { name: c.name || '', contact: c.contact || '' }) + '\n' + clip(m.text, 3000) + '\n\n' + t(lang, 'replyHint'), extra: btn(t(lang, 'open'), SITE()) });
  if (c.tid) await sendTeacher(c.tid, build, { kind: 'g', id: ev.params.id }); else await sendOwner(build, { kind: 'g', id: ev.params.id });
});

const leadText = (lang, key, l) => t(lang, key, { name: l.name || '', contact: l.contact || '', lang: [l.lang, l.level].filter(Boolean).join(' · '),
  fmt: l.fmt ? ' · ' + (FMT[L(lang)][l.fmt] || l.fmt) + (l.quote ? ' · ' + l.quote : '') : '', msg: l.msg ? '\n“' + clip(l.msg, 500) + '”' : '' });

exports.onLeadCreated = onDocumentCreated('leads/{id}', async ev => {
  const l = ev.data && ev.data.data(); if (!l) return;
  await sendOwner(lang => ({ text: leadText(lang, 'lead', l), extra: btn(t(lang, 'open'), SITE()) }));
  if (l.tid && l.tid !== 'main') await sendTeacher(l.tid, lang => ({ text: leadText(lang, 'lead', l), extra: btn(t(lang, 'open'), SITE()) }));
});

// a request is given to a teacher: tell the teacher, and send the person their sign-up link if they pressed Start
exports.onLeadUpdated = onDocumentUpdated('leads/{id}', async ev => {
  const a = ev.data.before.data() || {}, b = ev.data.after.data() || {};
  if (b.tid && b.tid !== a.tid) await sendTeacher(b.tid, lang => ({ text: leadText(lang, 'assigned', b), extra: btn(t(lang, 'open'), SITE()) }));
  if (b.tid && b.tgChat && b.st !== 'joined' && b.tgSent !== b.tid && (b.tid !== a.tid || b.tgChat !== a.tgChat)) await sendInvite(b, ev.params.id);
});

// a teacher starts a lesson: each chosen student gets the Meet link
exports.onLiveFor = onDocumentWritten('liveFor/{uid}', async ev => {
  const a = (ev.data.before && ev.data.before.data()) || {}, b = (ev.data.after && ev.data.after.data()) || {};
  for (const [tid, v] of Object.entries(b)) {
    if (!v || !v.on || (a[tid] && a[tid].at === v.at) || (v.until || 0) < Date.now()) continue;
    await sendUid(ev.params.uid, lang => ({ text: t(lang, 'live', { name: v.name || '', label: v.label ? '\n' + v.label : '' }), extra: okUrl(v.url) ? btn(t(lang, 'join'), v.url) : btn(t(lang, 'open'), SITE()) }));
  }
});

// an entry is checked (or sent back for rewriting)
exports.onReview = onDocumentWritten('feedback/{uid}/reviews/{eid}', async ev => {
  const a = (ev.data.before && ev.data.before.data()) || {}, b = (ev.data.after && ev.data.after.data()) || null;
  if (!b || (b.status !== 'reviewed' && b.status !== 'revise') || a.status === b.status) return;
  const j = await db.doc('journals/' + ev.params.uid).get(), title = (j.exists && j.data().index && j.data().index[ev.params.eid] && j.data().index[ev.params.eid].title) || '…';
  await sendUid(ev.params.uid, lang => ({ text: t(lang, b.status === 'revise' ? 'revise' : 'checked', { title }), extra: btn(t(lang, 'open'), SITE()) }));
});

// for tests
exports._t = { t, leadText, joinUrl, hookSecret, setupKey };
