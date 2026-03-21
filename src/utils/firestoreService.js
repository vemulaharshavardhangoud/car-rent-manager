import { db } from "../firebase";
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

// --- VEHICLE FIRESTORE FUNCTIONS ---

export const saveVehicleToFirestore = async (vehicleData) => {
  const docRef = doc(db, "vehicles", vehicleData.id);
  const data = {
    ...vehicleData,
    syncedAt: serverTimestamp()
  };
  await setDoc(docRef, data);
  return data;
};

export const getAllVehiclesFromFirestore = async () => {
  const q = query(collection(db, "vehicles"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateVehicleInFirestore = async (id, updatedFields) => {
  const docRef = doc(db, "vehicles", id);
  await updateDoc(docRef, {
    ...updatedFields,
    syncedAt: serverTimestamp()
  });
};

export const deleteVehicleFromFirestore = async (id) => {
  // Delete vehicle document
  await deleteDoc(doc(db, "vehicles", id));
  
  // Delete associated trips
  const tripsQ = query(collection(db, "trips"), where("vehicleId", "==", id));
  const tripsSnapshot = await getDocs(tripsQ);
  
  const batch = writeBatch(db);
  tripsSnapshot.docs.forEach((tripDoc) => {
    batch.delete(tripDoc.ref);
  });
  await batch.commit();
};

export const listenToVehicles = (callback) => {
  return onSnapshot(collection(db, "vehicles"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  });
};

// --- TRIP FIRESTORE FUNCTIONS ---

export const saveTripToFirestore = async (tripData) => {
  const docRef = doc(db, "trips", tripData.id);
  const data = {
    ...tripData,
    syncedAt: serverTimestamp()
  };
  await setDoc(docRef, data);
};

export const getAllTripsFromFirestore = async () => {
  const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const getTripsForVehicleFromFirestore = async (vehicleId) => {
  const q = query(
    collection(db, "trips"), 
    where("vehicleId", "==", vehicleId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateTripInFirestore = async (id, updatedFields) => {
  const docRef = doc(db, "trips", id);
  await updateDoc(docRef, {
    ...updatedFields,
    syncedAt: serverTimestamp()
  });
};

export const deleteTripFromFirestore = async (id) => {
  await deleteDoc(doc(db, "trips", id));
};

export const listenToTrips = (callback) => {
  return onSnapshot(collection(db, "trips"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  });
};

// --- BOOKING FIRESTORE FUNCTIONS ---

export const saveBookingToFirestore = async (bookingData) => {
  const docRef = doc(db, "bookings", bookingData.id);
  const data = {
    ...bookingData,
    syncedAt: serverTimestamp()
  };
  await setDoc(docRef, data);
};

export const getAllBookingsFromFirestore = async () => {
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

export const updateBookingInFirestore = async (id, updatedFields) => {
  const docRef = doc(db, "bookings", id);
  await updateDoc(docRef, {
    ...updatedFields,
    syncedAt: serverTimestamp()
  });
};

export const deleteBookingFromFirestore = async (id) => {
  await deleteDoc(doc(db, "bookings", id));
};

export const listenToBookings = (callback) => {
  return onSnapshot(collection(db, "bookings"), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data()));
  });
};

// --- SETTINGS FIRESTORE FUNCTIONS ---

export const saveSettingsToFirestore = async (settingsData) => {
  const docRef = doc(db, "settings", "app_settings");
  await setDoc(docRef, {
    ...settingsData,
    syncedAt: serverTimestamp()
  });
};

export const getSettingsFromFirestore = async () => {
  const docSnap = await getDoc(doc(db, "settings", "app_settings"));
  return docSnap.exists() ? docSnap.data() : null;
};

export const listenToSettings = (callback) => {
  return onSnapshot(doc(db, "settings", "app_settings"), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
};

// --- NOTIFICATION FIRESTORE FUNCTIONS ---

export const saveSentNotification = async (notificationData) => {
  const docRef = doc(collection(db, "sent_notifications"));
  await setDoc(docRef, {
    ...notificationData,
    sentAt: serverTimestamp()
  });
};

export const isNotificationSent = async (bookingId, type) => {
  const q = query(
    collection(db, "sent_notifications"), 
    where("bookingId", "==", bookingId),
    where("type", "==", type)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};
