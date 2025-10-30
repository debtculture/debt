// =================================================================================
// --- INITIALIZATION ---
// =================================================================================
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
let loggedInUserProfile = null;
let currentPostData = null; // Specific to this page

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
        fetchAllUsers() // This function now lives in social-helpers.js
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

// =================================================================================
// --- RENDERING FUNCTIONS ---
// =================================================================================
function renderPost(post) {
    // THIS IS THE NEW LINE
    document.title = `${escapeHTML(post.title)} - Debt Culture`;
    const postContainer = document.getElementById('post-container');
    const isOwner = loggedInUserProfile && loggedInUserProfile.id === post.author.id;
    const postAuthorPfp = post.author.pfp_url ? `<img src="${post.author.pfp_url}" alt="${post.author.username}" class="post-author-pfp">` : `<div class="post-author-pfp-placeholder"></div>`;
   
    // Note: We can now use renderCommentsHtml because it's loaded from the shared script
    const commentTree = buildCommentTree(post.comments);
    const commentsHtml = renderCommentsHtml(commentTree, post.id, isOwner, loggedInUserProfile);
   
    const postDate = new Date(post.created_at).toLocaleString();
    const updatedDateHtml = post.updated_at ? `<span style="color: #aaa; font-style: italic;">&nbsp;• Edited: ${new Date(post.updated_at).toLocaleString()}</span>` : '';
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
            <div class="comments-section" style="margin-top: 40px;">${commentsHtml || '<p style="color: #888;"><i>No comments yet.</i></p>'}</div>
            ${loggedInUserProfile ? `<div class="add-comment-form" style="display: flex; gap: 10px; margin-top: 15px;"><input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." style="width: 100%; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 8px;"><button onclick="submitComment(${post.id})" class="cta-button" style="font-size: 0.8rem; padding: 8px 12px; margin: 0;">Submit</button></div>` : ''}
        </div>
    `;
    postContainer.innerHTML = postHtml;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
