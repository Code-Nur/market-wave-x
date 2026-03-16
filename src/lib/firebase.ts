import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDHlvbSsPUpWEXYZ8UpaRI5PrbSQkESh1w",
  authDomain: "e-commerce-4c064.firebaseapp.com",
  projectId: "e-commerce-4c064",
  storageBucket: "e-commerce-4c064.appspot.com",
  messagingSenderId: "568176006341",
  appId: "1:568176006341:web:9d41157ad7064ab8d14cac",
  measurementId: "G-LZSME9LNTB",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
