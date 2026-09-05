import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalInteraction, ChatMessage } from '../types';

/**
 * Utility to strip undefined properties recursively to ensure zero-crash Firestore payloads
 */
function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Fetch all journal interactions isolated to a specific user
 */
export async function getUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) throw new Error('User ID is required to fetch interactions.');
  
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Reflection',
        preview: data.preview || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        turns: (data.turns || []) as ChatMessage[],
        summary: data.summary || '',
        tags: data.tags || [],
      } as JournalInteraction;
    });
  } catch (err: any) {
    // If index or order fallback occurs, try basic collection fetch
    console.warn('Firestore query fallback:', err);
    const snapshot = await getDocs(interactionsRef);
    const list = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Reflection',
        preview: data.preview || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        turns: (data.turns || []) as ChatMessage[],
        summary: data.summary || '',
        tags: data.tags || [],
      } as JournalInteraction;
    });
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

/**
 * Save or update a journal interaction strictly bound to users/{userId}/interactions/{interactionId}
 */
export async function saveUserInteraction(
  userId: string,
  interaction: Partial<JournalInteraction> & { id: string }
): Promise<void> {
  if (!userId) throw new Error('User ID is required to save an interaction.');
  if (!interaction.id) throw new Error('Interaction ID is required.');

  const docRef = doc(db, 'users', userId, 'interactions', interaction.id);

  const payload = sanitizePayload({
    id: interaction.id,
    userId,
    title: interaction.title || 'New Reflection',
    preview: interaction.preview || '',
    createdAt: interaction.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turns: interaction.turns || [],
    summary: interaction.summary || '',
    tags: interaction.tags || [],
    serverModified: serverTimestamp(),
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete an interaction
 */
export async function deleteUserInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) throw new Error('User ID and Interaction ID are required.');
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}
