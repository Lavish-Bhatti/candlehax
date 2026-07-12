// ==========================================
// Candlehax Firebase Configuration
// firebase-config.js
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// Your Firebase Configuration
// ==========================================

const firebaseConfig = {

    apiKey: "AIzaSyAXSYzfmsb5cg2yuXyg0U1srtmHWesjFaM",

    authDomain: "candlehax-80be7.firebaseapp.com",

    projectId: "candlehax-80be7",

    storageBucket: "candlehax-80be7.firebasestorage.app",

    messagingSenderId: "919355585070",

    appId: "1:919355585070:web:3a7771e8d5df99b0f4e5bf"

};

// ==========================================
// Initialize Firebase
// ==========================================

const app = initializeApp(firebaseConfig);

// ==========================================
// Services
// ==========================================

const auth = getAuth(app);

const db = getFirestore(app);

// ==========================================
// Export
// ==========================================

export { app, auth, db };
