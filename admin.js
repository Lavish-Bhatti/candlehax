import { auth } from "./firebase-config.js";
import { requireAdmin, logout } from "./auth.js";
import {
  listenUsers,
  searchUsers,
  dashboardStats,
  banUser,
  unbanUser,
} from "./firestore.js";

const ADMIN_EMAILS = [
    "bhattilavish1@gmail.com",
    "an4085612@gmail.com"
];

const totalUsersEl = document.getElementById("totalUsers");
const onlineUsersEl = document.getElementById("onlineUsers");
const todayLoginsEl = document.getElementById("todayLogins");
const usersTable = document.getElementById("usersTable");
const searchInput = document.getElementById("search");
const logoutBtn = document.getElementById("logoutBtn");
const exportBtn = document.getElementById("exportCsvBtn");

let users = [];
let filteredUsers = [];
let started = false;

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatLoginTime(lastLogin) {
  if (!lastLogin) return "Never";
  try {
    const d = typeof lastLogin.toDate === "function" ? lastLogin.toDate() : new Date(lastLogin);
    if (Number.isNaN(d.getTime())) return "Never";
    return d.toLocaleString();
  } catch {
    return "Never";
  }
}

function setCards(stats) {
  if (totalUsersEl) totalUsersEl.textContent = String(stats.total);
  if (onlineUsersEl) onlineUsersEl.textContent = String(stats.online);
  if (todayLoginsEl) todayLoginsEl.textContent = String(stats.today);
}

function renderUsers(list) {
  if (!usersTable) return;
  const tbody = usersTable.tagName === "TBODY" ? usersTable : usersTable.querySelector("tbody");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((u) => {
      const uid = u.uid || u.id || "";
      const status = u.online
        ? `<span class="badge online">Online</span>`
        : `<span class="badge offline">Offline</span>`;
      const banned = u.banned ? `<span class="badge banned">Banned</span>` : "";
      const action = u.banned
        ? `<button class="unban-btn" data-id="${escapeHtml(uid)}">Unban</button>`
        : `<button class="ban-btn" data-id="${escapeHtml(uid)}">Ban</button>`;

      return `
        <tr data-uid="${escapeHtml(uid)}">
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <img src="${escapeHtml(u.photo || "")}" alt="${escapeHtml(u.name || "User")}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;background:#12161F;">
              <span>${escapeHtml(u.name || "—")}</span>
            </div>
          </td>
          <td>${status} ${banned}</td>
          <td>${escapeHtml(u.email || "—")}</td>
          <td>${escapeHtml(u.provider || "—")}</td>
          <td>${escapeHtml(uid || "—")}</td>
          <td>${action}</td>
        </tr>`;
    })
    .join("");
}

function refreshDashboard() {
  const stats = dashboardStats(users);
  setCards(stats);
  filteredUsers = searchInput?.value ? searchUsers(users, searchInput.value) : [...users];
  renderUsers(filteredUsers);
}

function exportCSV() {
  if (!users.length) {
    toast("No users to export.");
    return;
  }

  const headers = ["Name", "Email", "UID", "Provider", "Online", "Banned", "Last Login"];
  const rows = users.map((u) => [
    u.name || "",
    u.email || "",
    u.uid || u.id || "",
    u.provider || "",
    u.online ? "Yes" : "No",
    u.banned ? "Yes" : "No",
    formatLoginTime(u.lastLogin),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candlehax_users_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV exported successfully.");
}

function bindEvents() {
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logout();
      window.location.href = "index.html";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filteredUsers = searchUsers(users, searchInput.value || "");
      renderUsers(filteredUsers);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportCSV);
  }

  if (usersTable) {
    usersTable.addEventListener("click", async (event) => {
      const button = event.target;
      if (!(button instanceof HTMLElement)) return;
      const uid = button.dataset.id;
      if (!uid) return;

      try {
        if (button.classList.contains("ban-btn")) {
          const user = users.find((u) => (u.uid || u.id) === uid);
          if (!user) return;
          if (!confirm(`Ban ${user.name || user.email || uid}?`)) return;
          await banUser(uid);
          toast(`${user.name || uid} banned.`);
        }

        if (button.classList.contains("unban-btn")) {
          const user = users.find((u) => (u.uid || u.id) === uid);
          if (!user) return;
          if (!confirm(`Unban ${user.name || user.email || uid}?`)) return;
          await unbanUser(uid);
          toast(`${user.name || uid} unbanned.`);
        }
      } catch (err) {
        console.error(err);
        toast("Action failed.");
      }
    });

    usersTable.addEventListener("dblclick", (event) => {
      const row = event.target.closest("tr");
      if (!row) return;
      const uid = row.dataset.uid;
      const user = users.find((u) => (u.uid || u.id) === uid);
      if (!user) return;
      alert(
        `Name : ${user.name || "—"}\nEmail : ${user.email || "—"}\nUID : ${user.uid || user.id || "—"}\nProvider : ${user.provider || "—"}\nStatus : ${user.online ? "Online" : "Offline"}\nBanned : ${user.banned ? "Yes" : "No"}`
      );
    });
  }
}

function startDashboard() {
  if (started) return;
  started = true;

  listenUsers((allUsers) => {
    users = allUsers;
    refreshDashboard();
  });

  toast("Admin dashboard loaded.");
}

function boot() {
  requireAdmin(ADMIN_EMAIL);
  bindEvents();
  startDashboard();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

console.log("admin.js loaded");
