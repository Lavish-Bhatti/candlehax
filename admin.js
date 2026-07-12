// ==============================
// Candlehax Admin Dashboard
// admin.js - Part 1
// ==============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    updateDoc,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_AUTH_DOMAIN",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_STORAGE_BUCKET",

    messagingSenderId: "YOUR_SENDER_ID",

    appId: "YOUR_APP_ID"

};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

// ======================================
// CHANGE THIS TO YOUR GMAIL
// ======================================

const ADMIN_EMAIL = "YOUR_GMAIL@gmail.com";

// ======================================

const usersRef = collection(db, "users");

const totalUsers = document.getElementById("totalUsers");

const onlineUsers = document.getElementById("onlineUsers");

const todayLogins = document.getElementById("todayLogins");

const usersTable = document.getElementById("usersTable");

const searchInput = document.getElementById("search");

// ==============================
// Admin Login Check
// ==============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../index.html";

        return;

    }

    if (user.email !== ADMIN_EMAIL) {

        alert("Access Denied");

        signOut(auth);

        return;

    }

    console.log("Admin Logged In");

    loadUsers();

});

// ==============================
// Logout
// ==============================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {

    signOut(auth);

});
// ==============================
// Load Users
// ==============================

async function loadUsers() {

    onSnapshot(usersRef, (snapshot) => {

        usersTable.innerHTML = "";

        let total = 0;
        let online = 0;
        let today = 0;

        snapshot.forEach((document) => {

            total++;

            const user = document.data();

            if (user.online === true) {

                online++;

            }

            // Count Today's Logins

            if (user.lastLogin) {

                const loginDate = user.lastLogin.toDate();

                const todayDate = new Date();

                if (
                    loginDate.toDateString() ===
                    todayDate.toDateString()
                ) {

                    today++;

                }

            }

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>

                    <img
                        src="${user.photo}"
                        width="40"
                        height="40"
                        style="border-radius:50%;object-fit:cover;"
                    >

                </td>

                <td>

                    ${user.name}

                </td>

                <td>

                    ${user.email}

                </td>

                <td>

                    ${
                        user.lastLogin
                        ? user.lastLogin
                            .toDate()
                            .toLocaleString()
                        : "Never"
                    }

                </td>

                <td>

                    ${
                        user.online
                        ? "<span style='color:lime'>● Online</span>"
                        : "<span style='color:red'>● Offline</span>"
                    }

                </td>

                <td>

                    <button
                        class="ban-btn"
                        data-id="${document.id}"
                    >

                        Ban

                    </button>

                </td>

            `;

            usersTable.appendChild(row);

        });

        totalUsers.textContent = total;

        onlineUsers.textContent = online;

        todayLogins.textContent = today;

    });

}
// ==============================
// Search Users
// ==============================

searchInput.addEventListener("keyup", () => {

    const value = searchInput.value.toLowerCase();

    const rows = usersTable.querySelectorAll("tr");

    rows.forEach((row) => {

        const text = row.innerText.toLowerCase();

        if (text.includes(value)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

});

// ==============================
// Ban User
// ==============================

usersTable.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("ban-btn")) return;

    const id = e.target.dataset.id;

    const confirmBan = confirm(
        "Are you sure you want to ban this user?"
    );

    if (!confirmBan) return;

    try {

        await updateDoc(
            doc(db, "users", id),
            {
                banned: true
            }
        );

        alert("User banned successfully.");

    } catch (error) {

        console.error(error);

        alert("Failed to ban user.");

    }

});

// ==============================
// Unban User (Future)
// ==============================

async function unbanUser(uid){

    await updateDoc(
        doc(db,"users",uid),
        {
            banned:false
        }
    );

}

// ==============================
// Refresh Every 5 Seconds
// ==============================

setInterval(() => {

    loadUsers();

},5000);

console.log("Admin Dashboard Loaded Successfully");
