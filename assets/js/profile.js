/* =============================================================================
   PROFILE PAGE - User profile viewing and editing
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION & INITIALIZATION ---
// =================================================================================

const SUPABASE_CONFIG = {
    url: 'https://pvbguojrkigzvnuwjawy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw'
};

const supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Global state
let viewedUserProfile = null;
let loggedInUserProfile = null;
let isInitialLoad = true;
let currentSortOrder = 'newest';
let profileYouTubePlayer = null;

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Debounces a function call
 */
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

/**
 * Gets wallet address from URL or localStorage
 */
function getTargetWalletAddress() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlWallet = urlParams.get('user');
    const loggedInWallet = localStorage.getItem('walletAddress');
    
    return urlWallet || loggedInWallet;
}

/**
 * Checks if current user is viewing their own profile
 */
function isOwnProfile() {
    return loggedInUserProfile && 
           viewedUserProfile && 
           loggedInUserProfile.wallet_address === viewedUserProfile.wallet_address;
}

// =================================================================================
// --- MAIN INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
    loadPageData();
});

// =================================================================================
// --- DATA LOADING ---
// =================================================================================

/**
 * Main data loading function
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
        // Load profile data
        const profileData = await fetchProfileData(addressToLoad);
        
        if (!profileData) {
            showProfileNotFoundState();
            return;
        }

        // Enhance profile data
        await enhanceProfileData(profileData);

        // Increment view count on first load
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
 * Fetches profile data with posts and comments
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
 * Enhances profile data with additional info
 */
async function enhanceProfileData(profileData) {
    // Sort posts by top rating if needed
    if (currentSortOrder === 'top' && profileData.posts) {
        sortPostsByTopRating(profileData.posts);
    }

    // Get follower counts
    const { count: followerCount } = await supabaseClient
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

    const { count: followingCount } = await supabaseClient
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

    // Check if current user follows this profile
    const { data: isFollowingData } = await supabaseClient
        .from('followers')
        .select('id')
        .eq('follower_id', loggedInUserProfile?.id)
        .eq('following_id', profileData.id);

    profileData.followerCount = followerCount || 0;
    profileData.followingCount = followingCount || 0;
    profileData.isFollowedByCurrentUser = isFollowingData && isFollowingData.length > 0;
}

/**
 * Sorts posts by vote score
 */
function sortPostsByTopRating(posts) {
    posts.sort((a, b) => {
        const scoreA = a.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
        const scoreB = b.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
        
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

/**
 * Increments view count for profile
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
// --- UI STATE FUNCTIONS ---
// =================================================================================

function showLoadingState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = '<div class="loading-container"><p>Loading profile...</p></div>';
}

function showNoUserState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2>No User Found</h2>
        <p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>
    `;
}

function showProfileNotFoundState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2>Profile Not Found</h2>
        <p>A profile for this wallet address does not exist.</p>
    `;
}

function showErrorState() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2>Error</h2>
        <p>There was an error loading the profile.</p>
    `;
}

// =================================================================================
// --- RENDERING FUNCTIONS ---
// =================================================================================

/**
 * Main profile view renderer
 */
function renderProfileView() {
    const profileContent = document.getElementById('profile-content');
    const isOwner = isOwnProfile();

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

    // Initialize event listeners
    if (isOwner) {
        attachOwnerEventListeners();
    }

    // Initialize YouTube player if song exists
    if (viewedUserProfile.profile_song_url) {
        setTimeout(() => initYouTubePlayer(viewedUserProfile.profile_song_url), 0);
    }
}

function renderViewCount() {
    return `<span class="profile-view-count">👁️ ${viewedUserProfile.view_count || 0}</span>`;
}

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

function renderEditButton() {
    return '<button id="edit-profile-btn" class="edit-profile-btn">Edit</button>';
}

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

function renderLastSeen() {
    if (!viewedUserProfile.last_seen) return '';
    
    return `
        <p class="profile-last-seen">
            Last seen: ${new Date(viewedUserProfile.last_seen).toLocaleString()}
        </p>
    `;
}

function renderFollowButton(isOwner) {
    if (!loggedInUserProfile || isOwner) return '';

    const isFollowing = viewedUserProfile.isFollowedByCurrentUser;
    const buttonText = isFollowing ? 'Unfollow' : 'Follow';
    const buttonClass = isFollowing ? 'follow-btn unfollow' : 'follow-btn';

    return `<button class="${buttonClass}" onclick="handleFollow()">${buttonText}</button>`;
}

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

function renderSocials() {
    const socials = [];

    if (viewedUserProfile.twitter_handle) {
        socials.push(`
            <a href="https://x.com/${viewedUserProfile.twitter_handle}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="X / Twitter" 
               class="social-icon-link">
                <img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png" alt="X">
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
                <img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png" alt="Telegram">
            </a>
        `);
    }

    if (viewedUserProfile.discord_handle) {
        socials.push(`
            <a href="#" 
               onclick="alert('Discord: ${viewedUserProfile.discord_handle}'); return false;" 
               title="Discord" 
               class="social-icon-link">
                <img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png" alt="Discord">
            </a>
        `);
    }

    if (viewedUserProfile.youtube_url) {
        socials.push(`
            <a href="${viewedUserProfile.youtube_url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="YouTube" 
               class="social-icon-link">
                <img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png" alt="YouTube">
            </a>
        `);
    }

    if (viewedUserProfile.magiceden_url) {
        socials.push(`
            <a href="${viewedUserProfile.magiceden_url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               title="Magic Eden" 
               class="social-icon-link">
                <img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762140417/Magic_Eden_gl926b.png" alt="Magic Eden">
            </a>
        `);
    }

    if (socials.length === 0) return '';

    return `<div class="profile-socials">${socials.join('')}</div>`;
}

function renderBioSection() {
    const bioText = viewedUserProfile.bio
        ? parseUserTags(parseFormatting(viewedUserProfile.bio))
        : '<span class="profile-bio-empty">User has not written a bio yet.</span>';

    return `
        <div class="profile-bio-section">
            <p class="profile-bio-label">Bio:</p>
            <div class="profile-bio-content">${bioText}</div>
        </div>
    `;
}

function renderPostsSection(isOwner) {
    return `
        <div id="posts-section">
            <div class="posts-header">
                <h3>Posts</h3>
                ${isOwner ? '<button id="create-post-btn" class="cta-button">Create New Post</button>' : ''}
            </div>
            ${renderSortDropdown()}
            <div id="posts-list">${renderPostsList(isOwner)}</div>
        </div>
    `;
}

function renderSortDropdown() {
    return `
        <div class="sort-container">
            <label for="sort-posts">Sort by:</label>
            <select id="sort-posts" onchange="handleSortChange(this.value)" class="sort-select">
                <option value="newest" ${currentSortOrder === 'newest' ? 'selected' : ''}>Newest</option>
                <option value="oldest" ${currentSortOrder === 'oldest' ? 'selected' : ''}>Oldest</option>
                <option value="top" ${currentSortOrder === 'top' ? 'selected' : ''}>Top Rated</option>
            </select>
        </div>
    `;
}

function renderPostsList(isOwner) {
    if (!viewedUserProfile.posts || viewedUserProfile.posts.length === 0) {
        return '<p class="posts-empty">No posts yet.</p>';
    }

    return viewedUserProfile.posts.map(post => renderSinglePost(post, isOwner)).join('');
}

function renderSinglePost(post, isOwner) {
    const pfpHtml = viewedUserProfile.pfp_url
        ? `<img src="${viewedUserProfile.pfp_url}" alt="${viewedUserProfile.username}" class="post-author-pfp">`
        : '<div class="post-author-pfp-placeholder"></div>';

    const commentTree = buildCommentTree(post.comments);
    const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);

    const postDate = new Date(post.created_at).toLocaleString();
    const editedDate = post.updated_at
        ? `<span class="post-edited-date"> • Edited: ${new Date(post.updated_at).toLocaleString()}</span>`
        : '';

    const adminButtons = isOwner ? renderPostAdminButtons(post) : '';
    const voteHtml = renderVoteSection(post);
    const processedContent = parseUserTags(parseFormatting(post.content));

    const commentFormHtml = loggedInUserProfile
        ? `
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
          `
        : '';

    return `
        <div class="post-item">
            <div class="post-header">
                ${pfpHtml}
                <div class="post-author-info">
                    <a href="profile.html?user=${viewedUserProfile.wallet_address}" class="post-author-name footer-link">
                        ${viewedUserProfile.username}
                    </a>
                    <small class="post-timestamp">${postDate}${editedDate}</small>
                </div>
                <div class="post-actions">${adminButtons}</div>
            </div>
            <div class="post-body">
                <h4 class="post-title">${escapeHTML(post.title)}</h4>
                <p class="post-content">${processedContent}</p>
                ${voteHtml}
            </div>
            <div class="comments-section">${commentsHtml}</div>
            ${commentFormHtml}
        </div>
    `;
}

function renderPostAdminButtons(post) {
    const pinText = post.is_pinned ? 'Unpin' : 'Pin';
    
    return `
        <button onclick="togglePinPost(${post.id}, ${post.is_pinned})" class="post-action-btn">
            ${pinText}
        </button>
        <button onclick='renderEditPostView(${post.id}, "${encodeURIComponent(post.title)}", "${encodeURIComponent(post.content)}")' class="post-action-btn">
            Edit
        </button>
        <button onclick="deletePost(${post.id})" class="post-action-btn delete">
            Delete
        </button>
    `;
}

function renderVoteSection(post) {
    const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);

    if (!loggedInUserProfile) {
        return `<div class="vote-container"><span class="vote-points-only">${voteTotal} points</span></div>`;
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

// =================================================================================
// --- EDIT PROFILE VIEW ---
// =================================================================================

function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    
    profileContent.innerHTML = `
        <h2 class="profile-username">Editing Profile</h2>
        
        <div class="profile-edit-form">
            <div class="form-group">
                <label for="pfp-upload" class="form-label">Upload New Profile Picture:</label>
                <input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" class="form-input">
            </div>

            <div class="form-group">
                <label for="bio-input" class="form-label">Your Bio:</label>
                <textarea id="bio-input" class="form-textarea">${viewedUserProfile.bio || ''}</textarea>
            </div>

            <hr class="form-divider">
            <h3 class="form-section-title">Social Handles & URLs</h3>

            <div class="form-group">
                <label for="twitter-input" class="form-label">X / Twitter Handle:</label>
                <input type="text" id="twitter-input" value="${viewedUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" class="form-input">
            </div>

            <div class="form-group">
                <label for="telegram-input" class="form-label">Telegram Handle:</label>
                <input type="text" id="telegram-input" value="${viewedUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" class="form-input">
            </div>

            <div class="form-group">
                <label for="discord-input" class="form-label">Discord Handle:</label>
                <input type="text" id="discord-input" value="${viewedUserProfile.discord_handle || ''}" placeholder="username" class="form-input">
            </div>

            <div class="form-group">
                <label for="youtube-input" class="form-label">YouTube Channel URL:</label>
                <input type="text" id="youtube-input" value="${viewedUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." class="form-input">
            </div>

            <div class="form-group">
                <label for="magiceden-input" class="form-label">Magic Eden Profile URL:</label>
                <input type="text" id="magiceden-input" value="${viewedUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." class="form-input">
            </div>

            <hr class="form-divider">
            <h3 class="form-section-title">Profile Song</h3>

            <div class="form-group">
                <label for="song-url-input" class="form-label">YouTube URL:</label>
                <input type="text" id="song-url-input" value="${viewedUserProfile.profile_song_url || ''}" placeholder="Paste a YouTube video link here..." class="form-input">
                <small class="form-helper-text">The audio will play from the video. We are not responsible for copyrighted content.</small>
            </div>
        </div>

        <div class="form-actions">
            <button id="save-profile-btn" class="cta-button">Save Changes</button>
            <button id="cancel-edit-btn" class="cta-button form-cancel-btn">Cancel</button>
        </div>
    `;

    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}

// =================================================================================
// --- POST FORM VIEWS ---
// =================================================================================

function renderCreatePostView() {
    const postsSection = document.getElementById('posts-section');
    
    postsSection.innerHTML = `
        <div class="post-form-container">
            <h3 class="post-form-title">New Post</h3>
            
            <div class="form-group">
                <label for="post-title-input" class="form-label">Title:</label>
                <input type="text" id="post-title-input" placeholder="Enter a title..." class="form-input">
            </div>

            <div class="form-group">
                <label for="post-content-input" class="form-label">Content:</label>
                <div class="format-toolbar">
                    <button onclick="formatText('b', 'post-content-input')">B</button>
                    <button onclick="formatText('i', 'post-content-input')">I</button>
                    <button onclick="formatText('u', 'post-content-input')">U</button>
                </div>
                <textarea id="post-content-input" placeholder="What's on your mind?" class="form-textarea" style="min-height: 200px;"></textarea>
            </div>

            <div class="form-actions">
                <button id="submit-post-btn" class="cta-button">Submit Post</button>
                <button id="cancel-post-btn" class="cta-button form-cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', loadPageData);
}

function renderEditPostView(postId, currentTitle, currentContent) {
    const postsSection = document.getElementById('posts-section');
    const decodedTitle = decodeURIComponent(currentTitle);
    const decodedContent = decodeURIComponent(currentContent);

    postsSection.innerHTML = `
        <div class="post-form-container">
            <h3 class="post-form-title">Edit Post</h3>
            
            <div class="form-group">
                <label for="post-title-input" class="form-label">Title:</label>
                <input type="text" id="post-title-input" value="${decodedTitle}" class="form-input">
            </div>

            <div class="form-group">
                <label for="post-content-input" class="form-label">Content:</label>
                <div class="format-toolbar">
                    <button onclick="formatText('b', 'post-content-input')">B</button>
                    <button onclick="formatText('i', 'post-content-input')">I</button>
                    <button onclick="formatText('u', 'post-content-input')">U</button>
                </div>
                <textarea id="post-content-input" class="form-textarea" style="min-height: 200px;">${decodedContent}</textarea>
            </div>

            <div class="form-actions">
                <button onclick="updatePost(${postId})" class="cta-button">Save Update</button>
                <button onclick="loadPageData()" class="cta-button form-cancel-btn">Cancel</button>
            </div>
        </div>
    `;
}

// =================================================================================
// --- EVENT HANDLERS ---
// =================================================================================

function attachOwnerEventListeners() {
    const editBtn = document.getElementById('edit-profile-btn');
    const createPostBtn = document.getElementById('create-post-btn');

    if (editBtn) editBtn.addEventListener('click', renderEditView);
    if (createPostBtn) createPostBtn.addEventListener('click', renderCreatePostView);
}

function handleSortChange(newOrder) {
    currentSortOrder = newOrder;
    isInitialLoad = false;
    
    const debouncedLoad = debounce(loadPageData, 300);
    debouncedLoad();
}

// =================================================================================
// --- DATA MODIFICATION FUNCTIONS ---
// =================================================================================

async function saveProfileChanges() {
    const saveButton = document.getElementById('save-profile-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    const userWalletAddress = localStorage.getItem('walletAddress');

    try {
        // Handle profile picture upload
        let pfpUrlToSave = viewedUserProfile.pfp_url;
        const file = document.getElementById('pfp-upload').files[0];

        if (file) {
            saveButton.textContent = 'Uploading Image...';
            pfpUrlToSave = await uploadProfilePicture(file, userWalletAddress);
        }

        // Update profile data
        saveButton.textContent = 'Saving Profile...';
        const newProfileData = {
            bio: document.getElementById('bio-input').value,
            pfp_url: pfpUrlToSave,
            twitter_handle: document.getElementById('twitter-input').value,
            telegram_handle: document.getElementById('telegram-input').value,
            discord_handle: document.getElementById('discord-input').value,
            youtube_url: document.getElementById('youtube-input').value,
            magiceden_url: document.getElementById('magiceden-input').value,
            profile_song_url: document.getElementById('song-url-input').value,
        };

        const { error } = await supabaseClient
            .from('profiles')
            .update(newProfileData)
            .eq('wallet_address', userWalletAddress);

        if (error) throw error;

        alert('Profile saved successfully!');
        loadPageData();

    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Could not save profile: ${error.message}`);
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}

async function uploadProfilePicture(file, walletAddress) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${walletAddress}.${fileExt}`;

    const { error } = await supabaseClient.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data } = supabaseClient.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

    return `${data.publicUrl}?t=${new Date().getTime()}`;
}

async function saveNewPost() {
    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const title = document.getElementById('post-title-input').value;
    const content = document.getElementById('post-content-input').value;

    if (!title.trim() || !content.trim()) {
        alert('Title and content cannot be empty.');
        btn.disabled = false;
        btn.textContent = 'Submit Post';
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .insert({
                title,
                content,
                author_id: viewedUserProfile.id
            });

        if (error) throw error;

        alert('Post submitted successfully!');
        loadPageData();

    } catch (error) {
        console.error('Error submitting post:', error);
        alert(`Could not submit post: ${error.message}`);
        btn.disabled = false;
        btn.textContent = 'Submit Post';
    }
}

async function updatePost(postId) {
    const newTitle = document.getElementById('post-title-input').value;
    const newContent = document.getElementById('post-content-input').value;

    if (!newTitle.trim() || !newContent.trim()) {
        alert('Title and content cannot be empty.');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .update({
                title: newTitle,
                content: newContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (error) throw error;

        alert('Post updated successfully!');
        loadPageData();

    } catch (error) {
        console.error('Error updating post:', error);
        alert(`Could not update post: ${error.message}`);
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;

        alert('Post deleted successfully.');
        loadPageData();

    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Could not delete post: ${error.message}`);
    }
}

async function togglePinPost(postId, currentStatus) {
    try {
        // Unpin all other posts first if pinning this one
        if (!currentStatus) {
            await supabaseClient
                .from('posts')
                .update({ is_pinned: false })
                .eq('author_id', viewedUserProfile.id);
        }

        const { error } = await supabaseClient
            .from('posts')
            .update({ is_pinned: !currentStatus })
            .eq('id', postId);

        if (error) throw error;

        loadPageData();

    } catch (error) {
        console.error('Error toggling pin status:', error);
        alert(`Could not update pin status: ${error.message}`);
    }
}

async function handleFollow() {
    if (!loggedInUserProfile) {
        alert('You must be logged in to follow users.');
        return;
    }

    if (loggedInUserProfile.id === viewedUserProfile.id) {
        alert('You cannot follow yourself.');
        return;
    }

    try {
        const { data: existingFollow, error: checkError } = await supabaseClient
            .from('followers')
            .select('*')
            .eq('follower_id', loggedInUserProfile.id)
            .eq('following_id', viewedUserProfile.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingFollow) {
            // Unfollow
            const { error } = await supabaseClient
                .from('followers')
                .delete()
                .match({ id: existingFollow.id });

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

        loadPageData();

    } catch (error) {
        console.error('Error handling follow:', error);
        alert(`Failed to process follow: ${error.message}`);
    }
}

// =================================================================================
// --- YOUTUBE PLAYER FUNCTIONS ---
// =================================================================================

function onYouTubeIframeAPIReady() {
    // Global callback required by YouTube API
}

async function initYouTubePlayer(youtubeUrl) {
    // Fetch and display video title
    setTimeout(async () => {
        const titleElement = document.getElementById('profile-song-title');
        if (!titleElement) {
            console.error('Song title element not found in DOM.');
            return;
        }

        try {
            const response = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
            );
            const data = await response.json();

            if (data && data.title) {
                titleElement.textContent = data.title;
            } else {
                console.warn('oEmbed fetch did not return a title.');
            }
        } catch (error) {
            console.error('Could not fetch YouTube title via oEmbed.', error);
            titleElement.textContent = 'Error Loading Title';
        }
    }, 100);

    // Initialize player
    try {
        const url = new URL(youtubeUrl);
        const videoId = url.searchParams.get('v');

        if (!videoId) {
            console.error('No video ID found in URL');
            return;
        }

        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            window.onYouTubeIframeAPIReady = function() {
                createYouTubePlayer(videoId);
            };
        } else {
            createYouTubePlayer(videoId);
        }
    } catch (error) {
        console.error('Error initializing YouTube player:', error);
    }
}

function createYouTubePlayer(videoId) {
    if (profileYouTubePlayer) {
        profileYouTubePlayer.destroy();
    }

    profileYouTubePlayer = new YT.Player('youtube-player-container', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: { playsinline: 1 },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // Player ready callback
}

function onPlayerStateChange(event) {
    const playButton = document.getElementById('profile-audio-play-pause');
    const titleElement = document.getElementById('profile-song-title');

    if (!playButton || !titleElement) return;

    const isPlaying = event.data === YT.PlayerState.PLAYING;

    // Update title if still loading
    if (isPlaying && (titleElement.textContent.includes('Loading') || titleElement.textContent.includes('Error'))) {
        const songTitle = event.target.getVideoData().title;
        if (songTitle) {
            titleElement.textContent = songTitle;
        }
    }

    // Update button and animation
    if (isPlaying) {
        playButton.textContent = '⏸️';
        titleElement.classList.add('scrolling');
    } else {
        playButton.textContent = '▶️';
        titleElement.classList.remove('scrolling');
    }
}

function toggleProfileAudio() {
    if (!profileYouTubePlayer || typeof profileYouTubePlayer.getPlayerState !== 'function') {
        console.error('YouTube player not ready yet.');
        return;
    }

    const playerState = profileYouTubePlayer.getPlayerState();

    if (playerState === YT.PlayerState.PLAYING) {
        profileYouTubePlayer.pauseVideo();
    } else {
        profileYouTubePlayer.playVideo();
    }
}

// =================================================================================
// --- MOBILE MENU FUNCTIONS ---
// =================================================================================

window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    const isOpen = menu.style.display === 'block';

    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};

// =================================================================================
// --- TEXT FORMATTING FUNCTION ---
// =================================================================================

/**
 * Inserts BBCode tags around selected text in textarea
 */
function formatText(tag, textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const replacement = `[${tag}]${selectedText}[/${tag}]`;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    textarea.focus();
    textarea.selectionStart = start + `[${tag}]`.length;
    textarea.selectionEnd = textarea.selectionStart + selectedText.length;
}
