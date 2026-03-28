import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";

export const QUOTA_DOC_ID = "storage_quota_metadata";
const DEFAULT_SAFETY_LIMIT = 4.5 * 1024 * 1024 * 1024; // 4.5 GB in bytes
const HARD_LIMIT = 5.0 * 1024 * 1024 * 1024; // 5.0 GB in bytes

/**
 * Usage Service: Tracks and enforces the Firebase Storage quota.
 */

export const getQuotaMetadata = async () => {
  if (!db) return null;
  const docRef = doc(db, "settings", QUOTA_DOC_ID);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    const initialData = {
      totalBytesUsed: 0,
      lastUpdated: serverTimestamp(),
      safetyLimit: DEFAULT_SAFETY_LIMIT,
      isHardStopEnabled: true
    };
    await setDoc(docRef, initialData);
    return initialData;
  }
  
  return docSnap.data();
};

export const listenToQuota = (callback) => {
  if (!db) return () => {};
  const docRef = doc(db, "settings", QUOTA_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ totalBytesUsed: 0, safetyLimit: DEFAULT_SAFETY_LIMIT });
    }
  });
};

export const checkUploadAllowed = async (newFileSizeBytes) => {
  const metadata = await getQuotaMetadata();
  if (!metadata) return true; // Fail open if DB is down? Or fail closed? Safe is closed.
  
  const currentUsed = metadata.totalBytesUsed || 0;
  const limit = metadata.safetyLimit || DEFAULT_SAFETY_LIMIT;
  
  if (currentUsed + newFileSizeBytes > limit) {
    return {
      allowed: false,
      currentUsed,
      limit,
      reason: "QUOTA_EXCEEDED"
    };
  }
  
  return { allowed: true };
};

export const recordUpload = async (fileSizeBytes) => {
  if (!db) return;
  const docRef = doc(db, "settings", QUOTA_DOC_ID);
  await updateDoc(docRef, {
    totalBytesUsed: increment(fileSizeBytes),
    lastUpdated: serverTimestamp()
  });
};

export const recordDeletion = async (fileSizeBytes) => {
  if (!db) return;
  const docRef = doc(db, "settings", QUOTA_DOC_ID);
  await updateDoc(docRef, {
    totalBytesUsed: increment(-fileSizeBytes),
    lastUpdated: serverTimestamp()
  });
};

export const resetQuotaCounter = async (actualBytes) => {
  if (!db) return;
  const docRef = doc(db, "settings", QUOTA_DOC_ID);
  await updateDoc(docRef, {
    totalBytesUsed: actualBytes,
    lastUpdated: serverTimestamp()
  });
};
