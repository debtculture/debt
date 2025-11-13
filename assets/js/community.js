/* =============================================================================
   COMMUNITY PAGE LOGIC - HOF Carousel, Leaderboard, Dynamic Member Grid
   ============================================================================= */

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    } else {
        console.error('Wallet manager not loaded');
    }
    
    // Generate non-featured members dynamically
    generateNonFeaturedMembers();
    
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
   DYNAMIC MEMBER GRID GENERATION
   ============================================================================= */

/**
 * Generates non-featured member grid dynamically from community-data.js
 * Creates rows of 6 for desktop and rows of 4 for mobile
 * INCLUDES ALL 48 MEMBERS - Autopsy (index 0) appears as first bubble in grid
 */
function generateNonFeaturedMembers() {
    const wrapper = document.getElementById('hof-rows-wrapper');
    if (!wrapper || typeof members === 'undefined') {
        console.error('Members data or wrapper element not found');
        return;
    }

    // IMPORTANT: Include ALL members in the grid, starting with Autopsy at index 0
    // This creates a complete grid of 48 members (8 rows × 6 on desktop, 12 rows × 4 on mobile)
    const allMembers = members; // members[0] = Autopsy, members[1] = Catavina, etc.
    
    console.log(`Generating grid with ${allMembers.length} members. First member: ${allMembers[0]?.name}`);
    
    // Clear existing content
    wrapper.innerHTML = '';
    
    // Generate desktop rows (6 members per row = 8 rows total)
    const desktopRowSize = 6;
    const desktopRows = Math.ceil(allMembers.length / desktopRowSize);
    
    for (let i = 0; i < desktopRows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'hof-row-desktop';
        
        const startIdx = i * desktopRowSize;
        const endIdx = Math.min(startIdx + desktopRowSize, allMembers.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const memberElement = createMemberElement(allMembers[j], j);
            rowDiv.appendChild(memberElement);
        }
        
        wrapper.appendChild(rowDiv);
    }
    
    // Generate mobile rows (4 members per row = 12 rows total)
    const mobileRowSize = 4;
    const mobileRows = Math.ceil(allMembers.length / mobileRowSize);
    
    for (let i = 0; i < mobileRows; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'hof-row-mobile';
        
        const startIdx = i * mobileRowSize;
        const endIdx = Math.min(startIdx + mobileRowSize, allMembers.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const memberElement = createMemberElement(allMembers[j], j);
            rowDiv.appendChild(memberElement);
        }
        
        wrapper.appendChild(rowDiv);
    }
}

/**
 * Creates a single member element with bubble and title
 * @param {Object} member - Member data from community-data.js
 * @param {number} index - Member index (for carousel navigation)
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

let currentCommunityIndex = 0;
const totalNamedCommunityMembers = typeof members !== 'undefined' ? members.length : 48;
let communityAutoRotateInterval;

/**
 * Updates the featured trading card in the carousel
 */
function updateCommunityCarousel() {
    const featuredCard = document.querySelector('#hof-featured .trading-card');
    if (!featuredCard || typeof members === 'undefined') {
        console.error('Featured card or members data not found');
        return;
    }
    
    const memberData = members[currentCommunityIndex];
    if (!memberData) {
        console.error('Member data not found for index:', currentCommunityIndex);
        return;
    }
    
    // Update profile picture link
    const pfpLink = featuredCard.querySelector('.pfp-link');
    if (memberData.walletAddress && memberData.walletAddress !== 'WALLET_ADDRESS_HERE') {
        pfpLink.href = `profile.html?user=${memberData.walletAddress}`;
    } else {
        pfpLink.href = memberData.xLink; // Fallback to X profile if no wallet
    }
    
    // Update profile picture
    const pfpImg = featuredCard.querySelector('.card-pfp-square img');
    pfpImg.src = memberData.img;
    pfpImg.alt = `${memberData.name} profile picture`;
    
    // Update name
    featuredCard.querySelector('.hof-name').textContent = memberData.name;
    
    // Update holder since date
    featuredCard.querySelector('.ability-content').textContent = memberData.holderSince;
    
    // Update badges
    const badgesContainer = featuredCard.querySelector('.hof-badges');
    badgesContainer.innerHTML = '';
    
    if (memberData.badges && memberData.badges.length > 0) {
        memberData.badges.forEach(badge => {
            const badgeEl = document.createElement('div');
            badgeEl.className = `badge badge-${badge.type} badge-${badge.tier}`;
            badgeEl.setAttribute('title', getBadgeTitle(badge.type, badge.tier));
            badgesContainer.appendChild(badgeEl);
        });
    }
    
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
 * Gets the title/tooltip text for a badge
 * @param {string} type - Badge type
 * @param {string} tier - Badge tier
 * @returns {string} Badge title
 */
function getBadgeTitle(type, tier) {
    const badges = {
        spaces: {
            bronze: 'Orbiter: Consistently shows up to X Spaces.',
            silver: 'Cosmonaut: Regularly engages in Spaces conversations.',
            gold: 'Star Commander: Leads conversations in $DEBT Spaces.',
            amethyst: 'Supernova: Hosts $DEBT-focused X Spaces.'
        },
        burn: {
            bronze: 'Pyro: Burned 100,000+ $DEBT.',
            silver: 'Arsonist: Burned 1,000,000+ $DEBT.',
            gold: 'Inferno: Burned 10,000,000+ $DEBT.',
            amethyst: 'Ashbringer: Burned 100,000,000+ $DEBT.'
        },
        holding: {
            bronze: 'Cold Wallet: Held $DEBT for 1+ month.',
            silver: 'Iron Grip: Held $DEBT for 3+ months.',
            gold: 'Steel Reserve: Held $DEBT for 6+ months, solid stack.',
            amethyst: 'Diamond Hands: Held $DEBT for 1 year+, unshakeable holder.'
        },
        shiller: {
            single: 'Cold Blooded Shiller: Hardcore $DEBT promoter on social media.'
        },
        meme: {
            single: 'Meme Machine: Creates dank $DEBT memes.'
        },
        year1: {
            single: 'Year 1: Heavily involved in the project during its first year.'
        }
    };
    
    return badges[type]?.[tier] || 'Badge';
}

/**
 * Rotates the HOF carousel left or right
 * @param {string} direction - 'left' or 'right'
 */
function rotateHof(direction) {
    if (direction === 'right') {
        currentCommunityIndex = (currentCommunityIndex + 1) % totalNamedCommunityMembers;
    } else {
        currentCommunityIndex = (currentCommunityIndex - 1 + totalNamedCommunityMembers) % totalNamedCommunityMembers;
    }
    
    updateCommunityCarousel();
    resetCommunityAutoRotate();
}

/**
 * Resets the auto-rotate timer for the HOF carousel
 */
function resetCommunityAutoRotate() {
    clearInterval(communityAutoRotateInterval);
    communityAutoRotateInterval = setInterval(() => {
        currentCommunityIndex = (currentCommunityIndex + 1) % totalNamedCommunityMembers;
        updateCommunityCarousel();
    }, 10000); // Rotate every 10 seconds
}

/* =============================================================================
   LEADERBOARD LOGIC
   ============================================================================= */

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQteQaPjXe3IlPsj8KNtr-pY5nZO2WMSNk9jPfMGSMEdmQghWjvXiF0-7Zbi64kHza926Yyg9lhguH-/pub?output=csv';
let allData = [];

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
        
        return allData;
    } catch (error) {
        console.error('Error fetching or parsing leaderboard data:', error);
        document.getElementById('leaderboard-loading').textContent = 
            'Error loading data. Please try again later.';
        return [];
    }
}

/**
 * Calculates total scores for each user
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
        
        // Add rank class for top 3 (for colored backgrounds)
        if (rank === 1) row.classList.add('rank-1');
        else if (rank === 2) row.classList.add('rank-2');
        else if (rank === 3) row.classList.add('rank-3');
        
        // Add medal emoji to rank display
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
    } else { // 'all-time'
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
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update leaderboard with selected period
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
