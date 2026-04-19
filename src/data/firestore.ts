import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Word } from '../types';

const wordsCol = (uid: string) => collection(db, 'users', uid, 'words');

export const fetchWords = async (uid: string): Promise<Word[]> => {
  const q = query(wordsCol(uid), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Word));
};

export const addWord = async (uid: string, word: Omit<Word, 'id'>): Promise<Word> => {
  const ref = await addDoc(wordsCol(uid), { ...word, createdAt: serverTimestamp() });
  return { ...word, id: ref.id };
};

export const updateWord = async (uid: string, word: Word): Promise<void> => {
  const { id, ...data } = word;
  await updateDoc(doc(wordsCol(uid), id), data);
};

export const deleteWord = async (uid: string, wordId: string): Promise<void> => {
  await deleteDoc(doc(wordsCol(uid), wordId));
};
