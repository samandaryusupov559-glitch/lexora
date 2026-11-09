// Security test: speaking clubs and the library are split by language.
// Run like rules.test.mjs, with the Firestore emulator on port 8089:  node tests/langs.test.mjs
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId:'daybook-langs', firestore:{ rules: fs.readFileSync('firestore.rules','utf8'), host:'127.0.0.1', port:8089 } });
await env.clearFirestore();
const D='2026-11-09', now=Date.now();
await env.withSecurityRulesDisabled(async c => { const db=c.firestore();
  await setDoc(doc(db,'staff/dil@x.com'),{tid:'t-dil'});
  await setDoc(doc(db,'teachers/t-dil'),{name:'Dilnoza', langs:['Russian','English']});
  await setDoc(doc(db,'teachers/t-jin'),{name:'Jin', langs:['Korean']});
  await setDoc(doc(db,'journals/sam'),{name:'Sam', teacher:'t-dil'});          // Russian + English
  await setDoc(doc(db,'journals/old'),{name:'Old'});                           // owner without a profile → English
  await setDoc(doc(db,'enrollStatus/old'),{'t-jin':'ok', langs:['Korean']});   // + Korean in extra lessons
  for(const l of ['English','Korean','German']) await setDoc(doc(db,'club/'+l+'_'+D),{topic:'x'});
  await setDoc(doc(db,'library/k1'),{lang:'Korean', title:'Hangul', by:'t-jin'});
  await setDoc(doc(db,'library/r1'),{lang:'Russian', title:'Poekhali', by:'t-dil'});
});
const OWN = env.authenticatedContext('own', {email:'samandaryusupov559@gmail.com', email_verified:true}).firestore();
const DIL = env.authenticatedContext('dil', {email:'dil@x.com', email_verified:true}).firestore();
const SAM = env.authenticatedContext('sam', {email:'sam@x.com'}).firestore();
const OLD = env.authenticatedContext('old', {email:'old@x.com'}).firestore();
const NEW = env.authenticatedContext('new', {email:'n@x.com'}).firestore();
let pass=0, fail=0;
async function t(name, p, ok){ try{ await (ok?assertSucceeds(p):assertFails(p)); pass++; console.log('  ok  ', name); }catch(e){ fail++; console.log('  FAIL', name, e.message); } }
const m = uid => ({uid, name:'X', text:'hi', at:now});
console.log('Speaking clubs');
await t('student reads the club of their language', getDoc(doc(SAM,'club/English_'+D)), true);
await t('student writes in their club', setDoc(doc(SAM,'club/English_'+D+'/msgs/a'), m('sam')), true);
await t('student cannot read another language club', getDoc(doc(SAM,'club/Korean_'+D)), false);
await t('student cannot write in another language club', setDoc(doc(SAM,'club/Korean_'+D+'/msgs/a'), m('sam')), false);
await t('extra-lessons student joins the Korean club', setDoc(doc(OLD,'club/Korean_'+D+'/msgs/b'), m('old')), true);
await t("owner's student (no teacher profile) joins English", getDoc(doc(OLD,'club/English_'+D)), true);
await t('extra-lessons student cannot join German', getDoc(doc(OLD,'club/German_'+D)), false);
await t('signed-in user without lessons sees no club', getDoc(doc(NEW,'club/English_'+D)), false);
await t('teacher moderates their language', setDoc(doc(DIL,'club/English_'+D), {topic:'Travel'}, {merge:true}), true);
await t('teacher cannot moderate another language', setDoc(doc(DIL,'club/Korean_'+D), {topic:'Travel'}, {merge:true}), false);
await t('teacher cannot read another language club', getDocs(collection(DIL,'club/Korean_'+D+'/msgs')), false);
await t('owner reads every club', getDocs(collection(OWN,'club/German_'+D+'/msgs')), true);
await t('student cannot mark own message as moderator', setDoc(doc(SAM,'club/English_'+D+'/msgs/c'), {...m('sam'), mod:true}), false);
console.log('Library');
await t('student lists their language', getDocs(query(collection(SAM,'library'), where('lang','==','Russian'))), true);
await t('student cannot list another language', getDocs(query(collection(SAM,'library'), where('lang','==','Korean'))), false);
await t('student cannot list the whole library', getDocs(collection(SAM,'library')), false);
await t('extra-lessons student reads Korean', getDocs(query(collection(OLD,'library'), where('lang','==','Korean'))), true);
await t('teacher adds in their language', setDoc(doc(DIL,'library/n1'), {lang:'Russian', title:'New', by:'t-dil'}), true);
await t('teacher cannot add in another language', setDoc(doc(DIL,'library/n2'), {lang:'Korean', title:'New', by:'t-dil'}), false);
await t('teacher cannot read another language', getDoc(doc(DIL,'library/k1')), false);
await t('owner lists the whole library', getDocs(collection(OWN,'library')), true);
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail?1:0);
