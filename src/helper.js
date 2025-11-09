import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase/config';

export const checkIfModelExists = async (collectionName, modelId, companyId) => {
  // Don't check empty strings
  if (!modelId || !modelId.trim()) return false;

  const q = query(
    collection(db, collectionName),
    where('modelId', '==', modelId),
    // Optional: If modelIds only need to be unique PER company, keep this line.
    // If they must be unique GLOBALLY across the whole app, remove this line.
    where('companyId', '==', companyId),
    limit(1) // <--- Key for optimization
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty; // Returns true if a document matched
};