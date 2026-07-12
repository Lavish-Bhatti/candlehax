// ==========================================
// admin.js — Complete Admin Dashboard Logic
// Firebase v9+ Modular SDK
// ==========================================
//
// ASSUMPTIONS (adjust to match your actual HTML):
//   Dashboard stat elements : #totalUsers, #onlineUsers, #bannedUsers
//   Search input            : #searchInput
//   Table body              : #usersTable tbody
//   Row action buttons      : .ban-btn / .unban-btn  with data-id="<uid>"
//   Firestore collection    : "users"
//     fields: name, email, uid, provider, online (bool), banned (bool), createdAt (Timestamp)
//
// If your IDs/classes differ, just change the selectors in the CONFIG block below.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Firebase Config — REPLACE with your own
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// DOM References
// ==========================================
const totalUsersEl = document.getElementById("totalUsers");
const onlineUsersEl = document.getElementById("onlineUsers");
const bannedUsersEl = document.getElementById("bannedUsers");
const searchInput = document.getElementById("searchInput");
const usersTable = document.getElementById("usersTable");
const tableBody = usersTable ? usersTable.querySelector("tbody") : null;
const exportBtn = document.getElementById("exportCsvBtn"); // optional button
const logoutBtn = document.getElementById("logoutBtn"); // optional button

// ==========================================
// State
// ==========================================
let users = [];
let searchTerm = "";

// ==========================================
// Admin Login Protection
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Not logged in -> kick back to login page
    window.location.href = "login.html";
    return;
  }
  // Logged in -> start listening to live data
  listenToUsers();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ==========================================
// Live Firestore Listener
// ==========================================
function listenToUsers() {
  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

  onSnapshot(
    usersQuery,
    (snapshot) => {
      users = snapshot.docs.map((docSnap) => ({
        docId: docSnap.id,
        uid: docSnap.data().uid || docSnap.id,
        ...docSnap.data(),
      }));
      updateDashboard();
      renderUsers();
    },
    (error) => {
      console.error("Firestore listener error:", error);
      toast("Failed to load users. Check console.");
    }
  );
}

// ==========================================
// Dashboard Stats
// ==========================================
function updateDashboard() {
  if (totalUsersEl) totalUsersEl.textContent = users.length;
  if (onlineUsersEl)
    onlineUsersEl.textContent = users.filter((u) => u.online).length;
  if (bannedUsersEl)
    bannedUsersEl.textContent = users.filter((u) => u.banned).length;
}

// ==========================================
// Render Users Table
// ==========================================
function renderUsers() {
  if (!tableBody) return;

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? users.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(term) ||
          (u.email || "").toLowerCase().includes(term) ||
          (u.uid || "").toLowerCase().includes(term)
      )
    : users;

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No users found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((u) => {
      const statusBadge = u.online
        ? `<span class="badge online">Online</span>`
        : `<span class="badge offline">Offline</span>`;
      const bannedBadge = u.banned
        ? `<span class="badge banned">Banned</span>`
        : "";
      const actionBtn = u.banned
        ? `<button class="unban-btn" data-id="${u.uid}">Unban</button>`
        : `<button class="ban-btn" data-id="${u.uid}">Ban</button>`;

      return `
        <tr>
          <td>${escapeHtml(u.name || "—")}</td>
          <td>${statusBadge} ${bannedBadge}</td>
          <td>${escapeHtml(u.email || "—")}</td>
          <td>${escapeHtml(u.provider || "—")}</td>
          <td>${escapeHtml(u.uid || "—")}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==========================================
// Search
// ==========================================
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderUsers();
  });
}

// ==========================================
// Ban / Unban Actions
// ==========================================
async function banUser(uid) {
  const target = users.find((u) => u.uid === uid);
  if (!target) return;
  await updateDoc(doc(db, "users", target.docId), { banned: true });
}

async function unbanUser(uid) {
  const target = users.find((u) => u.uid === uid);
  if (!target) return;
  await updateDoc(doc(db, "users", target.docId), { banned: false });
}

if (usersTable) {
  usersTable.addEventListener("click", async (event) => {
    const button = event.target;
    if (!(button instanceof HTMLElement)) return;

    if (button.classList.contains("ban-btn")) {
      const uid = button.dataset.id;
      const user = users.find((u) => u.uid === uid);
      if (!user) return;
      if (!confirm(`Ban ${user.name}?`)) return;
      await banUser(uid);
      toast(`${user.name} banned successfully.`);
    }

    if (button.classList.contains("unban-btn")) {
      const uid = button.dataset.id;
      const user = users.find((u) => u.uid === uid);
      if (!user) return;
      if (!confirm(`Unban ${user.name}?`)) return;
      await unbanUser(uid);
      toast(`${user.name} unbanned successfully.`);
    }
  });

  // Double-click for full user details
  usersTable.addEventListener("dblclick", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;
    const cells = row.querySelectorAll("td");
    if (cells.length < 5) return;

    const email = cells[2].innerText;
    const user = users.find((u) => u.email === email);
    if (!user) return;

    alert(
      `Name : ${user.name}\nEmail : ${user.email}\nUID : ${user.uid}\nProvider : ${user.provider}\nStatus : ${
        user.online ? "Online" : "Offline"
      }\nBanned : ${user.banned ? "Yes" : "No"}`
    );
  });
}

// ==========================================
// CSV Export
// ==========================================
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (users.length === 0) {
      toast("No users to export.");
      return;
    }
    const headers = ["Name", "Email", "UID", "Provider", "Online", "Banned"];
    const rows = users.map((u) => [
      u.name || "",
      u.email || "",
      u.uid || "",
      u.provider || "",
      u.online ? "Yes" : "No",
      u.banned ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast("CSV exported successfully.");
  });
}

// ==========================================
// Toast Notification
// ==========================================
function toast(message) {
  const box = document.createElement("div");
  box.className = "toast";
  box.innerText = message;
  document.body.appendChild(box);

  requestAnimationFrame(() => box.classList.add("show"));

  setTimeout(() => {
    box.classList.remove("show");
    setTimeout(() => box.remove(), 300);
  }, 2500);
}

console.log("admin.js loaded");
