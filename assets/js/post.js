// =================================================================================
// --- INITIALIZATION ---
// =================================================================================
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

let loggedInUserProfile = null;
let currentPostData = null;
let allUsersCache = [];

// =================================================================================
// --- MAIN LOGIC ---
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadPostData();
});

async function loadPostData() {
    const postContainer = document.getElementById('post-container');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        postContainer.innerHTML = `<h2>Post not found</h2><p>No post ID was provided in the URL.</p>`;
        return;
    }

    // Fetch logged-in user and all users for @tagging in parallel
    await Promise.all([
        (async () => {
            const loggedInUserWallet = localStorage.getItem('walletAddress');
            if (loggedInUserWallet) {
                const { data } = await supabaseClient.from('profiles').select('*').eq('wallet_address', loggedInUserWallet).single();
                if (data) loggedInUserProfile = data;
            }
        })(),
        fetchAllUsers()
    ]);
    
    try {
        const { data: post, error } = await supabaseClient
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
        
        currentPostData = post;
        renderPost(post);

    } catch (error) {
        console.error('Error fetching post data:', error);
        postContainer.innerHTML = '<h2>Error</h2><p>This post could not be loaded.</p>';
    }
}

function renderPost(post) {
    const postContainer = document.getElementById('post-container');
    const isOwner = loggedInUserProfile && loggedInUserProfile.id === post.author.id;
    const postAuthorPfp = post.author.pfp_url ? `<img src="${post.author.pfp_url}" alt="${post.author.username}" class="post-author-pfp">` : `<div class="post-author-pfp-placeholder"></div>`;
    const commentTree = buildCommentTree(post.comments);
    const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);
    const postDate = new Date(post.created_at).toLocaleString();
    const updatedDateHtml = post.updated_at ? `<span style="color: #aaa; font-style: italic;">&nbsp;• Edited: ${new Date(post.updated_at).toLocaleString()}</span>` : '';
    const pinButtonText = post.is_pinned ? 'Unpin' : 'Pin';

    // NOTE: For simplicity, edit/delete/pin buttons are not included on this page yet.
    // We can add them later if desired.

    const voteTotal = post.post_votes.reduce((acc, vote) => acc + vote.vote_type, 0);
    const userVote = loggedInUserProfile ? post.post_votes.find(v => v.user_id === loggedInUserProfile.id) : null;
    const upvoteClass = userVote && userVote.vote_type === 1 ? 'up active' : 'up';
    const downvoteClass = userVote && userVote.vote_type === -1 ? 'down active' : 'down';
    const voteHtml = loggedInUserProfile ? `<div class="vote-container"><button onclick="handleVote(${post.id}, 1)" class="vote-btn ${upvoteClass}" aria-label="Upvote">👍</button><span class="vote-count">${voteTotal}</span><button onclick="handleVote(${post.id}, -1)" class="vote-btn ${downvoteClass}" aria-label="Downvote">👎</button></div>` : `<div class="vote-container"><span class="vote-count">${voteTotal} points</span></div>`;
    const processedContent = parseUserTags(parseFormatting(post.content));

    const postHtml = `
        <div class="post-item">
            <div class="post-header">
                ${postAuthorPfp}
                <div class="post-author-info">
                    <a href="profile.html?user=${post.author.wallet_address}" class="post-author-name footer-link">${post.author.username}</a>
                    <small class="post-timestamp">${postDate}${updatedDateHtml}</small>
                </div>
            </div>
            <div class="post-body">
                <h1 style="font-size: 2.2rem; text-align: left;">${escapeHTML(post.title)}</h1>
                <p class="post-content" style="font-size: 1.1rem; line-height: 1.7;">${processedContent}</p>
                ${voteHtml}
            </div>
            <div class="comments-section" style="margin-top: 40px;">${commentsHtml}</div>
            ${loggedInUserProfile ? `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 15px;"><input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${post.id})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button></div>` : ''}
        </div>
    `;

    postContainer.innerHTML = postHtml;
}


// =================================================================================
// --- REUSED FUNCTIONS (Copied from profile.js) ---
// Note: In a larger project, these would be in a shared file to avoid duplication.
// For now, copying them is the simplest approach.
// =================================================================================

// --- VOTE & COMMENT DATA MODIFICATION ---
async function handleVote(postId, voteType) {
    if (!loggedInUserProfile) { return alert("You must be logged in to vote."); }
    const existingVote = currentPostData.post_votes.find(v => v.user_id === loggedInUserProfile.id);
    try {
        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                await supabaseClient.from('post_votes').delete().match({ id: existingVote.id });
            } else {
                await supabaseClient.from('post_votes').update({ vote_type: voteType }).match({ id: existingVote.id });
            }
        } else {
            await supabaseClient.from('post_votes').insert({ post_id: postId, user_id: loggedInUserProfile.id, vote_type: voteType });
        }
        loadPostData();
    } catch (error) { console.error('Error handling vote:', error); }
}

async function submitComment(postId, parentCommentId = null) {
    const inputId = parentCommentId ? `comment-input-reply-${parentCommentId}` : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) { return alert("Comment cannot be empty."); }
    if (!loggedInUserProfile) { return alert("You must be logged in to comment."); }
    try {
        await supabaseClient.from('comments').insert({ content: input.value, author_id: loggedInUserProfile.id, post_id: postId, parent_comment_id: parentCommentId });
        loadPostData();
    } catch (error) { console.error('Error submitting comment:', error); }
}

// --- RENDERING & UTILITY HELPERS ---
function renderCommentsHtml(comments, postId, isPostOwner, loggedInUserProfile) {
    if (!comments || comments.length === 0) return '';
    const commentsArray = Array.isArray(comments) ? comments : [comments];
    return commentsArray.map(comment => {
        const isCommentOwner = loggedInUserProfile && (loggedInUserProfile.id === comment.author_id);
        const profile = comment.profiles;
        if (!profile) return '';
        const commenterPfp = profile.pfp_url ? `<img src="${profile.pfp_url}" alt="${profile.username}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 10px;">` : `<div style="width: 30px; height: 30px; border-radius: 50%; background: #555; margin-right: 10px;"></div>`;
        const commentDate = new Date(comment.created_at).toLocaleString();
        const processedContent = parseUserTags(parseFormatting(comment.content));
        const childrenHtml = comment.children ? renderCommentsHtml(comment.children, postId, isPostOwner, loggedInUserProfile) : '';
        return `<div id="comment-${comment.id}" class="comment-item" style="margin-top: 20px;"><div class="comment-main" style="display: flex; align-items: flex-start;">${commenterPfp}<div style="background: #222; padding: 8px 12px; border-radius: 10px; width: 100%;"><div style="display: flex; align-items: center; justify-content: space-between;"><a href="profile.html?user=${profile.wallet_address}" class="footer-link" style="font-weight: bold;">${profile.username}</a></div><p class="comment-content" style="margin: 5px 0 0; color: #ddd; white-space: pre-wrap; word-wrap: break-word;">${processedContent}</p><div class="comment-footer" style="display: flex; align-items: center; margin-top: 8px; gap: 15px;"><small style="color: #888; font-size: 0.7rem;">${commentDate}</small>${loggedInUserProfile ? `<button onclick="showReplyForm(${comment.id}, ${postId})" class="post-action-btn">Reply</button>` : ''}</div></div></div><div id="reply-form-container-${comment.id}"></div><div class="comment-children">${childrenHtml}</div></div>`;
    }).join('');
}

function showReplyForm(parentCommentId, postId) {
    document.querySelectorAll('[id^="reply-form-container-"]').forEach(container => container.innerHTML = '');
    const container = document.getElementById(`reply-form-container-${parentCommentId}`);
    container.innerHTML = `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 10px; margin-left: 40px;"><input type="text" id="comment-input-reply-${parentCommentId}" placeholder="Write a reply..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${postId}, ${parentCommentId})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button><button onclick="this.parentElement.innerHTML = ''" class="cta-button" style="background: #555; font-size: 0.8rem; padding: 8px 12px; margin: 0;">Cancel</button></div>`;
    document.getElementById(`comment-input-reply-${parentCommentId}`).focus();
}

function buildCommentTree(comments) {
    const commentMap = {};
    const commentTree = [];
    if (!comments) return commentTree;
    comments.forEach(comment => { commentMap[comment.id] = { ...comment, children: [] }; });
    Object.values(commentMap).forEach(comment => {
        if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].children.push(comment);
        } else { commentTree.push(comment); }
    });
    return commentTree;
}

async function fetchAllUsers() {
    try {
        const { data, error } = await supabaseClient.from('profiles').select('username, wallet_address');
        if (error) throw error;
        if (data) allUsersCache = data;
    } catch (error) { console.error('Error fetching all users for cache:', error); }
}

function parseUserTags(text) {
    if (!text || !allUsersCache.length) return text;
    return text.replace(/@(\w+)/g, (match, username) => {
        const user = allUsersCache.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) return `<a href="profile.html?user=${user.wallet_address}" class="footer-link">@${user.username}</a>`;
        return match;
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function parseFormatting(text) {
    if (!text) return '';
    let safeText = escapeHTML(text);
    return safeText.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>').replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>').replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
}
