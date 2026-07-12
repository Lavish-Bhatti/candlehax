// ==========================================
// Candlehax Main
// main.js
// ==========================================

import {
    googleLogin,
    logout,
    getCurrentUser
} from "./auth.js";

import {
    saveUser,
    userOffline,
    isBanned
} from "./firestore.js";

// ==========================================
// Elements
// ==========================================

const loginBtn = document.getElementById("googleLoginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");

const userEmail = document.getElementById("userEmail");

const userPhoto = document.getElementById("userPhoto");

const loginOverlay = document.getElementById("loginOverlay");

// ==========================================
// Login
// ==========================================

if(loginBtn){

    loginBtn.onclick = async ()=>{

        await googleLogin();

    };

}

// ==========================================
// Logout
// ==========================================

if(logoutBtn){

    logoutBtn.onclick = ()=>{

        logout();

    };

}

// ==========================================
// User State
// ==========================================

getCurrentUser(async(user)=>{

    if(!user){

        if(loginOverlay){

            loginOverlay.style.display="flex";

        }

        return;

    }

    const banned = await isBanned(user.uid);

    if(banned){

        alert("Your account has been banned.");

        logout();

        return;

    }

    await saveUser(user);

    if(loginOverlay){

        loginOverlay.style.display="none";

    }

    if(userName){

        userName.textContent=user.displayName;

    }

    if(userEmail){

        userEmail.textContent=user.email;

    }

    if(userPhoto){

        userPhoto.src=user.photoURL;

    }

    window.addEventListener("beforeunload",()=>{

        userOffline(user.uid);

    });

});

// ==========================================
// Copy Button
// ==========================================

window.copyToClipboard = function(text){

    navigator.clipboard.writeText(text);

};

// ==========================================
// Open Link
// ==========================================

window.openLink=function(url){

    window.open(url,"_blank");

};

// ==========================================
// Scroll Top
// ==========================================

window.scrollTop=function(){

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

// ==========================================
// Notification
// ==========================================

window.showToast=function(message){

    const toast=document.createElement("div");

    toast.innerText=message;

    toast.style.position="fixed";

    toast.style.bottom="20px";

    toast.style.right="20px";

    toast.style.background="#D4A853";

    toast.style.color="#000";

    toast.style.padding="12px 20px";

    toast.style.borderRadius="8px";

    toast.style.zIndex="9999";

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.remove();

    },2500);

};

console.log("Main.js Loaded Successfully");
