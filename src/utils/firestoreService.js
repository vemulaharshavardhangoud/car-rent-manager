import { db, storage } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

// Guard: if db is null (not configured), return safe no-ops
const isReady = () => db !== null;

// --- VEHICLE FIRESTORE FUNCTIONS ---

export const saveVehicleToFirestore = async (vehicleData) => {
  if (!isReady()) return vehicleData;
  const docRef = doc(db, "vehicles", vehicleData.id);
  // Photos are now small Firebase Storage URLs, no need to strip them.
  const data = { 
    ...vehicleData, 
    hasPhotos: !!(vehicleData.photos && vehicleData.photos.length > 0), 
    photoCount: (vehicleData.photos || []).length, 
    syncedAt: serverTimestamp() 
  };
  await setDoc(docRef, data);
  return data;
};

export const getAllVehiclesFromFirestore = async () => {
  if (!isReady()) return [];
  const q = query(collection(db, "vehicles"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateVehicleInFirestore = async (id, updatedFields) => {
  if (!isReady()) return;
  const docRef = doc(db, "vehicles", id);
  // We no longer strip photos because we use Firebase Storage URLs now.
  const fieldsToSync = { 
    ...updatedFields, 
    hasPhotos: !!(updatedFields.photos && updatedFields.photos.length > 0),
    photoCount: (updatedFields.photos || []).length,
    syncedAt: serverTimestamp() 
  };
  await updateDoc(docRef, fieldsToSync);
};

export const deleteVehicleFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "vehicles", id));
  const tripsQ = query(collection(db, "trips"), where("vehicleId", "==", id));
  const tripsSnapshot = await getDocs(tripsQ);
  const batch = writeBatch(db);
  tripsSnapshot.docs.forEach((tripDoc) => { batch.delete(tripDoc.ref); });
  await batch.commit();
};

export const listenToVehicles = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(collection(db, "vehicles"), (snapshot) => {
    const firestoreVehicles = snapshot.docs.map(doc => doc.data());
    // Photos are now stored directly in Firestore as URLs. No merging needed.
    callback(firestoreVehicles);
  }, (err) => { console.warn("Vehicle listener error:", err); });
};

// --- TRIP FIRESTORE FUNCTIONS ---

export const saveTripToFirestore = async (tripData) => {
  if (!isReady()) return;
  const docRef = doc(db, "trips", tripData.id);
  await setDoc(docRef, { ...tripData, syncedAt: serverTimestamp() });
};

export const getAllTripsFromFirestore = async () => {
  if (!isReady()) return [];
  const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const getTripsForVehicleFromFirestore = async (vehicleId) => {
  if (!isReady()) return [];
  const q = query(collection(db, "trips"), where("vehicleId", "==", vehicleId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateTripInFirestore = async (id, updatedFields) => {
  if (!isReady()) return;
  const docRef = doc(db, "trips", id);
  await updateDoc(docRef, { ...updatedFields, syncedAt: serverTimestamp() });
};

export const deleteTripFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "trips", id));
};

export const listenToTrips = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(collection(db, "trips"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  }, (err) => { console.warn("Trip listener error:", err); });
};

// --- BOOKING FIRESTORE FUNCTIONS ---

export const saveBookingToFirestore = async (bookingData) => {
  if (!isReady()) return;
  const docRef = doc(db, "bookings", bookingData.id);
  await setDoc(docRef, { ...bookingData, syncedAt: serverTimestamp() });
};

export const getAllBookingsFromFirestore = async () => {
  if (!isReady()) return [];
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateBookingInFirestore = async (id, updatedFields) => {
  if (!isReady()) return;
  const docRef = doc(db, "bookings", id);
  await updateDoc(docRef, { ...updatedFields, syncedAt: serverTimestamp() });
};

export const deleteBookingFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "bookings", id));
};

export const listenToBookings = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(collection(db, "bookings"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  }, (err) => { console.warn("Booking listener error:", err); });
};

// --- SETTINGS FIRESTORE FUNCTIONS ---

export const saveSettingsToFirestore = async (settingsData) => {
  if (!isReady()) return;
  const docRef = doc(db, "settings", "app_settings");
  await setDoc(docRef, { ...settingsData, syncedAt: serverTimestamp() });
};

export const getSettingsFromFirestore = async () => {
  if (!isReady()) return null;
  const docSnap = await getDoc(doc(db, "settings", "app_settings"));
  return docSnap.exists() ? docSnap.data() : null;
};

export const listenToSettings = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(doc(db, "settings", "app_settings"), (docSnap) => {
    if (docSnap.exists()) callback(docSnap.data());
  }, (err) => { console.warn("Settings listener error:", err); });
};

// --- NOTIFICATION FIRESTORE FUNCTIONS ---

export const saveSentNotification = async (notificationData) => {
  if (!isReady()) return;
  const docRef = doc(collection(db, "sent_notifications"));
  await setDoc(docRef, { ...notificationData, sentAt: serverTimestamp() });
};

export const isNotificationSent = async (bookingId, type) => {
  if (!isReady()) return false;
  const q = query(
    collection(db, "sent_notifications"),
    where("bookingId", "==", bookingId),
    where("type", "==", type)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// --- DRIVER FIRESTORE FUNCTIONS ---

export const saveDriverToFirestore = async (driverData) => {
  if (!isReady()) return;
  const docRef = doc(db, "drivers", driverData.id);
  await setDoc(docRef, { ...driverData, syncedAt: serverTimestamp() });
};

export const updateDriverInFirestore = async (id, updatedFields) => {
  if (!isReady()) return;
  const docRef = doc(db, "drivers", id);
  await updateDoc(docRef, { ...updatedFields, syncedAt: serverTimestamp() });
};

export const deleteDriverFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "drivers", id));
};

export const listenToDrivers = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(collection(db, "drivers"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  }, (err) => { console.warn("Driver listener error:", err); });
};

// --- FUEL LOG FIRESTORE FUNCTIONS ---

export const saveFuelLogToFirestore = async (fuelData) => {
  if (!isReady()) return;
  const docRef = doc(db, "fuelLogs", fuelData.id);
  await setDoc(docRef, { ...fuelData, syncedAt: serverTimestamp() });
};

export const deleteFuelLogFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "fuelLogs", id));
};

export const listenToFuelLogs = (callback) => {
  if (!isReady()) return () => {};
  return onSnapshot(collection(db, "fuelLogs"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  }, (err) => { console.warn("Fuel Log listener error:", err); });
};

// --- CUSTOMER FIRESTORE FUNCTIONS ---

export const saveCustomerToFirestore = async (customerData) => {
  if (!isReady()) return;
  const docRef = doc(db, "customers", customerData.id);
  await setDoc(docRef, { ...customerData, syncedAt: serverTimestamp() });
};

export const updateCustomerInFirestore = async (id, updatedFields) => {
  if (!isReady()) return;
  const docRef = doc(db, "customers", id);
  await updateDoc(docRef, { ...updatedFields, syncedAt: serverTimestamp() });
};

export const deleteCustomerFromFirestore = async (id) => {
  if (!isReady()) return;
  await deleteDoc(doc(db, "customers", id));
};

export const listenToCustomers = (callback) => {
  if (!isReady()) return () => {};
  const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (err) => { console.warn("Customer listener error:", err); });
};

// --- EXPENSES ---
export const saveExpenseToFirestore = async (expenseData) => {
  if (!isReady()) return false;
  try {
    const docRef = doc(db, "expenses", expenseData.id);
    await setDoc(docRef, { ...expenseData, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error saving expense:", error);
    return false;
  }
};

export const updateExpenseInFirestore = async (id, updatedFields) => {
  if (!isReady()) return false;
  try {
    const docRef = doc(db, "expenses", id);
    await updateDoc(docRef, { ...updatedFields, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    return false;
  }
};

export const deleteExpenseFromFirestore = async (id) => {
  if (!isReady()) return false;
  try {
    const docRef = doc(db, "expenses", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    return false;
  }
};

export const listenToExpenses = (callback) => {
  if (!isReady()) return () => {};
  const q = query(collection(db, "expenses"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (err) => { console.warn("Expense listener error:", err); });
};

const compressImage = (file, maxWidth = 900, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const uploadFile = async (file, folder = 'vehicles') => {
  if (!storage) return null;
  
  let fileToUpload = file;
  
  // Only compress if it's an image and not a small thumbnail
  if (file.type.startsWith('image/') && file.size > 200 * 1024) {
    try {
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.warn("Compression failed, uploading original:", e);
    }
  }

  const storageRef = ref(storage, `${folder}/${Date.now()}_${fileToUpload.name}`);
  const snapshot = await uploadBytes(storageRef, fileToUpload);
  return await getDownloadURL(snapshot.ref);
};