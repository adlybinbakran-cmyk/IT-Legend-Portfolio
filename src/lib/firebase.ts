import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAOMKvEt2rSEhCNX5_WhAuPgLIEzARkyxs",
  authDomain: "webdev-dcfaa.firebaseapp.com",
  projectId: "webdev-dcfaa",
  storageBucket: "webdev-dcfaa.firebasestorage.app",
  messagingSenderId: "1096000918968",
  appId: "1:1096000918968:web:ec0b0d27c8e0b917ceeb4d",
  measurementId: "G-5K06GYJFBM",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
