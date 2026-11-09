// Lexora Telegram bot on Cloud Functions for Firebase.
//
//  telegram (HTTPS)  — Telegram calls it for every message (webhook):
//      /start u_<code>  links a Lexora account (the site wrote tglink/<code> = {uid, at})
//      /start l_<id>    links a trial request (leads/<id>) so the bot can tell the person when a teacher is assigned
//      a Reply to a chat notification goes back into that Lexora chat
//      ?setup=<key>     (called by GitHub after each deploy) points Telegram at this function and saves the bot name
//  Firestore triggers — new chat messages, visitor questions, trial requests, assignments, lesson start, checked entries,
//      and tgq/{id}: everything else a teacher announces (noticeboard, tasks, payments, bookings, orders), written by the site.
//  newsOut (every 15 min) — tells each newspaper reader in Telegram when their issue comes out.
//
// Settings come from functions/.env, written by the GitHub workflow from the repository secrets:
//   TELEGRAM_TOKEN, SITE_URL, OWNER_EMAIL (and optionally REGION).
// Server-only collections (no client access in firestore.rules): tgChats/{chatId}, tgMsgs/{chatId_messageId}, tgNews/{issueId}, tgClub/{clubId}.
// tg/{uid} = {chatId, username, role, tid, owner, at}: the student/teacher can read their own (to know they are linked).

const crypto = require('crypto');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
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
    hello: 'Assalomu alaykum! Bu Lexora boti. U ustoz xabarlari, dars havolalari va tekshirilgan yozuvlarni Telegramga yetkazadi.\n\nUlash uchun Lexorada “Telegram’ni ulash” tugmasini bosing. Batafsil ma’lumot uchun “Yordam” tugmasini bosing.',
    linked: '✅ Lexora akkauntingiz ulandi. Yangi xabarlar, dars havolalari va tekshiruvlar endi shu yerga keladi.',
    expired: 'Havola eskirgan. Lexoraga qaytib “Telegram’ni ulash” tugmasini yana bosing.',
    leadOk: '✅ So‘rovingiz qabul qilindi. Ustoz biriktirilishi bilan shu yerga xabar beramiz.',
    leadNo: 'So‘rov topilmadi. Lexorada qaytadan so‘rov qoldiring.',
    invite: 'Assalomu alaykum, {name}! Lexora: so‘rovingiz tasdiqlandi. Ustozingiz: {teacher}. Darslarni boshlash uchun shu havola orqali ro‘yxatdan o‘ting:',
    signup: 'Ro‘yxatdan o‘tish', open: 'Lexorani ochish', join: 'Darsga kirish',
    msgFrom: '💬 {name}:', guest: '🌐 Sayt mehmoni {name} ({contact}):', replyHint: '↩ Javob berish uchun shu xabarga “Reply” qiling.',
    sent: '✅ Yuborildi.', notLinked: 'Avval Lexoradagi “Telegram’ni ulash” tugmasi orqali akkauntingizni ulang.', noReply: 'Bu xabarga javob yozib bo‘lmaydi. Lexoraning o‘zida yozing.',
    app: '👩‍🏫 Yangi o‘qituvchilik arizasi: {name} · {contact}\n{langs} · {years} yil tajriba{levels}{bio}',
    clubLive: '🎙 {lang} speaking club hozir jonli! {name} video suhbatni boshladi.', clubMsg: '💬 {lang} speaking club: {name}\n{text}', join2: '🎥 Qo‘shilish', openClub: '💬 Clubni ochish',
    lead: '🆕 Sinov darsi so‘rovi: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 Sizga sinov darsi so‘rovi biriktirildi: {name} · {contact}\n{lang}',
    live: '🔴 {name} darsni boshladi.{label}', checked: '✅ Yozuvingiz tekshirildi: “{title}”.', revise: '✏️ Ustoz “{title}” yozuvini qayta yozishni so‘radi.',
    btnHelp: '❓ Yordam', btnStatus: '📊 Holat', btnMenu: '📋 Menyu',
    helpS: '❓ Lexora boti nima qiladi\n\n💬 Ustozingiz yozgan xabarlar shu yerga keladi. Xabarga “Reply” qilib javob bersangiz, javob Lexora chatiga tushadi.\n🔴 Dars boshlanganda Google Meet havolasi keladi, “Darsga kirish” tugmasini bosing.\n✅ Yozuvingiz tekshirilganda yoki qayta yozishga qaytarilganda xabar keladi.\n\nHech narsa yozish shart emas, xabarlar o‘zi keladi. Buyruqlar: /help yordam, /status ulanish holati, /menu tugmalar.',
    helpT: '❓ Lexora boti nima qiladi\n\n🆕 Sizga biriktirilgan sinov darsi so‘rovlari shu yerga keladi.\n💬 Talabalaringiz xabarlari keladi. “Reply” qilib javob bersangiz, u Lexora chatiga tushadi.\n🌐 Sayt mehmonlarining savollari ham keladi, ularga ham “Reply” bilan javob bering.\n\nBuyruqlar: /help yordam, /status ulanish holati, /menu tugmalar.',
    helpO: '❓ Lexora boti nima qiladi\n\n🆕 Barcha yangi sinov darsi so‘rovlari shu yerga keladi.\n🌐 Ustoz biriktirilmagan mehmon savollari sizga keladi, “Reply” bilan javob bering.\n💬 O‘z talabalaringiz xabarlari ham shu yerga keladi.\n\nBuyruqlar: /help yordam, /status ulanish holati, /menu tugmalar.',
    helpG: '❓ Lexora boti nima qiladi\n\nBot Lexoradagi xabarlarni Telegramga yetkazadi: ustoz xabarlari, dars havolalari, tekshirilgan yozuvlar.\n\nUlash uchun: Lexorani oching va “Telegram’ni ulash” tugmasini bosing. Sinov darsi so‘ragan bo‘lsangiz, so‘rovdagi tugma orqali botga o‘ting.\n\nBuyruqlar: /help yordam, /status ulanish holati, /menu tugmalar.',
    statusOn: '✅ Akkauntingiz ulangan.\nRol: {role}{extra}', statusOff: '⚠️ Akkaunt hali ulanmagan. Lexorada “Telegram’ni ulash” tugmasini bosing.',
    r_student: 'talaba', r_staff: 'ustoz', r_owner: 'egasi', yourTeacher: 'Ustozingiz',
    menu: '📋 Menyu: kerakli tugmani tanlang.',
  },
  ru: {
    hello: 'Здравствуйте! Это бот Lexora. Он доставляет сообщения преподавателя, ссылки на уроки и проверенные записи.\n\nЧтобы подключить, нажмите в Lexora «Подключить Telegram». Подробности: кнопка «Помощь».',
    linked: '✅ Аккаунт Lexora подключён. Новые сообщения, ссылки на уроки и проверки теперь будут приходить сюда.',
    expired: 'Ссылка устарела. Вернитесь в Lexora и снова нажмите «Подключить Telegram».',
    leadOk: '✅ Заявка принята. Как только назначим преподавателя, напишем сюда.',
    leadNo: 'Заявка не найдена. Оставьте заявку в Lexora ещё раз.',
    invite: 'Здравствуйте, {name}! Lexora: ваша заявка подтверждена. Ваш преподаватель: {teacher}. Чтобы начать занятия, зарегистрируйтесь по ссылке:',
    signup: 'Зарегистрироваться', open: 'Открыть Lexora', join: 'Войти на урок',
    msgFrom: '💬 {name}:', guest: '🌐 Посетитель сайта {name} ({contact}):', replyHint: '↩ Чтобы ответить, сделайте «Ответить» (Reply) на это сообщение.',
    sent: '✅ Отправлено.', notLinked: 'Сначала подключите аккаунт кнопкой «Подключить Telegram» в Lexora.', noReply: 'На это сообщение нельзя ответить. Напишите в самой Lexora.',
    app: '👩‍🏫 Новая заявка преподавателя: {name} · {contact}\n{langs} · опыт {years} лет{levels}{bio}',
    clubLive: '🎙 Speaking club ({lang}) сейчас в эфире! {name} начал(а) видеочат.', clubMsg: '💬 Speaking club ({lang}): {name}\n{text}', join2: '🎥 Присоединиться', openClub: '💬 Открыть клуб',
    lead: '🆕 Заявка на пробный урок: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 Вам назначена заявка на пробный урок: {name} · {contact}\n{lang}',
    live: '🔴 {name} начал(а) урок.{label}', checked: '✅ Ваша запись проверена: «{title}».', revise: '✏️ Преподаватель просит переписать «{title}».',
    btnHelp: '❓ Помощь', btnStatus: '📊 Статус', btnMenu: '📋 Меню',
    helpS: '❓ Что умеет бот Lexora\n\n💬 Сообщения вашего преподавателя приходят сюда. Ответьте на сообщение через «Ответить» (Reply), и ответ попадёт в чат Lexora.\n🔴 Когда урок начинается, приходит ссылка Google Meet: нажмите «Войти на урок».\n✅ Приходит уведомление, когда запись проверена или возвращена на переписывание.\n\nПисать ничего не нужно, уведомления приходят сами. Команды: /help помощь, /status статус подключения, /menu кнопки.',
    helpT: '❓ Что умеет бот Lexora\n\n🆕 Сюда приходят заявки на пробный урок, назначенные вам.\n💬 Приходят сообщения ваших учеников. Ответьте через «Ответить» (Reply), и ответ попадёт в чат Lexora.\n🌐 Приходят и вопросы посетителей сайта, отвечайте на них так же.\n\nКоманды: /help помощь, /status статус подключения, /menu кнопки.',
    helpO: '❓ Что умеет бот Lexora\n\n🆕 Сюда приходят все новые заявки на пробный урок.\n🌐 Вопросы посетителей без назначенного преподавателя приходят вам, отвечайте через «Ответить» (Reply).\n💬 Сообщения ваших учеников тоже приходят сюда.\n\nКоманды: /help помощь, /status статус подключения, /menu кнопки.',
    helpG: '❓ Что умеет бот Lexora\n\nБот доставляет в Telegram уведомления Lexora: сообщения преподавателя, ссылки на уроки, проверенные записи.\n\nЧтобы подключить: откройте Lexora и нажмите «Подключить Telegram». Если вы оставили заявку на пробный урок, перейдите в бота по кнопке в заявке.\n\nКоманды: /help помощь, /status статус подключения, /menu кнопки.',
    statusOn: '✅ Аккаунт подключён.\nРоль: {role}{extra}', statusOff: '⚠️ Аккаунт ещё не подключён. Нажмите в Lexora «Подключить Telegram».',
    r_student: 'ученик', r_staff: 'преподаватель', r_owner: 'владелец', yourTeacher: 'Ваш преподаватель',
    menu: '📋 Меню: выберите нужную кнопку.',
  },
  en: {
    hello: 'Hello! This is the Lexora bot. It brings you teacher messages, lesson links and checked entries.\n\nTo connect, press “Connect Telegram” in Lexora. For details press “Help”.',
    linked: '✅ Your Lexora account is connected. New messages, lesson links and checked entries will come here.',
    expired: 'This link has expired. Go back to Lexora and press “Connect Telegram” again.',
    leadOk: '✅ Your request is received. We will write here as soon as a teacher is assigned.',
    leadNo: 'Request not found. Please send a new request on Lexora.',
    invite: 'Hello, {name}! Lexora: your request is confirmed. Your teacher is {teacher}. To start your lessons, sign up with this link:',
    signup: 'Sign up', open: 'Open Lexora', join: 'Join the lesson',
    msgFrom: '💬 {name}:', guest: '🌐 Site visitor {name} ({contact}):', replyHint: '↩ Reply to this message to answer.',
    sent: '✅ Sent.', notLinked: 'First connect your account with “Connect Telegram” in Lexora.', noReply: 'You cannot answer this message here. Please write in Lexora.',
    app: '👩‍🏫 New teacher application: {name} · {contact}\n{langs} · {years} years of experience{levels}{bio}',
    clubLive: '🎙 The {lang} speaking club is live now! {name} started the video chat.', clubMsg: '💬 {lang} speaking club: {name}\n{text}', join2: '🎥 Join', openClub: '💬 Open the club',
    lead: '🆕 Trial request: {name} · {contact}\n{lang}{fmt}{msg}', assigned: '📌 A trial request was assigned to you: {name} · {contact}\n{lang}',
    live: '🔴 {name} has started the lesson.{label}', checked: '✅ Your entry was checked: “{title}”.', revise: '✏️ Your teacher asks you to rewrite “{title}”.',
    btnHelp: '❓ Help', btnStatus: '📊 Status', btnMenu: '📋 Menu',
    helpS: '❓ What the Lexora bot does\n\n💬 Messages from your teacher arrive here. Answer with “Reply” and your answer goes into the Lexora chat.\n🔴 When a lesson starts you get the Google Meet link: press “Join the lesson”.\n✅ You are told when an entry is checked or sent back for rewriting.\n\nYou do not need to type anything, notifications come by themselves. Commands: /help help, /status connection status, /menu buttons.',
    helpT: '❓ What the Lexora bot does\n\n🆕 Trial requests assigned to you arrive here.\n💬 Your students’ messages arrive here. Answer with “Reply” and it goes into the Lexora chat.\n🌐 Questions from site visitors arrive here too, answer them the same way.\n\nCommands: /help help, /status connection status, /menu buttons.',
    helpO: '❓ What the Lexora bot does\n\n🆕 Every new trial request arrives here.\n🌐 Visitor questions with no teacher assigned come to you, answer with “Reply”.\n💬 Messages from your own students arrive here too.\n\nCommands: /help help, /status connection status, /menu buttons.',
    helpG: '❓ What the Lexora bot does\n\nThe bot brings Lexora notifications to Telegram: teacher messages, lesson links, checked entries.\n\nTo connect: open Lexora and press “Connect Telegram”. If you sent a trial request, use the button in that request to open the bot.\n\nCommands: /help help, /status connection status, /menu buttons.',
    statusOn: '✅ Your account is connected.\nRole: {role}{extra}', statusOff: '⚠️ Your account is not connected yet. Press “Connect Telegram” in Lexora.',
    r_student: 'student', r_staff: 'teacher', r_owner: 'owner', yourTeacher: 'Your teacher',
    menu: '📋 Menu: pick a button.',
  },
};
const FMT = { uz: { group: 'Guruh', ind: 'Individual' }, ru: { group: 'Группа', ind: 'Индивидуально' }, en: { group: 'Group', ind: 'Individual' } };
const L = lang => (T[lang] ? lang : 'uz');
const t = (lang, k, v = {}) => String(T[L(lang)][k] || T.uz[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v[n] == null ? '' : String(v[n])));
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const btn = (text, url) => ({ reply_markup: { inline_keyboard: [[{ text, url }]] } });
// the main menu: open the site, help, connection status
const menuKb = lang => ({ reply_markup: { inline_keyboard: [[{ text: '🌐 Lexora', url: SITE() }], [{ text: t(lang, 'btnHelp'), callback_data: 'help' }, { text: t(lang, 'btnStatus'), callback_data: 'status' }]] } });
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
async function chatInfo(chatId, fallback) {
  const c = await db.doc('tgChats/' + chatId).get();
  if (!c.exists) return { linked: false, lang: fallback };
  const uid = c.data().uid, g = await db.doc('tg/' + uid).get();
  if (!g.exists) return { linked: false, lang: fallback };
  return { linked: true, uid, lang: await langOf(uid), tg: g.data() };
}
async function sendHelp(chatId, fallback) {
  const i = await chatInfo(chatId, fallback), k = !i.linked ? 'helpG' : i.tg.owner ? 'helpO' : i.tg.role === 'staff' ? 'helpT' : 'helpS';
  return sendChat(chatId, t(i.lang, k), menuKb(i.lang));
}
async function sendStatus(chatId, fallback) {
  const i = await chatInfo(chatId, fallback);
  if (!i.linked) return sendChat(chatId, t(i.lang, 'statusOff'), menuKb(i.lang));
  let extra = '';
  if (i.tg.role === 'student') {
    try { const j = await db.doc('journals/' + i.uid).get(); if (j.exists && j.data().teacher) extra = '\n' + t(i.lang, 'yourTeacher') + ': ' + await teacherName(j.data().teacher); } catch (e) { /* no teacher yet */ }
  }
  return sendChat(chatId, t(i.lang, 'statusOn', { role: t(i.lang, 'r_' + (i.tg.owner ? 'owner' : i.tg.role === 'staff' ? 'staff' : 'student')), extra }), menuKb(i.lang));
}

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
      const hook = await api('setWebhook', { url, secret_token: hookSecret(), allowed_updates: ['message', 'callback_query'], drop_pending_updates: false });
      if (hook.ok) await setupMenu();
      if (me.ok) await db.doc('site/bot').set({ username: me.result.username, on: !!hook.ok, at: Date.now() });
      res.status(hook.ok ? 200 : 500).json({ ok: !!hook.ok, bot: me.ok ? me.result.username : null, url });
      return;
    }
    res.status(200).send('Lexora bot'); return;
  }
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== hookSecret()) { res.status(403).send('no'); return; }
  try { if (req.body && req.body.callback_query) await onCallback(req.body.callback_query); else await onMessage(req.body && req.body.message); } catch (e) { logger.error('update failed', e); }
  res.status(200).send('ok');   // always 200, or Telegram keeps resending
});

// the “Menu” list next to the message box, and the bot's profile texts (each language, uz by default)
const COMMANDS = { uz: [['help', 'Yordam: bot nima qiladi'], ['status', 'Ulanish holati'], ['menu', 'Tugmalar']], ru: [['help', 'Помощь: что умеет бот'], ['status', 'Статус подключения'], ['menu', 'Кнопки']], en: [['help', 'Help: what the bot does'], ['status', 'Connection status'], ['menu', 'Buttons']] };
const ABOUT = { uz: 'Lexora xabarnomalari: ustoz xabarlari, dars havolalari, tekshirilgan yozuvlar.', ru: 'Уведомления Lexora: сообщения преподавателя, ссылки на уроки, проверенные записи.', en: 'Lexora notifications: teacher messages, lesson links, checked entries.' };
async function setupMenu() {
  const list = lang => COMMANDS[lang].map(([command, description]) => ({ command, description }));
  await api('setMyCommands', { commands: list('uz') });                 // everyone else sees Uzbek
  await api('setMyShortDescription', { short_description: ABOUT.uz });
  for (const lang of ['uz', 'ru', 'en']) {
    await api('setMyCommands', { commands: list(lang), language_code: lang });
    await api('setMyShortDescription', { short_description: ABOUT[lang], language_code: lang });
  }
}

// a pressed menu button
async function onCallback(q) {
  if (!q || !q.id) return;
  await api('answerCallbackQuery', { callback_query_id: q.id });
  const chat = q.message && q.message.chat;
  if (!chat || chat.type !== 'private') return;
  const lang = L((q.from && q.from.language_code || '').slice(0, 2));
  if (q.data === 'help') return sendHelp(chat.id, lang);
  if (q.data === 'status') return sendStatus(chat.id, lang);
}

async function onMessage(msg) {
  if (!msg || !msg.chat || msg.chat.type !== 'private' || typeof msg.text !== 'string') return;
  const chatId = msg.chat.id, text = msg.text.trim(), lang = L((msg.from && msg.from.language_code || '').slice(0, 2));
  const st = text.match(/^\/start(?:\s+(\S+))?/);
  if (st) {
    const p = st[1] || '';
    if (p.startsWith('u_')) return linkAccount(chatId, msg.from || {}, p.slice(2), lang);
    if (p.startsWith('l_')) return linkLead(chatId, msg.from || {}, p.slice(2), lang);
    return sendChat(chatId, t(lang, 'hello'), menuKb(lang));
  }
  const cmd = text.match(/^\/(\w+)(?:@\w+)?(?:\s|$)/);
  if (cmd) {
    if (cmd[1] === 'help') return sendHelp(chatId, lang);
    if (cmd[1] === 'status') return sendStatus(chatId, lang);
    if (cmd[1] === 'menu') { const ml = (await chatInfo(chatId, lang)).lang; return sendChat(chatId, t(ml, 'menu'), menuKb(ml)); }
  }
  const reply = msg.reply_to_message;
  if (!reply) {
    const c = await db.doc('tgChats/' + chatId).get();
    return sendChat(chatId, c.exists ? t(lang, 'noReply') : t(lang, 'notLinked'), menuKb(lang));
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
  { const ul = await langOf(uid) || lang; return sendChat(chatId, t(ul, 'linked'), menuKb(ul)); }
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

// a visitor applies to teach: tell the owner
exports.onApplication = onDocumentCreated('applications/{id}', async ev => {
  const a = ev.data && ev.data.data(); if (!a) return;
  await sendOwner(lang => ({ text: t(lang, 'app', { name: clip(a.name, 80), contact: clip(a.contact, 80), langs: (a.langs || []).join(', '), years: a.years || 0,
    levels: a.levels ? ' · ' + clip(a.levels, 60) : '', bio: a.bio ? '\n“' + clip(a.bio, 400) + '”' : '' }), extra: btn(t(lang, 'open'), SITE()) }));
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

/* ---------------- speaking clubs ---------------- */
// club/{lang}_{day}: {topic, video:{on,url,at,until,by,byName}}; club/{id}/msgs/{m}: {uid,name,text,at,mod}
// Everyone who studies or teaches that language (same test as firestore.rules) hears about it in Telegram.
const LANG_NAMES = { uz: { English: 'Ingliz tili', Russian: 'Rus tili', German: 'Nemis tili', Turkish: 'Turk tili', Korean: 'Koreys tili', Chinese: 'Xitoy tili', Japanese: 'Yapon tili', Spanish: 'Ispan tili' },
  ru: { English: 'английский', Russian: 'русский', German: 'немецкий', Turkish: 'турецкий', Korean: 'корейский', Chinese: 'китайский', Japanese: 'японский', Spanish: 'испанский' } };
const langLabel = (lang, l) => (LANG_NAMES[L(lang)] && LANG_NAMES[L(lang)][l]) || l;
async function clubPeople(langName, exceptUid) {
  const tl = {}, teacherLangs = async tid => {
    if (!(tid in tl)) { const d = await db.doc('teachers/' + tid).get(), l = (d.exists && d.data().langs) || []; tl[tid] = l.length ? l : ['English']; }
    return tl[tid];
  };
  const out = [], q = await db.collection('tg').get();
  for (const d of q.docs) {
    const g = d.data(), uid = d.id; if (uid === exceptUid || g.owner) continue;
    if (g.role === 'staff') { if ((await teacherLangs(g.tid)).includes(langName)) out.push(uid); continue; }
    const j = await db.doc('journals/' + uid).get();
    if (j.exists && (await teacherLangs(j.data().teacher || 'main')).includes(langName)) { out.push(uid); continue; }
    const e = await db.doc('enrollStatus/' + uid).get();
    if (e.exists && (e.data().langs || []).includes(langName)) out.push(uid);
  }
  return out;
}
// a teacher starts the club video chat
exports.onClubVideo = onDocumentWritten({ document: 'club/{id}', timeoutSeconds: 300 }, async ev => {
  const a = (ev.data.before && ev.data.before.data()) || {}, b = (ev.data.after && ev.data.after.data()) || {};
  const v = b.video || {}, was = a.video || {};
  if (!v.on || (v.until || 0) < Date.now() || (was.on && was.at === v.at)) return;
  const l = ev.params.id.split('_')[0];
  for (const uid of await clubPeople(l, v.by)) await sendUid(uid, lang => ({ text: t(lang, 'clubLive', { lang: langLabel(lang, l), name: v.byName || '' }), extra: okUrl(v.url) ? btn(t(lang, 'join2'), v.url) : btn(t(lang, 'openClub'), SITE() + '#club') }));
});
// a club message: at most one ping per club every 30 minutes, so a lively chat doesn't flood anyone
const CLUB_QUIET = 30 * 60e3;
exports.onClubMsg = onDocumentCreated({ document: 'club/{id}/msgs/{m}', timeoutSeconds: 300 }, async ev => {
  const m = ev.data && ev.data.data(); if (!m || !m.text) return;
  const mark = db.doc('tgClub/' + ev.params.id), now = Date.now();
  const ok = await db.runTransaction(async tx => { const s = await tx.get(mark); if (s.exists && now - (s.data().at || 0) < CLUB_QUIET) return false; tx.set(mark, { at: now }); return true; });
  if (!ok) return;
  const l = ev.params.id.split('_')[0];
  for (const uid of await clubPeople(l, m.uid)) await sendUid(uid, lang => ({ text: t(lang, 'clubMsg', { lang: langLabel(lang, l), name: clip(m.name, 80), text: clip(m.text, 300) }), extra: btn(t(lang, 'openClub'), SITE() + '#club') }));
});

/* ---------------- teacher announcements (tgq) ---------------- */
// The site writes tgq/{id} = {ev, uids, msg:{uz,ru,en}, btn:{uz,ru,en}, href, by, at}; the rules let only the owner and staff
// teachers create it, with by = their own uid. A staff teacher's message reaches only their own students.
async function senderOf(uid) {
  let user; try { user = await admin.auth().getUser(uid); } catch (e) { return null; }
  const email = String(user.email || '').toLowerCase();
  if (!email || !user.emailVerified) return null;
  if (email === OWNER()) return { owner: true };
  const sf = await db.doc('staff/' + email).get();
  return sf.exists && sf.data().tid ? { tid: sf.data().tid } : null;
}
async function teaches(tid, uid) {
  const j = await db.doc('journals/' + uid).get();
  if (j.exists && (j.data().teacher || 'main') === tid) return true;
  const e = await db.doc('enrollStatus/' + uid).get();
  return e.exists && e.data()[tid] === 'ok';
}
exports.onNotice = onDocumentCreated({ document: 'tgq/{id}', timeoutSeconds: 300 }, async ev => {
  const n = ev.data && ev.data.data(); if (!n) return;
  try {
    const who = await senderOf(n.by); if (!who) return;
    const msg = n.msg || {}, bt = n.btn || {}, url = okUrl(n.href) ? n.href : SITE();
    const uids = [...new Set((Array.isArray(n.uids) ? n.uids : []).filter(u => typeof u === 'string' && /^[\w-]{1,128}$/.test(u)))].slice(0, 1000);
    for (const uid of uids) {
      if (!who.owner && !(await teaches(who.tid, uid))) continue;
      await sendUid(uid, lang => ({ text: String(msg[lang] || msg.uz || msg.en || ''), extra: btn(String(bt[lang] || t(lang, 'open')), url) }));
    }
  } finally { await ev.data.ref.delete().catch(() => {}); }
});

/* ---------------- the daily newspaper ---------------- */
// newsDays/{uid}_{YYYY-MM-DD} = {releaseAt, stories:[{h}], on, …}; passes/{uid}.news.until says who has paid.
const NEWS = {
  uz: { subj: '📰 {name} · {day}: gazetangiz keldi', title: 'Bugungi son chiqdi', line: 'Maqolalarni o‘qing, testlarni yeching va bugungi mavzu haqida kundaligingizga yozing.', read: '📰 O‘qish', loc: 'uz-UZ' },
  ru: { subj: '📰 {name} · {day}: ваша газета пришла', title: 'Сегодняшний выпуск вышел', line: 'Прочитайте статьи, решите тесты и напишите в дневник на тему дня.', read: '📰 Читать', loc: 'ru-RU' },
  en: { subj: '📰 {name} · {day}: your paper is here', title: 'Today’s issue is out', line: 'Read the stories, do the quizzes and write about today’s topic in your journal.', read: '📰 Read', loc: 'en-GB' },
};
const weekday = (lang, date) => { try { const s = new Date(date + 'T12:00:00Z').toLocaleDateString(NEWS[L(lang)].loc, { weekday: 'long', timeZone: 'UTC' }); return s.charAt(0).toUpperCase() + s.slice(1); } catch (e) { return date; } };
const newsText = (lang, name, date, stories) => { const N = NEWS[L(lang)];
  return N.subj.replace('{name}', name).replace('{day}', weekday(lang, date)) + '\n\n' + N.title + '\n' + (stories || []).map(s => '• ' + clip(s && s.h, 200)).join('\n') + '\n\n' + N.line; };
exports.newsOut = onSchedule({ schedule: 'every 15 minutes', timeZone: 'Asia/Tashkent', timeoutSeconds: 300 }, async () => {
  const now = Date.now();
  const q = await db.collection('newsDays').where('releaseAt', '<=', now).where('releaseAt', '>', now - 6 * 3600e3).get();
  if (q.empty) return;
  const pm = await db.doc('premium/main').get(), P = (pm.exists && pm.data().news) || {};
  if (P.on === false) return;
  const name = P.name || 'The Lexora Daily';
  for (const d of q.docs) {
    const x = d.data(), m = d.id.match(/^(.+)_(\d{4}-\d{2}-\d{2})$/);
    if (!m || x.on === false || !(x.stories || []).length) continue;
    const mark = db.doc('tgNews/' + d.id); if ((await mark.get()).exists) continue;
    const ps = await db.doc('passes/' + m[1]).get(), until = +((ps.exists && ps.data().news && ps.data().news.until) || 0);
    if (until < x.releaseAt) continue;
    await mark.set({ at: now });   // marked first: a reader never gets the same issue twice
    await sendUid(m[1], lang => ({ text: newsText(lang, name, m[2], x.stories), extra: btn(NEWS[L(lang)].read, SITE()) }));
  }
});

// for tests
exports._t = { t, leadText, joinUrl, hookSecret, setupKey, newsText };
