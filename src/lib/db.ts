import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  QueryConstraint,
  DocumentData,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"

export type { DocumentData }
export { orderBy, where, Timestamp }

export const getDocument = async (path: string) => {
  const snap = await getDoc(doc(db, path))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const setDocument = async (path: string, data: DocumentData) => {
  await setDoc(doc(db, path), { ...data, updatedAt: Timestamp.now() }, { merge: true })
}

export const addDocument = async (collectionPath: string, data: DocumentData) => {
  const ref = await addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export const updateDocument = async (path: string, data: Partial<DocumentData>) => {
  await updateDoc(doc(db, path), { ...data, updatedAt: Timestamp.now() })
}

export const deleteDocument = async (path: string) => {
  await deleteDoc(doc(db, path))
}

export const getCollection = async (
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<DocumentData[]> => {
  const q = query(collection(db, collectionPath), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const subscribeCollection = (
  collectionPath: string,
  callback: (data: DocumentData[]) => void,
  ...constraints: QueryConstraint[]
) => {
  const q = query(collection(db, collectionPath), ...constraints)
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export const subscribeDocument = (
  path: string,
  callback: (data: DocumentData | null) => void
) => {
  return onSnapshot(doc(db, path), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export const batchUpdate = async (updates: { path: string; data: DocumentData }[]) => {
  const batch = writeBatch(db)
  updates.forEach(({ path, data }) => {
    batch.update(doc(db, path), { ...data, updatedAt: Timestamp.now() })
  })
  await batch.commit()
}

export const logActivity = async (action: string, entity: string) => {
  await addDoc(collection(db, "activity"), {
    action,
    entity,
    timestamp: Timestamp.now(),
  })
}
