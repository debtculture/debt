/* =============================================================================
   PROFILE PAGE - User profile viewing and editing
   Version: 2.0 (Optimized)
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const SUPABASE_CONFIG = {
    url: 'https://pvbguojrkigzvnuwjawy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw'
};

const CLOUDINARY_CONFIG = {
    cloudName: 'dpvptjn4t',
    uploadPreset: 'profile_pics'
};

const SOCIAL_ICONS = {
    twitter: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png',
    telegram: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png',
    youtube: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png',
    discord: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png'
};

// =================================================================================
// --- GLOBAL STATE ---
// =================================================================================

const supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

let viewedUserProfile = null;
let loggedInUserProfile = null;
let isInitialLoad = true;
let currentSortOrder = 'newest';
let profileYouTubePlayer = null;

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers(); // From social-helpers.js
    loadPageData();
});

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Debounces a function call to prevent excessive execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

/**
 * Gets target wallet address from URL or localStorage
 * @returns {string|null} Wallet address
 */
function getTargetWalletAddress() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlWallet = urlParams.get('user');
    const loggedInWallet = localStorage.getItem('walletAddress');
    
    return urlWallet || loggedInWallet;
}

/**
 * Checks if current user is viewing their own profile
 * @returns {boolean}
 */
function isOwnProfile() {
    return loggedInUserProfile && 
           viewedUserProfile && 
           loggedInUserProfile.wallet_address === viewedUserProfile.wallet_address;
}

/**
 * Extracts YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
function extractYouTubeVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
        /youtube\.com\/embed\/([^&\s]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

// =================================================================================
// --- DATA LOADING ---
// =================================================================================

/**
 * Main data loading orchestrator
 */
async function loadPageData() {
    showLoadingState();

    // Load logged-in user profile
    await loadLoggedInUserProfile();

    // Get target wallet address
    const addressToLoad = getTargetWalletAddress();
    
    if (!addressToLoad) {
        showNoUserState();
        return;
    }

    try {
        // Load profile data with posts and relationships
        const profileData = await fetchProfileData(addressToLoad);
        
        if (!profileData) {
            showProfileNotFoundState();
            return;
        }

        // Enhance profile with additional data
        await enhanceProfileData(profileData);

        // Increment view count on first load only
        if (isInitialLoad) {
            incrementViewCount(addressToLoad);
            isInitialLoad = false;
        }

        viewedUserProfile = profileData;
        renderProfileView();

    } catch (error) {
        console.error('Error loading page data:', error);
        showErrorState();
    }
}

/**
 * Loads logged-in user's profile from localStorage
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
 * Fetches complete profile data including posts, comments, and votes
 * @param {string} walletAddress - Target wallet address
 * @returns {Promise<Object|null>} Profile data
 */
async function fetchProfileData(walletAddress) {
    const sortAscending = currentSortOrder === 'oldest';

    const { data, error } = await supabaseClient
        .from('profiles')
        .select(`
            *,
            posts (
                *,
                comments (*, profiles (*)),
                post_votes (*)
            )
        `)
        .eq('wallet_address', walletAddress)
        .order('is_pinned', { foreignTable: 'posts', ascending: false })
        .order('created_at', { foreignTable: 'posts', ascending: sortAscending })
        .order('created_at', { foreignTable: 'posts.comments', ascending: true })
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data;
}

/**
 * Enhances profile data with follower counts and relationship status
 * @param {Object} profileData - Profile data to enhance
 */
async function enhanceProfileData(profileData) {
    // Sort posts by top rating if needed
    if (currentSortOrder === 'top' && profileData.posts) {
        sortPostsByTopRating(profileData.posts);
    }

    // Get follower and following counts
    const [followerResult, followingResult] = await Promise.all([
        supabaseClient
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileData.id),
        supabaseClient
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profileData.id)
    ]);

    profileData.followerCount = followerResult.count || 0;
    profileData.followingCount = followingResult.count || 0;

    // Check if current user follows this profile
    if (loggedInUserProfile) {
        const { data: isFollowingData } = await supabaseClient
            .from('followers')
            .select('id')
            .eq('follower_id', loggedInUserProfile.id)
            .eq('following_id', profileData.id);

        profileData.isFollowedByCurrentUser = isFollowingData && isFollowingData.length > 0;
    }
}

/**
 * Sorts posts by vote score (descending) and then by date
 * @param {Array} posts - Array of post objects
 */
function sortPostsByTopRating(posts) {
    posts.sort((a, b) => {
        const scoreA = a.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
        const scoreB = b.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
        
        // Sort by score first
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // If scores are equal, sort by date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

/**
 * Increments view count for profile via database function
 * @param {string} walletAddress - Wallet address to increment
 */
async function incrementViewCount(walletAddress) {
    try {
        await supabaseClient.rpc('increment_view_count', {
            wallet_address_to_increment: walletAddress
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

// =================================================================================
// --- UI STATE MANAGEMENT ---
// =================================================================================

/**
 * Shows loading state
 */
function showLoadingState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.setAttribute('aria-busy', 'true');
    profileContent.innerHTML = '<div class="loading-container"><p>Loading profile...</p></div>';
}

/**
 * Shows no user state (not logged in)
 */
function showNoUserState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.setAttribute('aria-busy', 'false');
    profileContent.innerHTML = `
        <h2>No User Found</h2>
        <p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>
    `;
}

/**
 * Shows profile not found state
 */
function showProfileNotFoundState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.setAttribute('aria-busy', 'false');
    profileContent.innerHTML = `
        <h2>Profile Not Found</h2>
        <p>A profile for this wallet address does not exist.</p>
    `;
}

/**
 * Shows error state
 */
function showErrorState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.setAttribute('aria-busy', 'false');
    profileContent.innerHTML = `
        <h2>Error</h2>
        <p>There was an error loading the profile. Please try again later.</p>
    `;
}

// =================================================================================
// --- MAIN RENDERING ---
// =================================================================================

/**
 * Main profile view renderer - orchestrates all sub-renderers
 */
function renderProfileView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.setAttribute('aria-busy', 'false');
    
    const isOwner = isOwnProfile();

    // Update page title
    document.title = `${viewedUserProfile.username} - Debt Culture`;

    const html = `
        <div class="profile-header">
            ${renderViewCount()}
            ${renderProfilePicture()}
            <h2 class="profile-username">${viewedUserProfile.username}</h2>
            ${isOwner ? renderEditButton() : ''}
        </div>
        ${renderStats()}
        ${renderLastSeen()}
        ${renderFollowButton(isOwner)}
        ${renderSongPlayer()}
        ${renderSocials()}
        ${renderBioSection()}
        ${renderPostsSection(isOwner)}
    `;

    profileContent.innerHTML = html;

    // Initialize event listeners for owner
    if (isOwner) {
        attachOwnerEventListeners();
    }

    // Initialize YouTube player if song exists
    if (viewedUserProfile.profile_song_url) {
        setTimeout(() => initYouTubePlayer(viewedUserProfile.profile_song_url), 0);
    }
}

// =================================================================================
// --- COMPONENT RENDERERS ---
// =================================================================================

/**
 * Renders view count badge
 */
function renderViewCount() {
    return `<span class="profile-view-count">👁️ ${viewedUserProfile.view_count || 0}</span>`;
}

/**
 * Renders profile picture or placeholder
 */
function renderProfilePicture() {
    if (viewedUserProfile.pfp_url) {
        return `
            <div class="pfp-container">
                <img src="${viewedUserProfile.pfp_url}" alt="${viewedUserProfile.username}" class="profile-pfp">
            </div>
        `;
    }
    
    return `
        <div class="pfp-container">
            <div class="profile-pfp-placeholder">No Profile<br>Picture</div>
        </div>
    `;
}

/**
 * Renders edit profile button (owner only)
 */
function renderEditButton() {
    return '<button id="edit-profile-btn" class="edit-profile-btn">Edit</button>';
}

/**
 * Renders follower/following stats
 */
function renderStats() {
    return `
        <div class="profile-stats">
            <div class="stat-item">
                <strong>${viewedUserProfile.followingCount}</strong> Following
            </div>
            <div class="stat-item">
                <strong>${viewedUserProfile.followerCount}</strong> Followers
            </div>
        </div>
    `;
}

/**
 * Renders last seen timestamp
 */
function renderLastSeen() {
    if (!viewedUserProfile.last_seen) return '';
    
    return `
        <p class="profile-last-seen">
            Last seen: ${new Date(viewedUserProfile.last_seen).toLocaleString()}
        </p>
    `;
}

/**
 * Renders follow/unfollow button (not for own profile)
 */
function renderFollowButton(isOwner) {
    if (!loggedInUserProfile || isOwner) return '';

    const isFollowing = viewedUserProfile.isFollowedByCurrentUser;
    const buttonText = isFollowing ? 'Unfollow' : 'Follow';
    const buttonClass = isFollowing ? 'follow-btn unfollow' : 'follow-btn';

    return `<button class="${buttonClass}" onclick="handleFollow()">${buttonText}</button>`;
}

/**
 * Renders profile song player if song exists
 */
function renderSongPlayer() {
    if (!viewedUserProfile.profile_song_url) return '';

    return `
        <div class="profile-song-player">
            <button 
                class="profile-song-play-btn" 
                id="profile-audio-play-pause" 
                onclick="toggleProfileAudio()"
            >
                ▶️
            </button>
            <div class="profile-song-title-container">
                <span class="profile-song-title" id="profile-song-title">Loading song...</span>
            </div>
        </div>
        <div id="youtube-player-container" class="youtube-player-hidden"></div>
    `;
}

/**
 * Renders social media links
 */
function renderSocials() {
    const socials = [];

    if (viewedUserProfile.twitter_handle) {
        socials.push(`
            <a href="https://x.com/${viewedUserProfile.twitter_handle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="X / Twitter" 
               class="social-icon-link">
                <img src="${SOCIAL_ICONS.twitter}" alt="X">
            </a>
        `);
    }

    if (viewedUserProfile.telegram_handle) {
        socials.push(`
            <a href="https://t.me/${viewedUserProfile.telegram_handle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="Telegram" 
               class="social-icon-link">
                <img src="${SOCIAL_ICONS.telegram}" alt="Telegram">
            </a>
        `);
    }

    if (viewedUserProfile.youtube_handle) {
        socials.push(`
            <a href="https://youtube.com/@${viewedUserProfile.youtube_handle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="YouTube" 
               class="social-icon-link">
                <img src="${SOCIAL_ICONS.youtube}" alt="YouTube">
            </a>
        `);
    }

    if (viewedUserProfile.discord_handle) {
        socials.push(`
            <a href="https://discord.com/users/${viewedUserProfile.discord_handle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="Discord" 
               class="social-icon-link">
                <img src="${SOCIAL_ICONS.discord}" alt="Discord">
            </a>
        `);
    }

    if (socials.length === 0) return '';

    return `<div class="profile-socials">${socials.join('')}</div>`;
}

/**
 * Renders bio section
 */
function renderBioSection() {
    if (!viewedUserProfile.bio) return '';

    const processedBio = parseUserTags(parseFormatting(viewedUserProfile.bio));

    return `
        <div class="profile-bio">
            <p>${processedBio}</p>
        </div>
    `;
}

/**
 * Renders posts section with create/sort controls
 */
function renderPostsSection(isOwner) {
    return `
        <div class="posts-section">
            <div class="posts-header">
                <h3>Posts</h3>
                ${isOwner ? '<button id="create-post-btn" class="cta-button">Create Post</button>' : ''}
                ${renderSortDropdown()}
            </div>
            ${renderPostsList(isOwner)}
        </div>
    `;
}

/**
 * Renders sort dropdown for posts
 */
function renderSortDropdown() {
    return `
        <select id="sort-posts" class="sort-dropdown" onchange="handleSortChange(this.value)">
            <option value="newest" ${currentSortOrder === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${currentSortOrder === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="top" ${currentSortOrder === 'top' ? 'selected' : ''}>Top Rated</option>
        </select>
    `;
}

/**
 * Renders list of posts or empty state
 */
function renderPostsList(isOwner) {
    if (!viewedUserProfile.posts || viewedUserProfile.posts.length === 0) {
        return `
            <div class="posts-empty">
                <p>${isOwner ? 'You haven\'t created any posts yet.' : 'No posts yet.'}</p>
            </div>
        `;
    }

    const postsHtml = viewedUserProfile.posts
        .map(post => renderSinglePost(post, isOwner))
        .join('');

    return `<div class="posts-list">${postsHtml}</div>`;
}

/**
 * Renders a single post card
 */
function renderSinglePost(post, isOwner) {
    const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
    const commentCount = post.comments.length;
    const processedContent = parseUserTags(parseFormatting(post.content));
    const postDate = new Date(post.created_at).toLocaleString();
    const editedDate = post.updated_at
        ? `<span class="post-edited-date"> • Edited: ${new Date(post.updated_at).toLocaleString()}</span>`
        : '';

    return `
        <div class="post-item ${post.is_pinned ? 'pinned' : ''}" id="post-${post.id}">
            ${post.is_pinned ? '<span class="pin-badge">📌 Pinned</span>' : ''}
            
            <div class="post-header-row">
                <h4 class="post-title">${escapeHTML(post.title)}</h4>
                ${isOwner ? renderPostAdminButtons(post) : ''}
            </div>

            <p class="post-content">${processedContent}</p>
            
            <div class="post-footer">
                <span class="post-meta">
                    <span class="post-date">${postDate}${editedDate}</span>
                    <span class="post-stats">
                        🗨️ ${commentCount} • ⬆️ ${voteTotal}
                    </span>
                </span>
                <a href="post.html?id=${post.id}" class="view-post-btn">View Post</a>
            </div>
        </div>
    `;
}

/**
 * Renders admin buttons for post (Edit/Delete/Pin)
 */
function renderPostAdminButtons(post) {
    const pinText = post.is_pinned ? 'Unpin' : 'Pin';
    
    return `
        <div class="post-admin-buttons">
            <button onclick='renderEditPostView(${post.id}, "${encodeURIComponent(post.title)}", "${encodeURIComponent(post.content)}")' class="post-action-btn">Edit</button>
            <button onclick="togglePinPost(${post.id}, ${post.is_pinned})" class="post-action-btn">${pinText}</button>
            <button onclick="deletePost(${post.id})" class="post-action-btn delete">Delete</button>
        </div>
    `;
}

/**
 * Renders vote section with buttons
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
            <button onclick="handleVote(${post.id}, 1)" class="${upvoteClass}">👍</button>
            <span class="vote-count">${voteTotal}</span>
            <button onclick="handleVote(${post.id}, -1)" class="${downvoteClass}">👎</button>
        </div>
    `;
}

// =================================================================================
// --- EDIT MODE RENDERERS ---
// =================================================================================

/**
 * Renders profile edit view
 */
function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <div class="edit-profile-container">
            <h2>Edit Profile</h2>
            
            <div class="form-group">
                <label for="edit-pfp">Profile Picture</label>
                <input type="file" id="edit-pfp" accept="image/*" class="form-input">
                <small>Max 5MB. Recommended: 500x500px</small>
            </div>

            <div class="form-group">
                <label for="edit-bio">Bio</label>
                <textarea 
                    id="edit-bio" 
                    class="form-textarea" 
                    placeholder="Tell us about yourself..."
                    maxlength="500"
                >${viewedUserProfile.bio || ''}</textarea>
                <small>Max 500 characters. BBCode formatting supported: [b]bold[/b], [i]italic[/i], [u]underline[/u]</small>
            </div>

            <div class="form-group">
                <label for="edit-twitter">X / Twitter Handle</label>
                <input 
                    type="text" 
                    id="edit-twitter" 
                    class="form-input" 
                    placeholder="username" 
                    value="${viewedUserProfile.twitter_handle || ''}"
                >
            </div>

            <div class="form-group">
                <label for="edit-telegram">Telegram Handle</label>
                <input 
                    type="text" 
                    id="edit-telegram" 
                    class="form-input" 
                    placeholder="username" 
                    value="${viewedUserProfile.telegram_handle || ''}"
                >
            </div>

            <div class="form-group">
                <label for="edit-youtube">YouTube Handle</label>
                <input 
                    type="text" 
                    id="edit-youtube" 
                    class="form-input" 
                    placeholder="@username" 
                    value="${viewedUserProfile.youtube_handle || ''}"
                >
            </div>

            <div class="form-group">
                <label for="edit-discord">Discord User ID</label>
                <input 
                    type="text" 
                    id="edit-discord" 
                    class="form-input" 
                    placeholder="123456789012345678" 
                    value="${viewedUserProfile.discord_handle || ''}"
                >
            </div>

            <div class="form-group">
                <label for="edit-song">Profile Song (YouTube URL)</label>
                <input 
                    type="text" 
                    id="edit-song" 
                    class="form-input" 
                    placeholder="https://youtube.com/watch?v=..." 
                    value="${viewedUserProfile.profile_song_url || ''}"
                >
            </div>

            <div class="form-actions">
                <button id="save-profile-btn" class="cta-button">Save Changes</button>
                <button id="cancel-edit-btn" class="cta-button cancel">Cancel</button>
            </div>
        </div>
    `;

    // Attach event listeners
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', () => renderProfileView());
}

/**
 * Renders create new post view
 */
function renderCreatePostView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <div class="create-post-container">
            <h2>Create New Post</h2>
            
            <div class="form-group">
                <label for="new-post-title">Title</label>
                <input type="text" id="new-post-title" class="form-input" placeholder="Post title..." maxlength="200">
            </div>

            <div class="form-group">
                <label for="new-post-content">Content</label>
                <div class="formatting-toolbar">
                    <button onclick="formatText('b', 'new-post-content')" type="button" title="Bold" class="format-btn"><strong>B</strong></button>
                    <button onclick="formatText('i', 'new-post-content')" type="button" title="Italic" class="format-btn"><em>I</em></button>
                    <button onclick="formatText('u', 'new-post-content')" type="button" title="Underline" class="format-btn"><u>U</u></button>
                </div>
                <textarea 
                    id="new-post-content" 
                    class="form-textarea" 
                    placeholder="What's on your mind?"
                    rows="8"
                ></textarea>
                <small>Tag users with @username</small>
            </div>

            <div class="form-actions">
                <button id="submit-post-btn" class="cta-button">Create Post</button>
                <button id="cancel-post-btn" class="cta-button cancel">Cancel</button>
            </div>
        </div>
    `;

    // Attach event listeners
    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', () => renderProfileView());
}

/**
 * Renders edit existing post view
 */
function renderEditPostView(postId, currentTitle, currentContent) {
    const decodedTitle = decodeURIComponent(currentTitle);
    const decodedContent = decodeURIComponent(currentContent);

    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <div class="edit-post-container">
            <h2>Edit Post</h2>
            
            <div class="form-group">
                <label for="edit-post-title-${postId}">Title</label>
                <input 
                    type="text" 
                    id="edit-post-title-${postId}" 
                    class="form-input" 
                    value="${escapeHTML(decodedTitle)}"
                    maxlength="200"
                >
            </div>

            <div class="form-group">
                <label for="edit-post-content-${postId}">Content</label>
                <div class="formatting-toolbar">
                    <button onclick="formatText('b', 'edit-post-content-${postId}')" type="button" title="Bold" class="format-btn"><strong>B</strong></button>
                    <button onclick="formatText('i', 'edit-post-content-${postId}')" type="button" title="Italic" class="format-btn"><em>I</em></button>
                    <button onclick="formatText('u', 'edit-post-content-${postId}')" type="button" title="Underline" class="format-btn"><u>U</u></button>
                </div>
                <textarea 
                    id="edit-post-content-${postId}" 
                    class="form-textarea"
                    rows="8"
                >${escapeHTML(decodedContent)}</textarea>
            </div>

            <div class="form-actions">
                <button onclick="updatePost(${postId})" class="cta-button">Save Changes</button>
                <button onclick="renderProfileView()" class="cta-button cancel">Cancel</button>
            </div>
        </div>
    `;
}

// =================================================================================
// --- EVENT HANDLERS ---
// =================================================================================

/**
 * Attaches event listeners for profile owner
 */
function attachOwnerEventListeners() {
    const editBtn = document.getElementById('edit-profile-btn');
    const createPostBtn = document.getElementById('create-post-btn');

    if (editBtn) {
        editBtn.addEventListener('click', renderEditView);
    }

    if (createPostBtn) {
        createPostBtn.addEventListener('click', renderCreatePostView);
    }
}

/**
 * Handles post sort order change
 */
function handleSortChange(newOrder) {
    currentSortOrder = newOrder;
    loadPageData();
}

/**
 * Saves profile changes to database
 */
async function saveProfileChanges() {
    const bio = document.getElementById('edit-bio').value.trim();
    const twitterHandle = document.getElementById('edit-twitter').value.trim();
    const telegramHandle = document.getElementById('edit-telegram').value.trim();
    const youtubeHandle = document.getElementById('edit-youtube').value.trim();
    const discordHandle = document.getElementById('edit-discord').value.trim();
    const songUrl = document.getElementById('edit-song').value.trim();
    const pfpFile = document.getElementById('edit-pfp').files[0];

    try {
        // Upload profile picture if provided
        let pfpUrl = viewedUserProfile.pfp_url;
        if (pfpFile) {
            if (pfpFile.size > 5 * 1024 * 1024) {
                alert('Profile picture must be under 5MB');
                return;
            }
            pfpUrl = await uploadProfilePicture(pfpFile, viewedUserProfile.wallet_address);
        }

        // Validate YouTube URL if provided
        if (songUrl && !extractYouTubeVideoId(songUrl)) {
            alert('Please enter a valid YouTube URL');
            return;
        }

        // Update profile in database
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                bio: bio,
                twitter_handle: twitterHandle,
                telegram_handle: telegramHandle,
                youtube_handle: youtubeHandle,
                discord_handle: discordHandle,
                profile_song_url: songUrl,
                pfp_url: pfpUrl
            })
            .eq('wallet_address', viewedUserProfile.wallet_address);

        if (error) throw error;

        alert('Profile updated successfully!');
        await loadPageData();

    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Failed to update profile: ${error.message}`);
    }
}

/**
 * Uploads profile picture to Cloudinary
 */
async function uploadProfilePicture(file, walletAddress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('public_id', `profile_${walletAddress}`);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Failed to upload image');

    const data = await response.json();
    return data.secure_url;
}

/**
 * Saves new post to database
 */
async function saveNewPost() {
    const title = document.getElementById('new-post-title').value.trim();
    const content = document.getElementById('new-post-content').value.trim();

    if (!title) {
        alert('Please enter a post title');
        return;
    }

    if (!content) {
        alert('Please enter post content');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .insert({
                title: title,
                content: content,
                author_id: viewedUserProfile.id
            });

        if (error) throw error;

        alert('Post created successfully!');
        await loadPageData();

    } catch (error) {
        console.error('Error creating post:', error);
        alert(`Failed to create post: ${error.message}`);
    }
}

/**
 * Updates existing post
 */
async function updatePost(postId) {
    const title = document.getElementById(`edit-post-title-${postId}`).value.trim();
    const content = document.getElementById(`edit-post-content-${postId}`).value.trim();

    if (!title || !content) {
        alert('Title and content cannot be empty');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .update({
                title: title,
                content: content,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (error) throw error;

        alert('Post updated successfully!');
        await loadPageData();

    } catch (error) {
        console.error('Error updating post:', error);
        alert(`Failed to update post: ${error.message}`);
    }
}

/**
 * Deletes a post
 */
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;

        alert('Post deleted successfully');
        await loadPageData();

    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.message}`);
    }
}

/**
 * Toggles pin status of a post
 */
async function togglePinPost(postId, currentStatus) {
    try {
        const { error } = await supabaseClient
            .from('posts')
            .update({ is_pinned: !currentStatus })
            .eq('id', postId);

        if (error) throw error;

        await loadPageData();

    } catch (error) {
        console.error('Error toggling pin:', error);
        alert(`Failed to ${currentStatus ? 'unpin' : 'pin'} post: ${error.message}`);
    }
}

/**
 * Handles follow/unfollow action
 */
async function handleFollow() {
    if (!loggedInUserProfile) {
        alert('Please connect your wallet to follow users');
        return;
    }

    const isFollowing = viewedUserProfile.isFollowedByCurrentUser;

    try {
        if (isFollowing) {
            // Unfollow
            const { error } = await supabaseClient
                .from('followers')
                .delete()
                .eq('follower_id', loggedInUserProfile.id)
                .eq('following_id', viewedUserProfile.id);

            if (error) throw error;
        } else {
            // Follow
            const { error } = await supabaseClient
                .from('followers')
                .insert({
                    follower_id: loggedInUserProfile.id,
                    following_id: viewedUserProfile.id
                });

            if (error) throw error;
        }

        await loadPageData();

    } catch (error) {
        console.error('Error toggling follow:', error);
        alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'}: ${error.message}`);
    }
}

// =================================================================================
// --- YOUTUBE PLAYER FUNCTIONS ---
// =================================================================================

/**
 * YouTube IFrame API ready callback
 */
function onYouTubeIframeAPIReady() {
    // This function is called by YouTube's API when ready
}

/**
 * Initializes YouTube player with video ID
 */
async function initYouTubePlayer(youtubeUrl) {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    
    if (!videoId) {
        console.error('Invalid YouTube URL');
        return;
    }

    try {
        // Fetch video title
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (response.ok) {
            const data = await response.json();
            const titleEl = document.getElementById('profile-song-title');
            if (titleEl) {
                titleEl.textContent = data.title || 'Profile Song';
            }
        }
    } catch (error) {
        console.error('Error fetching video title:', error);
    }

    // Create YouTube player
    createYouTubePlayer(videoId);
}

/**
 * Creates YouTube IFrame player instance
 */
function createYouTubePlayer(videoId) {
    if (typeof YT === 'undefined' || !YT.Player) {
        console.error('YouTube IFrame API not loaded');
        return;
    }

    profileYouTubePlayer = new YT.Player('youtube-player-container', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
            autoplay: 0,
            controls: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

/**
 * YouTube player ready event handler
 */
function onPlayerReady(event) {
    // Player is ready but not playing
}

/**
 * YouTube player state change handler
 */
function onPlayerStateChange(event) {
    const playBtn = document.getElementById('profile-audio-play-pause');
    if (!playBtn) return;

    // Update button based on player state
    if (event.data === YT.PlayerState.PLAYING) {
        playBtn.textContent = '⏸️';
        playBtn.classList.add('playing');
    } else if (event.data === YT.PlayerState.PAUSED || 
               event.data === YT.PlayerState.ENDED) {
        playBtn.textContent = '▶️';
        playBtn.classList.remove('playing');
    }
}

/**
 * Toggles profile song play/pause
 */
function toggleProfileAudio() {
    if (!profileYouTubePlayer) {
        console.error('YouTube player not initialized');
        return;
    }

    try {
        const state = profileYouTubePlayer.getPlayerState();
        
        if (state === YT.PlayerState.PLAYING) {
            profileYouTubePlayer.pauseVideo();
        } else {
            profileYouTubePlayer.playVideo();
        }
    } catch (error) {
        console.error('Error toggling audio:', error);
    }
}

// =================================================================================
// --- MOBILE NAVIGATION (HAMBURGER MENU) ---
// =================================================================================

/**
 * Toggles mobile hamburger menu
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

// =================================================================================
// --- TEXT FORMATTING UTILITIES ---
// =================================================================================

/**
 * Inserts BBCode tags around selected text in textarea
 * @param {string} tag - BBCode tag name (b, i, u)
 * @param {string} textareaId - ID of textarea element
 */
function formatText(tag, textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const replacement = `[${tag}]${selectedText}[/${tag}]`;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    // Restore focus and selection
    textarea.focus();
    textarea.selectionStart = start + `[${tag}]`.length;
    textarea.selectionEnd = textarea.selectionStart + selectedText.length;
}

/**
 * Escapes HTML special characters to prevent XSS
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
