// This script contains logic specific to the community page.
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Hall of Fame Carousel
    updateCommunityCarousel();
    resetCommunityAutoRotate();
    // Initialize Leaderboard
    setupTabListeners();
    await fetchLeaderboardData();
    updateLeaderboard('monthly'); // Load monthly data by default
    // Add click listeners to all HOF member bubbles
    document.querySelectorAll('.hof-member').forEach(memberEl => {
        memberEl.addEventListener('click', () => {
            currentCommunityIndex = parseInt(memberEl.dataset.index);
            updateCommunityCarousel();
            resetCommunityAutoRotate();
            if (window.innerWidth <= 768) {
                document.querySelector('.hof-carousel').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
});
// --- LEADERBOARD LOGIC ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQteQaPjXe3IlPsj8KNtr-pY5nZO2WMSNk9jPfMGSMEdmQghWjvXiF0-7Zbi64kHza926Yyg9lhguH-/pub?output=csv';
let allData = [];
async function fetchLeaderboardData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        if (csvText.includes('<title>Google Sheets</title>')) {
            throw new Error("Failed to fetch data. Please ensure your Google Sheet is published to the web as a CSV.");
        }
        const rows = csvText.split('\n').slice(1); // Skip header row
       
        allData = rows.map(row => {
            const [username, event, points, date] = row.split(',').map(s => s.trim());
            return {
                username,
                event,
                points: parseInt(points, 10),
                date: new Date(date)
            };
        }).filter(row => row.username && !isNaN(row.points) && row.date instanceof Date && !isNaN(row.date));
       
        return allData;
    } catch (error) {
        console.error("Error fetching or parsing leaderboard data:", error);
        document.getElementById('leaderboard-loading').textContent = 'Error loading data. Please try again later.';
        return [];
    }
}
function calculateScores(data) {
    const scores = data.reduce((acc, record) => {
        acc[record.username] = (acc[record.username] || 0) + record.points;
        return acc;
    }, {});
    return Object.entries(scores)
        .map(([username, points]) => ({ username, points }))
        .sort((a, b) => b.points - a.points);
}
function renderLeaderboard(scores) {
    const tbody = document.getElementById('leaderboard-body');
    const loadingEl = document.getElementById('leaderboard-loading');
   
    tbody.innerHTML = ''; // Clear existing rows
    if (scores.length === 0) {
        loadingEl.textContent = 'No data available for this period. The rebellion is just beginning.';
        loadingEl.style.display = 'block';
        return;
    }
    loadingEl.style.display = 'none';
    scores.forEach((score, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
       
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        if(rankClass) row.classList.add(rankClass);
        let rankContent = rank;
        if (rank === 1) rankContent = '🥇 ' + rank;
        else if (rank === 2) rankContent = '🥈 ' + rank;
        else if (rank === 3) rankContent = '🥉 ' + rank;
        row.innerHTML = `
            <td class="rank-cell">${rankContent}</td>
            <td class="user-cell">${score.username}</td>
            <td class="points-cell">${score.points}</td>
        `;
        tbody.appendChild(row);
    });
}
async function updateLeaderboard(period) {
    document.getElementById('leaderboard-loading').textContent = 'Calculating...';
    document.getElementById('leaderboard-loading').style.display = 'block';
    document.getElementById('leaderboard-body').innerHTML = '';
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let filteredData = [];
    if (period === 'monthly') {
        filteredData = allData.filter(d => d.date.getFullYear() === currentYear && d.date.getMonth() === currentMonth);
    } else if (period === 'yearly') {
        filteredData = allData.filter(d => d.date.getFullYear() === currentYear);
    } else { // 'all-time'
        filteredData = allData;
    }
   
    const scores = calculateScores(filteredData);
    renderLeaderboard(scores);
}
function setupTabListeners() {
    const tabs = document.querySelectorAll('.leaderboard-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateLeaderboard(tab.dataset.period);
        });
    });
}
// --- HALL OF FAME LOGIC ---
let currentCommunityIndex = 0;
const totalNamedCommunityMembers = 48;
let communityAutoRotateInterval;
function updateCommunityCarousel() {
    const featuredCard = document.querySelector('#hof-featured .trading-card');
    const memberData = members[currentCommunityIndex];
   
    // --- THIS IS THE MODIFIED LINE ---
    // It now links to the profile page using the member's wallet address.
    const pfpLink = featuredCard.querySelector('.pfp-link');
    if (memberData.walletAddress && memberData.walletAddress !== 'WALLET_ADDRESS_HERE') {
        pfpLink.href = `profile.html?user=${memberData.walletAddress}`;
    } else {
        pfpLink.href = memberData.xLink; // Fallback to X profile if no wallet is set
    }
   
    featuredCard.querySelector('.card-pfp-square img').src = memberData.img;
    featuredCard.querySelector('.card-pfp-square img').alt = `${memberData.name} profile picture`;
    featuredCard.querySelector('.hof-name').textContent = memberData.name;
    featuredCard.querySelector('.ability-content').textContent = memberData.holderSince;
    const badgesContainer = featuredCard.querySelector('.hof-badges');
    badgesContainer.innerHTML = '';
    if (memberData.badges && memberData.badges.length > 0) {
        memberData.badges.forEach(badge => {
            const badgeEl = document.createElement('div');
            badgeEl.className = `badge badge-${badge.type} badge-${badge.tier}`;
            badgesContainer.appendChild(badgeEl);
        });
    }
    document.querySelectorAll('.hof-member .hof-bubble').forEach(bubble => {
        bubble.classList.remove('active-member');
    });
    const activeMemberElements = document.querySelectorAll(`.hof-member[data-index="${currentCommunityIndex}"] .hof-bubble`);
    activeMemberElements.forEach(el => el.classList.add('active-member'));
}
function rotateHof(direction) {
    if (direction === 'right') { currentCommunityIndex = (currentCommunityIndex + 1) % totalNamedCommunityMembers; }
    else { currentCommunityIndex = (currentCommunityIndex - 1 + totalNamedCommunityMembers) % totalNamedCommunityMembers; }
    updateCommunityCarousel();
    resetCommunityAutoRotate();
}
function resetCommunityAutoRotate() {
    clearInterval(communityAutoRotateInterval);
    communityAutoRotateInterval = setInterval(() => {
        currentCommunityIndex = (currentCommunityIndex + 1) % totalNamedCommunityMembers;
        updateCommunityCarousel();
    }, 10000);
}
function toggleLeaderboardGlossary() {
    const content = document.getElementById('leaderboardGlossary');
    const header = content.previousElementSibling;
    const isActive = content.classList.toggle('active');
    header.classList.toggle('active', isActive);
    header.setAttribute('aria-expanded', isActive);
    if (isActive) {
        content.style.maxHeight = content.scrollHeight + 50 + 'px';
        content.style.padding = '25px';
    } else {
        content.style.maxHeight = '0';
        content.style.padding = '0 25px';
    }
}
function toggleBadgeGlossary() {
    const content = document.getElementById('badgeGlossary');
    const header = content.previousElementSibling;
    const isActive = content.classList.toggle('active');
    header.classList.toggle('active', isActive);
    header.setAttribute('aria-expanded', isActive);
    if (isActive) {
        content.style.maxHeight = content.scrollHeight + 30 + 'px';
        content.style.padding = '15px';
    } else {
        content.style.maxHeight = '0';
        content.style.padding = '0 15px';
    }
}
// --- Mobile Menu Toggle Functions ---
    window.toggleMenu = function() {
        const menu = document.getElementById("mobileMenu");
        const hamburger = document.querySelector(".hamburger");
        const isOpen = menu.style.display === "block";
        menu.style.display = isOpen ? "none" : "block";
        hamburger.classList.toggle("active", !isOpen);
    }
    window.closeMenu = function() {
        const menu = document.getElementById("mobileMenu");
        const hamburger = document.querySelector(".hamburger");
        menu.style.display = "none";
        hamburger.classList.remove("active");
    }
