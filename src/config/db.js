import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDu2cjwUvnlJP9uWWgbqPXz2Sw9WSJGg7s",
    authDomain: "course-demo-58959.firebaseapp.com",
    projectId: "course-demo-58959",
    storageBucket: "course-demo-58959.firebasestorage.app",
    messagingSenderId: "974647741248",
    appId: "1:974647741248:web:51bdc0e4ed48c7de9a08a5",
    measurementId: "G-MJG3KF1Y3R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
const analytics = getAnalytics(app);