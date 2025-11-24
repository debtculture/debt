/* =============================================================================
   COMMUNITY PAGE LOGIC - Automated Badge System & Dynamic Rankings
   ============================================================================= */

// --- GLOBAL VARIABLES ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQteQaPjXe3IlPsj8KNtr-pY5nZO2WMSNk9jPfMGSMEdmQghWjvXiF0-7Zbi64kHza926Yyg9lhguH-/pub?output=csv';
let allData = [];
let memberStats = {}; // Stores calculated stats for each member
let sortedMembers = []; // Members sorted by total points
let currentCommunityIndex = 0;
let communityAutoRotateInterval;

/* =============================================================================
   INITIALIZATION
   ============================================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    } else {
        console.error('Wallet manager not loaded');
    }
    
    // Fetch and calculate all leaderboard data
    await fetchLeaderboardData();
    calculateMemberStats();
    
    // Sort members by total points (highest first)
    sortMembersByPoints();
    
    // Generate member grid with sorted members
    generateNonFeaturedMembers();
    
    // Initialize Hall of Fame Carousel
    updateCommunityCarousel();
    resetCommunityAutoRotate();
    
    // Initialize Leaderboard
    setupTabListeners();
    updateLeaderboard('monthly');
    
    // Add click listeners to all HOF member bubbles
    document.querySelectorAll('.hof-member').forEach(memberEl => {
        memberEl.addEventListener('click', () => {
            currentCommunityIndex = parseInt(memberEl.dataset.index);
            updateCommunityCarousel();
            resetCommunityAutoRotate();
            
            // Scroll to featured card on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.hof-carousel').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });
    });
});

/* =============================================================================
   LEADERBOARD DATA FETCHING & PROCESSING
   ============================================================================= */

/**
 * Fetches leaderboard data from Google Sheets CSV
 * @returns {Promise<Array>} Array of leaderboard records
 */
async function fetchLeaderboardData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        if (csvText.includes('<title>Google Sheets</title>')) {
            throw new Error('Failed to fetch data. Please ensure your Google Sheet is published to the web as a CSV.');
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
        }).filter(row => 
            row.username && 
            !isNaN(row.points) && 
            row.date instanceof Date && 
            !isNaN(row.date)
        );
        
        console.log(`Fetched ${allData.length} leaderboard records`);
        return allData;
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        document.getElementById('leaderboard-loading').textContent = 
            'Error loading data. Please try again later.';
        return [];
    }
}

/**
 * Calculates comprehensive stats for each member based on leaderboard data
 * Stores results in memberStats object
 */
function calculateMemberStats() {
    memberStats = {};
    
    // Calculate all-time points and event participation
    members.forEach(member => {
        const memberData = allData.filter(d => d.username === member.name);
        const totalPoints = memberData.reduce((sum, d) => sum + d.points, 0);
        const eventCount = memberData.length;
        
        memberStats[member.name] = {
            totalPoints,
            eventCount,
            allTimeRank: 0, // Will be calculated after sorting
            monthlyRank: 0, // Will be calculated per month
            monthlyWins: [], // Array of {month, year, place}
            badges: []
        };
    });
    
    // Calculate all-time rankings
    const sortedByPoints = Object.entries(memberStats)
        .sort(([, a], [, b]) => b.totalPoints - a.totalPoints);
    
    sortedByPoints.forEach(([name, stats], index) => {
        memberStats[name].allTimeRank = index + 1;
    });
    
    // Calculate monthly winners and current monthly rank
    calculateMonthlyWinners();
    calculateCurrentMonthlyRanks();
    
    // Assign badges based on stats
    assignBadges();
    
    console.log('Member stats calculated:', memberStats);
}

/**
 * Detects monthly 1st/2nd/3rd place finishes for each member
 * Stores results in memberStats[name].monthlyWins
 */
function calculateMonthlyWinners() {
    // Group data by month/year
    const monthlyData = {};
    
    allData.forEach(record => {
        const monthKey = `${record.date.getFullYear()}-${record.date.getMonth()}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(record);
    });
    
    // For each month, calculate top 3
    Object.entries(monthlyData).forEach(([monthKey, records]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
        
        // Calculate monthly scores
        const monthlyScores = {};
        records.forEach(record => {
            monthlyScores[record.username] = (monthlyScores[record.username] || 0) + record.points;
        });
        
        // Sort by points
        const sorted = Object.entries(monthlyScores)
            .sort(([, a], [, b]) => b - a);
        
        // Assign 1st/2nd/3rd place
        sorted.slice(0, 3).forEach(([username, points], index) => {
            const place = index + 1;
            if (memberStats[username]) {
                memberStats[username].monthlyWins.push({
                    month: monthName,
                    year,
                    place
                });
            }
        });
    });
}

/**
 * Calculates current month rankings for all members
 */
function calculateCurrentMonthlyRanks() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter data to current month
    const currentMonthData = allData.filter(d =>
        d.date.getFullYear() === currentYear &&
        d.date.getMonth() === currentMonth
    );
    
    // Calculate monthly scores
    const monthlyScores = {};
    currentMonthData.forEach(record => {
        monthlyScores[record.username] = (monthlyScores[record.username] || 0) + record.points;
    });
    
    // Sort and assign ranks
    const sorted = Object.entries(monthlyScores)
        .sort(([, a], [, b]) => b - a);
    
    sorted.forEach(([username, points], index) => {
        if (memberStats[username]) {
            memberStats[username].monthlyRank = index + 1;
        }
    });
    
    // Members with no points this month get no rank displayed
    members.forEach(member => {
        if (!monthlyScores[member.name]) {
            memberStats[member.name].monthlyRank = null;
        }
    });
}

/**
 * Assigns badges to members based on their stats
 * Badge types:
 * - Monthly Winners (1st/2nd/3rd place badges with month tooltips)
 * - Milestones (50, 100, 250, 500, 1000 points)
 * - Profile Pioneer (has wallet address)
 * - Consistent Contributor (10+ events)
 * - Core Contributor (manually assigned)
 */
function assignBadges() {
    members.forEach(member => {
        const stats = memberStats[member.name];
        const badges = [];
        
        // 1. Monthly Winner Badges
        if (stats.monthlyWins.length > 0) {
            // Group wins by place
            const firstPlaces = stats.monthlyWins.filter(w => w.place === 1);
            const secondPlaces = stats.monthlyWins.filter(w => w.place === 2);
            const thirdPlaces = stats.monthlyWins.filter(w => w.place === 3);
            
            if (firstPlaces.length > 0) {
                badges.push({
                    type: 'monthly-first',
                    count: firstPlaces.length,
                    months: firstPlaces
                });
            }
            if (secondPlaces.length > 0) {
                badges.push({
                    type: 'monthly-second',
                    count: secondPlaces.length,
                    months: secondPlaces
                });
            }
            if (thirdPlaces.length > 0) {
                badges.push({
                    type: 'monthly-third',
                    count: thirdPlaces.length,
                    months: thirdPlaces
                });
            }
        }
        
        // 2. Milestone Badges (highest one only)
        if (stats.totalPoints >= 1000) {
            badges.push({ type: 'milestone-1000' });
        } else if (stats.totalPoints >= 500) {
            badges.push({ type: 'milestone-500' });
        } else if (stats.totalPoints >= 250) {
            badges.push({ type: 'milestone-250' });
        } else if (stats.totalPoints >= 100) {
            badges.push({ type: 'milestone-100' });
        } else if (stats.totalPoints >= 50) {
            badges.push({ type: 'milestone-50' });
        }
        
        // 3. Special Badges
        if (member.walletAddress !== 'WALLET_ADDRESS_HERE') {
            badges.push({ type: 'profile-pioneer' });
        }
        
        if (stats.eventCount >= 10) {
            badges.push({ type: 'consistent-contributor' });
        }
        
        if (member.coreContributor === true) {
            badges.push({ type: 'core-contributor' });
        }
        
        stats.badges = badges;
    });
}

/**
 * Gets the dynamic level based on total points
 * @param {number} points - Total all-time points
 * @returns {string} Level name
 */
function getLevel(points) {
    if (points >= 500) return 'Legend';
    if (points >= 200) return 'Champion';
    if (points >= 100) return 'Elite';
    if (points >= 50) return 'Rising Star';
    return 'Member';
}

/**
 * Sorts members by total points (highest first)
 * Updates the sortedMembers array
 */
function sortMembersByPoints() {
    sortedMembers = [...members].sort((a, b) => {
        const aPoints = memberStats[a.name]?.totalPoints || 0;
        const bPoints = memberStats[b.name]?.totalPoints || 0;
        return bPoints - aPoints;
    });
    
    console.log('Members sorted by points. Top 5:', 
        sortedMembers.slice(0, 5).map(m => `${m.name}: ${memberStats[m.name]?.totalPoints || 0}pts`)
    );
}

/* =============================================================================
   DYNAMIC MEMBER GRID GENERATION
   ============================================================================= */

/**
 * Generates non-featured member grid dynamically from sorted members array
 * Creates rows of 6 for desktop and rows of 4 for mobile
 */
function generateNonFeaturedMembers() {
    const wrapper = document.getElementById('hof-rows-wrapper');
    if (!wrapper) {
        console.error('Wrapper element not found');
        return;
    }
    
    // Clear existing content
    wrapper.innerHTML = '';
    
    // Generate desktop rows (6 members per row)
    const desktopRowSize = 6;
    const desktopRows = Math.ceil(sortedMembers.length / desktopRowSize);
    
    for (let i = 0; i < desktopRows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'hof-row-desktop';
        
        const startIdx = i * desktopRowSize;
        const endIdx = Math.min(startIdx + desktopRowSize, sortedMembers.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const memberElement = createMemberElement(sortedMembers[j], j);
            rowDiv.appendChild(memberElement);
        }
        
        wrapper.appendChild(rowDiv);
    }
    
    // Generate mobile rows (4 members per row)
    const mobileRowSize = 4;
    const mobileRows = Math.ceil(sortedMembers.length / mobileRowSize);
    
    for (let i = 0; i < mobileRows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'hof-row-mobile';
        
        const startIdx = i * mobileRowSize;
        const endIdx = Math.min(startIdx + mobileRowSize, sortedMembers.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const memberElement = createMemberElement(sortedMembers[j], j);
            rowDiv.appendChild(memberElement);
        }
        
        wrapper.appendChild(rowDiv);
    }
}

/**
 * Creates a single member element with bubble and title
 * @param {Object} member - Member data
 * @param {number} index - Member index in sorted array
 * @returns {HTMLElement} Member element
 */
function createMemberElement(member, index) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'hof-member';
    memberDiv.dataset.index = index;
    memberDiv.dataset.xLink = member.xLink;
    
    memberDiv.innerHTML = `
        <div class="hof-bubble">
            <div class="hof-inner-bubble">
                <img src="${member.img}" 
                     alt="${member.name} profile picture" 
                     width="100" 
                     height="100" 
                     loading="lazy">
            </div>
        </div>
        <div class="hof-title">${member.name}</div>
    `;
    
    return memberDiv;
}

/* =============================================================================
   HALL OF FAME CAROUSEL LOGIC
   ============================================================================= */

/**
 * Updates the featured trading card in the carousel
 */
function updateCommunityCarousel() {
    const featuredCard = document.querySelector('#hof-featured .trading-card');
    if (!featuredCard) {
        console.error('Featured card not found');
        return;
    }
    
    const memberData = sortedMembers[currentCommunityIndex];
    if (!memberData) {
        console.error('Member data not found for index:', currentCommunityIndex);
        return;
    }
    
    const stats = memberStats[memberData.name];
    
    // Update profile picture link
    const pfpLink = featuredCard.querySelector('.pfp-link');
    if (memberData.walletAddress && memberData.walletAddress !== 'WALLET_ADDRESS_HERE') {
        pfpLink.href = `profile.html?user=${memberData.walletAddress}`;
    } else {
        pfpLink.href = memberData.xLink;
    }
    
    // Update profile picture
    const pfpImg = featuredCard.querySelector('.card-pfp-square img');
    pfpImg.src = memberData.img;
    pfpImg.alt = `${memberData.name} profile picture`;
    
    // Update level badge
    const levelBadge = featuredCard.querySelector('.card-level');
    levelBadge.textContent = getLevel(stats.totalPoints);
    
    // Update name
    featuredCard.querySelector('.hof-name').textContent = memberData.name;
    
    // Update badges
    const badgesContainer = featuredCard.querySelector('.hof-badges');
    badgesContainer.innerHTML = '';
    
    if (stats.badges && stats.badges.length > 0) {
        stats.badges.forEach(badge => {
            const badgeEl = createBadgeElement(badge);
            badgesContainer.appendChild(badgeEl);
        });
    }
    
    // Update stats section (replaces "Holder Since")
    const statsSection = featuredCard.querySelector('.special-ability');
    statsSection.innerHTML = `
        <p class="ability-title">Total Points: <span class="ability-content" style="display: inline;">${stats.totalPoints}</span></p>
        <p class="ability-title" style="margin-top: 8px;">All-Time Rank: <span class="ability-content" style="display: inline;">#${stats.allTimeRank}</span></p>
        <p class="ability-title" style="margin-top: 8px;">Monthly Rank: <span class="ability-content" style="display: inline;">${stats.monthlyRank ? '#' + stats.monthlyRank : 'N/A'}</span></p>
    `;
    
    // Update active state on member bubbles
    document.querySelectorAll('.hof-member .hof-bubble').forEach(bubble => {
        bubble.classList.remove('active-member');
    });
    
    const activeMemberElements = document.querySelectorAll(
        `.hof-member[data-index="${currentCommunityIndex}"] .hof-bubble`
    );
    activeMemberElements.forEach(el => el.classList.add('active-member'));
}

/**
 * Creates a badge element with proper styling and tooltip
 * @param {Object} badge - Badge data
 * @returns {HTMLElement} Badge element
 */
function createBadgeElement(badge) {
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge badge-${badge.type}`;
    
    // Set tooltip based on badge type
    let tooltip = '';
    
    if (badge.type === 'monthly-first') {
        const monthList = badge.months.map(m => `${m.month} ${m.year}`).join(', ');
        tooltip = `1st Place: ${monthList}`;
        if (badge.count > 1) badgeEl.classList.add('multi-badge');
    } else if (badge.type === 'monthly-second') {
        const monthList = badge.months.map(m => `${m.month} ${m.year}`).join(', ');
        tooltip = `2nd Place: ${monthList}`;
        if (badge.count > 1) badgeEl.classList.add('multi-badge');
    } else if (badge.type === 'monthly-third') {
        const monthList = badge.months.map(m => `${m.month} ${m.year}`).join(', ');
        tooltip = `3rd Place: ${monthList}`;
        if (badge.count > 1) badgeEl.classList.add('multi-badge');
    } else if (badge.type.startsWith('milestone-')) {
        const points = badge.type.split('-')[1];
        tooltip = `Milestone: ${points}+ Points`;
    } else if (badge.type === 'profile-pioneer') {
        tooltip = 'Profile Pioneer: Created a profile on the site';
    } else if (badge.type === 'consistent-contributor') {
        tooltip = 'Consistent Contributor: Participated in 10+ events';
    } else if (badge.type === 'core-contributor') {
        tooltip = 'Core Contributor: Special recognition for exceptional commitment';
    }
    
    badgeEl.setAttribute('title', tooltip);
    
    // Add count indicator for multiple monthly wins
    if (badge.count && badge.count > 1) {
        const countEl = document.createElement('span');
        countEl.className = 'badge-count';
        countEl.textContent = badge.count;
        badgeEl.appendChild(countEl);
    }
    
    return badgeEl;
}

/**
 * Rotates the carousel left or right
 * @param {string} direction - 'left' or 'right'
 */
function rotateHof(direction) {
    const totalMembers = sortedMembers.length;
    
    if (direction === 'left') {
        currentCommunityIndex = (currentCommunityIndex - 1 + totalMembers) % totalMembers;
    } else {
        currentCommunityIndex = (currentCommunityIndex + 1) % totalMembers;
    }
    
    updateCommunityCarousel();
    resetCommunityAutoRotate();
}

/**
 * Auto-rotates the carousel every 5 seconds
 */
function resetCommunityAutoRotate() {
    clearInterval(communityAutoRotateInterval);
    
    communityAutoRotateInterval = setInterval(() => {
        rotateHof('right');
    }, 5000);
}

/* =============================================================================
   LEADERBOARD DISPLAY LOGIC
   ============================================================================= */

/**
 * Calculates total scores for each user from filtered data
 * @param {Array} data - Array of leaderboard records
 * @returns {Array} Array of {username, points} sorted by points descending
 */
function calculateScores(data) {
    const scores = data.reduce((acc, record) => {
        acc[record.username] = (acc[record.username] || 0) + record.points;
        return acc;
    }, {});
    
    return Object.entries(scores)
        .map(([username, points]) => ({ username, points }))
        .sort((a, b) => b.points - a.points);
}

/**
 * Renders the leaderboard table with calculated scores
 * @param {Array} scores - Array of {username, points}
 */
function renderLeaderboard(scores) {
    const tbody = document.getElementById('leaderboard-body');
    const loadingEl = document.getElementById('leaderboard-loading');
    
    tbody.innerHTML = '';
    
    if (scores.length === 0) {
        loadingEl.textContent = 'No data available for this period. The rebellion is just beginning.';
        loadingEl.style.display = 'block';
        return;
    }
    
    loadingEl.style.display = 'none';
    
    scores.forEach((score, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
        
        if (rank === 1) row.classList.add('rank-1');
        else if (rank === 2) row.classList.add('rank-2');
        else if (rank === 3) row.classList.add('rank-3');
        
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

/**
 * Updates the leaderboard for a specific time period
 * @param {string} period - 'monthly', 'yearly', or 'all-time'
 */
async function updateLeaderboard(period) {
    document.getElementById('leaderboard-loading').textContent = 'Calculating...';
    document.getElementById('leaderboard-loading').style.display = 'block';
    document.getElementById('leaderboard-body').innerHTML = '';
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let filteredData = [];
    
    if (period === 'monthly') {
        filteredData = allData.filter(d =>
            d.date.getFullYear() === currentYear &&
            d.date.getMonth() === currentMonth
        );
    } else if (period === 'yearly') {
        filteredData = allData.filter(d =>
            d.date.getFullYear() === currentYear
        );
    } else {
        filteredData = allData;
    }
    
    const scores = calculateScores(filteredData);
    renderLeaderboard(scores);
}

/**
 * Sets up event listeners for leaderboard tab buttons
 */
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

/* =============================================================================
   GLOSSARY TOGGLE FUNCTIONS
   ============================================================================= */

/**
 * Toggles the leaderboard "How It Works" glossary
 */
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

/**
 * Toggles the Badge Glossary
 */
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

/* =============================================================================
   MOBILE MENU FUNCTIONS
   ============================================================================= */

/**
 * Toggles the mobile navigation menu
 */
window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    const isOpen = menu.style.display === 'block';
    
    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

/**
 * Closes the mobile navigation menu
 */
window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', false);
};
