// This script contains all the logic for the user profile page.

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

let viewedUserProfile = null;
let loggedInUserProfile = null;
let isInitialLoad = true;
let currentSortOrder = 'newest'; // Can be 'newest' or 'oldest'
let profileYouTubePlayer;

// =================================================================================
// --- MAIN LOGIC & DATA LOADING ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPageData();
});

/**
 * Main function to fetch all necessary data for the page from Supabase.
 */
async function loadPageData() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `<p>Loading profile...</p>`;

    // Get the currently logged-in user's profile, if any
    const loggedInUserWallet = localStorage.getItem('walletAddress');
    if (loggedInUserWallet) {
        const { data } = await supabaseClient.from('profiles').select('*').eq('wallet_address', loggedInUserWallet).single();
        if (data) loggedInUserProfile = data;
    }

    // Determine which profile to load from the URL or fallback to the logged-in user
    const urlParams = new URLSearchParams(window.location.search);
    let addressToLoad = urlParams.get('user') || loggedInUserWallet;

    if (!addressToLoad) {
        profileContent.innerHTML = `<h2>No User Found</h2><p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>`;
        return;
    }

    try {
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select(`*, posts (*, comments (*, profiles (*)), post_votes (*))`) // <-- This line is updated to include post_votes
            .eq('wallet_address', addressToLoad)
            .order('is_pinned', { foreignTable: 'posts', ascending: false })
            .order('created_at', { foreignTable: 'posts', ascending: currentSortOrder === 'oldest' ? true : false })
            .order('created_at', { foreignTable: 'posts.comments', ascending: true })
            .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        if (profileData) {
            if (isInitialLoad) {
                supabaseClient.rpc('increment_view_count', {
                    wallet_address_to_increment: addressToLoad
                }).then(({ error }) => {
                    if (error) console.error('Error incrementing view count:', error);
                });
                isInitialLoad = false;
            }

            viewedUserProfile = profileData;
            renderProfileView();
        } else {
            profileContent.innerHTML = `<h2>Profile Not Found</h2><p>A profile for this wallet address does not exist.</p>`;
        }
    } catch (error) {
        console.error('Error loading page data:', error);
        profileContent.innerHTML = `<h2>Error</h2><p>There was an error loading the profile.</p>`;
    }
}

// =================================================================================
// --- VIEW RENDERING FUNCTIONS ---
// =================================================================================

/**
 * Renders the main profile view, including bio, posts, and comments.
 */
function renderProfileView() {
    const isOwner = loggedInUserProfile && (loggedInUserProfile.wallet_address === viewedUserProfile.wallet_address);
    const profileContent = document.getElementById('profile-content');

    // Build Posts HTML
    let postsHtml = '<p style="color: #888;"><i>No posts yet.</i></p>';
    if (viewedUserProfile.posts && viewedUserProfile.posts.length > 0) {
        postsHtml = viewedUserProfile.posts.map(post => {
            const postAuthorPfp = viewedUserProfile.pfp_url ? `<img src="${viewedUserProfile.pfp_url}" alt="${viewedUserProfile.username}" class="post-author-pfp">` : `<div class="post-author-pfp-placeholder"></div>`;
            const commentTree = buildCommentTree(post.comments);
            const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);
            const postDate = new Date(post.created_at).toLocaleString();
            const updatedDateHtml = post.updated_at ? `<span style="color: #aaa; font-style: italic;">&nbsp;• Edited: ${new Date(post.updated_at).toLocaleString()}</span>` : '';
            const pinButtonText = post.is_pinned ? 'Unpin' : 'Pin';
            const postAdminButtons = isOwner ? `<button onclick="togglePinPost(${post.id}, ${post.is_pinned})" class="post-action-btn">${pinButtonText}</button><button onclick='renderEditPostView(${post.id}, "${encodeURIComponent(post.title)}", "${encodeURIComponent(post.content)}")' class="post-action-btn">Edit</button><button onclick="deletePost(${post.id})" class="post-action-btn delete">Delete</button>` : '';

            // --- VOTE LOGIC ---
            const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
            const userVote = loggedInUserProfile ? post.post_votes.find(v => v.user_id === loggedInUserProfile.id) : null;
            const upvoteClass = userVote && userVote.vote_type === 1 ? 'up active' : 'up';
            const downvoteClass = userVote && userVote.vote_type === -1 ? 'down active' : 'down';
            
            const voteHtml = loggedInUserProfile ? `
                <div class="vote-container">
                    <button onclick="handleVote(${post.id}, 1)" class="vote-btn ${upvoteClass}" aria-label="Upvote">👍</button>
                    <span class="vote-count">${voteTotal}</span>
                    <button onclick="handleVote(${post.id}, -1)" class="vote-btn ${downvoteClass}" aria-label="Downvote">👎</button>
                </div>
            ` : `<div class="vote-container"><span class="vote-count">${voteTotal} points</span></div>`;
            // --- END VOTE LOGIC ---

            return `
                <div class="post-item">
                    <div class="post-header">
                        ${postAuthorPfp}
                        <div class="post-author-info">
                            <a href="profile.html?user=${viewedUserProfile.wallet_address}" class="post-author-name footer-link">${viewedUserProfile.username}</a>
                            <small class="post-timestamp">${postDate}${updatedDateHtml}</small>
                        </div>
                        <div class="post-actions">${postAdminButtons}</div>
                    </div>
                    <div class="post-body">
                        <h4 class="post-title">${escapeHTML(post.title)}</h4>
                        <p class="post-content">${parseFormatting(post.content)}</p>
                        ${voteHtml}
                    </div>
                    <div class="comments-section">${commentsHtml}</div>
                    ${loggedInUserProfile ? `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 15px;"><input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${post.id})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button></div>` : ''}
                </div>
            `;
        }).join('');
    }

    // The rest of the function remains unchanged
    const bioText = viewedUserProfile.bio ? parseFormatting(viewedUserProfile.bio) : '<i>User has not written a bio yet.</i>';
    const pfpHtml = viewedUserProfile.pfp_url ? `<img src="${viewedUserProfile.pfp_url}" alt="User Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #ff5555; margin-bottom: 20px;">` : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #333; border: 3px solid #ff5555; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; text-align: center;">No Profile<br>Picture</div>`;
    let socialsHtml = '';
    if (viewedUserProfile.twitter_handle) { socialsHtml += `<a href="https://x.com/${viewedUserProfile.twitter_handle}" target="_blank" rel="noopener noreferrer" title="X / Twitter" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png" alt="X"></a>`; }
    if (viewedUserProfile.telegram_handle) { socialsHtml += `<a href="https://t.me/${viewedUserProfile.telegram_handle}" target="_blank" rel="noopener noreferrer" title="Telegram" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png" alt="Telegram"></a>`; }
    if (viewedUserProfile.discord_handle) { socialsHtml += `<a href="#" onclick="alert('Discord: ${viewedUserProfile.discord_handle}'); return false;" title="Discord" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png" alt="Discord"></a>`; }
    if (viewedUserProfile.youtube_url) { socialsHtml += `<a href="${viewedUserProfile.youtube_url}" target="_blank" rel="noopener noreferrer" title="YouTube" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png" alt="YouTube"></a>`; }
    if (viewedUserProfile.magiceden_url) { socialsHtml += `<a href="${viewedUserProfile.magiceden_url}" target="_blank" rel="noopener noreferrer" title="Magic Eden" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762140417/Magic_Eden_gl926b.png" alt="Magic Eden"></a>`; }
    
    profileContent.innerHTML = `
        ${pfpHtml}
        <span style="position: absolute; top: 30px; left: 30px; color: #ccc; font-size: 0.9rem;">👁️ ${viewedUserProfile.view_count || 0}</span>
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${viewedUserProfile.username}</h2>
        ${isOwner ? `<button id="edit-profile-btn" class="edit-profile-icon-btn">Edit</button>` : ''}
        ${viewedUserProfile.profile_song_url ? `
          <div id="profile-audio-player" style="margin-top: 15px; background: #2a2a2a; border-radius: 5px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; max-width: 350px; margin-left: auto; margin-right: auto;">
            <button id="profile-audio-play-pause" onclick="toggleProfileAudio()" style="background: #ff5555; color: #fff; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 1rem; cursor: pointer; flex-shrink: 0;">▶️</button>
            <div id="profile-song-title-container">
              <span id="profile-song-title" style="font-size: 0.9rem;">Loading song...</span>
            </div>
          </div>
          <div id="youtube-player-container" style="display: none;"></div>
        ` : ''}
        <div style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">${socialsHtml}</div>
        <div style="margin-top: 20px; border-top: 1px solid #444; padding: 20px 0;">
            <p style="text-align: left; color: #ccc;"><strong>Bio:</strong></p>
            <p style="text-align: left; min-height: 50px; white-space: pre-wrap; word-wrap: break-word;">${bioText}</p>
        </div>
        <div id="posts-section">
            <div class="posts-header">
                <h3>Posts</h3>
                ${isOwner ? `<button id="create-post-btn" class="cta-button">Create New Post</button>` : ''}
            </div>
            <div class="sort-container" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-bottom: 20px;">
                <label for="sort-posts" style="font-weight: bold; font-size: 0.9rem;">Sort by:</label>
                <select id="sort-posts" onchange="handleSortChange(this.value)" style="background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 5px;">
                    <option value="newest" ${currentSortOrder === 'newest' ? 'selected' : ''}>Newest</option>
                    <option value="oldest" ${currentSortOrder === 'oldest' ? 'selected' : ''}>Oldest</option>
                    <option value="top" disabled>Top Rated (Soon)</option>
                </select>
            </div>
            <div id="posts-list">${postsHtml}</div>
        </div>`;

    if (isOwner) {
        document.getElementById('edit-profile-btn').addEventListener('click', renderEditView);
        document.getElementById('create-post-btn').addEventListener('click', renderCreatePostView);
    }

    if (viewedUserProfile.profile_song_url) {
        setTimeout(() => {
            initYouTubePlayer(viewedUserProfile.profile_song_url);
        }, 0);
    }
}

/**
 * Renders the HTML for a single comment or a full tree recursively.
 */
function renderCommentsHtml(comments, postId, isPostOwner, loggedInUserProfile) {
    if (!comments || comments.length === 0) return '';
    
    const commentsArray = Array.isArray(comments) ? comments : [comments];

    return commentsArray.map(comment => {
        const isCommentOwner = loggedInUserProfile && (loggedInUserProfile.id === comment.author_id);
        const profile = comment.profiles || loggedInUserProfile;
        if (!profile) return '';

        const commenterPfp = profile.pfp_url ? `<img src="${profile.pfp_url}" alt="${profile.username}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : `<div style="width: 30px; height: 30px; border-radius: 50%; background: #555; margin-right: 10px;"></div>`;
        const commentAdminButtons = (isCommentOwner || isPostOwner) ? `<div style="margin-left: auto; display: flex; gap: 5px;">${isCommentOwner ? `<button onclick='renderEditCommentView(${comment.id}, "${encodeURIComponent(comment.content)}")' class="post-action-btn">Edit</button>` : ''}<button onclick="deleteComment(${comment.id})" class="post-action-btn delete">Delete</button></div>` : '';
        const commentDate = new Date(comment.created_at).toLocaleString();
        const commentEditedDate = comment.updated_at ? `<span style="font-style: italic;">&nbsp;• Edited: ${new Date(comment.updated_at).toLocaleString()}</span>` : '';
        
        const childrenHtml = comment.children ? renderCommentsHtml(comment.children, postId, isPostOwner, loggedInUserProfile) : '';

        return `
            <div id="comment-${comment.id}" class="comment-item">
                <div class="comment-main" style="display: flex; align-items: flex-start;">
                    ${commenterPfp}
                    <div style="background: #222; padding: 8px 12px; border-radius: 10px; width: 100%;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <a href="profile.html?user=${profile.wallet_address}" class="footer-link" style="font-weight: bold;">${profile.username}</a>
                            ${commentAdminButtons}
                        </div>
                        <p class="comment-content" style="margin: 5px 0 0; color: #ddd; white-space: pre-wrap; word-wrap: break-word;">${parseFormatting(comment.content)}</p>
                        <div class="comment-footer" style="display: flex; align-items: center; margin-top: 8px; gap: 15px;">
                            <small style="color: #888; font-size: 0.7rem;">${commentDate}${commentEditedDate}</small>
                            ${loggedInUserProfile ? `<button onclick="showReplyForm(${comment.id}, ${postId})" class="post-action-btn">Reply</button>` : ''}
                        </div>
                    </div>
                </div>
                <div id="reply-form-container-${comment.id}"></div>
                <div class="comment-children">${childrenHtml}</div>
            </div>
        `;
    }).join('');
}

/**
 * Renders the "Edit Profile" view.
 */
function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">Editing Profile</h2>
        <div style="text-align: left; margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 15px;">
            <div>
                <label for="pfp-upload" style="display: block; margin-bottom: 10px; font-weight: bold;">Upload New Profile Picture:</label>
                <input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" style="width: 100%; color: #eee; background: #111; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;">
            </div>
            <div>
                <label for="bio-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Your Bio:</label>
                <textarea id="bio-input" style="width: 100%; height: 120px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${viewedUserProfile.bio || ''}</textarea>
            </div>
            <hr style="border-color: #333;">
            <h3 style="margin-bottom: 10px;">Social Handles & URLs</h3>
            <div><label for="twitter-input" style="display: block; margin-bottom: 5px;">X / Twitter Handle:</label><input type="text" id="twitter-input" value="${viewedUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="telegram-input" style="display: block; margin-bottom: 5px;">Telegram Handle:</label><input type="text" id="telegram-input" value="${viewedUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="discord-input" style="display: block; margin-bottom: 5px;">Discord Handle:</label><input type="text" id="discord-input" value="${viewedUserProfile.discord_handle || ''}" placeholder="username" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="youtube-input" style="display: block; margin-bottom: 5px;">YouTube Channel URL:</label><input type="text" id="youtube-input" value="${viewedUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="magiceden-input" style="display: block; margin-bottom: 5px;">Magic Eden Profile URL:</label><input type="text" id="magiceden-input" value="${viewedUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <hr style="border-color: #333;">
            <h3 style="margin-bottom: 10px;">Profile Song</h3>
            <div>
                <label for="song-url-input" style="display: block; margin-bottom: 5px;">YouTube URL:</label>
                <input type="text" id="song-url-input" value="${viewedUserProfile.profile_song_url || ''}" placeholder="Paste a YouTube video link here..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
                <small style="color: #888; font-size: 0.8rem;">The audio will play from the video. We are not responsible for copyrighted content.</small>
            </div>
        </div>
        <div style="margin-top: 30px;">
            <button id="save-profile-btn" class="cta-button">Save Changes</button>
            <button id="cancel-edit-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>`;
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}

/**
 * Renders the "Create Post" view.
 */
function renderCreatePostView() {
    const postsSection = document.getElementById('posts-section');
    postsSection.innerHTML = `
        <h3 style="font-size: 2rem; color: #ff5555;">New Post</h3>
        <div style="text-align: left; margin-top: 20px;">
            <label for="post-title-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label>
            <input type="text" id="post-title-input" placeholder="Enter a title..." style="width: 100%; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-bottom: 15px;">
            <label for="post-content-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label>
            <div class="format-toolbar" style="margin-bottom: 5px; display: flex; gap: 5px;">
                <button onclick="formatText('b', 'post-content-input')">B</button>
                <button onclick="formatText('i', 'post-content-input')" style="font-style: italic;">I</button>
                <button onclick="formatText('u', 'post-content-input')" style="text-decoration: underline;">U</button>
            </div>
            <textarea id="post-content-input" placeholder="What's on your mind?" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;"></textarea>
        </div>
        <div style="margin-top: 20px;">
            <button id="submit-post-btn" class="cta-button">Submit Post</button>
            <button id="cancel-post-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>`;
    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', loadPageData);
}

/**
 * Renders the view for editing a specific post.
 */
function renderEditPostView(postId, currentTitle, currentContent) {
    const postsSection = document.getElementById('posts-section');
    const decodedTitle = decodeURIComponent(currentTitle);
    const decodedContent = decodeURIComponent(currentContent);
    postsSection.innerHTML = `
        <h3 style="font-size: 2rem; color: #ff5555;">Edit Post</h3>
        <div style="text-align: left; margin-top: 20px;">
            <label for="post-title-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label>
            <input type="text" id="post-title-input" value="${decodedTitle}" style="width: 100%; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-bottom: 15px;">
            <label for="post-content-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label>
            <div class="format-toolbar" style="margin-bottom: 5px; display: flex; gap: 5px;">
                <button onclick="formatText('b', 'post-content-input')">B</button>
                <button onclick="formatText('i', 'post-content-input')" style="font-style: italic;">I</button>
                <button onclick="formatText('u', 'post-content-input')" style="text-decoration: underline;">U</button>
            </div>
            <textarea id="post-content-input" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;">${decodedContent}</textarea>
        </div>
        <div style="margin-top: 20px;">
            <button onclick="updatePost(${postId})" class="cta-button">Save Update</button>
            <button onclick="loadPageData()" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>`;
}

/**
 * Renders the view for editing a specific comment.
 */
function renderEditCommentView(commentId, currentContent) {
    const commentContentEl = document.querySelector(`#comment-${commentId} .comment-content`);
    const commentFooterEl = document.querySelector(`#comment-${commentId} .comment-footer`);
    const decodedContent = decodeURIComponent(currentContent);
    
    // Hide original content and footer, show edit form
    commentContentEl.style.display = 'none';
    commentFooterEl.style.display = 'none';
    
    const editForm = document.createElement('div');
    editForm.className = 'edit-comment-form';
    editForm.innerHTML = `
        <textarea id="comment-edit-input-${commentId}" style="width: 100%; height: 80px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-top: 5px;">${decodedContent}</textarea>
        <div style="margin-top: 10px;">
            <button onclick="updateComment(${commentId})" class="cta-button" style="font-size: 0.8rem; padding: 6px 10px; margin: 0;">Save</button>
            <button onclick="loadPageData()" class="cta-button" style="font-size: 0.8rem; padding: 6px 10px; margin: 0; background: #555; border-color: #777; margin-left: 10px;">Cancel</button>
        </div>`;
    commentContentEl.parentNode.insertBefore(editForm, commentContentEl.nextSibling);
}

/**
 * Displays the reply form under a specific comment.
 */
function showReplyForm(parentCommentId, postId) {
    // Close any other open reply forms
    document.querySelectorAll('[id^="reply-form-container-"]').forEach(container => container.innerHTML = '');

    const container = document.getElementById(`reply-form-container-${parentCommentId}`);
    container.innerHTML = `
        <div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 10px; margin-left: 40px;">
            <input type="text" id="comment-input-reply-${parentCommentId}" placeholder="Write a reply..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;">
            <button onclick="submitComment(${postId}, ${parentCommentId})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button>
            <button onclick="this.parentElement.innerHTML = ''" class="cta-button" style="background: #555; font-size: 0.8rem; padding: 8px 12px; margin: 0;">Cancel</button>
        </div>`;
    document.getElementById(`comment-input-reply-${parentCommentId}`).focus();
}


// =================================================================================
// --- SUPABASE DATA MODIFICATION FUNCTIONS ---
// =================================================================================

/**
 * Saves changes made to a user's profile.
 */
async function saveProfileChanges() {
    const saveButton = document.getElementById('save-profile-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    const userWalletAddress = localStorage.getItem('walletAddress');

    try {
        const file = document.getElementById('pfp-upload').files[0];
        let pfpUrlToSave = viewedUserProfile.pfp_url;

        if (file) {
            saveButton.textContent = 'Uploading Image...';
            const fileExt = file.name.split('.').pop();
            const fileName = `${userWalletAddress}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage.from('profile-pictures').upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabaseClient.storage.from('profile-pictures').getPublicUrl(fileName);
            pfpUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Add cache-busting parameter
        }

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

        const { error: dbError } = await supabaseClient.from('profiles').update(newProfileData).eq('wallet_address', userWalletAddress);
        if (dbError) throw dbError;
        
        alert('Profile saved successfully!');
        loadPageData();

    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Could not save profile: ${error.message}`);
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}

/**
 * Saves a new post to the database.
 */
async function saveNewPost() {
    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    
    const title = document.getElementById('post-title-input').value;
    const content = document.getElementById('post-content-input').value;
    
    if (!title.trim() || !content.trim()) {
        alert("Title and content cannot be empty.");
        btn.disabled = false;
        btn.textContent = 'Submit Post';
        return;
    }
    
    try {
        const { error } = await supabaseClient.from('posts').insert({ title, content, author_id: viewedUserProfile.id });
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

/**
 * Updates an existing post in the database.
 */
async function updatePost(postId) {
    const newTitle = document.getElementById('post-title-input').value;
    const newContent = document.getElementById('post-content-input').value;
    if (!newTitle.trim() || !newContent.trim()) {
        alert("Title and content cannot be empty.");
        return;
    }
    try {
        const { error } = await supabaseClient.from('posts').update({ title: newTitle, content: newContent, updated_at: new Date() }).eq('id', postId);
        if (error) throw error;
        alert('Post updated successfully!');
        loadPageData();
    } catch (error) {
        console.error('Error updating post:', error);
        alert(`Could not update post: ${error.message}`);
    }
}

/**
 * Handles upvoting or downvoting a post.
 */
async function handleVote(postId, voteType) {
    if (!loggedInUserProfile) {
        alert("You must be logged in to vote.");
        return;
    }

    // Find the specific vote by the current user on this post
    const post = viewedUserProfile.posts.find(p => p.id === postId);
    const existingVote = post.post_votes.find(v => v.user_id === loggedInUserProfile.id);

    try {
        if (existingVote) {
            // Case 1: User has an existing vote
            if (existingVote.vote_type === voteType) {
                // User is clicking the same button again (e.g., upvoting an upvoted post), so we un-vote.
                const { error } = await supabaseClient.from('post_votes').delete().match({ id: existingVote.id });
                if (error) throw error;
            } else {
                // User is changing their vote (e.g., from up to down).
                const { error } = await supabaseClient.from('post_votes').update({ vote_type: voteType }).match({ id: existingVote.id });
                if (error) throw error;
            }
        } else {
            // Case 2: User has no existing vote, so we insert a new one.
            const { error } = await supabaseClient.from('post_votes').insert({
                post_id: postId,
                user_id: loggedInUserProfile.id,
                vote_type: voteType
            });
            if (error) throw error;
        }
        
        // Refresh the page data to show the new vote count
        loadPageData();

    } catch (error) {
        console.error('Error handling vote:', error);
        alert(`Failed to process vote: ${error.message}`);
    }
}

/**
 * Deletes a post from the database.
 */
async function deletePost(postId) {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
        if (error) throw error;
        alert('Post deleted successfully.');
        loadPageData();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Could not delete post: ${error.message}`);
    }
}

/**
 * Toggles the 'is_pinned' status of a post.
 */
async function togglePinPost(postId, currentStatus) {
    try {
        // Unpin all other posts for this user first if we are pinning a new one.
        if (!currentStatus) {
            await supabaseClient.from('posts').update({ is_pinned: false }).eq('author_id', viewedUserProfile.id);
        }

        // Toggle the selected post to the opposite of its current status.
        const { error } = await supabaseClient.from('posts').update({ is_pinned: !currentStatus }).eq('id', postId);
        if (error) throw error;
        loadPageData();
    } catch (error) {
        console.error('Error toggling pin status:', error);
        alert(`Could not update pin status: ${error.message}`);
    }
}

/**
 * Submits a new comment or reply to the database.
 */
async function submitComment(postId, parentCommentId = null) {
    const inputId = parentCommentId ? `comment-input-reply-${parentCommentId}` : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    const content = input.value;

    if (!content.trim()) {
        alert("Comment cannot be empty.");
        return;
    }
    if (!loggedInUserProfile) {
        alert("You must be logged in to comment.");
        return;
    }

    try {
        const { error } = await supabaseClient.from('comments').insert({
            content: content,
            author_id: loggedInUserProfile.id,
            post_id: postId,
            parent_comment_id: parentCommentId
        });
        if (error) throw error;
        input.value = '';
        loadPageData(); // Reload all data to ensure consistency
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert(`Could not submit comment: ${error.message}`);
    }
}

/**
 * Updates an existing comment in the database.
 */
async function updateComment(commentId) {
    const newContent = document.getElementById(`comment-edit-input-${commentId}`).value;
    if (!newContent.trim()) {
        alert("Comment cannot be empty.");
        return;
    }
    try {
        const { error } = await supabaseClient.from('comments').update({ content: newContent, updated_at: new Date() }).eq('id', commentId);
        if (error) throw error;
        loadPageData();
    } catch (error) {
        console.error('Error updating comment:', error);
        alert(`Could not update comment: ${error.message}`);
    }
}

/**
 * Deletes a comment from the database.
 */
async function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
        const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
        if (error) throw error;
        alert('Comment deleted.');
        loadPageData();
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert(`Could not delete comment: ${error.message}`);
    }
}

// =================================================================================
// --- UTILITY & HELPER FUNCTIONS ---
// =================================================================================

/**
 * A crucial security function to prevent XSS attacks.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/**
 * Parses simple formatting tags ([b], [i], [u]) into HTML.
 */
function parseFormatting(text) {
    if (!text) return '';
    let safeText = escapeHTML(text);
    return safeText
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
}

/**
 * Wraps selected text in a textarea with formatting tags.
 */
function formatText(tag, textareaId) {
    const textarea = document.getElementById(textareaId);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    if (selectedText) {
        textarea.value = `${beforeText}[${tag}]${selectedText}[/${tag}]${afterText}`;
        textarea.focus();
        textarea.selectionStart = start + `[${tag}]`.length;
        textarea.selectionEnd = end + `[${tag}]`.length;
    }
}

/**
 * Turns a flat array of comments into a nested tree structure.
 */
function buildCommentTree(comments) {
    const commentMap = {};
    const commentTree = [];
    if (!comments) return commentTree;

    comments.forEach(comment => {
        commentMap[comment.id] = { ...comment, children: [] };
    });

    Object.values(commentMap).forEach(comment => {
        if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].children.push(comment);
        } else {
            commentTree.push(comment);
        }
    });
    return commentTree;
}

/**
 * Handles the change of the post sorting dropdown.
 */
function handleSortChange(newOrder) {
    currentSortOrder = newOrder;
    isInitialLoad = false; // We don't want to increment view count when just sorting
    loadPageData();
}

// =================================================================================
// --- YOUTUBE PLAYER LOGIC ---
// =================================================================================

/**
 * This function is called by the YouTube API script tag once it's loaded.
 */
function onYouTubeIframeAPIReady() {
    // Intentionally left blank. We initialize the player when the profile renders.
}

/**
 * Initializes the YouTube player after a short delay.
 */
async function initYouTubePlayer(youtubeUrl) {
    // Wait for the browser to finish rendering before running.
    setTimeout(async () => {
        const titleElement = document.getElementById('profile-song-title');
        if (!titleElement) {
            console.error("Marquee title element not found in DOM.");
            return;
        }

        // Attempt to fetch and display the title immediately.
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
            const data = await response.json();
            if (data && data.title) {
                titleElement.textContent = data.title;
            } else {
                console.warn("oEmbed fetch did not return a title.");
            }
        } catch (fetchError) {
            console.error("Could not fetch YouTube title via oEmbed.", fetchError);
            if (titleElement) titleElement.textContent = "Error Loading Title";
        }
    }, 100);

    // Create the YouTube player instance in the background.
    try {
        const url = new URL(youtubeUrl);
        const videoId = url.searchParams.get("v");
        if (videoId) {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                window.onYouTubeIframeAPIReady = function() { createYouTubePlayer(videoId); };
            } else {
                createYouTubePlayer(videoId);
            }
        }
    } catch (e) {
        console.error("Error initializing YouTube player:", e);
    }
}

/**
 * Creates the YT.Player instance.
 */
function createYouTubePlayer(videoId) {
    if (profileYouTubePlayer) {
        profileYouTubePlayer.destroy();
    }
    profileYouTubePlayer = new YT.Player('youtube-player-container', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: { 'playsinline': 1 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

/**
 * Event handler for when the player is ready.
 */
function onPlayerReady(event) {
    // Intentionally left blank.
}

/**
 * Event handler for when the player's state changes (e.g., playing, paused).
 */
function onPlayerStateChange(event) {
    const playButton = document.getElementById('profile-audio-play-pause');
    const titleElement = document.getElementById('profile-song-title');
    if (!playButton || !titleElement) return;

    const isPlaying = event.data === YT.PlayerState.PLAYING;

    // Fallback to grab title on first play, just in case the initial fetch fails.
    if (isPlaying && (titleElement.textContent.includes("Loading") || titleElement.textContent.includes("Error"))) {
        const songTitle = event.target.getVideoData().title;
        if (songTitle) {
            titleElement.textContent = songTitle;
        }
    }

    // Add or remove the 'scrolling' class to control the animation.
    if (isPlaying) {
        playButton.textContent = '⏸️';
        titleElement.classList.add('scrolling');
    } else {
        playButton.textContent = '▶️';
        titleElement.classList.remove('scrolling');
    }
}

/**
 * Toggles the play/pause state of the video.
 */
function toggleProfileAudio() {
    if (!profileYouTubePlayer || typeof profileYouTubePlayer.getPlayerState !== 'function') {
        console.error("YouTube player not ready yet.");
        return;
    }
    const playerState = profileYouTubePlayer.getPlayerState();
    if (playerState == YT.PlayerState.PLAYING) {
        profileYouTubePlayer.pauseVideo();
    } else {
        profileYouTubePlayer.playVideo();
    }
}
