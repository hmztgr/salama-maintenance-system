$ npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIyQYGTyB0v8ERXDUAB5-9IPlZda9P7Bw",
  authDomain: "salama-maintenance-prod.firebaseapp.com",
  projectId: "salama-maintenance-prod",
  storageBucket: "salama-maintenance-prod.firebasestorage.app",
  messagingSenderId: "147270460266",
  appId: "1:147270460266:web:0f8decd600a927e52d7b13",
  measurementId: "G-HB1VBJN9HD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);