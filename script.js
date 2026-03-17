import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, query, where 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// YOUR CORRECT FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBkTk1OIdjo_hOR5BROuC5KWI6ThKnTvQk",
    authDomain: "tradenix-28334.firebaseapp.com",
    projectId: "tradenix-28334",
    storageBucket: "tradenix-28334.firebasestorage.app",
    messagingSenderId: "735443885282",
    appId: "1:735443885282:web:3d93b4a11b60a63dbad2bb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userUID = null;
let isLoginMode = true;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const errorMsg = document.getElementById('auth-error');

// Toggle Elements
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const mainAuthBtn = document.getElementById('main-auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const switchText = document.getElementById('switch-text');

// Profile Modal Elements
const profileModal = document.getElementById('profile-modal');
const openProfileBtn = document.getElementById('open-profile-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalLogoutBtn = document.getElementById('modal-logout-btn');

function showError(message) {
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
}

// --- PROFILE MODAL LOGIC ---
openProfileBtn.addEventListener('click', () => {
    profileModal.style.display = 'flex';
});
closeModalBtn.addEventListener('click', () => {
    profileModal.style.display = 'none';
});
// Close modal if user clicks the dark background outside the card
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.style.display = 'none';
});

// --- TOGGLE BETWEEN LOGIN & SIGNUP ---
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    errorMsg.style.display = "none";
    
    if(isLoginMode) {
        authTitle.innerText = "Welcome Back";
        authSubtitle.innerText = "Enter your credentials to access your dashboard.";
        mainAuthBtn.innerText = "Log In";
        switchText.innerText = "New here? ";
        toggleAuth.innerText = "Create an account";
    } else {
        authTitle.innerText = "Create Account";
        authSubtitle.innerText = "Sign up to start your trading journal.";
        mainAuthBtn.innerText = "Sign Up";
        switchText.innerText = "Already have an account? ";
        toggleAuth.innerText = "Log In";
    }
});

// --- SUBMIT AUTH FORM ---
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    errorMsg.style.display = "none";

    if(isLoginMode) {
        try { await signInWithEmailAndPassword(auth, email, pass); } 
        catch (err) { showError("Incorrect email or password."); }
    } else {
        if (pass.length < 6) return showError("Password must be at least 6 characters.");
        try { await createUserWithEmailAndPassword(auth, email, pass); } 
        catch (err) { showError(err.message); }
    }
});

// Google Sign-In
document.getElementById('google-btn').addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (err) { showError(err.message); }
});

// Logout (Now triggered from inside the Profile Modal)
modalLogoutBtn.addEventListener('click', () => {
    signOut(auth);
    profileModal.style.display = 'none';
});

// Watcher
onAuthStateChanged(auth, (user) => {
    if (user) {
        userUID = user.uid;
        authScreen.style.display = "none";
        appScreen.style.display = "flex";
        
        // Populate profile modal with actual user data
        if (user.email) {
            document.getElementById('modal-email').innerText = user.email;
            document.getElementById('modal-avatar-letter').innerText = user.email.charAt(0).toUpperCase();
            document.getElementById('sidebar-avatar').innerText = user.email.charAt(0).toUpperCase();
        }
        
        loadDashboardStats();
    } else {
        userUID = null;
        authScreen.style.display = "flex";
        appScreen.style.display = "none";
    }
});

// --- SAVE TRADE ---
document.getElementById('new-trade-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userUID) return;

    const tradeData = {
        uid: userUID,
        symbol: document.getElementById('trade-symbol').value.toUpperCase(),
        outcome: document.getElementById('trade-outcome').value,
        date: document.getElementById('trade-date').value,
        timestamp: Date.now()
    };

    try {
        await addDoc(collection(db, "trades"), tradeData);
        e.target.reset();
        document.getElementById('trade-date').valueAsDate = new Date();
        loadDashboardStats();
    } catch (err) {
        alert("Sync Error: " + err.message);
    }
});

// --- CALCULATE STATS ---
async function loadDashboardStats() {
    const q = query(collection(db, "trades"), where("uid", "==", userUID));
    const snap = await getDocs(q);
    
    let total = 0;
    let targetsHit = 0;
    let stopsHit = 0;
    let breakevens = 0;
    
    snap.forEach(doc => {
        total++;
        const outcome = doc.data().outcome;
        if (outcome === "Target") targetsHit++;
        else if (outcome === "Stoploss") stopsHit++;
        else if (outcome === "Breakeven") breakevens++;
    });

    const winRate = total > 0 ? Math.round((targetsHit / total) * 100) : 0;
    
    document.getElementById('stat-winrate').innerText = winRate + "%";
    document.getElementById('stat-wins').innerText = targetsHit;
    document.getElementById('stat-losses').innerText = stopsHit;
    document.getElementById('stat-be').innerText = breakevens;
}
