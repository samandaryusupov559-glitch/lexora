/* Public entry (outside Lexora): sign in anonymously and give the bridge a Firestore adapter with the same API as Lexora's. */
import { firebaseConfig } from '../config.js';
const V = '10.12.2', B = 'https://www.gstatic.com/firebasejs/' + V + '/';
const wrap = x => ({ id: x.id, exists: x.exists(), data: () => x.data() });
export async function connect() {
  const [app, auth, fs] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);
  const a = app.initializeApp(firebaseConfig, 'hjpublic'), au = auth.getAuth(a);
  if (!au.currentUser) await auth.signInAnonymously(au);
  const f = fs.getFirestore(a);
  class Doc { constructor(p) { this.path = p; this.id = p.split('/').pop(); this.ref = fs.doc(f, p); }
    set(d, o) { return o ? fs.setDoc(this.ref, d, o) : fs.setDoc(this.ref, d); }
    update(d) { return fs.updateDoc(this.ref, d); }
    delete() { return fs.deleteDoc(this.ref); } }
  class Col { constructor(p) { this.path = p; this.ref = fs.collection(f, p); }
    doc(id) { return new Doc(this.path + '/' + (id || crypto.randomUUID().replace(/-/g, '').slice(0, 20))); }
    where(fld, v) { const q = fs.query(this.ref, fs.where(fld, '==', v)); return { onSnapshot: (next, err) => fs.onSnapshot(q, s => next({ docs: s.docs.map(wrap) }), err) }; } }
  return { uid: au.currentUser.uid, db: { doc: p => new Doc(p), collection: p => new Col(p) } };
}
