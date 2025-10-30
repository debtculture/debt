// =================================================================================
// --- INITIALIZATION ---
// =================================================================================
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
let viewedUserProfile = null;
let loggedInUserProfile = null;
let isInitialLoad = true;
let currentSortOrder = 'newest';
let profileYouTubePlayer;
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}
// =================================================================================
// --- MAIN LOGIC & DATA LOADING ---
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
    loadPageData();
});
async function loadPageData() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `<p>Loading profile...</p>`;
    const loggedInUserWallet = localStorage.getItem('walletAddress');
    if (loggedInUserWallet) {
        const { data } = await supabaseClient.from('profiles').select('*').eq('wallet_address', loggedInUserWallet).single();
        if (data) loggedInUserProfile = data;
    }
    const urlParams = new URLSearchParams(window.location.search);
    let addressToLoad = urlParams.get('user') || loggedInUserWallet;
    if (!addressToLoad) {
        profileContent.innerHTML = `<h2>No User Found</h2><p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>`;
        return;
    }
    try {
        let sortAscending = currentSortOrder === 'oldest';
        if (currentSortOrder === 'top') {
            sortAscending = false;
        }
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select(`*, posts (*, comments (*, profiles (*)), post_votes (*))`)
            .eq('wallet_address', addressToLoad)
            .order('is_pinned', { foreignTable: 'posts', ascending: false })
            .order('created_at', { foreignTable: 'posts', ascending: sortAscending })
            .order('created_at', { foreignTable: 'posts.comments', ascending: true })
            .single();
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
     
        if (profileData) {
            if (currentSortOrder === 'top' && profileData.posts) {
                profileData.posts.sort((a, b) => {
                    const scoreB = b.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
                    const scoreA = a.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
                    if (scoreB !== scoreA) { return scoreB - scoreA; }
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            }
            const { count: followerCount } = await supabaseClient.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id);
            const { count: followingCount } = await supabaseClient.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id);
            const { data: isFollowingData } = await supabaseClient.from('followers').select('id').eq('follower_id', loggedInUserProfile?.id).eq('following_id', profileData.id);
         
            profileData.followerCount = followerCount;
            profileData.followingCount = followingCount;
            profileData.isFollowedByCurrentUser = isFollowingData && isFollowingData.length > 0;
            if (isInitialLoad) {
                supabaseClient.rpc('increment_view_count', { wallet_address_to_increment: addressToLoad })
                    .then(({ error }) => { if (error) console.error('Error incrementing view count:', error); });
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
// --- VIEW RENDERING FUNCTIONS (Profile-Specific) ---
// =================================================================================
function renderProfileView() {
    const isOwner = loggedInUserProfile && (loggedInUserProfile.wallet_address === viewedUserProfile.wallet_address);
    const profileContent = document.getElementById('profile-content');
    let followButtonHtml = '';
    if (loggedInUserProfile && !isOwner) {
        const buttonText = viewedUserProfile.isFollowedByCurrentUser ? 'Unfollow' : 'Follow';
        const buttonClass = viewedUserProfile.isFollowedByCurrentUser ? 'follow-btn unfollow' : 'follow-btn';
        followButtonHtml = `<button class="${buttonClass}" onclick="handleFollow()">${buttonText}</button>`;
    }
    const statsHtml = renderStats();
    const lastSeenHtml = viewedUserProfile.last_seen ? `<p style="color: #888; font-size: 0.9rem; margin-top: -10px; margin-bottom: 20px;">Last seen: ${new Date(viewedUserProfile.last_seen).toLocaleString()}</p>` : '';
    const postsHtml = renderPostsList(isOwner);
    const bioText = viewedUserProfile.bio ? parseUserTags(parseFormatting(viewedUserProfile.bio)) : '<i>User has not written a bio yet.</i>';
 
    const pfpHtml = `<div class="pfp-container">${viewedUserProfile.pfp_url ? `<img src="${viewedUserProfile.pfp_url}" alt="User Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #ff5555;">` : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #333; border: 3px solid #ff5555; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; text-align: center;">No Profile<br>Picture</div>`}</div>`;
    let socialsHtml = renderSocials();
    profileContent.innerHTML = `
        ${pfpHtml}
        <span style="position: absolute; top: 30px; left: 30px; color: #ccc; font-size: 0.9rem;">👁️ ${viewedUserProfile.view_count || 0}</span>
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${viewedUserProfile.username}</h2>
        ${isOwner ? `<button id="edit-profile-btn" class="edit-profile-icon-btn">Edit</button>` : ''}
        ${statsHtml}
        ${lastSeenHtml}
        ${followButtonHtml}
        ${viewedUserProfile.profile_song_url ? renderSongPlayer() : ''}
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
                    <option value="top" ${currentSortOrder === 'top' ? 'selected' : ''}>Top Rated</option>
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
function renderStats() {
    return `<div class="profile-stats"><div class="stat-item"><strong>${viewedUserProfile.followingCount || 0}</strong> Following</div><div class="stat-item"><strong>${viewedUserProfile.followerCount || 0}</strong> Followers</div></div>`;
}
function renderSocials() {
    let socialsHtml = '';
    if (viewedUserProfile.twitter_handle) { socialsHtml += `<a href="https://x.com/${viewedUserProfile.twitter_handle}" target="_blank" rel="noopener noreferrer" title="X / Twitter" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png" alt="X"></a>`; }
    if (viewedUserProfile.telegram_handle) { socialsHtml += `<a href="https://t.me/${viewedUserProfile.telegram_handle}" target="_blank" rel="noopener noreferrer" title="Telegram" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png" alt="Telegram"></a>`; }
    if (viewedUserProfile.discord_handle) { socialsHtml += `<a href="#" onclick="alert('Discord: ${viewedUserProfile.discord_handle}'); return false;" title="Discord" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png" alt="Discord"></a>`; }
    if (viewedUserProfile.youtube_url) { socialsHtml += `<a href="${viewedUserProfile.youtube_url}" target="_blank" rel="noopener noreferrer" title="YouTube" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png" alt="YouTube"></a>`; }
    if (viewedUserProfile.magiceden_url) { socialsHtml += `<a href="${viewedUserProfile.magiceden_url}" target="_blank" rel="noopener noreferrer" title="Magic Eden" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762140417/Magic_Eden_gl926b.png" alt="Magic Eden"></a>`; }
    return socialsHtml;
}
function renderSongPlayer() {
    return `
          <div id="profile-audio-player" style="margin-top: 15px; background: #2a2a2a; border-radius: 5px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; max-width: 350px; margin-left: auto; margin-right: auto;">
            <button id="profile-audio-play-pause" onclick="toggleProfileAudio()" style="background: #ff5555; color: #fff; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 1rem; cursor: pointer; flex-shrink: 0;">▶️</button>
            <div id="profile-song-title-container">
              <span id="profile-song-title" style="font-size: 0.9rem;">Loading song...</span>
            </div>
          </div>
          <div id="youtube-player-container" style="display: none;"></div>
    `;
}
function renderPostsList(isOwner) {
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
            const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
            const userVote = loggedInUserProfile ? post.post_votes.find(v => v.user_id === loggedInUserProfile.id) : null;
            const upvoteClass = userVote && userVote.vote_type === 1 ? 'up active' : 'up';
            const downvoteClass = userVote && userVote.vote_type === -1 ? 'down active' : 'down';
            const voteHtml = loggedInUserProfile ? `<div class="vote-container"><button onclick="handleVote(${post.id}, 1)" class="vote-btn ${upvoteClass}" aria-label="Upvote">👍</button><span class="vote-count">${voteTotal}</span><button onclick="handleVote(${post.id}, -1)" class="vote-btn ${downvoteClass}" aria-label="Downvote">👎</button></div>` : `<div class="vote-container"><span class="vote-count">${voteTotal} points</span></div>`;
            const processedContent = parseUserTags(parseFormatting(post.content));
            return `<div class="post-item"><div class="post-header">${postAuthorPfp}<div class="post-author-info"><a href="profile.html?user=${viewedUserProfile.wallet_address}" class="post-author-name footer-link">${viewedUserProfile.username}</a><small class="post-timestamp">${postDate}${updatedDateHtml}</small></div><div class="post-actions">${postAdminButtons}</div></div><div class="post-body"><h4 class="post-title">${escapeHTML(post.title)}</h4><p class="post-content">${processedContent}</p>${voteHtml}</div><div class="comments-section">${commentsHtml}</div>${loggedInUserProfile ? `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 15px;"><input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${post.id})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button></div>` : ''}</div>`;
        }).join('');
    }
    return postsHtml;
}
function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `<h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">Editing Profile</h2><div style="text-align: left; margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 15px;"><div><label for="pfp-upload" style="display: block; margin-bottom: 10px; font-weight: bold;">Upload New Profile Picture:</label><input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" style="width: 100%; color: #eee; background: #111; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;"></div><div><label for="bio-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Your Bio:</label><textarea id="bio-input" style="width: 100%; height: 120px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${viewedUserProfile.bio || ''}</textarea></div><hr style="border-color: #333;"><h3 style="margin-bottom: 10px;">Social Handles & URLs</h3><div><label for="twitter-input" style="display: block; margin-bottom: 5px;">X / Twitter Handle:</label><input type="text" id="twitter-input" value="${viewedUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="telegram-input" style="display: block; margin-bottom: 5px;">Telegram Handle:</label><input type="text" id="telegram-input" value="${viewedUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="discord-input" style="display: block; margin-bottom: 5px;">Discord Handle:</label><input type="text" id="discord-input" value="${viewedUserProfile.discord_handle || ''}" placeholder="username" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="youtube-input" style="display: block; margin-bottom: 5px;">YouTube Channel URL:</label><input type="text" id="youtube-input" value="${viewedUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="magiceden-input" style="display: block; margin-bottom: 5px;">Magic Eden Profile URL:</label><input type="text" id="magiceden-input" value="${viewedUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><hr style="border-color: #333;"><h3 style="margin-bottom: 10px;">Profile Song</h3><div><label for="song-url-input" style="display: block; margin-bottom: 5px;">YouTube URL:</label><input type="text" id="song-url-input" value="${viewedUserProfile.profile_song_url || ''}" placeholder="Paste a YouTube video link here..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"><small style="color: #888; font-size: 0.8rem;">The audio will play from the video. We are not responsible for copyrighted content.</small></div></div><div style="margin-top: 30px;"><button id="save-profile-btn" class="cta-button">Save Changes</button><button id="cancel-edit-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button></div>`;
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}
function renderCreatePostView() {
    const postsSection = document.getElementById('posts-section');
    postsSection.innerHTML = `<h3 style="font-size: 2rem; color: #ff5555;">New Post</h3><div style="text-align: left; margin-top: 20px;"><label for="post-title-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label><input type="text" id="post-title-input" placeholder="Enter a title..." style="width: 100%; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-bottom: 15px;"><label for="post-content-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label><div class="format-toolbar" style="margin-bottom: 5px; display: flex; gap: 5px;"><button onclick="formatText('b', 'post-content-input')">B</button><button onclick="formatText('i', 'post-content-input')" style="font-style: italic;">I</button><button onclick="formatText('u', 'post-content-input')" style="text-decoration: underline;">U</button></div><textarea id="post-content-input" placeholder="What's on your mind?" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;"></textarea></div><div style="margin-top: 20px;"><button id="submit-post-btn" class="cta-button">Submit Post</button><button id="cancel-post-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button></div>`;
    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', loadPageData);
}
function renderEditPostView(postId, currentTitle, currentContent) {
    const postsSection = document.getElementById('posts-section');
    const decodedTitle = decodeURIComponent(currentTitle);
    const decodedContent = decodeURIComponent(currentContent);
    postsSection.innerHTML = `<h3 style="font-size: 2rem; color: #ff5555;">Edit Post</h3><div style="text-align: left; margin-top: 20px;"><label for="post-title-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label><input type="text" id="post-title-input" value="${decodedTitle}" style="width: 100%; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-bottom: 15px;"><label for="post-content-input" style="display: block; margin-bottom: 5px; font-weight: bold;">Content:</label><div class="format-toolbar" style="margin-bottom: 5px; display: flex; gap: 5px;"><button onclick="formatText('b', 'post-content-input')">B</button><button onclick="formatText('i', 'post-content-input')" style="font-style: italic;">I</button><button onclick="formatText('u', 'post-content-input')" style="text-decoration: underline;">U</button></div><textarea id="post-content-input" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;">${decodedContent}</textarea></div><div style="margin-top: 20px;"><button onclick="updatePost(${postId})" class="cta-button">Save Update</button><button onclick="loadPageData()" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button></div>`;
}
// =================================================================================
// --- SUPABASE DATA MODIFICATION FUNCTIONS (Profile-Specific) ---
// =================================================================================
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
            pfpUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
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
async function updatePost(postId) {
    const newTitle = document.getElementById('post-title-input').value;
    const newContent = document.getElementById('post-content-input').value;
    if (!newTitle.trim() || !newContent.trim()) { return alert("Title and content cannot be empty."); }
    try {
        const { error } = await supabaseClient.from('posts').update({ title: newTitle, content: newContent, updated_at: new Date() }).eq('id', postId);
        if (error) throw error;
        alert('Post updated successfully!');
        loadPageData();
    } catch (error) { console.error('Error updating post:', error); alert(`Could not update post: ${error.message}`); }
}
async function deletePost(postId) {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
        if (error) throw error;
        alert('Post deleted successfully.');
        loadPageData();
    } catch (error) { console.error('Error deleting post:', error); alert(`Could not delete post: ${error.message}`); }
}
async function togglePinPost(postId, currentStatus) {
    try {
        if (!currentStatus) {
            await supabaseClient.from('posts').update({ is_pinned: false }).eq('author_id', viewedUserProfile.id);
        }
        const { error } = await supabaseClient.from('posts').update({ is_pinned: !currentStatus }).eq('id', postId);
        if (error) throw error;
        loadPageData();
    } catch (error) { console.error('Error toggling pin status:', error); alert(`Could not update pin status: ${error.message}`); }
}
async function handleFollow() {
    if (!loggedInUserProfile) { return alert("You must be logged in to follow users."); }
    if (loggedInUserProfile.id === viewedUserProfile.id) { return alert("You cannot follow yourself."); }
    try {
        const { data: existingFollow, error: checkError } = await supabaseClient.from('followers').select('*').eq('follower_id', loggedInUserProfile.id).eq('following_id', viewedUserProfile.id).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingFollow) {
            const { error } = await supabaseClient.from('followers').delete().match({ id: existingFollow.id });
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('followers').insert({ follower_id: loggedInUserProfile.id, following_id: viewedUserProfile.id });
            if (error) throw error;
        }
        loadPageData();
    } catch (error) { console.error('Error handling follow:', error); alert(`Failed to process follow: ${error.message}`); }
}
function handleSortChange(newOrder) {
    currentSortOrder = newOrder;
    isInitialLoad = false;
    loadPageData = debounce(loadPageData, 300);
    loadPageData();
}
// =================================================================================
// --- YOUTUBE PLAYER LOGIC (Profile-Specific) ---
// =================================================================================
function onYouTubeIframeAPIReady() {}
async function initYouTubePlayer(youtubeUrl) {
    setTimeout(async () => {
        const titleElement = document.getElementById('profile-song-title');
        if (!titleElement) { return console.error("Marquee title element not found in DOM."); }
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
            const data = await response.json();
            if (data && data.title) { titleElement.textContent = data.title; }
            else { console.warn("oEmbed fetch did not return a title."); }
        } catch (fetchError) {
            console.error("Could not fetch YouTube title via oEmbed.", fetchError);
            if (titleElement) titleElement.textContent = "Error Loading Title";
        }
    }, 100);
    try {
        const url = new URL(youtubeUrl);
        const videoId = url.searchParams.get("v");
        if (videoId) {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                window.onYouTubeIframeAPIReady = function() { createYouTubePlayer(videoId); };
            } else { createYouTubePlayer(videoId); }
        }
    } catch (e) { console.error("Error initializing YouTube player:", e); }
}
function createYouTubePlayer(videoId) {
    if (profileYouTubePlayer) { profileYouTubePlayer.destroy(); }
    profileYouTubePlayer = new YT.Player('youtube-player-container', {
        height: '0', width: '0', videoId: videoId,
        playerVars: { 'playsinline': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
    });
}
function onPlayerReady(event) {}
function onPlayerStateChange(event) {
    const playButton = document.getElementById('profile-audio-play-pause');
    const titleElement = document.getElementById('profile-song-title');
    if (!playButton || !titleElement) return;
    const isPlaying = event.data === YT.PlayerState.PLAYING;
    if (isPlaying && (titleElement.textContent.includes("Loading") || titleElement.textContent.includes("Error"))) {
        const songTitle = event.target.getVideoData().title;
        if (songTitle) { titleElement.textContent = songTitle; }
    }
    if (isPlaying) {
        playButton.textContent = '⏸️';
        titleElement.classList.add('scrolling');
    } else {
        playButton.textContent = '▶️';
        titleElement.classList.remove('scrolling');
    }
}
function toggleProfileAudio() {
    if (!profileYouTubePlayer || typeof profileYouTubePlayer.getPlayerState !== 'function') { return console.error("YouTube player not ready yet."); }
    const playerState = profileYouTubePlayer.getPlayerState();
    if (playerState == YT.PlayerState.PLAYING) {
        profileYouTubePlayer.pauseVideo();
    } else { profileYouTubePlayer.playVideo(); }
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
// Inserts BBCode tags around selected text in a textarea
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
