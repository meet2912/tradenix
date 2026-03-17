// --- DOM ELEMENTS ---
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

// Profile Modal Elements
const userProfileBtn = document.getElementById('user-profile-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const modalLogoutBtn = document.getElementById('modal-logout-btn');
const avatarUpload = document.getElementById('avatar-upload');

let currentUser = null;
let outcomeChartInstance = null;

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
    const modalImg = document.getElementById('modal-avatar-img');
    const modalInit = document.getElementById('modal-avatar');

    if (base64String) {
        sidebarImg.src = base64String;
        sidebarImg.style.display = 'block';
        sidebarInit.style.display = 'none';

        modalImg.src = base64String;
        modalImg.style.display = 'block';
        modalInit.style.display = 'none';
    } else {
        sidebarImg.style.display = 'none';
        sidebarInit.style.display = 'flex';

        modalImg.style.display = 'none';
        modalInit.style.display = 'flex';
    }
}

// --- INITIALIZATION ---
window.onload = () => {
    const activeUser = localStorage.getItem('activeUser');
    if (activeUser) {
        currentUser = activeUser;
        const userDetails = JSON.parse(localStorage.getItem(`details_${activeUser}`));
        loadDashboard(userDetails ? userDetails.fullname : activeUser);
    }
};

// --- AUTHENTICATION LOGIC ---
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
    
    showToast('Account created successfully!');
    loginUser(username, fullname);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    const savedPassword = localStorage.getItem(`user_${username}`);
    
    if (!savedPassword) {
        errorMsg.innerText = "Account not found. Please click 'Create an account' first.";
        return;
    }

    if (savedPassword === password) {
        const userDetails = JSON.parse(localStorage.getItem(`details_${username}`));
        errorMsg.innerText = ""; 
        showToast('Logged in successfully!');
        loginUser(username, userDetails ? userDetails.fullname : username);
    } else {
        errorMsg.innerText = "Incorrect password. Please try again.";
    }
});

function loginUser(username, fullname) {
    currentUser = username;
    localStorage.setItem('activeUser', username);
    loadDashboard(fullname);
}

function loadDashboard(name) {
    authContainer.classList.remove('active');
    dashboardContainer.classList.add('active');
    
    displayName.innerText = name;
    avatarInitial.innerText = name.charAt(0).toUpperCase();
    
    const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
    updateAvatarDisplay(savedAvatar);
    
    loadTrades();
    loadNotebook();
}

// --- PROFILE MODAL LOGIC ---
if (userProfileBtn) {
    userProfileBtn.addEventListener('click', () => {
        const userDetails = JSON.parse(localStorage.getItem(`details_${currentUser}`));
        
        document.getElementById('modal-avatar').innerText = (userDetails?.fullname || currentUser).charAt(0).toUpperCase();
        document.getElementById('modal-name').innerText = userDetails?.fullname || currentUser;
        document.getElementById('modal-email').innerText = userDetails?.email || 'N/A';
        document.getElementById('modal-username').innerText = currentUser;
        
        if (userDetails?.dob) {
            const parts = userDetails.dob.split('-');
            document.getElementById('modal-dob').innerText = `${parts[1]}/${parts[2]}/${parts[0]}`;
        } else {
            document.getElementById('modal-dob').innerText = 'N/A';
        }

        const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
        updateAvatarDisplay(savedAvatar);
        
        profileModal.classList.add('active');
    });
}

if (avatarUpload) {
    avatarUpload.addEventListener('change', function(e) {
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

if (closeProfileBtn) closeProfileBtn.addEventListener('click', () => profileModal.classList.remove('active'));
if (profileModal) profileModal.addEventListener('click', (e) => { if(e.target === profileModal) profileModal.classList.remove('active'); });

if (modalLogoutBtn) {
    modalLogoutBtn.addEventListener('click', () => {
        profileModal.classList.remove('active');
        localStorage.removeItem('activeUser');
        currentUser = null;
        dashboardContainer.classList.remove('active');
        authContainer.classList.add('active');
        toggleAuth('login');
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
                legend: { position: 'bottom', labels: { color: '#6b7280', font: { family: 'Inter', size: 13 } } }
            }
        }
    });
}

// --- LOAD TRADES & CALCULATE STATS ---
function loadTrades() {
    tradeBody.innerHTML = "";
    let trades = JSON.parse(localStorage.getItem(`trades_${currentUser}`)) || [];
    
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
        
        if (trades.length === 0) {
            showToast("No trades to export yet!");
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
        link.setAttribute("download", `Tradenix_Journal_${today}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        showToast("Journal exported to CSV!");
    });
}

// --- LOCAL ASSETS FALLBACK ---
const localAssets = [
    { symbol: "RELIANCE", name: "Reliance Industries", type: "Stock", exchange: "NSE" },
    { symbol: "TCS", name: "Tata Consultancy Services", type: "Stock", exchange: "NSE" },
    { symbol: "HDFCBANK", name: "HDFC Bank", type: "Stock", exchange: "NSE" },
    { symbol: "ICICIBANK", name: "ICICI Bank", type: "Stock", exchange: "NSE" },
    { symbol: "INFY", name: "Infosys", type: "Stock", exchange: "NSE" },
    { symbol: "SBIN", name: "State Bank of India", type: "Stock", exchange: "NSE" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel", type: "Stock", exchange: "NSE" },
    { symbol: "ITC", name: "ITC Limited", type: "Stock", exchange: "NSE" },
    { symbol: "LT", name: "Larsen & Toubro", type: "Stock", exchange: "NSE" },
    { symbol: "BAJFINANCE", name: "Bajaj Finance", type: "Stock", exchange: "NSE" },
    { symbol: "TATAMOTORS", name: "Tata Motors", type: "Stock", exchange: "NSE" },
    { symbol: "NTPC", name: "NTPC Limited", type: "Stock", exchange: "NSE" },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", type: "Stock", exchange: "NSE" },
    { symbol: "AXISBANK", name: "Axis Bank", type: "Stock", exchange: "NSE" },
    { symbol: "M&M", name: "Mahindra & Mahindra", type: "Stock", exchange: "NSE" },
    { symbol: "MARUTI", name: "Maruti Suzuki", type: "Stock", exchange: "NSE" },
    { symbol: "ULTRACEMCO", name: "UltraTech Cement", type: "Stock", exchange: "NSE" },
    { symbol: "ASIANPAINT", name: "Asian Paints", type: "Stock", exchange: "NSE" },
    { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", type: "Stock", exchange: "NSE" },
    { symbol: "TITAN", name: "Titan Company", type: "Stock", exchange: "NSE" },
    { symbol: "EUR/USD", name: "Euro / US Dollar", type: "Forex" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar", type: "Forex" },
    { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", type: "Forex" },
    { symbol: "BTC/USD", name: "Bitcoin", type: "Crypto" },
    { symbol: "ETH/USD", name: "Ethereum", type: "Crypto" },
    { symbol: "NIFTY", name: "Nifty 50", type: "Indices", exchange: "NSE" },
    { symbol: "BANKNIFTY", name: "Nifty Bank", type: "Indices", exchange: "NSE" }
];

// --- FETCH LIVE CURRENT MARKET PRICE ---
async function fetchLivePrice(symbol) {
    const entryInput = document.getElementById('trade-entry');
    entryInput.placeholder = "Fetching live price...";
    
    try {
        const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
        // Updated to the secure /get proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network error');
        
        const proxyData = await response.json();
        if (!proxyData.contents) throw new Error('Proxy blocked');

        const data = JSON.parse(proxyData.contents);
        
        if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
            const price = data.quoteResponse.result[0].regularMarketPrice;
            if (price) {
                const decimalPlaces = price < 10 ? 4 : 2; 
                entryInput.value = price.toFixed(decimalPlaces);
                showToast(`Live price fetched for ${symbol}`);
            } else {
                entryInput.placeholder = "0.00";
            }
        }
    } catch (error) {
        console.error("Live Price Proxy Error:", error);
        entryInput.placeholder = "0.00";
        showToast("Could not fetch live price.");
    }
}

// --- LIVE YAHOO FINANCE SEARCH (Proxied safely) ---
const symbolInput = document.getElementById('trade-symbol');
const searchDropdown = document.getElementById('search-results');
const marketSelect = document.getElementById('trade-market');

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
        let hasLocalResults = false;

        // 1. Show Instant Local Results First
        const localMatches = localAssets.filter(item => 
            item.symbol.includes(query) || item.name.toUpperCase().includes(query)
        ).slice(0, 5);

        if (localMatches.length > 0) {
            hasLocalResults = true;
            localMatches.forEach(item => {
                let badge = "";
                if (item.exchange === "NSE") badge = `<span style="font-size: 0.7rem; background: #ffedd5; color: #f97316; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">NSE</span>`;
                else if (item.type === "Forex" || item.type === "Crypto") badge = `<span style="font-size: 0.7rem; background: #e0e7ff; color: #4f46e5; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">Global</span>`;

                const div = document.createElement('div');
                div.className = "search-item";
                div.innerHTML = `
                    <div>
                        <span class="symbol-name">${item.symbol}</span> ${badge}
                        <br><small style="color:gray">${item.name} (Local)</small>
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
        
        // 2. Add Loading indicator for the Live API
        const loadingDiv = document.createElement('div');
        loadingDiv.className = "search-item";
        loadingDiv.style.color = "gray";
        loadingDiv.style.fontSize = "0.8rem";
        loadingDiv.innerHTML = `<em>Searching Yahoo Finance Live...</em>`;
        searchDropdown.appendChild(loadingDiv);

        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(async () => {
            try {
                const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
                // Switch to /get endpoint to bypass Cloudflare block on raw requests
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
                
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Proxy network error');
                
                const proxyData = await response.json();
                
                if(searchDropdown.contains(loadingDiv)) {
                    searchDropdown.removeChild(loadingDiv);
                }

                // If proxyData.contents exists, parse it.
                if (proxyData.contents) {
                    const data = JSON.parse(proxyData.contents);
                    
                    if (data.quotes && data.quotes.length > 0) {
                        data.quotes.forEach(item => {
                            const symbol = item.symbol;
                            const name = item.shortname || item.longname || "Unknown Asset";
                            const type = item.quoteType;
                            const exchangeDisp = item.exchDisp || "";

                            let marketType = "Stock";
                            if (type === "INDEX") marketType = "Indices";
                            if (type === "CURRENCY") marketType = "Forex";
                            if (type === "CRYPTOCURRENCY") marketType = "Crypto";

                            let exchangeBadge = "";
                            if (symbol.endsWith(".NS") || exchangeDisp.includes("NSE")) {
                                exchangeBadge = `<span style="font-size: 0.7rem; background: #ffedd5; color: #f97316; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">NSE</span>`;
                            } else if (symbol.endsWith(".BO") || exchangeDisp.includes("BSE")) {
                                exchangeBadge = `<span style="font-size: 0.7rem; background: #fef3c7; color: #f59e0b; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">BSE</span>`;
                            } else if (marketType === "Forex" || marketType === "Crypto") {
                                 exchangeBadge = `<span style="font-size: 0.7rem; background: #e0e7ff; color: #4f46e5; padding: 2px 4px; border-radius: 4px; margin-left: 5px;">Global</span>`;
                            }

                            // Prevent duplicates if local already showed it
                            if (!localMatches.some(loc => loc.symbol === symbol)) {
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
                                    symbolInput.value = symbol;
                                    marketSelect.value = marketType;
                                    searchDropdown.style.display = "none";
                                    
                                    // Trigger the live price fetch immediately after selecting
                                    fetchLivePrice(symbol);
                                });
                                searchDropdown.appendChild(div);
                            }
                        });
                    } else if (!hasLocalResults) {
                        searchDropdown.innerHTML = '<div class="search-item" style="color:gray;">No results found.</div>';
                    }
                } else {
                     throw new Error('Yahoo blocked the request');
                }
            } catch (error) {
                if(searchDropdown.contains(loadingDiv)) searchDropdown.removeChild(loadingDiv);
                if (!hasLocalResults) {
                    searchDropdown.innerHTML = '<div class="search-item" style="color:var(--danger); font-size: 0.85rem;">Live search unavailable. Please type manually.</div>';
                }
                console.error("Live Search Proxy Error:", error);
            }
        }, 600); 
    });

    document.addEventListener('click', (e) => {
        if (!symbolInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = "none";
        }
    });
}