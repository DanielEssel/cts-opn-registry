import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyChFFKpDW_PCtRDeU7UItKlOnlg0TN_gS8",
  authDomain: "permittrack-dev.firebaseapp.com",
  projectId: "permittrack-dev",
  storageBucket: "permittrack-dev.firebasestorage.app",
  messagingSenderId: "192385808651",
  appId: "1:192385808651:web:961fc7fddf335468ec4a0e",
  measurementId: "G-YSDP15FMVJ"
};

// Initialize Firebase (checking if already initialized for Next.js HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics ONLY if we are in the browser (window is defined)
// and if the browser supports it
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};