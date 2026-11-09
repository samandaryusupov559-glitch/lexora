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
  const list = (f, v) => [...store.keys()].filter(k => k.slice(0, k.lastIndexOf('/')) === path && (!f || (store.get(k) || {})[f] === v)).map(snap);
  return { doc: id => doc(path + '/' + (id || 'auto' + (++autoId))), add: async d => { const p = path + '/auto' + (++autoId); store.set(p, { ...d }); return doc(p); },
    where: (f, op, v) => ({ get: async () => ({ docs: list(f, v) }) }), get: async () => ({ docs: list() }) };
}
const fakeDb = { doc, collection };
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

  console.log('Lessons and checked entries');
  sent.length = 0; await bot.onLiveFor.run(ev({ uid: 's1' }, { 't-dil': { on: true, at: 5, until: Date.now() + 3600e3, url: 'https://meet.google.com/abc-defg-hij', name: 'Dilso‘z', label: 'B1' } }, {}));
  ok('lesson start sends the Meet button', last().chat_id === 11 && last().reply_markup.inline_keyboard[0][0].url.startsWith('https://meet.google.com'));
  sent.length = 0; await bot.onLiveFor.run(ev({ uid: 's1' }, { 't-dil': { on: true, at: 5, until: Date.now() + 3600e3, url: 'https://meet.google.com/abc' } }, { 't-dil': { on: true, at: 5 } }));
  ok('the same lesson is not sent again', sent.length === 0);
  sent.length = 0; await bot.onReview.run(ev({ uid: 's1', eid: 'e1' }, { status: 'reviewed' }, { status: 'inreview' }));
  ok('checked entry is announced with its title', /My weekend/.test(last().text));

  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
