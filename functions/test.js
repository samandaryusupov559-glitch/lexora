// Offline test of the bot: an in-memory Firestore and a fake Telegram API.  Run:  npm test  (in functions/)
const Module = require('module');
const store = new Map(), sent = [];
let autoId = 0;
const snap = (path) => ({ id: path.split('/').pop(), exists: store.has(path), data: () => (store.has(path) ? JSON.parse(JSON.stringify(store.get(path))) : undefined), ref: doc(path) });
function doc(path) {
  return { id: path.split('/').pop(), path,
    get: async () => snap(path),
    set: async (d, o) => { store.set(path, o && o.merge ? { ...(store.get(path) || {}), ...d } : { ...d }); },
    update: async (d) => { if (!store.has(path)) throw new Error('no doc ' + path); store.set(path, { ...store.get(path), ...d }); },
    delete: async () => { store.delete(path); } };
}
function collection(path) {
  const OPS = { '==': (a, b) => a === b, '<=': (a, b) => a <= b, '<': (a, b) => a < b, '>': (a, b) => a > b, '>=': (a, b) => a >= b };
  const list = fs => [...store.keys()].filter(k => k.slice(0, k.lastIndexOf('/')) === path && fs.every(([f, op, v]) => OPS[op]((store.get(k) || {})[f], v))).map(snap);
  const query = fs => ({ where: (f, op, v) => query([...fs, [f, op, v]]), get: async () => { const docs = list(fs); return { docs, empty: !docs.length }; } });
  return { doc: id => doc(path + '/' + (id || 'auto' + (++autoId))), add: async d => { const p = path + '/auto' + (++autoId); store.set(p, { ...d }); return doc(p); }, ...query([]) };
}
const fakeDb = { doc, collection, runTransaction: async fn => fn({ get: r => r.get(), set: (r, d) => r.set(d) }) };
const users = { s1: { email: 'aziza@x.com', emailVerified: false }, own: { email: 'samandaryusupov559@gmail.com', emailVerified: true }, dil: { email: 'dil@x.com', emailVerified: true } };
const fakeAdmin = { initializeApp() {}, firestore: () => fakeDb, auth: () => ({ getUser: async uid => { if (!users[uid]) throw new Error('no user'); return users[uid]; } }) };
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

  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
