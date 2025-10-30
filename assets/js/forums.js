/* =============================================================================
   FORUMS PAGE - Community discussion board
   Version: 2.0 (Optimized)
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const SUPABASE_CONFIG = {
    url: 'https://pvbguojrkigzvnuwjawy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw'
};

const supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

/**
 * Initialize forums page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeCreatePostButton();
    loadForumPosts();
});

// =================================================================================
// --- CREATE POST BUTTON ---
// =================================================================================

/**
 * Initializes the Create Post button based on user login status
 */
function initializeCreatePostButton() {
    const forumActions = document.getElementById('forum-actions');
    const userWallet = localStorage.getItem('walletAddress');

    if (userWallet) {
        // User is logged in - show Create Post button
        forumActions.innerHTML = `
            <button class="create-post-btn" onclick="navigateToCreatePost()">
                ➕ Create New Post
            </button>
        `;
    } else {
        // User not logged in - show info message
        forumActions.innerHTML = `
            <div class="forum-info-message">
                <a href="index.html">Connect your wallet</a> to create posts and join the discussion
            </div>
        `;
    }
}

/**
 * Navigates user to their profile page to create a post
 */
window.navigateToCreatePost = function() {
    const userWallet = localStorage.getItem('walletAddress');
    if (userWallet) {
        window.location.href = `profile.html?user=${userWallet}`;
    } else {
        alert('Please connect your wallet first');
        window.location.href = 'index.html';
    }
};

// =================================================================================
// --- DATA LOADING ---
// =================================================================================

/**
 * Loads all forum posts from database with author info and comment counts
 * Orders by newest first
 */
async function loadForumPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                author:profiles(username, wallet_address),
                comments(count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderPosts(posts);

    } catch (error) {
        console.error('Error fetching forum posts:', error);
        showErrorState();
    }
}

// =================================================================================
// --- RENDERING FUNCTIONS ---
// =================================================================================

/**
 * Renders list of forum posts in table format
 * @param {Array} posts - Array of post objects with author and comment data
 */
function renderPosts(posts) {
    const postList = document.getElementById('post-list');

    // Handle empty state
    if (!posts || posts.length === 0) {
        postList.innerHTML = `
            <p style="padding: 40px; text-align: center; color: #888;">
                No posts have been created yet. Be the first to start a discussion!
            </p>
        `;
        return;
    }

    // Build post rows HTML
    const postHtml = posts.map(post => {
        const lastActivity = new Date(post.created_at).toLocaleString();
        const replyCount = post.comments[0]?.count || 0;
        const authorUsername = post.author?.username || 'Unknown';
        const authorWallet = post.author?.wallet_address || '#';

        return `
            <div class="post-row" role="listitem">
                <div class="post-title">
                    <a href="post.html?id=${post.id}" aria-label="View post: ${escapeHTML(post.title)}">
                        ${escapeHTML(post.title)}
                    </a>
                </div>
                <div class="post-author">
                    <a href="profile.html?user=${authorWallet}" aria-label="View ${authorUsername}'s profile">
                        ${escapeHTML(authorUsername)}
                    </a>
                </div>
                <div class="post-replies" aria-label="${replyCount} replies">
                    ${replyCount}
                </div>
                <div class="post-activity" aria-label="Last activity: ${lastActivity}">
                    ${lastActivity}
                </div>
            </div>
        `;
    }).join('');

    postList.innerHTML = postHtml;
}

/**
 * Shows error state in post list
 */
function showErrorState() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = `
        <p style="color: #ff5555; padding: 40px; text-align: center;">
            Error loading posts. Please try refreshing the page.
        </p>
    `;
}

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
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
// --- MOBILE NAVIGATION (HAMBURGER MENU) ---
// =================================================================================

/**
 * Toggles mobile hamburger menu open/closed
 * CRITICAL: Do not modify - this function works correctly
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
 * Closes mobile hamburger menu
 * CRITICAL: Do not modify - this function works correctly
 */
window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};
