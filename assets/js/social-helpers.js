// =================================================================================
// --- SHARED HELPER FUNCTIONS for Profile & Post pages ---
// =================================================================================

// --- VOTE & COMMENT DATA MODIFICATION ---
async function handleVote(postId, voteType) {
    if (!loggedInUserProfile) { return alert("You must be logged in to vote."); }
    
    // Determine which data object to look in
    const postData = typeof currentPostData !== 'undefined' 
        ? currentPostData 
        : (viewedUserProfile && viewedUserProfile.posts) 
            ? viewedUserProfile.posts.find(p => p.id === postId) 
            : null;

    if (!postData) return console.error('Could not find post data to handle vote.');

    const existingVote = postData.post_votes.find(v => v.user_id === loggedInUserProfile.id);

    try {
        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // User is clicking the same vote button again, so remove the vote
                await supabaseClient.from('post_votes').delete().match({ id: existingVote.id });
            } else {
                // User is changing their vote (e.g., from up to down)
                await supabaseClient.from('post_votes').update({ vote_type: voteType }).match({ id: existingVote.id });
            }
        } else {
            // User is casting a new vote
            await supabaseClient.from('post_votes').insert({ post_id: postId, user_id: loggedInUserProfile.id, vote_type: voteType });
        }

        // CORRECTED: This now checks which refresh function is available and calls the correct one.
        if (typeof loadPostData === 'function') {
            loadPostData();
        } else if (typeof loadPageData === 'function') {
            loadPageData();
        }

    } catch (error) { 
        console.error('Error handling vote:', error); 
        alert('There was an error processing your vote.');
    }
}

async function submitComment(postId, parentCommentId = null) {
    const inputId = parentCommentId ? `comment-input-reply-${parentCommentId}` : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) { return alert("Comment cannot be empty."); }
    if (!loggedInUserProfile) { return alert("You must be logged in to comment."); }
    
    try {
        await supabaseClient.from('comments').insert({ 
            content: input.value, 
            author_id: loggedInUserProfile.id, 
            post_id: postId, 
            parent_comment_id: parentCommentId 
        });

        // This checks which refresh function is available and calls the correct one.
        if (typeof loadPostData === 'function') {
            loadPostData();
        } else if (typeof loadPageData === 'function') {
            loadPageData();
        }

    } catch (error) { 
        console.error('Error submitting comment:', error);
        alert('There was an error submitting your comment. Please try again.');
    }
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
        const commentAdminButtons = (isCommentOwner || isPostOwner) ? `<div style="margin-left: auto; display: flex; gap: 5px;">${isCommentOwner ? `<button onclick='renderEditCommentView(${comment.id}, "${encodeURIComponent(comment.content)}")' class="post-action-btn">Edit</button>` : ''}<button onclick="deleteComment(${comment.id})" class="post-action-btn delete">Delete</button></div>` : '';
        const commentDate = new Date(comment.created_at).toLocaleString();
        const commentEditedDate = comment.updated_at ? `<span style="font-style: italic;">&nbsp;• Edited: ${new Date(comment.updated_at).toLocaleString()}</span>` : '';
        const processedContent = parseUserTags(parseFormatting(comment.content));
        const childrenHtml = comment.children ? renderCommentsHtml(comment.children, postId, isPostOwner, loggedInUserProfile) : '';

        return `<div id="comment-${comment.id}" class="comment-item" style="margin-top: 20px;"><div class="comment-main" style="display: flex; align-items: flex-start;">${commenterPfp}<div style="background: #222; padding: 8px 12px; border-radius: 10px; width: 100%;"><div style="display: flex; align-items: center; justify-content: space-between;"><a href="profile.html?user=${profile.wallet_address}" class="footer-link" style="font-weight: bold;">${profile.username}</a>${commentAdminButtons}</div><p class="comment-content" style="margin: 5px 0 0; color: #ddd; white-space: pre-wrap; word-wrap: break-word;">${processedContent}</p><div class="comment-footer" style="display: flex; align-items: center; margin-top: 8px; gap: 15px;"><small style="color: #888; font-size: 0.7rem;">${commentDate}${commentEditedDate}</small>${loggedInUserProfile ? `<button onclick="showReplyForm(${comment.id}, ${postId})" class="post-action-btn">Reply</button>` : ''}</div></div></div><div id="reply-form-container-${comment.id}"></div><div class="comment-children">${childrenHtml}</div></div>`;
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

function renderEditCommentView(commentId, currentContent) {
    const commentContentEl = document.querySelector(`#comment-${commentId} .comment-content`);
    const commentFooterEl = document.querySelector(`#comment-${commentId} .comment-footer`);
    const decodedContent = decodeURIComponent(currentContent);
    commentContentEl.style.display = 'none';
    commentFooterEl.style.display = 'none';
    const editForm = document.createElement('div');
    editForm.className = 'edit-comment-form';
    const cancelAction = "typeof loadPostData === 'function' ? loadPostData() : loadPageData()";
    editForm.innerHTML = `<textarea id="comment-edit-input-${commentId}" style="width: 100%; height: 80px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; margin-top: 5px;">${decodedContent}</textarea><div style="margin-top: 10px;"><button onclick="updateComment(${commentId})" class="cta-button" style="font-size: 0.8rem; padding: 6px 10px; margin: 0;">Save</button><button onclick="${cancelAction}" class="cta-button" style="font-size: 0.8rem; padding: 6px 10px; margin: 0; background: #555; border-color: #777; margin-left: 10px;">Cancel</button></div>`;
    commentContentEl.parentNode.insertBefore(editForm, commentContentEl.nextSibling);
}

async function updateComment(commentId) {
    const newContent = document.getElementById(`comment-edit-input-${commentId}`).value;
    if (!newContent.trim()) { return alert("Comment cannot be empty."); }
    try {
        const { error } = await supabaseClient.from('comments').update({ content: newContent, updated_at: new Date() }).eq('id', commentId);
        if (error) throw error;
        // This checks which refresh function is available and calls the correct one.
        if (typeof loadPostData === 'function') {
            loadPostData();
        } else if (typeof loadPageData === 'function') {
            loadPageData();
        }
    } catch (error) { 
        console.error('Error updating comment:', error); 
        alert(`Could not update comment: ${error.message}`); 
    }
}

async function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
        const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
        if (error) throw error;
        alert('Comment deleted.');
        // This checks which refresh function is available and calls the correct one.
        if (typeof loadPostData === 'function') {
            loadPostData();
        } else if (typeof loadPageData === 'function') {
            loadPageData();
        }
    } catch (error) { 
        console.error('Error deleting comment:', error); 
        alert(`Could not delete comment: ${error.message}`); 
    }
}
