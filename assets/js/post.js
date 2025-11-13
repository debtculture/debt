/* =============================================================================
   POST PAGE - Individual post viewing and interaction
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION & INITIALIZATION ---
// =================================================================================

// Global state
let loggedInUserProfile = null;
let currentPostData = null;

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Gets post ID from URL parameters
 */
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Checks if current user is the post owner
 */
function isPostOwner() {
    return loggedInUserProfile && 
           currentPostData && 
           loggedInUserProfile.id === currentPostData.author.id;
}

// =================================================================================
// --- MAIN INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    } else {
        console.error('Wallet manager not loaded');
    }
    
    loadPostData();
});

// =================================================================================
// --- DATA LOADING ---
// =================================================================================

/**
 * Main data loading function
 */
async function loadPostData() {
    showLoadingState();

    const postId = getPostIdFromUrl();
    
    if (!postId) {
        showNoPostIdState();
        return;
    }

    // Load logged-in user and fetch all users for @tagging
    await Promise.all([
        loadLoggedInUserProfile(),
        fetchAllUsers()
    ]);

    try {
        const postData = await fetchPostData(postId);
        
        if (!postData) {
            showPostNotFoundState();
            return;
        }

        currentPostData = postData;
        renderPost(postData);

    } catch (error) {
        console.error('Error fetching post data:', error);
        showErrorState();
    }
}

/**
 * Loads logged-in user's profile
 */
async function loadLoggedInUserProfile() {
    const loggedInUserWallet = localStorage.getItem('walletAddress');
    
    if (!loggedInUserWallet) return;

    try {
        const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('wallet_address', loggedInUserWallet)
            .single();

        if (data) loggedInUserProfile = data;
    } catch (error) {
        console.error('Error loading logged-in user profile:', error);
    }
}

/**
 * Fetches post data with author, comments, and votes
 */
async function fetchPostData(postId) {
    const { data, error } = await supabaseClient
        .from('posts')
        .select(`
            *,
            author:profiles(*),
            comments(*, profiles(*)),
            post_votes(*)
        `)
        .eq('id', postId)
        .single();

    if (error) throw error;

    return data;
}

// =================================================================================
// --- UI STATE FUNCTIONS ---
// =================================================================================

function showLoadingState() {
    const postContainer = document.getElementById('post-container');
    postContainer.setAttribute('aria-busy', 'true');
    postContainer.innerHTML = '<div class="loading-container"><p>Loading post...</p></div>';
}

function showNoPostIdState() {
    const postContainer = document.getElementById('post-container');
    postContainer.setAttribute('aria-busy', 'false');
    postContainer.innerHTML = `
        <div class="error-container">
            <h2>Post Not Found</h2>
            <p>No post ID was provided in the URL.</p>
        </div>
    `;
}

function showPostNotFoundState() {
    const postContainer = document.getElementById('post-container');
    postContainer.setAttribute('aria-busy', 'false');
    postContainer.innerHTML = `
        <div class="error-container">
            <h2>Post Not Found</h2>
            <p>This post does not exist or has been deleted.</p>
        </div>
    `;
}

function showErrorState() {
    const postContainer = document.getElementById('post-container');
    postContainer.setAttribute('aria-busy', 'false');
    postContainer.innerHTML = `
        <div class="error-container">
            <h2>Error</h2>
            <p>This post could not be loaded. Please try again later.</p>
        </div>
    `;
}

// =================================================================================
// --- RENDERING FUNCTIONS ---
// =================================================================================

/**
 * Main post rendering function
 */
function renderPost(post) {
    const postContainer = document.getElementById('post-container');
    postContainer.setAttribute('aria-busy', 'false');

    // Update page title with post title
    document.title = `${escapeHTML(post.title)} - Debt Culture`;

    const isOwner = isPostOwner();
    
    const html = `
        <div class="post-item">
            ${renderPostHeader(post)}
            ${renderPostBody(post)}
            ${renderCommentsSection(post, isOwner)}
            ${renderCommentForm(post)}
        </div>
    `;

    postContainer.innerHTML = html;
}

/**
 * Renders post header with author info
 */
function renderPostHeader(post) {
    const pfpHtml = post.author.pfp_url
        ? `<img src="${post.author.pfp_url}" alt="${post.author.username}" class="post-author-pfp">`
        : '<div class="post-author-pfp-placeholder"></div>';

    const postDate = new Date(post.created_at).toLocaleString();
    const editedDate = post.updated_at
        ? `<span class="post-edited-date"> • Edited: ${new Date(post.updated_at).toLocaleString()}</span>`
        : '';

    return `
        <div class="post-header">
            ${pfpHtml}
            <div class="post-author-info">
                <a href="profile.html?user=${post.author.wallet_address}" class="post-author-name footer-link">
                    ${post.author.username}
                </a>
                <small class="post-timestamp">${postDate}${editedDate}</small>
            </div>
        </div>
    `;
}

/**
 * Renders post body with title, content, and votes
 */
function renderPostBody(post) {
    const processedContent = parseUserTags(parseFormatting(post.content));
    const voteHtml = renderVoteSection(post);

    return `
        <div class="post-body">
            <h1 class="post-title">${escapeHTML(post.title)}</h1>
            <p class="post-content">${processedContent}</p>
            ${voteHtml}
        </div>
    `;
}

/**
 * Renders vote section with buttons and count
 */
function renderVoteSection(post) {
    const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);

    if (!loggedInUserProfile) {
        return `
            <div class="vote-container">
                <span class="vote-count">${voteTotal} points</span>
            </div>
        `;
    }

    const userVote = post.post_votes.find(v => v.user_id === loggedInUserProfile.id);
    const upvoteClass = userVote && userVote.vote_type === 1 ? 'vote-btn up active' : 'vote-btn up';
    const downvoteClass = userVote && userVote.vote_type === -1 ? 'vote-btn down active' : 'vote-btn down';

    return `
        <div class="vote-container">
            <button onclick="handleVote(${post.id}, 1)" class="${upvoteClass}" aria-label="Upvote">
                👍
            </button>
            <span class="vote-count">${voteTotal}</span>
            <button onclick="handleVote(${post.id}, -1)" class="${downvoteClass}" aria-label="Downvote">
                👎
            </button>
        </div>
    `;
}

/**
 * Renders comments section
 */
function renderCommentsSection(post, isOwner) {
    const commentTree = buildCommentTree(post.comments);
    const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);

    if (!commentsHtml) {
        return `
            <div class="comments-section">
                <p class="comments-empty">No comments yet. Be the first to comment!</p>
            </div>
        `;
    }

    return `<div class="comments-section">${commentsHtml}</div>`;
}

/**
 * Renders comment input form
 */
function renderCommentForm(post) {
    if (!loggedInUserProfile) return '';

    return `
        <div class="add-comment-form">
            <input 
                type="text" 
                id="comment-input-${post.id}" 
                placeholder="Add a comment..." 
                class="comment-input"
            >
            <button onclick="submitComment(${post.id})" class="cta-button comment-submit">
                Submit
            </button>
        </div>
    `;
}

/**
 * Escapes HTML special characters
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
