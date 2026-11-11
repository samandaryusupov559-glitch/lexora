// Security test: tests (exams), paid access, timed attempts and 1–5 marks.
// Run like rules.test.mjs, with the Firestore emulator on port 8089:  node tests/exams.test.mjs
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId:'daybook-exams', firestore:{ rules: fs.readFileSync('firestore.rules','utf8'), host:'127.0.0.1', port:8089 } });
await env.clearFirestore();
const now = Date.now(), qs=[{q:'2+2', o:['3','4'], a:1}];
const ex = x => ({id:'free', tid:'main', title:'Math', cert:'national', subject:'Mathematics', mins:20, price:0, on:true, qs, at:1, ...x});
await env.withSecurityRulesDisabled(async c => { const db=c.firestore();
  await setDoc(doc(db,'staff/dil@x.com'),{tid:'t-dil'});
  await setDoc(doc(db,'exams/free'), ex({}));
  await setDoc(doc(db,'exams/ielts'), ex({id:'ielts', cert:'ielts', price:50000, mins:60}));
  await setDoc(doc(db,'exams/hidden'), ex({id:'hidden', on:false}));
  await setDoc(doc(db,'exams/dil'), ex({id:'dil', tid:'t-dil'}));
  await setDoc(doc(db,'examList/main'), {items:{free:{title:'Math'}}});
  await setDoc(doc(db,'examAccess/bob'), {ids:{ielts:now}});
  // an attempt that started long ago: its time is up
  await setDoc(doc(db,'examRuns/bob_free'), {uid:'bob', examId:'free', name:'Bob', mins:20, startedAt:now-3600e3});
  await setDoc(doc(db,'examRuns/old_free'), {uid:'old', examId:'free', name:'Old', mins:20, startedAt:now-60e3, answers:[1], score:1, n:1, submittedAt:now-30e3});
  await setDoc(doc(db,'stCrit/sam'), {main:{c:{attend:5}, at:1}});
});
const OWN = env.authenticatedContext('own', {email:'samandaryusupov559@gmail.com', email_verified:true}).firestore();
const DIL = env.authenticatedContext('dil', {email:'dil@x.com', email_verified:true}).firestore();
const SAM = env.authenticatedContext('sam', {email:'sam@x.com', email_verified:false}).firestore();
const BOB = env.authenticatedContext('bob', {email:'bob@x.com', email_verified:false}).firestore();
const N = env.unauthenticatedContext().firestore();
let pass=0, fail=0;
async function t(name, p, ok){ try{ await (ok?assertSucceeds(p):assertFails(p)); pass++; console.log('  ok  ', name); }catch(e){ fail++; console.log('  FAIL', name, e.message); } }
const run = (uid, id, x) => ({uid, examId:id, name:'S', mins:20, startedAt:Date.now(), ...x});

console.log('Teachers');
await t('owner creates a test', setDoc(doc(OWN,'exams/t1'), ex({id:'t1'})), true);
await t('owner writes the catalogue', setDoc(doc(OWN,'examList/main'), {items:{free:{title:'Math'}, t1:{title:'x'}}}), true);
await t('owner opens a paid test for a student', setDoc(doc(OWN,'examAccess/sam'), {ids:{}}), true);
await t('owner reads all attempts', getDocs(collection(OWN,'examRuns')), true);
await t('owner deletes an attempt for a retake', deleteDoc(doc(OWN,'examRuns/old_free')), true);
await t('staff reads own test', getDoc(doc(DIL,'exams/dil')), true);
await t('staff reads the owner\'s paid test', getDoc(doc(DIL,'exams/ielts')), false);
await t('staff creates a test for another teacher', setDoc(doc(DIL,'exams/t2'), ex({id:'t2', tid:'main'})), false);
await t('staff opens a paid test', setDoc(doc(DIL,'examAccess/sam'), {ids:{ielts:1}}), false);
await t('staff marks a student', setDoc(doc(DIL,'stCrit/sam'), {'t-dil':{c:{attend:4}, at:1}}, {merge:true}), true);

console.log('Students: reading');
await t('student reads the catalogue', getDoc(doc(SAM,'examList/main')), true);
await t('student reads a free published test', getDoc(doc(SAM,'exams/free')), true);
await t('student reads a hidden test', getDoc(doc(SAM,'exams/hidden')), false);
await t('student reads a paid test without paying', getDoc(doc(SAM,'exams/ielts')), false);
await t('student reads a paid test the owner opened', getDoc(doc(BOB,'exams/ielts')), true);
await t('student lists all tests', getDocs(collection(SAM,'exams')), false);
await t('student opens a paid test for themselves', setDoc(doc(SAM,'examAccess/sam'), {ids:{ielts:1}}), false);
await t('student edits the catalogue', setDoc(doc(SAM,'examList/main'), {items:{}}), false);

console.log('Students: taking a test');
await t('student starts a free test', setDoc(doc(SAM,'examRuns/sam_free'), run('sam','free')), true);
await t('student submits in time', updateDoc(doc(SAM,'examRuns/sam_free'), {answers:[1], score:1, n:1, submittedAt:Date.now()}), true);
await t('student submits twice', updateDoc(doc(SAM,'examRuns/sam_free'), {answers:[1], score:1, n:1, submittedAt:Date.now()}), false);
await t('student starts the same test again', setDoc(doc(SAM,'examRuns/sam_free'), run('sam','free')), false);
await t('student starts a paid test without paying', setDoc(doc(SAM,'examRuns/sam_ielts'), run('sam','ielts',{mins:60})), false);
await t('student starts a paid test the owner opened', setDoc(doc(BOB,'examRuns/bob_ielts'), run('bob','ielts',{mins:60})), true);
await t('student starts a hidden test', setDoc(doc(SAM,'examRuns/sam_hidden'), run('sam','hidden')), false);
await t('student gives themselves more time', setDoc(doc(SAM,'examRuns/sam_dil'), run('sam','dil',{mins:500})), false);
await t('student backdates the start', setDoc(doc(SAM,'examRuns/sam_dil'), run('sam','dil',{startedAt:Date.now()+3600e3})), false);
await t('student starts a test for someone else', setDoc(doc(SAM,'examRuns/bob_dil'), run('bob','dil')), false);
await t('student submits after the time is up', updateDoc(doc(BOB,'examRuns/bob_free'), {answers:[1], score:1, n:1, submittedAt:Date.now()}), false);
await t('student moves the start time', updateDoc(doc(BOB,'examRuns/bob_ielts'), {startedAt:Date.now()+3600e3}), false);
await t('student claims more right answers than questions', updateDoc(doc(BOB,'examRuns/bob_ielts'), {answers:[1], score:5, n:1, submittedAt:Date.now()}), false);
await t('student reads own attempts', getDocs(query(collection(SAM,'examRuns'), where('uid','==','sam'))), true);
await t('student reads someone else\'s attempt', getDoc(doc(SAM,'examRuns/bob_free')), false);
await t('student deletes an attempt', deleteDoc(doc(SAM,'examRuns/sam_free')), false);

console.log('Marks');
await t('student reads own marks', getDoc(doc(SAM,'stCrit/sam')), true);
await t('student changes own marks', setDoc(doc(SAM,'stCrit/sam'), {main:{c:{attend:5,hw:5}, at:1}}), false);
await t('student rates a teacher', setDoc(doc(SAM,'tCrit/sam'), {main:{c:{clear:5}, at:1}}), true);
await t('student rates for someone else', setDoc(doc(SAM,'tCrit/bob'), {main:{c:{clear:1}, at:1}}), false);
await t('owner reads teacher ratings', getDoc(doc(OWN,'tCrit/sam')), true);
await t('staff reads teacher ratings', getDoc(doc(DIL,'tCrit/sam')), false);
await t('student reads another student\'s ratings', getDoc(doc(BOB,'tCrit/sam')), false);

console.log('Guests');
await t('guest reads the catalogue', getDoc(doc(N,'examList/main')), false);
await t('guest reads a free test', getDoc(doc(N,'exams/free')), false);
await t('guest starts a test', setDoc(doc(N,'examRuns/x_free'), run('x','free')), false);

console.log(`\n${pass} passed, ${fail} failed`); await env.cleanup(); process.exit(fail?1:0);
