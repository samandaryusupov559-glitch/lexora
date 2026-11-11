// Security test: homework. Teachers own the master copy; each student reads only their own copy
// and may change only its "done" map. Run like rules.test.mjs, with the Firestore emulator on port 8089:
//   node tests/homework.test.mjs
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId:'daybook-hw', firestore:{ rules: fs.readFileSync('firestore.rules','utf8'), host:'127.0.0.1', port:8089 } });
await env.clearFirestore();
const hw = x => ({id:'h1', tid:'main', title:'Unit 3', note:'Listen twice', due:'2026-12-01', fmt:'ind', to:{uids:['sam'], gids:[]}, files:[], at:1, ...x});
await env.withSecurityRulesDisabled(async c => { const db=c.firestore();
  await setDoc(doc(db,'staff/dil@x.com'),{tid:'t-dil'});
  await setDoc(doc(db,'homework/h1'), hw({}));
  await setDoc(doc(db,'homework/h2'), hw({id:'h2', tid:'t-dil'}));
  await setDoc(doc(db,'hwFor/sam'), {items:{h1:{title:'Unit 3'}}, done:{}});
  await setDoc(doc(db,'hwFor/bob'), {items:{h1:{title:'Unit 3'}}, done:{}});
});
const OWN = env.authenticatedContext('own', {email:'samandaryusupov559@gmail.com', email_verified:true}).firestore();
const DIL = env.authenticatedContext('dil', {email:'dil@x.com', email_verified:true}).firestore();
const SAM = env.authenticatedContext('sam', {email:'sam@x.com', email_verified:false}).firestore();
const N = env.unauthenticatedContext().firestore();
let pass=0, fail=0;
async function t(name, p, ok){ try{ await (ok?assertSucceeds(p):assertFails(p)); pass++; console.log('  ok  ', name); }catch(e){ fail++; console.log('  FAIL', name, e.message); } }

console.log('Teachers');
await t('owner creates homework', setDoc(doc(OWN,'homework/h3'), hw({id:'h3'})), true);
await t('owner lists all homework', getDocs(collection(OWN,'homework')), true);
await t('owner writes a student copy', setDoc(doc(OWN,'hwFor/sam'), {items:{h1:{title:'Unit 3'}, h3:{title:'x'}}, done:{}}), true);
await t('staff lists own homework', getDocs(query(collection(DIL,'homework'), where('tid','==','t-dil'))), true);
await t('staff lists everyone\'s homework', getDocs(collection(DIL,'homework')), false);
await t('staff reads the owner\'s homework', getDoc(doc(DIL,'homework/h1')), false);
await t('staff creates own homework', setDoc(doc(DIL,'homework/h4'), hw({id:'h4', tid:'t-dil'})), true);
await t('staff creates homework for another teacher', setDoc(doc(DIL,'homework/h5'), hw({id:'h5', tid:'main'})), false);
await t('staff moves own homework to another teacher', updateDoc(doc(DIL,'homework/h2'), {tid:'main'}), false);
await t('staff deletes own homework', deleteDoc(doc(DIL,'homework/h4')), true);
await t('staff writes a student copy', setDoc(doc(DIL,'hwFor/bob'), {items:{h2:{title:'x'}}, done:{}}), true);

console.log('Students');
await t('student reads own copy', getDoc(doc(SAM,'hwFor/sam')), true);
await t('student reads another student\'s copy', getDoc(doc(SAM,'hwFor/bob')), false);
await t('student reads the master copy', getDoc(doc(SAM,'homework/h1')), false);
await t('student lists homework', getDocs(collection(SAM,'homework')), false);
await t('student ticks homework done', updateDoc(doc(SAM,'hwFor/sam'), {done:{h1:{at:1}}}), true);
await t('student rewrites the whole copy keeping items', setDoc(doc(SAM,'hwFor/sam'), {items:{h1:{title:'Unit 3'}, h3:{title:'x'}}, done:{}}), true);
await t('student changes the task text', updateDoc(doc(SAM,'hwFor/sam'), {items:{h1:{title:'nothing to do'}}}), false);
await t('student gives themselves homework', setDoc(doc(SAM,'hwFor/sam'), {items:{}, done:{}}), false);
await t('student ticks another student\'s homework', updateDoc(doc(SAM,'hwFor/bob'), {done:{h1:{at:1}}}), false);
await t('student done is not a map', updateDoc(doc(SAM,'hwFor/sam'), {done:'all'}), false);
await t('student creates homework', setDoc(doc(SAM,'homework/h9'), hw({id:'h9'})), false);

console.log('Guests');
await t('guest reads a student copy', getDoc(doc(N,'hwFor/sam')), false);
await t('guest reads homework', getDoc(doc(N,'homework/h1')), false);

console.log(`\n${pass} passed, ${fail} failed`); await env.cleanup(); process.exit(fail?1:0);
