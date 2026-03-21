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

// Guard: if db is null (not configured), return safe no-ops
const isReady = () => db !== null;

// --- VEHICLE FIRESTORE FUNCTIONS ---

export const saveVehicleToFirestore = async (vehicleData) => {
  if (!isReady()) return vehicleData;
  const docRef = doc(db, "vehicles", vehicleData.id);
  const data = { ...vehicleData, syncedAt: serverTimestamp() };
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
  await updateDoc(docRef, { ...updatedFields, syncedAt: serverTimestamp() });
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
    callback(snapshot.docs.map(doc => doc.data()));
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
