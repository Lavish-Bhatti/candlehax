// ==========================================
// Candlehax Authentication
// auth.js
// ==========================================

import { auth } from "./firebase-config.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const provider = new GoogleAuthProvider();

// ==========================================
// Google Login
// ==========================================

export async function googleLogin() {

    try {

        const result = await signInWithPopup(auth, provider);

        return result.user;

    } catch (error) {

        console.error("Google Login Error:", error);

        alert(error.message);

    }

}

// ==========================================
// Logout
// ==========================================

export async function logout() {

    try {

        await signOut(auth);

        window.location.reload();

    } catch (error) {

        console.error(error);

    }

}

// ==========================================
// Current User
// ==========================================

export function getCurrentUser(callback) {

    onAuthStateChanged(auth, (user) => {

        callback(user);

    });

}

// ==========================================
// Check Login
// ==========================================

export function requireLogin() {

    onAuthStateChanged(auth, (user) => {

        if (!user) {

            document.body.innerHTML = `

            <div style="
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                background:#0B0E14;
                color:white;
                font-family:Arial;
                flex-direction:column;
            ">

                <h1>CANDLEHAX</h1>

                <p>Please login first.</p>

                <button id="googleLoginBtn"
                style="
                    padding:12px 24px;
                    background:#D4A853;
                    border:none;
                    cursor:pointer;
                    border-radius:8px;
                    font-weight:bold;
                ">
                    Continue with Google
                </button>

            </div>

            `;

            document
                .getElementById("googleLoginBtn")
                .onclick = googleLogin;

        }

    });

}

// ==========================================
// Admin Check
// ==========================================

export function requireAdmin(adminEmail) {

    onAuthStateChanged(auth, (user) => {

        if (!user) {

            window.location.href = "index.html";

            return;

        }

        if (user.email !== adminEmail) {

            alert("Access Denied");

            signOut(auth);

        }

    });

}
