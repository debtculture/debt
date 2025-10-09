// This script contains all the logic for the user profile page.

// --- Initialize Supabase Client ---
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Global Variables ---
let viewedUserProfile = null;
let loggedInUserProfile = null;
let isInitialLoad = true;
let currentSortOrder = 'newest'; // Can be 'newest' or 'oldest'
let profileYouTubePlayer;

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    loadPageData();
});

// --- HELPER FUNCTIONS ---

/**
 * A crucial security function to prevent XSS attacks.
 * It escapes HTML characters so user input is treated as plain text.
 * @param {string} str - The raw string from the user.
 * @returns {string} The sanitized string.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/**
 * Parses our simple formatting tags ([b], [i], [u]) into HTML.
 * @param {string} text - The text from the database.
 * @returns {string} The formatted HTML string.
 */
function parseFormatting(text) {
    if (!text) return '';
    // First, escape any potential HTML the user typed in.
    let safeText = escapeHTML(text);
    // Then, replace our safe tags with real HTML tags.
    return safeText
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
}

/**
 * Wraps selected text in a textarea with formatting tags.
 * @param {string} tag - The tag to use ('b', 'i', or 'u').
 * @param {string} textareaId - The ID of the textarea element.
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
        // Place cursor after the newly inserted tags
        textarea.selectionStart = start + `[${tag}]`.length;
        textarea.selectionEnd = end + `[${tag}]`.length;
    }
}


/**
 * Main function to fetch all necessary data for the page.
 */
async function loadPageData() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `<p>Loading profile...</p>`;

    const loggedInUserWallet = localStorage.getItem('walletAddress');
    if (loggedInUserWallet) {
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('wallet_address', loggedInUserWallet).single();
        if (data) loggedInUserProfile = data;
    }

    const urlParams = new URLSearchParams(window.location.search);
    let addressToLoad = urlParams.get('user') || loggedInUserWallet;

    if (!addressToLoad) {
        profileContent.innerHTML = `<h2>No User Found</h2><p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>`;
        return;
    }

    try {
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select(`*, posts (*, comments (*, profiles (*)))`)
            .eq('wallet_address', addressToLoad)
            .order('is_pinned', { foreignTable: 'posts', ascending: false })
            .order('created_at', { foreignTable: 'posts', ascending: currentSortOrder === 'oldest' })
            .order('created_at', { foreignTable: 'posts.comments', ascending: true })
            .single();

        if (profileError) throw profileError;
        
        if (profileData) {
            // On the very first load of the page, increment the view count.
            if (isInitialLoad) {
              supabaseClient.rpc('increment_view_count', {
                wallet_address_to_increment: addressToLoad
              }).then(({ error }) => {
                if (error) console.error('Error incrementing view count:', error);
              });
              isInitialLoad = false; // Set the flag so this doesn't run again on refreshes.
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

function handleSortChange(newOrder) {
  currentSortOrder = newOrder;
  // We don't want to increment the view count when just sorting, so we set the flag to false first.
  isInitialLoad = false; 
  loadPageData();
}

async function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
        const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
        if (error) throw error;
        alert('Comment deleted.');
        loadPageData();
    } catch (error) { console.error('Error deleting comment:', error); alert(`Could not delete comment: ${error.message}`); }
}

async function updateComment(commentId) {
    const newContent = document.getElementById(`comment-edit-input-${commentId}`).value;
    if (!newContent.trim()) { alert("Comment cannot be empty."); return; }
    try {
        const { error } = await supabaseClient.from('comments').update({ content: newContent, updated_at: new Date() }).eq('id', commentId);
        if (error) throw error;
        loadPageData();
    } catch (error) { console.error('Error updating comment:', error); alert(`Could not update comment: ${error.message}`); }
}

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
        </div>
    `;
}

async function updatePost(postId) {
    const newTitle = document.getElementById('post-title-input').value;
    const newContent = document.getElementById('post-content-input').value;
    if (!newTitle.trim() || !newContent.trim()) { alert("Title and content cannot be empty."); return; }
    try {
        const { error } = await supabaseClient.from('posts').update({ title: newTitle, content: newContent }).eq('id', postId);
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
    // To ensure only one post is ever pinned, we first unpin all other posts for this user.
    // This only runs when we are about to PIN a new post.
    if (!currentStatus) {
      await supabaseClient
        .from('posts')
        .update({ is_pinned: false })
        .eq('author_id', viewedUserProfile.id);
    }

    // Now, toggle the selected post to the opposite of its current status.
    const { error } = await supabaseClient
      .from('posts')
      .update({ is_pinned: !currentStatus })
      .eq('id', postId);

    if (error) throw error;
    loadPageData(); // Reload the profile to show the change
  } catch (error) {
    console.error('Error toggling pin status:', error);
    alert(`Could not update pin status: ${error.message}`);
  }
}

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
        </div>
    `;
    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', loadPageData);
}

async function saveNewPost() {
    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true; btn.textContent = 'Submitting...';
    const title = document.getElementById('post-title-input').value;
    const content = document.getElementById('post-content-input').value;
    if (!title.trim() || !content.trim()) {
        alert("Title and content cannot be empty.");
        btn.disabled = false;
        btn.textContent = 'Submit Post';
        return;
    }
    try {
        const { error } = await supabaseClient.from('posts').insert({ title: title, content: content, author_id: viewedUserProfile.id });
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

function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `<h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">Editing Profile</h2><div style="text-align: left; margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 15px;"><div><label for="pfp-upload" style="display: block; margin-bottom: 10px; font-weight: bold;">Upload New Profile Picture:</label><input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" style="width: 100%; color: #eee; background: #111; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;"></div><div><label for="bio-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Your Bio:</label><textarea id="bio-input" style="width: 100%; height: 120px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${viewedUserProfile.bio || ''}</textarea></div><hr style="border-color: #333;"><h3 style="margin-bottom: 10px;">Social Handles & URLs</h3><div><label for="twitter-input" style="display: block; margin-bottom: 5px;">X / Twitter Handle:</label><input type="text" id="twitter-input" value="${viewedUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="telegram-input" style="display: block; margin-bottom: 5px;">Telegram Handle:</label><input type="text" id="telegram-input" value="${viewedUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="discord-input" style="display: block; margin-bottom: 5px;">Discord Handle:</label><input type="text" id="discord-input" value="${viewedUserProfile.discord_handle || ''}" placeholder="username" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="youtube-input" style="display: block; margin-bottom: 5px;">YouTube Channel URL:</label><input type="text" id="youtube-input" value="${viewedUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div><div><label for="magiceden-input" style="display: block; margin-bottom: 5px;">Magic Eden Profile URL:</label><input type="text" id="magiceden-input" value="${viewedUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
    <hr style="border-color: #333;">
    <h3 style="margin-bottom: 10px;">Profile Song</h3>
    <div>
        <label for="song-url-input" style="display: block; margin-bottom: 5px;">YouTube URL:</label>
        <input type="text" id="song-url-input" value="${viewedUserProfile.profile_song_url || ''}" placeholder="Paste a YouTube video link here..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
        <small style="color: #888; font-size: 0.8rem;">The audio will play from the video. We are not responsible for copyrighted content.</small>
    </div>
    </div><div style="margin-top: 30px;"><button id="save-profile-btn" class="cta-button">Save Changes</button><button id="cancel-edit-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button></div>`;
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}

async function saveProfileChanges() {
    const saveButton = document.getElementById('save-profile-btn');
    saveButton.disabled = true; saveButton.textContent = 'Saving...';
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
            pfpUrlToSave = urlData.publicUrl;
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

// --- NEW HELPER FUNCTIONS FOR NESTED COMMENTS ---

// Turns a flat array of comments into a nested tree structure
function buildCommentTree(comments) {
    const commentMap = {};
    const commentTree = [];

    // First, map all comments by their ID
    comments.forEach(comment => {
        commentMap[comment.id] = { ...comment, children: [] };
    });

    // Then, build the tree by linking children to their parents
    Object.values(commentMap).forEach(comment => {
        if (comment.parent_comment_id) {
            if (commentMap[comment.parent_comment_id]) {
                commentMap[comment.parent_comment_id].children.push(comment);
            }
        } else {
            commentTree.push(comment);
        }
    });

    return commentTree;
}

// Renders the HTML for a single comment or a full tree
function renderCommentsHtml(comments, postId, isPostOwner, loggedInUserProfile) {
    if (!comments || comments.length === 0) return '';
    
    // If 'comments' isn't an array, wrap it in one so we can reuse the logic
    const commentsArray = Array.isArray(comments) ? comments : [comments];

    return commentsArray.map(comment => {
        const isCommentOwner = loggedInUserProfile && (loggedInUserProfile.id === comment.author_id);
        
        // Use comment.profiles if it exists, otherwise fall back to loggedInUserProfile for new comments
        const profile = comment.profiles || loggedInUserProfile;
        if (!profile) return ''; // Skip if we can't identify the commenter

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


// Submits comments and dynamically adds them to the page
async function submitComment(postId, parentCommentId = null) {
    const inputId = parentCommentId ? `comment-input-reply-${parentCommentId}` : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    const content = input.value;

    if (!content.trim()) { alert("Comment cannot be empty."); return; }
    if (!loggedInUserProfile) { alert("You must be logged in to comment."); return; }

    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .insert({ 
                content: content, 
                author_id: loggedInUserProfile.id, 
                post_id: postId,
                parent_comment_id: parentCommentId
            })
            .select() // Ask Supabase to return the new comment
            .single();

        if (error) throw error;
        
        const newCommentHtml = renderCommentsHtml(data, postId, (loggedInUserProfile.id === viewedUserProfile.id), loggedInUserProfile);
        
        if (parentCommentId) {
            // It's a reply, append it to the parent's children container
            const parentContainer = document.querySelector(`#comment-${parentCommentId} .comment-children`);
            parentContainer.insertAdjacentHTML('beforeend', newCommentHtml);
            // Close the reply form
            document.getElementById(`reply-form-container-${parentCommentId}`).innerHTML = '';
        } else {
            // It's a top-level comment, append it to the main comments section
            const postContainer = input.closest('.post-item');
            const commentsSection = postContainer.querySelector('.comments-section');
            commentsSection.insertAdjacentHTML('beforeend', newCommentHtml);
        }

        input.value = ''; // Clear the input field

    } catch (error) { 
        console.error('Error submitting comment:', error); 
        alert(`Could not submit comment: ${error.message}`); 
    }
}

function showReplyForm(parentCommentId, postId) {
    // Close any other open reply forms
    document.querySelectorAll('[id^="reply-form-container-"]').forEach(container => container.innerHTML = '');

    const container = document.getElementById(`reply-form-container-${parentCommentId}`);
    container.innerHTML = `
        <div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 10px; margin-left: 40px;">
            <input type="text" id="comment-input-reply-${parentCommentId}" placeholder="Write a reply..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;">
            <button onclick="submitComment(${postId}, ${parentCommentId})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button>
            <button onclick="this.parentElement.innerHTML = ''" class="cta-button" style="background: #555; font-size: 0.8rem; padding: 8px 12px; margin: 0;">Cancel</button>
        </div>
    `;
    document.getElementById(`comment-input-reply-${parentCommentId}`).focus();
}

// Renders the view to edit an existing comment
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
        </div>
    `;
    commentContentEl.parentNode.insertBefore(editForm, commentContentEl.nextSibling);
}

// Renders the entire profile, now with nested comments
function renderProfileView() {
    const isOwner = loggedInUserProfile && (loggedInUserProfile.wallet_address === viewedUserProfile.wallet_address);
    const profileContent = document.getElementById('profile-content');

    let postsHtml = '';
    if (viewedUserProfile.posts.length > 0) {
        const postAuthorPfp = viewedUserProfile.pfp_url ? `<img src="${viewedUserProfile.pfp_url}" alt="${viewedUserProfile.username}" class="post-author-pfp">` : `<div class="post-author-pfp-placeholder"></div>`;
        postsHtml = viewedUserProfile.posts.map(post => {
            const commentTree = buildCommentTree(post.comments);
            const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);

            const postDate = new Date(post.created_at).toLocaleString();
            const updatedDateHtml = post.updated_at ? `<span style="color: #aaa; font-style: italic;">&nbsp;• Edited: ${new Date(post.updated_at).toLocaleString()}</span>` : '';
            const pinButtonText = post.is_pinned ? 'Unpin' : 'Pin';
            const postAdminButtons = isOwner ? `<button onclick="togglePinPost(${post.id}, ${post.is_pinned})" class="post-action-btn">${pinButtonText}</button><button onclick='renderEditPostView(${post.id}, "${encodeURIComponent(post.title)}", "${encodeURIComponent(post.content)}")' class="post-action-btn">Edit</button><button onclick="deletePost(${post.id})" class="post-action-btn delete">Delete</button>` : '';

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
                    </div>
                    <div class="comments-section">${commentsHtml}</div>
                    ${loggedInUserProfile ? `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 15px;"><input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${post.id})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button></div>` : ''}
                </div>
            `;
        }).join('');
    } else { postsHtml = `<p style="color: #888;"><i>No posts yet.</i></p>`; }

    const bioText = viewedUserProfile.bio ? parseFormatting(viewedUserProfile.bio) : '<i>User has not written a bio yet.</i>';
    const pfpHtml = viewedUserProfile.pfp_url ? `<img src="${viewedUserProfile.pfp_url}" alt="User Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #ff5555; margin-bottom: 20px;">` : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #333; border: 3px solid #ff5555; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; text-align: center;">No Profile<br>Picture</div>`;
    let socialsHtml = '';
    if (viewedUserProfile.twitter_handle) { socialsHtml += `<a href="https://x.com/${viewedUserProfile.twitter_handle}" target="_blank" rel="noopener noreferrer" title="X / Twitter" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png" alt="X"></a>`; }
    if (viewedUserProfile.telegram_handle) { socialsHtml += `<a href="https://t.me/${viewedUserProfile.telegram_handle}" target="_blank" rel="noopener noreferrer" title="Telegram" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png" alt="Telegram"></a>`; }
    if (viewedUserProfile.discord_handle) { socialsHtml += `<a href="#" onclick="alert('Discord: ${viewedUserProfile.discord_handle}'); return false;" title="Discord" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png" alt="Discord"></a>`; }
    if (viewedUserProfile.youtube_url) { socialsHtml += `<a href="${viewedUserProfile.youtube_url}" target="_blank" rel="noopener noreferrer" title="YouTube" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png" alt="YouTube"></a>`; }
    if (viewedUserProfile.magiceden_url) { socialsHtml += `<a href="${viewedUserProfile.magiceden_url}" target="_blank" rel="noopener noreferrer" title="Magic Eden" class="social-icon-link"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762140417/Magic_Eden_gl926b.png" alt="Magic Eden"></a>`; }
    
    profileContent.innerHTML = `${pfpHtml}
    <span style="position: absolute; top: 30px; left: 30px; color: #ccc; font-size: 0.9rem;">👁️ ${viewedUserProfile.view_count || 0}</span>
    <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${viewedUserProfile.username}</h2>${isOwner ? `<button id="edit-profile-btn" class="edit-profile-icon-btn">Edit</button>` : ''}
    ${viewedUserProfile.profile_song_url ? `
      <div id="profile-audio-player" style="margin-top: 15px; background: #2a2a2a; border-radius: 5px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; max-width: 350px; margin-left: auto; margin-right: auto;">
        <button id="profile-audio-play-pause" onclick="toggleProfileAudio()" style="background: #ff5555; color: #fff; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 1rem; cursor: pointer; flex-shrink: 0;">▶️</button>
        <div id="profile-song-title-container">
          <span id="profile-song-title" style="font-size: 0.9rem;">Loading song...</span>
        </div>
      </div>
      <div id="youtube-player-container" style="display: none;"></div>
    ` : ''}
    <div style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">${socialsHtml}</div><div style="margin-top: 20px; border-top: 1px solid #444; padding: 20px 0;"><p style="text-align: left; color: #ccc;"><strong>Bio:</strong></p><p style="text-align: left; min-height: 50px; white-space: pre-wrap; word-wrap: break-word;">${bioText}</p></div><div id="posts-section">
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
    <div id="posts-list">${postsHtml}</div></div>`;

    if (isOwner) {
        document.getElementById('edit-profile-btn').addEventListener('click', renderEditView);
        document.getElementById('create-post-btn').addEventListener('click', renderCreatePostView);
    }

    if (viewedUserProfile.profile_song_url) {
        initYouTubePlayer(viewedUserProfile.profile_song_url);
    }
}

// --- YouTube Player Logic for Profile Song ---
// This function will be called by the YouTube API script once it's loaded
function onYouTubeIframeAPIReady() {
    // This is intentionally left blank. We initialize the player when the profile renders.
}

// This function extracts the video ID and creates the player
async function initYouTubePlayer(youtubeUrl) {
    const titleElement = document.getElementById('profile-song-title');

    // --- Step 1: Immediately fetch and display the title ---
    try {
        // Use YouTube's official oEmbed endpoint. It's the most reliable way to get video data.
        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
        const data = await response.json();

        if (data && data.title && titleElement) {
            titleElement.textContent = data.title;
        } else {
            titleElement.textContent = "Song Title Unavailable";
        }
    } catch (fetchError) {
        console.error("Could not fetch YouTube title:", fetchError);
        if (titleElement) titleElement.textContent = "Error Loading Title";
    }

    // --- Step 2: Create the YouTube player in the background ---
    // This part runs separately from the title fetching.
    try {
        const url = new URL(youtubeUrl);
        const videoId = url.searchParams.get("v");

        if (videoId) {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                window.onYouTubeIframeAPIReady = function() { createYouTubePlayer(videoId); };
            } else {
                createYouTubePlayer(videoId);
            }
        } else if (titleElement) {
             titleElement.textContent = "Invalid YouTube URL";
        }
    } catch (e) {
        console.error("Error initializing YouTube player:", e);
        if (titleElement) titleElement.textContent = "Invalid URL";
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
    playerVars: {
      'playsinline': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
    // This function's only job now is to ensure the player is ready.
    // The title is already displayed by initYouTubePlayer.
}

function onPlayerStateChange(event) {
  const playButton = document.getElementById('profile-audio-play-pause');
  const titleElement = document.getElementById('profile-song-title');
  if (!playButton || !titleElement) return;

  if (event.data == YT.PlayerState.PLAYING) {
    playButton.textContent = '⏸️';
    // Only run animation if it hasn't been disabled for short titles
    if (titleElement.style.animationName !== 'none') {
      titleElement.style.animationPlayState = 'running';
    }
  } else {
    playButton.textContent = '▶️';
    titleElement.style.animationPlayState = 'paused';
  }
}

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
