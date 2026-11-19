// Offline test of the bot: an in-memory Firestore and a fake Telegram API.  Run:  npm test  (in functions/)
const Module = require('module');
const store = new Map(), sent = [];
let autoId = 0;
const snap = (path) => ({ id: path.split('/').pop(), exists: store.has(path), data: () => (store.has(path) ? JSON.parse(JSON.stringify(store.get(path))) : undefined), ref: doc(path) });
function doc(path) {
  return { id: path.split('/').pop(), path,
    get: async () => snap(path),
    set: async (d, o) => { const cur = (o && o.merge && store.get(path)) || {}, out = { ...cur };
      for (const [k, v] of Object.entries(d)) out[k] = v && v.__inc ? (cur[k] || 0) + v.__inc : v;
      store.set(path, o && o.merge ? out : { ...d }); },
    update: async (d) => { if (!store.has(path)) throw new Error('no doc ' + path); store.set(path, { ...store.get(path), ...d }); },
    delete: async () => { store.delete(path); } };
}
function collection(path) {
  const OPS = { '==': (a, b) => a === b, '<=': (a, b) => a <= b, '<': (a, b) => a < b, '>': (a, b) => a > b, '>=': (a, b) => a >= b };
  const list = fs => [...store.keys()].filter(k => k.slice(0, k.lastIndexOf('/')) === path && fs.every(([f, op, v]) => OPS[op]((store.get(k) || {})[f], v))).map(snap);
  const query = fs => ({ select: () => query(fs), where: (f, op, v) => query([...fs, [f, op, v]]), get: async () => { const docs = list(fs); return { docs, empty: !docs.length }; } });
  return { doc: id => doc(path + '/' + (id || 'auto' + (++autoId))), add: async d => { const p = path + '/auto' + (++autoId); store.set(p, { ...d }); return doc(p); }, ...query([]) };
}
const fakeDb = { doc, collection, runTransaction: async fn => fn({ get: r => r.get(), set: (r, d) => r.set(d) }) };
const users = { s1: { email: 'aziza@x.com', emailVerified: false }, own: { email: 'samandaryusupov559@gmail.com', emailVerified: true }, dil: { email: 'dil@x.com', emailVerified: true } };
const fakeFirestore = () => fakeDb; fakeFirestore.FieldValue = { increment: n => ({ __inc: n }) };
const fakeAdmin = { initializeApp() {}, firestore: fakeFirestore, auth: () => ({ getUser: async uid => { if (!users[uid]) throw new Error('no user'); return users[uid]; }, generateSignInWithEmailLink: async (e, s) => 'https://daybook.firebaseapp.com/__/auth/action?oobCode=abc&continueUrl=' + encodeURIComponent(s.url) }) };
const load = Module._load;
Module._load = function (req, ...rest) { return req === 'firebase-admin' ? fakeAdmin : load.call(this, req, ...rest); };
let msgId = 100;
global.fetch = async (url, o) => { const method = url.split('/').pop(), body = JSON.parse(o.body); sent.push({ method, ...body });
  const result = method === 'getMe' ? { username: 'lexora_test_bot' } : method === 'sendMessage' ? { message_id: ++msgId } : true;
  return { json: async () => ({ ok: true, result }) }; };

process.env.TELEGRAM_TOKEN = '123:abc'; process.env.OWNER_EMAIL = 'samandaryusupov559@gmail.com'; process.env.SITE_URL = 'https://example.github.io/lexora';
const bot = require('./index.js');
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name); } };
const last = () => sent[sent.length - 1] || {};
function call(body, headers = {}, query = {}) {
  return new Promise(resolve => {
    const fin = [], done = x => { resolve(x); fin.forEach(f => f()); };
    const res = { code: 200, on(e, f) { if (e === 'finish') fin.push(f); }, status(c) { this.code = c; return this; }, send(x) { done({ code: this.code, body: x }); }, json(x) { done({ code: this.code, body: x }); }, setHeader() {}, getHeader() {} };
    const h = { 'x-telegram-bot-api-secret-token': bot._t.hookSecret(), host: 'europe-west1-p.cloudfunctions.net', ...headers };
    bot.telegram({ method: body ? 'POST' : 'GET', body, query, path: '/', baseUrl: '', get: k => h[k.toLowerCase()], header: k => h[k.toLowerCase()], headers: h }, res);
  });
}
const tgMsg = (chat, text, extra = {}) => ({ message: { chat: { id: chat, type: 'private' }, from: { id: chat, username: 'u' + chat, language_code: 'uz' }, text, ...extra } });
const ev = (params, after, before) => ({ params, data: before === undefined ? { data: () => after } : { before: { data: () => before }, after: { data: () => after } } });

(async () => {
  store.set('teachers/main', { name: 'Samandar' }); store.set('teachers/t-dil', { name: 'Dilso‘z' }); store.set('staff/dil@x.com', { tid: 't-dil' });
  store.set('journals/s1', { name: 'Aziza', teacher: 't-dil', index: { e1: { title: 'My weekend' } } }); store.set('contacts/s1', { lang: 'uz' });

  console.log('Setup and security');
  let r = await call(null, {}, { setup: 'wrong' }); ok('setup needs the key', r.code === 200 && !store.has('site/bot'));
  r = await call(null, {}, { setup: bot._t.setupKey(), hook: 'https://europe-west1-p.cloudfunctions.net/telegram' });
  ok('setup sets the webhook and saves the bot name', r.code === 200 && store.get('site/bot').username === 'lexora_test_bot' && sent.some(x => x.method === 'setWebhook' && x.url.endsWith('/telegram')));
  r = await call(tgMsg(1, '/start'), { 'x-telegram-bot-api-secret-token': 'bad' }); ok('webhook without the secret is refused', r.code === 403);

  console.log('Linking');
  await call(tgMsg(1, '/start u_nope_nope_nope_nope')); ok('unknown code says the link expired', /eskirgan/.test(last().text));
  store.set('tglink/codecodecodecode1', { uid: 's1', at: Date.now() }); await call(tgMsg(11, '/start u_codecodecodecode1'));
  ok('student linked', store.get('tg/s1')?.chatId === 11 && store.get('tg/s1').role === 'student' && !store.has('tglink/codecodecodecode1'));
  store.set('tglink/codecodecodecode2', { uid: 'dil', at: Date.now() }); await call(tgMsg(22, '/start u_codecodecodecode2'));
  ok('staff teacher linked with their tid', store.get('tg/dil')?.tid === 't-dil' && store.get('tg/dil').role === 'staff');
  store.set('tglink/codecodecodecode3', { uid: 'own', at: Date.now() }); await call(tgMsg(33, '/start u_codecodecodecode3'));
  ok('owner linked', store.get('tg/own')?.owner === true && store.get('tg/own').tid === 'main');
  store.set('tglink/codecodecodecode4', { uid: 's1', at: Date.now() - 2 * 864e5 }); await call(tgMsg(44, '/start u_codecodecodecode4')); ok('old code refused', /eskirgan/.test(last().text));

  console.log('Chats');
  store.set('dm/s1_t-dil', { uid: 's1', tid: 't-dil', name: 'Aziza' });
  sent.length = 0; await bot.onDmMessage.run(ev({ id: 's1_t-dil', m: 'a' }, { uid: 's1', name: 'Aziza', text: 'Salom ustoz', by: 's', at: 1 }));
  ok('student message reaches the teacher', last().chat_id === 22 && /Salom ustoz/.test(last().text));
  const teacherMsg = msgId;
  sent.length = 0; await call(tgMsg(22, 'Salom Aziza!', { reply_to_message: { message_id: teacherMsg } }));
  const back = [...store.entries()].find(([k, v]) => k.startsWith('dm/s1_t-dil/msgs/') && v.text === 'Salom Aziza!');
  ok('teacher’s Telegram reply lands in the Lexora chat', back && back[1].by === 't' && back[1].uid === 'dil' && store.get('dm/s1_t-dil').lastBy === 't');
  sent.length = 0; await bot.onDmMessage.run(ev({ id: 's1_t-dil', m: 'b' }, back[1]));
  ok('...and the student is told', last().chat_id === 11 && /Salom Aziza!/.test(last().text));
  sent.length = 0; await call(tgMsg(33, 'Men ham', { reply_to_message: { message_id: teacherMsg } }));
  ok('a reply to someone else’s notification is refused', /yozib bo/.test(last().text));
  await call(tgMsg(11, 'hello')); ok('plain text without Reply explains what to do', /javob yozib bo/.test(last().text));

  console.log('Visitors and requests');
  store.set('gchat/G1', { name: 'Malika', contact: '+998901112233', tid: '' });
  sent.length = 0; await bot.onGuestMessage.run(ev({ id: 'G1', m: 'x' }, { name: 'Malika', text: 'Kurs bormi?', by: 'g', at: 1 }));
  ok('visitor question goes to the owner', sent.length === 1 && last().chat_id === 33);
  store.set('leads/L1', { name: 'Marhabo X', contact: '+998887031343', lang: 'English', level: 'B1', fmt: 'ind', quote: '650 000 so‘m / oy', tid: '', at: 1 });
  sent.length = 0; await bot.onLeadCreated.run(ev({ id: 'L1' }, store.get('leads/L1')));
  ok('new request reaches the owner with format and price', last().chat_id === 33 && /Individual · 650 000/.test(last().text));
  await call(tgMsg(55, '/start l_L1xxxxxxxx')); ok('unknown request id', /topilmadi/.test(last().text));
  store.set('leads/L1abcdefghij', { ...store.get('leads/L1') });
  sent.length = 0; await call(tgMsg(55, '/start l_L1abcdefghij'));
  ok('person confirms the request in Telegram', store.get('leads/L1abcdefghij').tgChat === 55 && /qabul qilindi/.test(last().text));
  const before = store.get('leads/L1abcdefghij'); store.set('leads/L1abcdefghij', { ...before, tid: 't-dil' });
  sent.length = 0; await bot.onLeadUpdated.run(ev({ id: 'L1abcdefghij' }, store.get('leads/L1abcdefghij'), before));
  ok('assigned teacher is told', sent.some(x => x.chat_id === 22 && /biriktirildi/.test(x.text)));
  ok('the person gets the sign-up link with the teacher', sent.some(x => x.chat_id === 55 && /Dilso‘z/.test(x.text) && /#join=t-dil\.L1abcdefghij/.test(x.text)));
  const b2 = store.get('leads/L1abcdefghij');
  sent.length = 0; await bot.onLeadUpdated.run(ev({ id: 'L1abcdefghij' }, b2, before));
  ok('the link is not sent twice', !sent.some(x => x.chat_id === 55));

  console.log('Menu, help and buttons');
  const flat = m => (m.reply_markup ? m.reply_markup.inline_keyboard.flat() : []);
  sent.length = 0; await call(tgMsg(99, '/start'));
  ok('/start shows the intro with Open, Help and Status buttons', /Lexora boti/.test(last().text) && flat(last()).some(b => b.url) && flat(last()).some(b => b.callback_data === 'help') && flat(last()).some(b => b.callback_data === 'status'));
  sent.length = 0; await call(tgMsg(99, '/help'));
  ok('/help for someone not linked explains how to connect', /ulash/i.test(last().text) && /Telegram’ni ulash/.test(last().text));
  sent.length = 0; await call(tgMsg(11, '/help@lexora_test_bot'));
  ok('/help for a student explains Reply and the lesson link', /Reply/.test(last().text) && /Meet/.test(last().text) && !/sinov darsi so‘rovlari/.test(last().text));
  sent.length = 0; await call(tgMsg(22, '/help')); ok('/help for a teacher mentions assigned requests', /biriktirilgan/.test(last().text));
  sent.length = 0; await call(tgMsg(33, '/help')); ok('/help for the owner mentions all requests', /Barcha yangi/.test(last().text));
  sent.length = 0; await call(tgMsg(11, '/status')); ok('/status shows role and teacher', /talaba/.test(last().text) && /Dilso‘z/.test(last().text));
  sent.length = 0; await call(tgMsg(99, '/status')); ok('/status for someone not linked says so', /ulanmagan/.test(last().text));
  sent.length = 0; await call(tgMsg(11, '/menu')); ok('/menu sends the buttons', flat(last()).length === 3);
  sent.length = 0; await call({ callback_query: { id: 'cb1', data: 'help', from: { id: 11, language_code: 'uz' }, message: { chat: { id: 11, type: 'private' }, message_id: 5 } } });
  ok('a Help button press is answered and sends help', sent.some(x => x.method === 'answerCallbackQuery' && x.callback_query_id === 'cb1') && /Reply/.test(last().text));
  sent.length = 0; await call({ callback_query: { id: 'cb2', data: 'status', from: { id: 22, language_code: 'uz' }, message: { chat: { id: 22, type: 'private' }, message_id: 6 } } });
  ok('a Status button press shows the status', /ustoz/.test(last().text));
  store.set('contacts/s1', { lang: 'ru' }); sent.length = 0; await call(tgMsg(11, '/help'));
  ok('help follows the language set in Lexora', /Что умеет бот/.test(last().text)); store.set('contacts/s1', { lang: 'uz' });
  sent.length = 0; await call(tgMsg(11, 'hello')); ok('plain text now also shows the menu buttons', flat(last()).some(b => b.callback_data === 'help'));
  sent.length = 0; await call(null, {}, { setup: bot._t.setupKey(), hook: 'https://europe-west1-p.cloudfunctions.net/telegram' });
  ok('setup allows button presses and sets the command list', sent.some(x => x.method === 'setWebhook' && x.allowed_updates.includes('callback_query')) && sent.filter(x => x.method === 'setMyCommands').length >= 3);

  console.log('Lessons and checked entries');
  sent.length = 0; await bot.onLiveFor.run(ev({ uid: 's1' }, { 't-dil': { on: true, at: 5, until: Date.now() + 3600e3, url: 'https://meet.google.com/abc-defg-hij', name: 'Dilso‘z', label: 'B1' } }, {}));
  ok('lesson start sends the Meet button', last().chat_id === 11 && last().reply_markup.inline_keyboard[0][0].url.startsWith('https://meet.google.com'));
  sent.length = 0; await bot.onLiveFor.run(ev({ uid: 's1' }, { 't-dil': { on: true, at: 5, until: Date.now() + 3600e3, url: 'https://meet.google.com/abc' } }, { 't-dil': { on: true, at: 5 } }));
  ok('the same lesson is not sent again', sent.length === 0);
  sent.length = 0; await bot.onReview.run(ev({ uid: 's1', eid: 'e1' }, { status: 'reviewed' }, { status: 'inreview' }));
  ok('checked entry is announced with its title', /My weekend/.test(last().text));

  console.log('Teacher applications');
  sent.length = 0; await bot.onApplication.run(ev({ id: 'a1' }, { name: 'Malika', contact: '@malika', langs: ['English', 'German'], years: 5, bio: 'I teach speaking.' }));
  ok('owner hears about a new teacher application', sent.length === 1 && sent[0].chat_id === 33 && /Malika/.test(sent[0].text) && /German/.test(sent[0].text));
  console.log('Speaking clubs');
  store.set('teachers/t-dil', { name: 'Dilso‘z', langs: ['Russian', 'English'] });
  store.set('journals/s3', { name: 'Jamshid', teacher: 'main' }); store.set('enrollStatus/s3', { langs: ['Korean'] }); store.set('tg/s3', { chatId: 55, role: 'student' });
  store.set('journals/s2', { name: 'Bobur', teacher: 'main' }); store.set('contacts/s2', { lang: 'ru' }); store.set('tg/s2', { chatId: 44, role: 'student' });
  const cv = (id, after, before) => ({ params: { id }, data: { before: { data: () => before }, after: { data: () => after } } });
  sent.length = 0; await bot.onClubVideo.run(cv('Russian_2026-11-09', { video: { on: true, at: 7, until: Date.now() + 3600e3, url: 'https://meet.google.com/aaa-bbbb-ccc', by: 'dil', byName: 'Dilso‘z' } }, {}));
  ok('video start reaches only Russian learners (not the teacher who started it)', sent.length === 1 && sent[0].chat_id === 11 && /jonli/.test(sent[0].text) && sent[0].reply_markup.inline_keyboard[0][0].url.includes('meet.google.com'));
  sent.length = 0; await bot.onClubVideo.run(cv('Russian_2026-11-09', { video: { on: true, at: 7, until: Date.now() + 3600e3 } }, { video: { on: true, at: 7 } }));
  ok('the same video start is not sent twice', sent.length === 0);
  const cm = (id, m) => ({ params: { id, m: 'x' }, data: { data: () => m } });
  sent.length = 0; await bot.onClubMsg.run(cm('English_2026-11-09', { uid: 'own', name: 'Samandar', text: 'Hello guys!', at: 1 }));
  ok('a club message reaches English learners and teachers, each in their language', sent.length === 4 && sent.some(x => x.chat_id === 44 && /Hello guys/.test(x.text) && /английский/.test(x.text)) && [11, 22, 55].every(c => sent.some(x => x.chat_id === c)) && !sent.some(x => x.chat_id === 33));
  sent.length = 0; await bot.onClubMsg.run(cm('English_2026-11-09', { uid: 's1', name: 'Aziza', text: 'Fine!', at: 2 }));
  ok('a busy club pings at most once every 30 minutes', sent.length === 0);
  sent.length = 0; await bot.onClubMsg.run(cm('Korean_2026-11-09', { uid: 'own', name: 'Samandar', text: '안녕', at: 3 }));
  ok('extra-lessons learners get their language club', sent.length === 1 && sent[0].chat_id === 55);
  store.delete('journals/s3'); store.delete('enrollStatus/s3'); store.delete('tg/s3');

  console.log('Teacher announcements (tgq)');
  store.set('journals/s2', { name: 'Bobur', teacher: 'main' }); store.set('contacts/s2', { lang: 'ru' }); store.set('tg/s2', { chatId: 44, role: 'student' });
  const note = (by, uids) => { store.set('tgq/n1', { ev: 'ann', by, uids, msg: { uz: 'E’lon: dars yo‘q', ru: 'Объявление: урока нет', en: 'Notice: no lesson' }, btn: { uz: 'Lexorani ochish', ru: 'Открыть', en: 'Open' } });
    return { params: { id: 'n1' }, data: { data: () => store.get('tgq/n1'), ref: doc('tgq/n1') } }; };
  sent.length = 0; await bot.onNotice.run(note('own', ['s1', 's2']));
  ok('owner reaches every student, each in their language', sent.length === 2 && sent.some(x => x.chat_id === 11 && /dars yo‘q/.test(x.text)) && sent.some(x => x.chat_id === 44 && /урока нет/.test(x.text)));
  ok('the queued notice is deleted', !store.has('tgq/n1'));
  sent.length = 0; await bot.onNotice.run(note('dil', ['s1', 's2']));
  ok("staff teacher reaches only their own students", sent.length === 1 && sent[0].chat_id === 11);
  sent.length = 0; await bot.onNotice.run(note('s1', ['s2']));
  ok('a student cannot send announcements', sent.length === 0 && !store.has('tgq/n1'));

  console.log('Daily newspaper');
  const now = Date.now(), d = new Date(now + 5 * 3600e3).toISOString().slice(0, 10);
  store.set('premium/main', { news: { on: true, name: 'The Lexora Daily' } });
  store.set('newsDays/s1_' + d, { releaseAt: now - 60e3, week: d, stories: [{ h: 'Rain in Tashkent' }, { h: 'New metro line' }] });
  store.set('newsDays/s2_' + d, { releaseAt: now - 60e3, week: d, stories: [{ h: 'Snow' }] });
  store.set('newsDays/s1_2099-01-01', { releaseAt: now + 3600e3, stories: [{ h: 'Later' }] });
  store.set('passes/s1', { news: { until: now + 10 * 864e5 } }); store.set('passes/s2', { news: { until: now - 864e5 } });
  sent.length = 0; await bot.newsOut.run({});
  ok('paying reader gets the headlines', sent.length === 1 && sent[0].chat_id === 11 && /Rain in Tashkent/.test(sent[0].text) && /gazetangiz keldi/.test(sent[0].text));
  sent.length = 0; await bot.newsOut.run({});
  ok('the same issue is never sent twice', sent.length === 0);

  console.log('Owner report');
  const day = bot._t.dayKey(), stats = store.get('tgStats/' + day) || {};
  ok('every message the bot sent was counted today', stats.sent > 10 && stats.ev_review >= 1 && stats.ev_notice >= 2 && stats.ev_clubVideo >= 1 && stats.ev_news === 1);
  store.set('tg/own', { chatId: 77, role: 'owner', tid: 'main', owner: true }); store.set('tgChats/77', { uid: 'own' });
  store.set('journals/s9', { name: 'Zarina', teacher: 'main' });
  store.set('tgStats/' + day, { ...stats, failed: 2, blocked: 1, lastErr: 'Forbidden: bot was blocked by the user' });
  const txt = await bot._t.reportText('uz', day);
  ok('report shows messages, failures, events and who is not linked', /Yuborilgan xabarlar: \d+/.test(txt) && /Yetkazilmadi: 2/.test(txt) && /bloklaganlar: 1/.test(txt) && /Oxirgi xato: Forbidden/.test(txt) && /Gazeta sonlari: 1/.test(txt) && /ulamagan talabalar: [1-9]/.test(txt) && /Zarina/.test(txt) && /Telegram ulangan: \d+/.test(txt));
  sent.length = 0; await call(tgMsg(77, '/report'));
  ok('the owner can ask for the report with /report', sent.length === 1 && sent[0].chat_id === 77 && /Lexora boti/.test(sent[0].text));
  sent.length = 0; await call(tgMsg(11, '/report'));
  ok('a student cannot get the report', !sent.some(x => /Yuborilgan xabarlar/.test(x.text || '')));
  sent.length = 0; await bot.dailyReport.run({});
  ok('the 21:00 report goes to the owner', sent.some(x => x.chat_id === 77 && /Lexora boti/.test(x.text)));
  store.delete('tg/own'); store.delete('tgChats/77'); store.delete('journals/s9');

  console.log('Reminders');
  store.set('tg/own', { chatId: 77, role: 'owner', tid: 'main', owner: true });
  // a lesson today at 18:00 Tashkent (13:00 UTC); s1 (uz, chat 11) and s2 (ru, chat 44) are in it
  const lday = '2030-03-04', at18 = Date.parse(lday + 'T13:00:00Z'), meet = 'https://meet.google.com/abc-defg-hij';
  store.set('lessons/s1', { links: { sl1: { url: meet, date: lday, from: '18:00', to: '19:20' } } });
  store.set('lessons/s2', { links: { sl1: { url: meet, date: lday, from: '18:00', to: '19:20' } } });
  sent.length = 0; await bot._t.lessonSoonRun(at18 - 60 * 60e3);
  ok('nothing an hour before the lesson', sent.length === 0);
  sent.length = 0; await bot._t.lessonSoonRun(at18 - 30 * 60e3);
  const join = x => x.reply_markup && x.reply_markup.inline_keyboard[0][0].url === meet;
  ok('30 minutes before: each student gets the Meet link in their language', sent.some(x => x.chat_id === 11 && /18:00/.test(x.text) && /30 daqiqadan/.test(x.text) && join(x)) && sent.some(x => x.chat_id === 44 && /через 30 мин/.test(x.text) && join(x)));
  ok('the owner gets one reminder with the students’ names', sent.filter(x => x.chat_id === 77).length === 1 && /Aziza, Bobur/.test(sent.find(x => x.chat_id === 77).text));
  sent.length = 0; await bot._t.lessonSoonRun(at18 - 25 * 60e3);
  ok('the 30-minute reminder is sent only once', sent.length === 0);
  sent.length = 0; await bot._t.lessonSoonRun(at18 - 5 * 60e3);
  ok('5 minutes before: a second, short reminder', sent.length === 2 && sent.every(join) && sent.some(x => x.chat_id === 11 && /bir necha daqiqa/.test(x.text)));
  sent.length = 0; await bot._t.lessonSoonRun(at18 + 60e3);
  ok('nothing after the lesson started', sent.length === 0);

  // 10:00 Tashkent on the 9th: homework due today / tomorrow, and the fee that is still owed
  const ten = Date.parse('2030-03-09T05:00:00Z');
  store.set('hwFor/s1', { items: { h1: { title: 'Past simple', due: '2030-03-10', tid: 't-dil' }, h2: { title: 'Articles', due: '2030-03-09', tid: 't-dil' }, h3: { title: 'Old', due: '2030-03-01' }, h4: { title: 'Done', due: '2030-03-09' } }, done: { h4: { at: 1 } } });
  store.set('balances/s1', { month: '2030-03', fee: 700000, left: 350000, status: 'partial' });
  store.set('balances/s2', { month: '2030-03', fee: 350000, left: 0, status: 'paid' });
  store.set('balances/s9', { month: '2030-02', fee: 350000, left: 350000, status: 'unpaid' });
  sent.length = 0; await bot._t.dailyNudgesRun(ten);
  ok('homework due tomorrow and today are reminded, done or old ones are not', sent.some(x => x.chat_id === 11 && /Ertaga/.test(x.text) && /Past simple/.test(x.text)) && sent.some(x => x.chat_id === 11 && /Bugun/.test(x.text) && /Articles/.test(x.text)) && !sent.some(x => /Old|Done/.test(x.text)));
  ok('only a student who still owes this month gets the payment reminder', sent.filter(x => /to‘lash qoldi/.test(x.text)).length === 1 && sent.some(x => x.chat_id === 11 && /mart oyi uchun yana 350 000 so‘m/.test(x.text)) && !sent.some(x => x.chat_id === 44));
  sent.length = 0; await bot._t.dailyNudgesRun(ten);
  ok('daily reminders are not repeated', sent.length === 0);
  sent.length = 0; await bot._t.dailyNudgesRun(Date.parse('2030-03-10T05:00:00Z'));
  ok('no payment reminder on other days', !sent.some(x => /💳/.test(x.text)));

  console.log('Homework done and payment reports');
  sent.length = 0; await bot.onHwDone.run(ev({ uid: 's1' }, { ...store.get('hwFor/s1'), done: { h4: { at: 1 }, h1: { at: 2 } } }, store.get('hwFor/s1')));
  ok('the teacher who gave the homework hears it is done', sent.length === 1 && sent[0].chat_id === 22 && /Aziza/.test(sent[0].text) && /Past simple/.test(sent[0].text));
  const claimBefore = { name: 'Aziza', items: [{ id: 'c1', amount: 100000 }] };
  sent.length = 0; await bot.onPayClaim.run(ev({ uid: 's1' }, { name: 'Aziza', items: [...claimBefore.items, { id: 'c2', amount: 175000, method: 'click', ref: 'last digits 4821' }] }, claimBefore));
  ok('the owner is told about a new payment report, once', sent.length === 1 && sent[0].chat_id === 77 && /175 000 so‘m/.test(sent[0].text) && /click/.test(sent[0].text));
  store.delete('tg/own');

  console.log('Keeping students with Lexora');
  const hc = bot._t.hasContact;
  ok('phone numbers, @usernames, emails, messenger links and card numbers are caught', ['+998 90 123 45 67', '901234567', 'write me @aziza_k', 'my mail a.b@gmail.com', 't.me/aziza', 'wa.me/99890', '8600 1234 5678 9012'].every(hc));
  ok('ordinary lesson messages pass', !['See you at 18:00 on 12.11.2026', 'Page 45, exercises 3-7', 'IELTS 6.5 by May', 'Salom ustoz!'].some(hc));
  ok('hidden text keeps the message but not the number', bot._t.hideContact('call +998 90 123 45 67 please') === 'call 🔒 please');
  store.set('tg/own', { chatId: 77, role: 'owner', tid: 'main', owner: true });
  sent.length = 0; await bot.onDmMessage.run(ev({ id: 's1_t-dil', m: 'c' }, { uid: 's1', name: 'Aziza', text: 'my number 90 123 45 67', by: 's', at: 2 }));
  ok('a chat message with a phone number is not relayed; the owner is told', !sent.some(x => x.chat_id === 22) && sent.some(x => x.chat_id === 77 && /aloqa ma’lumoti/.test(x.text)));
  store.set('leads/L9', { name: 'Kamola', contact: '+998 93 111 22 33', lang: 'English', tid: 't-dil', at: 1 });
  sent.length = 0; await bot.onLeadCreated.run({ params: { id: 'L9' }, data: { data: () => store.get('leads/L9'), ref: doc('leads/L9') } });
  ok('a trial request keeps its contact only for the owner', store.get('leads/L9').contact === '' && store.get('privContact/lead_L9').contact === '+998 93 111 22 33'
    && sent.some(x => x.chat_id === 77 && /111 22 33/.test(x.text)) && sent.some(x => x.chat_id === 22 && /🔒/.test(x.text) && !/111 22 33/.test(x.text)));

  console.log('In-site video call');
  const { privateKey, publicKey } = require('crypto').generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.JAAS_APP_ID = 'vpaas-magic-cookie-test'; process.env.JAAS_KID = 'vpaas-magic-cookie-test/abc'; process.env.JAAS_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const t0 = Date.parse('2030-04-01T10:00:00Z');
  store.set('calls/lx-r1', { tid: 't-dil', uids: ['s1'], label: 'Group A', at: t0, until: t0 + 3 * 3600e3 });
  let cr = await bot._t.callRun('s1', 'lx-r1', false, t0 + 60e3);
  const parts = (cr.body.jwt || '').split('.'), claims = parts[1] ? JSON.parse(Buffer.from(parts[1], 'base64url').toString()) : {};
  ok('an invited student gets a personal pass for that room only', cr.code === 200 && cr.body.room === 'vpaas-magic-cookie-test/lx-r1' && claims.room === 'lx-r1' && claims.context.user.name === 'Aziza' && claims.context.user.moderator === 'false' && claims.exp <= Math.floor((t0 + 3 * 3600e3) / 1000) + 1);
  ok('the pass is signed with the Lexora key', require('crypto').createVerify('RSA-SHA256').update(parts[0] + '.' + parts[1]).verify(publicKey, Buffer.from(parts[2], 'base64url')));
  cr = await bot._t.callRun('dil', 'lx-r1', false, t0 + 60e3);
  ok('the lesson’s teacher enters as moderator', cr.code === 200 && JSON.parse(Buffer.from(cr.body.jwt.split('.')[1], 'base64url').toString()).context.user.moderator === 'true');
  ok('anyone else is refused', (await bot._t.callRun('s2', 'lx-r1', false, t0 + 60e3)).code === 403);
  store.set('calls/s-later', { tid: 'main', uids: ['s1'], at: t0 + 2 * 864e5, until: t0 + 3 * 864e5 });
  ok('a booked lesson can’t be entered days early', (await bot._t.callRun('s1', 's-later', false, t0)).code === 425);
  ok('an ended lesson can’t be entered', (await bot._t.callRun('s1', 'lx-r1', false, t0 + 4 * 3600e3)).code === 410);
  for (let i = 2; i <= 6; i++) await bot._t.callRun('s1', 'lx-r1', true, t0 + i * 60e3);
  await bot._t.callRun('s1', 'lx-r1', true, t0 + 6 * 60e3 + 5e3);
  ok('lesson minutes are logged once a minute', store.get('callLog/lx-r1').people.s1.mins === 5 && store.get('callMins/2030-04-01_s1').mins === 5);
  delete process.env.JAAS_APP_ID;
  ok('without keys the in-site call is off', (await bot._t.callRun('s1', 'lx-r1', false, t0)).code === 503);

  console.log('Attendance');
  const now9 = Date.parse('2030-05-30T08:00:00Z'), dk = ms => bot._t.dayKey(ms);
  store.set('callMins/' + dk(now9 - 20 * 864e5) + '_s1', { uid: 's1', day: dk(now9 - 20 * 864e5), tid: 't-dil', mod: false, mins: 80 });
  store.set('callMins/' + dk(now9 - 10 * 864e5) + '_dil', { uid: 'dil', day: dk(now9 - 10 * 864e5), tid: 't-dil', mod: true, mins: 400 });
  store.set('callMins/' + dk(now9 - 2 * 864e5) + '_dil', { uid: 'dil', day: dk(now9 - 2 * 864e5), tid: 't-dil', mod: true, mins: 80 });
  const at = await bot._t.attendance(now9);
  ok('a student with no lesson for 14 days is listed', at.gone.includes('Aziza'));
  ok('a teacher whose lesson time dropped is listed', at.drop.some(x => /Dilso‘z/.test(x) && /400 → 80/.test(x)));
  store.delete('tg/own');

  console.log('Speaking Buddy');
  const tgFetch = global.fetch; let elCalls = 0, elOk = true, cidN = 0, noCid = false; const convs = {};   // convs[cid] = {status, dur} or a status code number
  global.fetch = async (url) => { if (!/api\.elevenlabs\.io/.test(url)) return tgFetch(url); elCalls++;
    const cm = /conversations\/([^/?]+)$/.exec(url);
    if (cm) { const c = convs[cm[1]]; if (typeof c === 'number') return { ok: false, status: c, json: async () => ({}) };
      return { ok: !!c, status: c ? 200 : 404, json: async () => (c ? { status: c.status, metadata: { call_duration_secs: c.dur } } : {}) }; }
    const cid = 'conv_' + (++cidN);
    return { ok: elOk, status: elOk ? 200 : 500, json: async () => (elOk ? { signed_url: 'wss://x/?agent=' + /agent_id=([^&]+)/.exec(url)[1], ...(/include_conversation_id=true/.test(url) && !noCid ? { conversation_id: cid } : {}) } : {}) }; };
  users.s3 = { email: 'kid@x.com', emailVerified: true };
  const sp = (uid, body, now = 5e12) => bot._t.speakRun(uid, body, now);
  ok('an unknown language is refused', (await sp('s3', { action: 'start', lang: 'Klingon' })).code === 400);
  let sr = await sp('s3', { action: 'status', lang: 'English' });
  ok('status shows 1 free left (a 1-minute try) and does not use one', sr.code === 200 && sr.body.trialSecs === 60 && sr.body.left === 1 && sr.body.used === 0 && !sr.body.paid && sr.body.secs === 0 && elCalls === 0);
  sr = await sp('s3', { action: 'start', lang: 'English' });
  ok('without the key nothing starts and no trial is used', sr.code === 503 && !store.has('speakUse/s3'));
  process.env.ELEVENLABS_API_KEY = 'k';
  sr = await sp('s3', { action: 'start', lang: 'English' });
  ok('first conversation: signed link, 0 left', sr.code === 200 && /agent_2301/.test(sr.body.signedUrl) && sr.body.left === 0);
  const calls0 = elCalls; sr = await sp('s3', { action: 'start', lang: 'Russian' });
  ok('second is refused with 402 and no link is asked for', sr.code === 402 && sr.body.error === 'paywall' && elCalls === calls0);
  // ---- paid minutes: a prepaid balance, the real length is taken off after each conversation
  store.set('passes/s3', { name: 'Kid', speak: { until: 5e12 + 864e5, quota: 600, hist: [] } });
  sr = await sp('s3', { action: 'status', lang: 'English' });
  ok('a pass with 10 minutes shows 600 seconds and is paid', sr.body.paid && sr.body.secs === 600 && sr.body.quota === 600);
  sr = await sp('s3', { action: 'start', lang: 'English' });
  ok('with minutes it starts, holds the conversation, uses no trial', sr.code === 200 && sr.body.paid && sr.body.pending && store.get('speakUse/s3').used === 1 && store.get('speakUse/s3').pend.cid === 'conv_' + cidN);
  const cidA = store.get('speakUse/s3').pend.cid; convs[cidA] = { status: 'processing', dur: 0 };
  sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 20e3);
  ok('a second start while the first still runs is refused (409 busy), nothing is charged', sr.code === 409 && sr.body.error === 'busy' && !(store.get('speakUse/s3').spent));
  convs[cidA] = { status: 'done', dur: 143 };
  sr = await sp('s3', { action: 'end', lang: 'English' }, 5e12 + 200e3);
  ok('when it is done the real 143 seconds come off: 457 left, nothing held', sr.code === 200 && sr.body.secs === 457 && !sr.body.pending && store.get('speakUse/s3').spent === 143);
  sr = await sp('s3', { action: 'end', lang: 'English' }, 5e12 + 300e3);
  ok('ending twice charges once', sr.body.secs === 457 && store.get('speakUse/s3').spent === 143);
  sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 400e3); const cidB = store.get('speakUse/s3').pend.cid; convs[cidB] = { status: 'done', dur: 900 };
  sr = await sp('s3', { action: 'status', lang: 'English' }, 5e12 + 900e3);
  ok('a length over the 5-minute cap is charged as 300 seconds', store.get('speakUse/s3').spent === 443 && sr.body.secs === 157);
  sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 1000e3); const cidC = store.get('speakUse/s3').pend.cid;
  sr = await sp('s3', { action: 'status', lang: 'English' }, 5e12 + 1100e3);
  ok('a conversation ElevenLabs does not know yet stays held inside the grace time', sr.body.pending && store.get('speakUse/s3').spent === 443);
  sr = await sp('s3', { action: 'status', lang: 'English' }, 5e12 + 1000e3 + 400e3);
  ok('...and when ElevenLabs never saw it, nothing is charged after the grace time', !sr.body.pending && store.get('speakUse/s3').spent === 443 && store.get('speakUse/s3').hist.slice(-1)[0].secs === 0);
  noCid = true; sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 2000e3); noCid = false;
  ok('without a conversation id it is held with no id', sr.code === 200 && store.get('speakUse/s3').pend.cid === '');
  sr = await sp('s3', { action: 'status', lang: 'English' }, 5e12 + 2000e3 + 400e3);
  ok('...and counted as the most it could cost (300 s) when the id is missing', store.get('speakUse/s3').spent === 743 && sr.body.secs === 0 && !sr.body.paid);
  sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 2500e3);
  ok('with no minutes left it is refused (402) even though the days run on', sr.code === 402 && sr.body.error === 'paywall' && sr.body.until > 0);
  store.set('passes/s3', { name: 'Kid', speak: { until: 5e12 + 864e5, quota: 1200, hist: [] } });
  elOk = false; sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 3000e3);
  ok('buying more adds on top, and if ElevenLabs fails nothing is held or charged', sr.code === 502 && !store.get('speakUse/s3').pend && store.get('speakUse/s3').spent === 743);
  elOk = true;
  store.set('passes/s3', { name: 'Kid', speak: { until: 5e12 + 864e5, hist: [] } }); store.set('speakUse/s3', { used: 1 });
  sr = await sp('s3', { action: 'status', lang: 'English' });
  ok('an old pass with no minutes counts as 3600 seconds', sr.body.paid && sr.body.secs === 3600);
  sr = await sp('s3', { action: 'status', lang: 'English' }, 5e12 + 2 * 864e5);
  ok('...and an old pass still ends with its days', !sr.body.paid);
  store.set('passes/s3', { name: 'Kid', speak: { until: 5e12 + 864e5, quota: 600, hist: [] } }); store.set('speakUse/s3', { used: 1 });
  sr = await sp('s3', { action: 'start', lang: 'English' }, 5e12 + 400 * 864e5);
  ok('bought minutes do not expire: a year later they still work', sr.code === 200 && sr.body.paid && sr.body.secs === 600);
  store.delete('speakUse/s3'); store.set('speakUse/s3', { used: 1 });
  store.set('speakUse/s3', { used: 1 }); store.delete('passes/s3'); elOk = false; store.set('speakUse/s4', { used: 0, log: [] }); users.s4 = { email: 'b@x.com', emailVerified: true };
  sr = await sp('s4', { action: 'start', lang: 'English' });
  ok('if ElevenLabs fails the trial is given back', sr.code === 502 && store.get('speakUse/s4').used === 0);
  elOk = true;
  store.set('speakUse/own', { used: 9 }); sr = await sp('own', { action: 'start', lang: 'English' }); ok('the owner is never limited', sr.code === 200 && store.get('speakUse/own').used === 9);
  const calls1 = elCalls; sr = await sp('dil', { action: 'start', lang: 'English' }); ok('an invited teacher cannot use it (403) and no link is asked for', sr.code === 403 && sr.body.error === 'teacher' && elCalls === calls1);
  sr = await sp('dil', { action: 'status', lang: 'English' }); ok('a teacher status is refused too', sr.code === 403);
  delete process.env.ELEVENLABS_API_KEY; global.fetch = tgFetch;

  console.log('Teacher sign-in mail');
  const mails = []; const fetch0 = global.fetch;
  global.fetch = async (url, o) => { if (/api\.resend\.com/.test(url)) { mails.push(JSON.parse(o.body)); return { ok: mails.rsOk !== false, status: 200, json: async () => ({}) }; } return fetch0(url, o); };
  const LU = 'https://lexoralc.uz/', lm = (email, extra = {}, now = 7e12) => bot._t.loginLinkRun({ email, url: LU, lang: 'ru', ...extra }, now);
  ok('a bad address or a foreign site is refused', (await lm('nope')).code === 400 && (await lm('a@b.co', { url: 'https://evil.example/' })).code === 400);
  ok('without keys it says off (the site falls back to Firebase)', (await lm('dil@x.com')).body.error === 'off');
  process.env.RESEND_API_KEY = 'rk'; process.env.RESEND_FROM = 'Lexora <login@lexoralc.uz>';
  let lr = await lm('dil@x.com');
  ok('a teacher gets one branded mail with the link', lr.code === 200 && mails.length === 1 && mails[0].to[0] === 'dil@x.com' && mails[0].from.includes('lexoralc.uz') && /oobCode=abc/.test(mails[0].html) && /oobCode=abc/.test(mails[0].text) && /Войти в Lexora/.test(mails[0].html));
  ok('a second request within a minute is held back', (await lm('dil@x.com')).code === 429 && mails.length === 1);
  ok('after a minute it works again', (await lm('dil@x.com', {}, 7e12 + 61e3)).code === 200 && mails.length === 2);
  lr = await lm('stranger@x.com');
  ok('a stranger gets no branded mail and is told to use the Firebase one', lr.code === 200 && lr.body.sent === false && mails.length === 2);
  ok('the owner gets a mail', (await lm('samandaryusupov559@gmail.com')).code === 200 && mails.length === 3);
  ok('the mail exists in uz and en too', /Lexora’ga kirish/.test(bot._t.loginMail('uz', 'https://l').html) && /Sign in to Lexora/.test(bot._t.loginMail('en', 'https://l').html));
  mails.rsOk = false; ok('a Resend failure is reported', (await lm('dil@x.com', {}, 7e12 + 200e3)).code === 502);
  delete process.env.RESEND_API_KEY; delete process.env.RESEND_FROM; global.fetch = fetch0;

  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
