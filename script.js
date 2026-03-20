// 1. Firebase Configuration
var firebaseConfig = {
    apiKey: "AIzaSyBDTnMVSJ2Gh6sPuS2eJ2Bn_Z6KN_T20Js",
    authDomain: "eid-gift-2026-16dd4.firebaseapp.com",
    projectId: "eid-gift-2026-16dd4",
    storageBucket: "eid-gift-2026-16dd4.firebasestorage.app",
    messagingSenderId: "897681481125",
    appId: "1:897681481125:web:68c49d340d08252423dc4c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var db = firebase.firestore();

// 2. Page Switching Logic
function showPage(pageId) {
    const sections = ['auth-box', 'dashboard', 'rules-section', 'how-to-section'];
    
    // 1. Saare sections hide karein
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // 2. Logic to show the correct page
    if (pageId === 'home') {
        const user = localStorage.getItem('currentUser');
        const targetId = user ? 'dashboard' : 'auth-box';
        const target = document.getElementById(targetId);
        if (target) target.classList.remove('hidden');
    } else {
        const target = document.getElementById(pageId);
        if (target) target.classList.remove('hidden');
    }

    // 3. IMPORTANT: Switch hone ke baad page ko scroll karke top par le jayein
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 4. Navigation Buttons ki "Active" class update karein
    updateNavButtons(pageId);
}

// Navigation buttons ko highlight karne wala function
function updateNavButtons(activePage) {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active'); // Pehle sab se active class hataein
        
        // Agar button ka onclick function matches the pageId, usay active kar dein
        if (btn.getAttribute('onclick').includes(activePage)) {
            btn.classList.add('active');
        }
    });
}

// 3. Login Function (With Fingerprint & IP Lock)
async function login() {
    const nameVal = document.getElementById('name').value.trim();
    const phoneVal = document.getElementById('phone').value.trim();

    if (nameVal.length < 3 || phoneVal.length < 10) {
        alert("Naam aur Sahi WhatsApp number likhein!");
        return;
    }

    try {
        // Unique Fingerprint Generation
        const fingerprint = btoa([navigator.userAgent, screen.height, screen.width, navigator.language].join('|'));

        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const userIP = ipData.ip;

        const userRef = db.collection("users").doc(phoneVal);
        const doc = await userRef.get();

        if (!doc.exists) {
            // Anti-Cheat: IP & Device Check
            const ipQuery = await db.collection("users").where("ip", "==", userIP).get();
            const deviceQuery = await db.collection("users").where("deviceId", "==", fingerprint).get();

            if (!ipQuery.empty || !deviceQuery.empty) {
                alert("Ek device par sirf ek account allowed hai!");
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const referredBy = urlParams.get('ref');

            await userRef.set({
                name: nameVal,
                phone: phoneVal,
                balance: 0,
                invites: 0,
                ip: userIP,
                deviceId: fingerprint,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (referredBy && referredBy !== phoneVal) {
                const referrerRef = db.collection("users").doc(referredBy);
                await referrerRef.update({
                    balance: firebase.firestore.FieldValue.increment(50),
                    invites: firebase.firestore.FieldValue.increment(1)
                }).catch(e => console.log("Referrer error"));
            }
        }

        localStorage.setItem('currentUser', phoneVal);
        showDashboard();
        loadUserData(phoneVal);

    } catch (error) {
        alert("Error: Internet check karein!");
        console.error(error);
    }
}

// 4. Load Data
async function loadUserData(phone) {
    try {
        const doc = await db.collection("users").doc(phone).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('balance').innerText = data.balance || 0;
            document.getElementById('invites').innerText = data.invites || 0;
            // Dono jagah referral ID show karne ke liye
if(document.getElementById('ref-id-dashboard')) {
    document.getElementById('ref-id-dashboard').innerText = userReferralID;
}
if(document.getElementById('ref-id-share')) {
    document.getElementById('ref-id-share').innerText = userReferralID;
}

            const prog = Math.min((data.balance / 2000) * 100, 100);
            document.getElementById('progress').style.width = prog + "%";

            const wBtn = document.getElementById('withdraw-btn');
            if (data.balance >= 2000 && data.invites >= 20) {
                wBtn.classList.remove('btn-disabled');
                wBtn.classList.add('btn-primary');
                wBtn.disabled = false;
            }
        }
    } catch (e) { console.error(e); }
}

// 5. Watch Ad (Earning + Reward Logic)
let adTimer;
let timeLeft = 30;

function watchVideoAd() {
    const modal = document.getElementById('ad-modal');
    const timerDisplay = document.getElementById('timer-container');
    const adFrame = document.getElementById('ad-frame');
    const claimBtn = document.getElementById('claim-btn');
    const statusText = document.getElementById('ad-status');

    // 1. Aapka Adsterra Smart Link
    const myAdLink = "https://www.profitablecpmratenetwork.com/d63nmprev5?key=b25985fa1a9981263d77b7b9b7cf2468";

    // 2. Setup UI
    timeLeft = 30;
    timerDisplay.innerText = timeLeft;
    claimBtn.classList.add('hidden');
    statusText.innerText = "Keep this page open to earn Rs. 15";
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // 3. Load Ad in Iframe
    adFrame.src = myAdLink;

    // 4. Start Timer
    if(adTimer) clearInterval(adTimer);
    adTimer = setInterval(() => {
        // Anti-Cheat: Agar user tab switch kare to timer rok do
        if (!document.hidden) {
            timeLeft--;
            timerDisplay.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(adTimer);
                timerDisplay.innerHTML = '<i class="fas fa-check"></i>';
                statusText.innerText = "Mission Accomplished!";
                claimBtn.classList.remove('hidden'); // 30s ke baad button show
            }
        } else {
            statusText.innerText = "⚠️ Timer Paused! Come back to earn.";
        }
    }, 1000);
}

function claimReward() {
    const phone = localStorage.getItem('currentUser');
    const claimBtn = document.getElementById('claim-btn');
    const modal = document.getElementById('ad-modal');
    const adFrame = document.getElementById('ad-frame');

    if (!phone) return;

    // 1. Button ko foran disable karein (Double-click Prevention)
    claimBtn.disabled = true;
    claimBtn.innerText = "PROCESSING...";
    claimBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // 2. Firebase Update
    db.collection("users").doc(phone).update({
        balance: firebase.firestore.FieldValue.increment(15)
    }).then(() => {
        // 3. UI Update (Dashboard refresh)
        if (typeof loadUserData === "function") {
            loadUserData(phone); 
        }

        // 4. Modal Clean-up & Redirect
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        adFrame.src = ""; // Ad stop karne ke liye
        
        // 5. Reset button for next time
        claimBtn.disabled = false;
        claimBtn.innerText = "Claim Now";
        claimBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        alert("🎉 Mubarak! Rs. 15 add ho gaye hain. Aap Dashboard par wapas aa gaye hain.");
        
        // Auto-scroll to Dashboard (Optional)
        window.scrollTo({ top: 0, behavior: 'smooth' });

    }).catch((error) => {
        console.error("Error updating balance: ", error);
        alert("Server error! Please try again.");
        claimBtn.disabled = false;
    });
}
// 6. Withdraw, Share & Utilities
function share(platform) {
    const phone = localStorage.getItem('currentUser');
    if (!phone) return;
    const siteLink = window.location.origin + window.location.pathname + "?ref=" + phone;
    const msg = `🌙 Maine Rs. 2000 jeetne ke liye register kiya hai. Aap bhi join karein: ${siteLink}`;
    let url = platform === 'wa' ? `https://wa.me/?text=${encodeURIComponent(msg)}` : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteLink)}`;
    window.open(url, '_blank');
}

async function submitWithdrawRequest() {
    const phone = localStorage.getItem('currentUser');
    const method = document.getElementById('method').value;
    const accName = document.getElementById('acc-name').value;
    const accNum = document.getElementById('acc-num').value;

    if (accName.length < 3 || accNum.length < 10) {
        alert("Sahi Details enter karein!");
        return;
    }

    try {
        await db.collection("withdrawals").add({
            userPhone: phone,
            method: method,
            accountName: accName,
            accountNumber: accNum,
            status: "Pending",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Request Submit! 24-48 ghanton mein payment mil jayegi.");
        closeWithdraw();
    } catch (e) { alert("Error!"); }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}
function withdraw() { document.getElementById('withdraw-modal').classList.remove('hidden'); }
function closeWithdraw() { document.getElementById('withdraw-modal').classList.add('hidden'); }

window.onload = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
        showDashboard();
        loadUserData(user);
    }
};

function copyLink() {
    const phone = localStorage.getItem('currentUser');
    if (!phone) return;
    const link = window.location.origin + window.location.pathname + "?ref=" + phone;
    navigator.clipboard.writeText(link).then(() => alert("Link Copy Ho Gaya!"));
}
