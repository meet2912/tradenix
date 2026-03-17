// --- DOM ELEMENTS ---
const landingContainer = document.getElementById('landing-container');
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMsg = document.getElementById('auth-error');
const displayName = document.getElementById('display-name');
const avatarInitial = document.getElementById('avatar-initial');
const toastEl = document.getElementById('toast');

const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const newTradeForm = document.getElementById('new-trade-form');
const tradeBody = document.getElementById('trade-body');
const notebookArea = document.getElementById('notebook-textarea');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Profile Page Elements
const userProfileBtn = document.getElementById('user-profile-btn');
const pageLogoutBtn = document.getElementById('page-logout-btn');
const pageGuestLogoutBtn = document.getElementById('page-guest-logout-btn');
const pageAvatarUpload = document.getElementById('page-avatar-upload');
const editProfileForm = document.getElementById('edit-profile-form');

let currentUser = null;
let outcomeChartInstance = null;
let currentMarketFilter = 'All';

// --- TOAST NOTIFICATION ---
function showToast(message) {
    toastEl.innerText = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// --- AVATAR DISPLAY FUNCTION ---
function updateAvatarDisplay(base64String) {
    const sidebarImg = document.getElementById('sidebar-avatar-img');
    const sidebarInit = document.getElementById('avatar-initial');
    const pageImg = document.getElementById('page-avatar-img');
    const pageInit = document.getElementById('page-avatar');

    if (base64String) {
        sidebarImg.src = base64String;
        sidebarImg.style.display = 'block';
        sidebarInit.style.display = 'none';

        if(pageImg) {
            pageImg.src = base64String;
            pageImg.style.display = 'block';
            pageInit.style.display = 'none';
        }
    } else {
        sidebarImg.style.display = 'none';
        sidebarInit.style.display = 'flex';

        if(pageImg) {
            pageImg.style.display = 'none';
            pageInit.style.display = 'flex';
        }
    }
}

// --- INITIALIZATION ---
window.onload = () => {
    const activeUser = localStorage.getItem('activeUser');
    if (activeUser) {
        currentUser = activeUser;
        const userDetails = JSON.parse(localStorage.getItem(`details_${activeUser}`));
        loadDashboard(userDetails ? userDetails.fullname : activeUser);
    } else {
        landingContainer.classList.add('active');
        authContainer.classList.remove('active');
        dashboardContainer.classList.remove('active');
    }
};

// --- AUTH / LANDING LOGIC ---
function showAuth(type) {
    landingContainer.classList.remove('active');
    dashboardContainer.classList.remove('active');
    authContainer.classList.add('active');
    toggleAuth(type);
}

function toggleAuth(type) {
    errorMsg.innerText = "";
    if (type === 'signup') {
        loginForm.classList.remove('active-form');
        signupForm.classList.add('active-form');
    } else {
        signupForm.classList.remove('active-form');
        loginForm.classList.add('active-form');
    }
}

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const dob = document.getElementById('reg-dob').value;
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (password !== confirm) { errorMsg.innerText = "Passwords do not match."; return; }
    if (localStorage.getItem(`user_${username}`)) { errorMsg.innerText = "Username taken."; return; }

    localStorage.setItem(`user_${username}`, password);
    localStorage.setItem(`details_${username}`, JSON.stringify({ fullname, email, dob }));
    
    showToast('Thank you for creating an account on Tradenix!');
    loginUser(username, fullname);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (localStorage.getItem(`user_${username}`) === password) {
        const userDetails = JSON.parse(localStorage.getItem(`details_${username}`));
        showToast('Logged in successfully!');
        loginUser(username, userDetails ? userDetails.fullname : username);
    } else {
        errorMsg.innerText = "Invalid credentials.";
    }
});

function loginUser(username, fullname) {
    currentUser = username;
    localStorage.setItem('activeUser', username);
    loadDashboard(fullname);
}

// --- SKIP TO DASHBOARD LOGIC ---
const landingSkipBtn = document.getElementById('landing-skip-btn');
if (landingSkipBtn) {
    landingSkipBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        const guestUsername = "guest_user";
        const guestName = "Guest Trader";
        
        currentUser = guestUsername;
        localStorage.setItem('activeUser', guestUsername);
        
        if (!localStorage.getItem(`details_${guestUsername}`)) {
            localStorage.setItem(`details_${guestUsername}`, JSON.stringify({ fullname: guestName, email: "guest@tradenix.com", dob: "" }));
        }
        
        errorMsg.innerText = ""; 
        showToast('Entering as Guest...');
        loadDashboard(guestName);
    });
}

function loadDashboard(name) {
    if(landingContainer) landingContainer.classList.remove('active');
    authContainer.classList.remove('active');
    dashboardContainer.classList.add('active');
    
    navItems.forEach(nav => nav.classList.remove('active'));
    contentSections.forEach(sec => sec.classList.remove('active'));
    
    const dashNav = document.querySelector('[data-target="view-dashboard"]');
    if(dashNav) dashNav.classList.add('active');
    
    const dashSection = document.getElementById('view-dashboard');
    if(dashSection) dashSection.classList.add('active');
    
    displayName.innerText = name;
    avatarInitial.innerText = name.charAt(0).toUpperCase();
    
    const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
    updateAvatarDisplay(savedAvatar);
    
    loadTrades();
    loadNotebook();
}

// --- PROFILE PAGE NAV LOGIC ---
if (userProfileBtn) {
    userProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(sec => sec.classList.remove('active'));
        document.getElementById('view-profile').classList.add('active');
        loadProfilePage();
    });
}

function loadProfilePage() {
    const guestWarning = document.getElementById('guest-profile-warning');
    const saveBtn = document.getElementById('save-profile-btn');
    const guestLogout = document.getElementById('page-guest-logout-btn');
    const normalLogout = document.getElementById('page-logout-btn');

    const userDetails = JSON.parse(localStorage.getItem(`details_${currentUser}`));

    document.getElementById('edit-username').value = currentUser;

    if (currentUser === "guest_user") {
        guestWarning.style.display = "block";
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.5";
        saveBtn.style.cursor = "not-allowed";
        
        guestLogout.style.display = "block";
        normalLogout.style.display = "none";
        
        document.getElementById('edit-fullname').value = "Guest Trader";
        document.getElementById('edit-email').value = "guest@tradenix.com";
        document.getElementById('edit-dob').value = "";
        
        document.getElementById('page-display-name').innerText = "Guest Trader";
        document.getElementById('page-display-username').innerText = "Temporary Account";
        document.getElementById('page-avatar').innerText = "G";
    } else {
        if(guestWarning) guestWarning.style.display = "none";
        saveBtn.disabled = false;
        saveBtn.style.opacity = "1";
        saveBtn.style.cursor = "pointer";
        
        guestLogout.style.display = "none";
        normalLogout.style.display = "block";
        
        document.getElementById('edit-fullname').value = userDetails?.fullname || currentUser;
        document.getElementById('edit-email').value = userDetails?.email || '';
        document.getElementById('edit-dob').value = userDetails?.dob || '';
        
        document.getElementById('page-display-name').innerText = userDetails?.fullname || currentUser;
        document.getElementById('page-display-username').innerText = "@" + currentUser;
        document.getElementById('page-avatar').innerText = (userDetails?.fullname || currentUser).charAt(0).toUpperCase();
    }
    
    const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
    updateAvatarDisplay(savedAvatar);
}

// --- PROFILE SAVING LOGIC ---
if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentUser === "guest_user") return; 
        
        const fullname = document.getElementById('edit-fullname').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const dob = document.getElementById('edit-dob').value;
        
        const userDetails = { fullname, email, dob };
        localStorage.setItem(`details_${currentUser}`, JSON.stringify(userDetails));
        
        displayName.innerText = fullname; 
        avatarInitial.innerText = fullname.charAt(0).toUpperCase(); 
        
        document.getElementById('page-display-name').innerText = fullname; 
        document.getElementById('page-avatar').innerText = fullname.charAt(0).toUpperCase(); 
        
        showToast("Profile updated successfully!");
    });
}

// --- AVATAR UPLOAD LOGIC ---
if (pageAvatarUpload) {
    pageAvatarUpload.addEventListener('change', function(e) {
        if(currentUser === "guest_user") {
            showToast("Guests cannot change avatars.");
            return;
        }
        
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                localStorage.setItem(`avatar_${currentUser}`, base64String);
                updateAvatarDisplay(base64String);
                showToast("Profile photo updated!");
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- MASTER LOGOUT LOGIC ---
function performLogout(message) {
    localStorage.removeItem('activeUser');
    currentUser = null;
    
    // Explicitly hide auth and dashboard containers
    dashboardContainer.classList.remove('active');
    authContainer.classList.remove('active');
    
    // Explicitly show the landing container
    landingContainer.classList.add('active');
    
    // Reset dashboard tabs so next login is clean
    document.getElementById('view-profile').classList.remove('active');
    contentSections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('view-dashboard').classList.add('active');
    
    showToast(message);
}

if (pageLogoutBtn) {
    pageLogoutBtn.addEventListener('click', () => {
        performLogout('Logged out successfully');
    });
}

if (pageGuestLogoutBtn) {
    pageGuestLogoutBtn.addEventListener('click', () => {
        performLogout('Exited Guest Mode');
    });
}

// --- NAVIGATION (SPA TAB SWITCHING) ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(sec => sec.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(item.getAttribute('data-target')).classList.add('active');
    });
});

// --- MARKET FILTER LOGIC ---
const marketFilterBtns = document.querySelectorAll('.market-filter-btn');
if (marketFilterBtns) {
    marketFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            marketFilterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMarketFilter = e.target.getAttribute('data-market');
            loadTrades(); 
        });
    });
}

// --- DATE FORMATTER (MM/DD/YY) ---
function formatDate(dateString) {
    const parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    const year = parts[0].substring(2); 
    const month = parts[1];
    const day = parts[2];
    return `${month}/${day}/${year}`;
}

// --- NEW TRADE FORM LOGIC ---
newTradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const rawDate = document.getElementById('trade-date').value;
    
    const trade = {
        id: Date.now(),
        date: formatDate(rawDate),
        market: document.getElementById('trade-market').value,
        symbol: document.getElementById('trade-symbol').value.toUpperCase(),
        outcome: document.getElementById('trade-outcome').value,
        entry: document.getElementById('trade-entry').value,
        exit: document.getElementById('trade-exit').value,
        notes: document.getElementById('trade-notes').value
    };

    let trades = JSON.parse(localStorage.getItem(`trades_${currentUser}`)) || [];
    trades.push(trade);
    localStorage.setItem(`trades_${currentUser}`, JSON.stringify(trades));
    
    newTradeForm.reset();
    showToast('Trade analyzed and saved!');
    loadTrades();
    
    document.querySelector('[data-target="view-dashboard"]').click();
});

// --- CHART RENDERING LOGIC ---
function renderChart(targets, stoplosses, breakevens) {
    const ctx = document.getElementById('outcomeChart');
    if (!ctx) return;

    if (outcomeChartInstance) {
        outcomeChartInstance.destroy();
    }

    if (targets === 0 && stoplosses === 0 && breakevens === 0) {
        return; 
    }

    outcomeChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Targets Hit', 'Stoplosses', 'Breakevens'],
            datasets: [{
                data: [targets, stoplosses, breakevens],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { family: 'Inter', size: 13 } } }
            }
        }
    });
}

// --- LOAD TRADES & CALCULATE STATS ---
function loadTrades() {
    tradeBody.innerHTML = "";
    let allTrades = JSON.parse(localStorage.getItem(`trades_${currentUser}`)) || [];
    
    let trades = allTrades;
    if (currentMarketFilter !== 'All') {
        trades = allTrades.filter(t => t.market === currentMarketFilter);
    }
    
    let targets = 0;
    let stoplosses = 0;
    let breakevens = 0;

    [...trades].reverse().forEach(trade => {
        if(trade.outcome === 'Target') targets++;
        if(trade.outcome === 'Stoploss') stoplosses++;
        if(trade.outcome === 'Breakeven') breakevens++;

        const row = document.createElement('tr');
        
        let outcomeClass = '';
        if(trade.outcome === 'Target') outcomeClass = 'outcome-target';
        if(trade.outcome === 'Stoploss') outcomeClass = 'outcome-stoploss';
        if(trade.outcome === 'Breakeven') outcomeClass = 'outcome-breakeven';

        row.innerHTML = `
            <td>${trade.date}</td>
            <td><span class="asset-tag">${trade.symbol}</span> <span style="font-size:0.8rem; color:var(--text-muted); margin-left:5px;">${trade.market}</span></td>
            <td>${trade.entry}</td>
            <td>${trade.exit}</td>
            <td><span class="outcome-badge ${outcomeClass}">${trade.outcome}</span></td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${trade.notes ? trade.notes.substring(0, 35) + '...' : '-'}</td>
        `;
        tradeBody.appendChild(row);
    });

    document.getElementById('dash-targets').innerText = targets;
    document.getElementById('dash-stoplosses').innerText = stoplosses;
    document.getElementById('dash-breakevens').innerText = breakevens;

    const winRate = trades.length > 0 ? ((targets / trades.length) * 100).toFixed(1) : 0;
    document.getElementById('dash-winrate').innerText = `${winRate}%`;

    renderChart(targets, stoplosses, breakevens);
}

// --- NOTEBOOK AUTO-SAVE LOGIC ---
function loadNotebook() {
    if (notebookArea) {
        notebookArea.value = localStorage.getItem(`notes_${currentUser}`) || "";
    }
}
if (notebookArea) {
    notebookArea.addEventListener('input', () => {
        localStorage.setItem(`notes_${currentUser}`, notebookArea.value);
    });
}

// --- EXPORT TO CSV LOGIC ---
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
        let trades = JSON.parse(localStorage.getItem(`trades_${currentUser}`)) || [];
        
        if (currentMarketFilter !== 'All') {
            trades = trades.filter(t => t.market === currentMarketFilter);
        }
        
        if (trades.length === 0) {
            showToast("No trades to export for this filter!");
            return;
        }

        const headers = ["Date", "Market", "Symbol", "Entry Price", "Exit Price", "Outcome", "Notes"];
        
        const csvRows = trades.map(trade => {
            const safeNotes = trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : '""';
            return [trade.date, trade.market, trade.symbol, trade.entry, trade.exit, trade.outcome, safeNotes].join(",");
        });

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Tradenix_Journal_${currentMarketFilter}_${today}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        showToast(`Exported ${currentMarketFilter} Journal to CSV!`);
    });
}

// --- HYBRID SEARCH (Instant Local + Live Alpha Vantage API) ---
const symbolInput = document.getElementById('trade-symbol');
const searchDropdown = document.getElementById('search-results');
const marketSelect = document.getElementById('trade-market');

const localAssets = [
    { symbol: "EUR/USD", name: "Euro / US Dollar", type: "Forex" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar", type: "Forex" },
    { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", type: "Forex" },
    { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", type: "Forex" },
    { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", type: "Forex" },
    { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", type: "Forex" },
    { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", type: "Forex" },
    { symbol: "BTC/USD", name: "Bitcoin", type: "Crypto" },
    { symbol: "ETH/USD", name: "Ethereum", type: "Crypto" },
    { symbol: "NIFTY", name: "Nifty 50", type: "Indices" },
    { symbol: "BANKNIFTY", name: "Nifty Bank", type: "Indices" },
    { symbol: "SPX", name: "S&P 500", type: "Indices" },
    { symbol: "NDX", name: "NASDAQ 100", type: "Indices" }
];

const apiKey = 'YIA0HZOTJCUEICY3';
let searchTimeout = null;

if (symbolInput && searchDropdown) {
    symbolInput.addEventListener('input', function() {
        const query = this.value.trim().toUpperCase();
        searchDropdown.innerHTML = "";
        
        if (query.length < 1) {
            searchDropdown.style.display = "none";
            return;
        }

        searchDropdown.style.display = "block";
        let hasResults = false;

        const localResults = localAssets.filter(item => 
            item.symbol.includes(query) || item.name.toUpperCase().includes(query)
        ).slice(0, 6);

        if (localResults.length > 0) {
            hasResults = true;
            localResults.forEach(item => {
                const div = document.createElement('div');
                div.className = "search-item";
                div.innerHTML = `
                    <div>
                        <span class="symbol-name">${item.symbol}</span>
                        <br><small style="color:gray">${item.name}</small>
                    </div>
                    <span class="market-type">${item.type}</span>
                `;
                div.addEventListener('click', () => {
                    symbolInput.value = item.symbol;
                    marketSelect.value = item.type;
                    searchDropdown.style.display = "none";
                });
                searchDropdown.appendChild(div);
            });
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.className = "search-item";
        loadingDiv.style.color = "gray";
        loadingDiv.style.fontSize = "0.8rem";
        loadingDiv.innerHTML = `<em>Searching live stocks...</em>`;
        searchDropdown.appendChild(loadingDiv);

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`);
                const data = await response.json();

                if(searchDropdown.contains(loadingDiv)) {
                    searchDropdown.removeChild(loadingDiv);
                }

                if (data.bestMatches && data.bestMatches.length > 0) {
                    const stockResults = data.bestMatches.slice(0, 6);
                    
                    if (stockResults.length > 0) hasResults = true;

                    stockResults.forEach(item => {
                        const symbol = item['1. symbol'];
                        const name = item['2. name'] || "Unknown Stock";
                        const type = item['3. type'];
                        
                        let marketType = "Stock";
                        if (type === "ETF") marketType = "Indices";

                        let exchangeBadge = "";
                        if (symbol.endsWith(".BSE")) exchangeBadge = `<span style="font-size: 0.7rem; background: #fef3c7; color: #f59e0b; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">BSE</span>`;

                        const div = document.createElement('div');
                        div.className = "search-item";
                        div.innerHTML = `
                            <div>
                                <span class="symbol-name">${symbol}</span> ${exchangeBadge}
                                <br><small style="color:gray">${name}</small>
                            </div>
                            <span class="market-type">${marketType}</span>
                        `;
                        
                        div.addEventListener('click', () => {
                            symbolInput.value = symbol.replace('.BSE', '');
                            marketSelect.value = marketType;
                            searchDropdown.style.display = "none";
                        });
                        searchDropdown.appendChild(div);
                    });
                }

                if (!hasResults) {
                    searchDropdown.innerHTML = '<div class="search-item" style="color:gray;">No results found.</div>';
                }
            } catch (error) {
                if(searchDropdown.contains(loadingDiv)) searchDropdown.removeChild(loadingDiv);
                if (!hasResults) {
                    searchDropdown.innerHTML = '<div class="search-item" style="color:gray;">No results found in local database.</div>';
                }
            }
        }, 800); 
    });

    document.addEventListener('click', (e) => {
        if (!symbolInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = "none";
        }
    });
}