// ==========================================
// Candlehax Firestore
// firestore.js
// ==========================================

import { db } from "./firebase-config.js";

import {
    doc,
    setDoc,
    updateDoc,
    getDoc,
    getDocs,
    collection,
    serverTimestamp,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// Save User
// ==========================================

export async function saveUser(user){

    if(!user) return;

    const userRef = doc(db,"users",user.uid);

    const snapshot = await getDoc(userRef);

    if(!snapshot.exists()){

        await setDoc(userRef,{

            uid:user.uid,

            name:user.displayName,

            email:user.email,

            photo:user.photoURL,

            provider:"Google",

            online:true,

            banned:false,

            createdAt:serverTimestamp(),

            lastLogin:serverTimestamp()

        });

    }else{

        await updateDoc(userRef,{

            online:true,

            lastLogin:serverTimestamp()

        });

    }

}

// ==========================================
// User Offline
// ==========================================

export async function userOffline(uid){

    if(!uid) return;

    await updateDoc(doc(db,"users",uid),{

        online:false

    });

}

// ==========================================
// Ban User
// ==========================================

export async function banUser(uid){

    await updateDoc(doc(db,"users",uid),{

        banned:true

    });

}

// ==========================================
// Unban User
// ==========================================

export async function unbanUser(uid){

    await updateDoc(doc(db,"users",uid),{

        banned:false

    });

}

// ==========================================
// Check Banned
// ==========================================

export async function isBanned(uid){

    const snapshot = await getDoc(doc(db,"users",uid));

    if(!snapshot.exists()) return false;

    return snapshot.data().banned===true;

}

// ==========================================
// Get Total Users
// ==========================================

export async function totalUsers(){

    const snap = await getDocs(collection(db,"users"));

    return snap.size;

}

// ==========================================
// Online Users
// ==========================================

export async function totalOnlineUsers(){

    const q=query(

        collection(db,"users"),

        where("online","==",true)

    );

    const snap=await getDocs(q);

    return snap.size;

}

// ==========================================
// Live Users
// ==========================================

export function listenUsers(callback){

    onSnapshot(

        collection(db,"users"),

        (snapshot)=>{

            let users=[];

            snapshot.forEach(doc=>{

                users.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            callback(users);

        }

    );

}

// ==========================================
// Search User
// ==========================================

export function searchUsers(users,text){

    text=text.toLowerCase();

    return users.filter(user=>{

        return(

            user.name?.toLowerCase().includes(text)

            ||

            user.email?.toLowerCase().includes(text)

        );

    });

}

// ==========================================
// Today's Login
// ==========================================

export function todayLogins(users){

    const today=new Date().toDateString();

    return users.filter(user=>{

        if(!user.lastLogin) return false;

        return user.lastLogin

            .toDate()

            .toDateString()===today;

    }).length;

}

// ==========================================
// Dashboard Stats
// ==========================================

export function dashboardStats(users){

    return{

        total:users.length,

        online:users.filter(u=>u.online).length,

        banned:users.filter(u=>u.banned).length,

        today:todayLogins(users)

    };

}
