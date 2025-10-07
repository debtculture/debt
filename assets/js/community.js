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
const totalNamedCommunityMembers = 36;
let communityAutoRotateInterval;

// IMPORTANT: You will need to replace 'WALLET_ADDRESS_HERE' with the actual wallet addresses for each member.
const members = [
    { name: 'Autopsy', walletAddress: '5aRXLjG3G4dxUu3oVXKQyk9u9b8qfSjLKFwLEbQyWcto', holderSince: '07/21/2024', xLink: 'https://x.com/AutopsyT2', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758110923/rKUcuWaF_400x400_d3fqvc.jpg', badges: [{ type: 'spaces', tier: 'amethyst' }, { type: 'burn', tier: 'gold' }, { type: 'holding', tier: 'gold' }, { type: 'shiller', tier: 'single' }, { type: 'meme', tier: 'single' }] },
    { name: 'Catavina', walletAddress: '67AmN618UrkHE3QAL1FPr2HAW1ubaeeLFf2bf4xhxtia', holderSince: '11/17/2024', xLink: 'https://x.com/catavina17', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/catavina_dfcvoe.jpg', badges: [{ type: 'spaces', tier: 'amethyst' }, { type: 'holding', tier: 'gold' }, { type: 'shiller', tier: 'single' }, { type: 'meme', tier: 'single' }] },
    { name: 'Lou', walletAddress: '46aaAd2EmhUegQJhn4eouCVnyEp1V3N7bWbZCYkutXZK', holderSince: '01/10/2025', xLink: 'https://x.com/louisedbegin', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Lou2_kxasor.jpg', badges: [{ type: 'spaces', tier: 'amethyst' }, { type: 'holding', tier: 'silver' }, { type: 'shiller', tier: 'single' }] },
    { name: 'Tormund', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '11/17/2024', xLink: 'https://x.com/Tormund_17', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Tormund_pj4hwd.jpg', badges: [{ type: 'holding', tier: 'gold' }, { type: 'spaces', tier: 'silver' }, { type: 'shiller', tier: 'single' }, { type: 'meme', tier: 'single' }] },
    { name: 'JPEG', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '07/22/2024', xLink: 'https://x.com/jpegfein', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755034794/JPEG_rte1vj.jpg', badges: [{ type: 'spaces', tier: 'gold' }, { type: 'holding', tier: 'gold' }, { type: 'shiller', tier: 'single' }, { type: 'meme', tier: 'single' }] },
    { name: 'blu', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '02/14/2025', xLink: 'https://x.com/blu_chek', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/blu_fko02p.jpg', badges: [{ type: 'holding', tier: 'silver' }, { type: 'spaces', tier: 'silver' }, { type: 'shiller', tier: 'single' }] },
    { name: 'Drinks', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '05/18/2025', xLink: 'https://x.com/drinkonsaturday', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906211/Drinks_tibhzd.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Renee', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '02/11/2025', xLink: 'https://x.com/ReneeBush96829', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747850503/Renee_eekhuh.jpg', badges: [{ type: 'holding', tier: 'silver' }, { type: 'spaces', tier: 'bronze' }, { type: 'shiller', tier: 'single' }] },
    { name: 'Ambient', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '05/23/2025', xLink: 'https://x.com/AmbientSound', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906930/Ambient_jztyfi.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Tom', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '02/04/2025', xLink: 'https://x.com/deadend_king', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111318/tom_firsei.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'shiller', tier: 'single' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Lunicking', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '11/17/2024', xLink: 'https://x.com/Lunicking178677', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Lunic_k1ndzn.jpg', badges: [{ type: 'holding', tier: 'gold' }, { type: 'spaces', tier: 'bronze' }, { type: 'shiller', tier: 'single' }, { type: 'meme', tier: 'single' }] },
    { name: 'Cory B', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '05/30/2025', xLink: 'https://x.com/coryb410', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Cory_qntp8y.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Dan', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '05/30/2025', xLink: 'https://x.com/DanVibes10', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Dan_uu4sey.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'DK', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/PgHYinzer86', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111442/dk_aqpdct.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Cody', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/CodyMarmaduke', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747646/Cody_ab60wn.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Rankin', walletAddress: '7PEo1vTv9aUAwBgVBKStYTE1NqVpJkb96MddEaN1akJ1', holderSince: '06/27/2025', xLink: 'https://x.com/rankin56696', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111531/rankin_mnn26k.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Scrappy', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '08/29/2025', xLink: 'https://x.com/bigsoup6_7', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/scrappy2_ihsso6.jpg', badges: [{ type: 'holding', tier: 'silver' }, { type: 'spaces', tier: 'silver' }] },
    { name: 'Mia', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/GirlMia9079', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1754610304/KNg3MAIS_400x400_tmabka.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Elvis', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/ElpatronSFC', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752608182/Elvis_yrnpxh.png', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Bstr', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/Bstr___', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752608094/bstr_knv2eq.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'George', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '03/19/2025', xLink: 'https://x.com/GeorgeCdr28874', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747417142/George_q1e0c2.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Dog', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/Dog66515910', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Dog2_sb9l5v.jpg', badges: [{ type: 'holding', tier: 'bronze' }, { type: 'shiller', tier: 'single' }] },
    { name: 'Marilyn', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/Marilyn_Moanroe', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Marilyn2_gzdbq2.jpg', badges: [{ type: 'holding', tier: 'bronze' }, { type: 'shiller', tier: 'single' }] },
    { name: 'ZOMBi', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/HauskenHelge', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/ZOMBi_obepxi.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Cyanide', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/ipoopcrypto', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111719/cy_sxrobe.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Demitrieus', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/RecklesUnicorn', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758748132/Demetrius_knntdo.jpg', badges: [{ type: 'holding', tier: 'bronze' }] },
    { name: 'Ugo', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '08/27/2025', xLink: 'https://x.com/0x_Ugo', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747924/Ugo_flbfsw.jpg', badges: [{ type: 'holding', tier: 'gold' }] },
    { name: 'Coinbud', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/madgamer1979', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Coinbud_uwjumu.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Momma Blu', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '02/14/2025', xLink: 'https://x.com/AngelaPatt86456', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111841/momma_tvdmop.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Thurston', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/ThurstonWaffles', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032869/Thurston_n6zd2i.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Michael', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/p_r_o_m_o__', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111977/promo_jea2uu.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Gnomie', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '08/29/2025', xLink: 'https://x.com/medraresteaker', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758112105/gnomie_epet05.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'AJ', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/blaze_mb21', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032499/AJ_s3hfjk.png', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'George Eager', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: '03/16/2025', xLink: 'https://x.com/edition1', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032568/George_Eager_ckxq9y.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Denzel', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/0xDnxl', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032699/Denzel_bmt4td.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] },
    { name: 'Tree', walletAddress: 'WALLET_ADDRESS_HERE', holderSince: 'TBD', xLink: 'https://x.com/TheresaWeik', img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032771/Tree_bggo4f.jpg', badges: [{ type: 'spaces', tier: 'silver' }, { type: 'holding', tier: 'bronze' }] }
];

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
