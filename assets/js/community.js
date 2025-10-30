/* =============================================================================
   COMMUNITY PAGE - Hall of Fame and Leaderboard functionality
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const COMMUNITY_CONFIG = {
    sheet: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQteQaPjXe3IlPsj8KNtr-pY5nZO2WMSNk9jPfMGSMEdmQghWjvXiF0-7Zbi64kHza926Yyg9lhguH-/pub?output=csv'
    },
    carousel: {
        totalMembers: 48,
        autoRotateInterval: 10000 // 10 seconds
    }
};

// =================================================================================
// --- GLOBAL STATE ---
// =================================================================================

let currentCommunityIndex = 0;
let communityAutoRotateInterval = null;
let allLeaderboardData = [];

// =================================================================================
// --- MAIN INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeCommunityPage();
});

/**
 * Initializes all community page components
 */
async function initializeCommunityPage() {
    try {
        // Initialize Hall of Fame Carousel
        updateCommunityCarousel();
        resetCommunityAutoRotate();

        // Add click listeners to all HOF member bubbles
        setupMemberClickListeners();

        // Initialize Leaderboard
        setupLeaderboardTabListeners();
        await fetchLeaderboardData();
        updateLeaderboard('monthly'); // Load monthly data by default

    } catch (error) {
        console.error('Error initializing community page:', error);
    }
}

// =================================================================================
// --- HALL OF FAME CAROUSEL ---
// =================================================================================

/**
 * Sets up click listeners for all HOF member bubbles
 */
function setupMemberClickListeners() {
    document.querySelectorAll('.hof-member').forEach(memberEl => {
        memberEl.addEventListener('click', () => {
            currentCommunityIndex = parseInt(memberEl.dataset.index);
            updateCommunityCarousel();
            resetCommunityAutoRotate();

            // Scroll to carousel on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.hof-carousel').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });
    });
}

/**
 * Updates the featured member card in the carousel
 */
function updateCommunityCarousel() {
    const featuredCard = document.querySelector('#hof-featured .trading-card');
    if (!featuredCard) {
        console.error('Featured card element not found');
        return;
    }

    const memberData = members[currentCommunityIndex];
    if (!memberData) {
        console.error(`Member data not found for index ${currentCommunityIndex}`);
        return;
    }

    // Update profile picture link
    const pfpLink = featuredCard.querySelector('.pfp-link');
    if (pfpLink) {
        // Link to profile page if wallet address is available, otherwise X profile
        if (memberData.walletAddress && memberData.walletAddress !== 'WALLET_ADDRESS_HERE') {
            pfpLink.href = `profile.html?user=${memberData.walletAddress}`;
        } else {
            pfpLink.href = memberData.xLink;
        }
    }

    // Update profile picture
    const pfpImg = featuredCard.querySelector('.card-pfp-square img');
    if (pfpImg) {
        pfpImg.src = memberData.img;
        pfpImg.alt = `${memberData.name} profile picture`;
    }

    // Update member name
    const nameEl = featuredCard.querySelector('.hof-name');
    if (nameEl) {
        nameEl.textContent = memberData.name;
    }

    // Update holder since date
    const abilityContent = featuredCard.querySelector('.ability-content');
    if (abilityContent) {
        abilityContent.textContent = memberData.holderSince;
    }

    // Update badges
    const badgesContainer = featuredCard.querySelector('.hof-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        
        if (memberData.badges && memberData.badges.length > 0) {
            memberData.badges.forEach(badge => {
                const badgeEl = document.createElement('div');
                badgeEl.className = `badge badge-${badge.type} badge-${badge.tier}`;
                badgesContainer.appendChild(badgeEl);
            });
        }
    }

    // Update active member highlighting
    updateActiveMemberHighlight();
}

/**
 * Updates the active member highlighting in the grid
 */
function updateActiveMemberHighlight() {
    // Remove active class from all bubbles
    document.querySelectorAll('.hof-member .hof-bubble').forEach(bubble => {
        bubble.classList.remove('active-member');
    });

    // Add active class to current member
    const activeMemberElements = document.querySelectorAll(
        `.hof-member[data-index="${currentCommunityIndex}"] .hof-bubble`
    );
    activeMemberElements.forEach(el => el.classList.add('active-member'));
}

/**
 * Rotates to the next or previous HOF member
 * @param {string} direction - 'left' or 'right'
 */
function rotateHof(direction) {
    const { totalMembers } = COMMUNITY_CONFIG.carousel;

    if (direction === 'right') {
        currentCommunityIndex = (currentCommunityIndex + 1) % totalMembers;
    } else {
        currentCommunityIndex = (currentCommunityIndex - 1 + totalMembers) % totalMembers;
    }

    updateCommunityCarousel();
    resetCommunityAutoRotate();
}

/**
 * Resets the auto-rotation interval for the carousel
 */
function resetCommunityAutoRotate() {
    clearInterval(communityAutoRotateInterval);

    communityAutoRotateInterval = setInterval(() => {
        const { totalMembers } = COMMUNITY_CONFIG.carousel;
        currentCommunityIndex = (currentCommunityIndex + 1) % totalMembers;
        updateCommunityCarousel();
    }, COMMUNITY_CONFIG.carousel.autoRotateInterval);
}

// =================================================================================
// --- LEADERBOARD DATA FETCHING ---
// =================================================================================

/**
 * Fetches leaderboard data from Google Sheets
 * @returns {Promise<Array>} Array of leaderboard records
 */
async function fetchLeaderboardData() {
    try {
        const response = await fetch(COMMUNITY_CONFIG.sheet.url);
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const csvText = await response.text();

        // Check if we actually got CSV data
        if (csvText.includes('<title>Google Sheets</title>')) {
            throw new Error('Failed to fetch data. Please ensure your Google Sheet is published to the web as a CSV.');
        }

        // Parse CSV data
        const rows = csvText.split('\n').slice(1); // Skip header row

        allLeaderboardData = rows
            .map(row => {
                const [username, event, points, date] = row.split(',').map(s => s.trim());
                
                return {
                    username,
                    event,
                    points: parseInt(points, 10),
                    date: new Date(date)
                };
            })
            .filter(row => {
                // Filter out invalid rows
                return row.username && 
                       !isNaN(row.points) && 
                       row.date instanceof Date && 
                       !isNaN(row.date);
            });

        return allLeaderboardData;

    } catch (error) {
        console.error('Error fetching or parsing leaderboard data:', error);
        
        const loadingEl = document.getElementById('leaderboard-loading');
        if (loadingEl) {
            loadingEl.textContent = 'Error loading data. Please try again later.';
        }
        
        return [];
    }
}

// =================================================================================
// --- LEADERBOARD CALCULATIONS ---
// =================================================================================

/**
 * Calculates total scores from leaderboard data
 * @param {Array} data - Array of leaderboard records
 * @returns {Array} Sorted array of user scores
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
 * Filters leaderboard data by time period
 * @param {string} period - 'monthly', 'yearly', or 'all-time'
 * @returns {Array} Filtered leaderboard data
 */
function filterDataByPeriod(period) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (period === 'monthly') {
        return allLeaderboardData.filter(d => 
            d.date.getFullYear() === currentYear && 
            d.date.getMonth() === currentMonth
        );
    } else if (period === 'yearly') {
        return allLeaderboardData.filter(d => 
            d.date.getFullYear() === currentYear
        );
    } else {
        return allLeaderboardData; // all-time
    }
}

// =================================================================================
// --- LEADERBOARD RENDERING ---
// =================================================================================

/**
 * Renders the leaderboard table
 * @param {Array} scores - Array of user scores
 */
function renderLeaderboard(scores) {
    const tbody = document.getElementById('leaderboard-body');
    const loadingEl = document.getElementById('leaderboard-loading');

    if (!tbody || !loadingEl) {
        console.error('Leaderboard elements not found');
        return;
    }

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

        // Apply rank-specific styling
        if (rank === 1) row.classList.add('rank-1');
        else if (rank === 2) row.classList.add('rank-2');
        else if (rank === 3) row.classList.add('rank-3');

        // Add medal emojis for top 3
        let rankContent = rank;
        if (rank === 1) rankContent = '🥇 ' + rank;
        else if (rank === 2) rankContent = '🥈 ' + rank;
        else if (rank === 3) rankContent = '🥉 ' + rank;

        row.innerHTML = `
            <td class="rank-cell">${rankContent}</td>
            <td class="user-cell">${escapeHTML(score.username)}</td>
            <td class="points-cell">${score.points}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Updates the leaderboard display for a specific period
 * @param {string} period - 'monthly', 'yearly', or 'all-time'
 */
async function updateLeaderboard(period) {
    const loadingEl = document.getElementById('leaderboard-loading');
    const tbody = document.getElementById('leaderboard-body');

    if (!loadingEl || !tbody) {
        console.error('Leaderboard elements not found');
        return;
    }

    // Show loading state
    loadingEl.textContent = 'Calculating...';
    loadingEl.style.display = 'block';
    tbody.innerHTML = '';

    // Filter and calculate scores
    const filteredData = filterDataByPeriod(period);
    const scores = calculateScores(filteredData);

    // Render results
    renderLeaderboard(scores);
}

/**
 * Sets up event listeners for leaderboard tabs
 */
function setupLeaderboardTabListeners() {
    const tabs = document.querySelectorAll('.leaderboard-tab-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab styling
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Update leaderboard
            updateLeaderboard(tab.dataset.period);
        });
    });
}

// =================================================================================
// --- COLLAPSIBLE SECTIONS ---
// =================================================================================

/**
 * Toggles the leaderboard info section
 */
function toggleLeaderboardGlossary() {
    const content = document.getElementById('leaderboardGlossary');
    const header = content.previousElementSibling;

    if (!content || !header) {
        console.error('Leaderboard glossary elements not found');
        return;
    }

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
 * Toggles the badge glossary section
 */
function toggleBadgeGlossary() {
    const content = document.getElementById('badgeGlossary');
    const header = content.previousElementSibling;

    if (!content || !header) {
        console.error('Badge glossary elements not found');
        return;
    }

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

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Escapes HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    if (!str) return '';

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return str.replace(/[&<>"']/g, char => escapeMap[char]);
}

// =================================================================================
// --- MOBILE MENU FUNCTIONS ---
// =================================================================================

/**
 * Toggles mobile menu visibility
 */
window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    if (!menu || !hamburger) return;

    const isOpen = menu.style.display === 'block';

    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

/**
 * Closes mobile menu
 */
window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    if (!menu || !hamburger) return;

    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};

// =================================================================================
// --- GLOBAL FUNCTION EXPORTS ---
// =================================================================================

// Make functions available globally for onclick handlers
window.rotateHof = rotateHof;
window.toggleLeaderboardGlossary = toggleLeaderboardGlossary;
window.toggleBadgeGlossary = toggleBadgeGlossary;
