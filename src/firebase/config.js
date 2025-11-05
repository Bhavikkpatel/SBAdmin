import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCiuHMmsJ9gNU1u3jhlhITNNpbiW7yGQmU",
  authDomain: "synergyglobals-412ae.firebaseapp.com",
  projectId: "synergyglobals-412ae",
  storageBucket: "synergyglobals-412ae.firebasestorage.app",
  messagingSenderId: "89835035430",
  appId: "1:89835035430:web:0ff91d513646e7ad8f3fe7",
  measurementId: "G-2YGGB0S8YL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };