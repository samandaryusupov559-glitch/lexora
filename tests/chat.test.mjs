// Security test for chats (visitor ↔ centre, student ↔ teacher) and fair sharing of "any teacher" requests.
// Run like rules.test.mjs, with the Firestore emulator on port 8089:  node tests/chat.test.mjs
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId:'daybook-chat', firestore:{ rules: fs.readFileSync('firestore.rules','utf8'), host:'127.0.0.1', port:8089 } });
await env.clearFirestore();
const now = Date.now(), GID = 'abcdefghij0123456789xyzQ', GID2 = 'zzzzzzzzzz0123456789xyzQ';
await env.withSecurityRulesDisabled(async c => { const db=c.firestore();
  await setDoc(doc(db,'staff/dil@x.com'),{tid:'t-dil'});
  await setDoc(doc(db,'journals/sam'),{name:'Sam', teacher:'t-dil', index:{}});     // Sam studies with Dilnoza
  await setDoc(doc(db,'journals/old'),{name:'Old', index:{}});                      // Old studies with the owner
  await setDoc(doc(db,'enrollStatus/old'),{'t-dil':'ok'});                          // ...and has extra lessons with Dilnoza
  await setDoc(doc(db,'dm/sam_t-dil'),{uid:'sam', tid:'t-dil', name:'Sam', lastAt:now, lastBy:'s', lastText:'hi', rs:now});
  await setDoc(doc(db,'dm/sam_t-dil/msgs/m1'),{uid:'sam', name:'Sam', text:'hi', at:now, by:'s'});
  await setDoc(doc(db,'dm/old_main'),{uid:'old', tid:'main', name:'Old', lastAt:now, lastBy:'s', lastText:'hi'});
  await setDoc(doc(db,'gchat/'+GID2),{name:'Guest', contact:'+998901112233', lang:'English', tid:'', at:now, lastAt:now, lastBy:'g', lastText:'hello'});
  await setDoc(doc(db,'gchat/'+GID2+'/msgs/g1'),{name:'Guest', text:'hello', at:now, by:'g'});
  await setDoc(doc(db,'leads/l1'),{name:'A', contact:'+998', tid:'', at:1});
});
const OWN = env.authenticatedContext('own', {email:'samandaryusupov559@gmail.com', email_verified:true}).firestore();
const DIL = env.authenticatedContext('dil', {email:'dil@x.com', email_verified:true}).firestore();
const SAM = env.authenticatedContext('sam', {email:'sam@x.com', email_verified:false}).firestore();
const OLD = env.authenticatedContext('old', {email:'old@x.com', email_verified:false}).firestore();
const NEW = env.authenticatedContext('newbie', {email:'n@x.com', email_verified:false}).firestore();
const N = env.unauthenticatedContext().firestore();
let pass=0, fail=0;
async function t(name, p, ok){ try{ await (ok?assertSucceeds(p):assertFails(p)); pass++; console.log('  ok  ', name); }catch(e){ fail++; console.log('  FAIL', name, e.message); } }
const msg = (x) => ({name:'X', text:'hello', at:Date.now(), ...x});
const thread = (x) => ({uid:'sam', tid:'t-dil', name:'Sam', lastAt:Date.now(), lastBy:'s', lastText:'hey', rs:Date.now(), ...x});

console.log('Visitors (gchat)');
const g = {name:'Malika', contact:'+998905554433', lang:'Russian', tid:'', at:now, lastAt:now, lastBy:'g', lastText:'Salom'};
await t('visitor starts a chat', setDoc(doc(N,'gchat/'+GID), g), true);
await t('visitor cannot use a short (guessable) id', setDoc(doc(N,'gchat/short'), g), false);
await t('visitor cannot add extra fields', setDoc(doc(N,'gchat/'+GID+'x'), {...g, admin:true}), false);
await t('visitor writes in own chat', setDoc(doc(N,'gchat/'+GID+'/msgs/a'), msg({by:'g'})), true);
await t('visitor cannot pretend to be the centre', setDoc(doc(N,'gchat/'+GID+'/msgs/b'), msg({by:'t'})), false);
await t('visitor marks reply read', updateDoc(doc(N,'gchat/'+GID), {rg:Date.now()}), true);
await t('visitor cannot reassign the chat', updateDoc(doc(N,'gchat/'+GID), {tid:'t-dil'}), false);
await t('visitor reads own chat by id', getDoc(doc(N,'gchat/'+GID)), true);
await t('visitor cannot list all chats', getDocs(collection(N,'gchat')), false);
await t('student cannot list all chats', getDocs(collection(SAM,'gchat')), false);
await t('teacher lists only chats given to them', getDocs(query(collection(DIL,'gchat'), where('tid','==','t-dil'))), true);  // empty set is fine
await t('owner lists visitor chats', getDocs(collection(OWN,'gchat')), true);
await t('owner replies', setDoc(doc(OWN,'gchat/'+GID2+'/msgs/r'), msg({uid:'own', by:'t'})), true);
await t('owner assigns to Dilnoza', updateDoc(doc(OWN,'gchat/'+GID2), {tid:'t-dil'}), true);
await t('assigned teacher lists their chats', getDocs(query(collection(DIL,'gchat'), where('tid','==','t-dil'))), true);
await t('assigned teacher replies', setDoc(doc(DIL,'gchat/'+GID2+'/msgs/r2'), msg({uid:'dil', by:'t'})), true);
await t('assigned teacher cannot reassign', updateDoc(doc(DIL,'gchat/'+GID2), {tid:'main'}), false);
await t('assigned teacher updates last message', updateDoc(doc(DIL,'gchat/'+GID2), {lastAt:Date.now(), lastBy:'t', lastText:'ok', rt:Date.now()}), true);
await t('teacher reply must carry own uid', setDoc(doc(DIL,'gchat/'+GID2+'/msgs/r3'), msg({uid:'own', by:'t'})), false);

console.log('Students and teachers (dm)');
await t('student reads own chat', getDoc(doc(SAM,'dm/sam_t-dil')), true);
await t('student reads own chat that does not exist yet', getDoc(doc(SAM,'dm/sam_main')), true);
await t("student cannot read another student's chat", getDoc(doc(SAM,'dm/old_main')), false);
await t('student writes to own teacher', setDoc(doc(SAM,'dm/sam_t-dil/msgs/x'), msg({uid:'sam', by:'s'})), true);
await t('student cannot write as a teacher', setDoc(doc(SAM,'dm/sam_t-dil/msgs/y'), msg({uid:'sam', by:'t'})), false);
await t("student cannot write in another's chat", setDoc(doc(SAM,'dm/old_main/msgs/z'), msg({uid:'sam', by:'s'})), false);
await t('student cannot open a chat with a teacher they do not study with', setDoc(doc(SAM,'dm/sam_main'), thread({tid:'main'})), false);
await t('student with confirmed extra lessons opens that chat', setDoc(doc(OLD,'dm/old_t-dil'), thread({uid:'old', name:'Old'})), true);
await t('new user without lessons cannot open a chat', setDoc(doc(NEW,'dm/newbie_main'), thread({uid:'newbie', tid:'main'})), false);
await t('student cannot mark the teacher side read', updateDoc(doc(SAM,'dm/sam_t-dil'), {rt:Date.now()}), false);
await t('student updates own thread', setDoc(doc(SAM,'dm/sam_t-dil'), {lastAt:Date.now(), lastBy:'s', lastText:'again', rs:Date.now()}, {merge:true}), true);
await t('teacher reads their student chat', getDoc(doc(DIL,'dm/sam_t-dil')), true);
await t('teacher lists their chats', getDocs(query(collection(DIL,'dm'), where('tid','==','t-dil'))), true);
await t("teacher cannot read owner's chats", getDoc(doc(DIL,'dm/old_main')), false);
await t('teacher replies', setDoc(doc(DIL,'dm/sam_t-dil/msgs/t1'), msg({uid:'dil', by:'t'})), true);
await t('teacher marks read', updateDoc(doc(DIL,'dm/sam_t-dil'), {rt:Date.now()}), true);
await t('teacher cannot write in a chat of another teacher', setDoc(doc(DIL,'dm/old_main/msgs/t2'), msg({uid:'dil', by:'t'})), false);
await t('owner reads every chat', getDocs(collection(OWN,'dm')), true);
await t('owner replies anywhere', setDoc(doc(OWN,'dm/sam_t-dil/msgs/o1'), msg({uid:'own', by:'t'})), true);
await t('visitor reads nothing in dm', getDoc(doc(N,'dm/sam_t-dil')), false);

console.log('Fair sharing');
await t('owner assigns an "any teacher" request', updateDoc(doc(OWN,'leads/l1'), {tid:'t-dil'}), true);
await t('teacher cannot take a request', updateDoc(doc(DIL,'leads/l1'), {tid:'t-dil'}), false);
await t('owner turns on auto sharing', setDoc(doc(OWN,'centre/assign'), {auto:true}), true);
await t('teacher cannot change auto sharing', setDoc(doc(DIL,'centre/assign'), {auto:false}), false);

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail?1:0);
