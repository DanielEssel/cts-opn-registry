import { initializeApp, getApps, getApp }        from "firebase/app";
import { getFirestore }                           from "firebase/firestore";
import { getAuth }                                from "firebase/auth";
import { getStorage }                             from "firebase/storage";
import { getFunctions }                           from "firebase/functions";
import { getAnalytics, isSupported }              from "firebase/analytics";

export const firebaseConfig = {
  apiKey:            "AIzaSyCPprJc-tFU4ouayRL9MrvJIfkuAsyd1s8",
  authDomain:        "cts-rin-registry.firebaseapp.com",
  projectId:         "cts-rin-registry",
  storageBucket:     "cts-rin-registry.firebasestorage.app",
  messagingSenderId: "371283843923",
  appId:             "1:371283843923:web:aa6d10284972c04e109fa6",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db        = getFirestore(app);
export const auth      = getAuth(app);
export const storage   = getStorage(app);
export const functions = getFunctions(app, "europe-west2");

export const initAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};