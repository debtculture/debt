/* =============================================================================
   SOCIAL HELPERS - Shared functions for Profile & Post pages
   ============================================================================= */

// Global cache for user data
let allUsersCache = [];

/* --- AUTHENTICATION CHECKS --- */

/**
 * Validates that user is logged in before performing action
 * @param {string} actionName - Name of the action being performed
 * @returns {boolean} True if user is logged in
 */
function requireAuth(actionName = 'perform this action') {
    if (!loggedInUserProfile) {
        alert(`You must be logged in to ${actionName}.`);
        return false;
    }
    return true;
}

/* --- VOTE HANDLING --- */

/**
 * Handles voting on a post (upvote/downvote)
 * @param {number} postId - The ID of the post
 * @param {string} voteType - Either 'up' or 'down'
 */
async function handleVote(postId, voteType) {
    if (!requireAuth('vote')) return;

    const postData = findPostData(postId);
    if (!postData) {
        console.error('Could not find post data to handle vote.');
        return;
    }

    const existingVote = postData.post_votes.find(
        v => v.user_id === loggedInUserProfile.id
    );

    try {
        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // Remove vote if clicking same button
                await supabaseClient
                    .from('post_votes')
                    .delete()
                    .match({ id: existingVote.id });
            } else {
                // Change vote type
                await supabaseClient
                    .from('post_votes')
                    .update({ vote_type: voteType })
                    .match({ id: existingVote.id });
            }
        } else {
            // Insert new vote
            await supabaseClient
                .from('post_votes')
                .insert({
                    post_id: postId,
                    user_id: loggedInUserProfile.id,
                    vote_type: voteType
                });
        }

        refreshPageData();
    } catch (error) {
        console.error('Error handling vote:', error);
        alert('Failed to process your vote. Please try again.');
    }
}

/* --- COMMENT HANDLING --- */

/**
 * Submits a new comment or reply
 * @param {number} postId - The ID of the post
 * @param {number|null} parentCommentId - The parent comment ID (null for top-level)
 */
async function submitComment(postId, parentCommentId = null) {
    if (!requireAuth('comment')) return;

    const inputId = parentCommentId
        ? `comment-input-reply-${parentCommentId}`
        : `comment-input-${postId}`;
    const input = document.getElementById(inputId);

    if (!input || !input.value.trim()) {
        alert('Comment cannot be empty.');
        return;
    }

    const balance = await window.fetchTokenBalance();
    if (balance < 100000) {
        alert(`You need at least 100,000 $DEBT to comment. Current balance: ${balance.toLocaleString()}`);
        return;
    }

    const content = input.value.trim();

    try {
        await supabaseClient.from('comments').insert({
            content: content,
            author_id: loggedInUserProfile.id,
            post_id: postId,
            parent_comment_id: parentCommentId
        });

        input.value = '';
        refreshPageData();
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit your comment. Please try again.');
    }
}

/**
 * Updates an existing comment
 * @param {number} commentId - The ID of the comment to update
 */
async function updateComment(commentId) {
    const input = document.getElementById(`comment-edit-input-${commentId}`);
    if (!input) return;

    const newContent = input.value.trim();
    if (!newContent) {
        alert('Comment cannot be empty.');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('comments')
            .update({
                content: newContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId);

        if (error) throw error;

        refreshPageData();
    } catch (error) {
        console.error('Error updating comment:', error);
        alert(`Failed to update comment: ${error.message}`);
    }
}

/**
 * Deletes a comment
 * @param {number} commentId - The ID of the comment to delete
 */
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;

        alert('Comment deleted successfully.');
        refreshPageData();
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert(`Failed to delete comment: ${error.message}`);
    }
}

/* --- COMMENT RENDERING --- */

/**
 * Renders comments as nested HTML
 * @param {Array} comments - Array of comment objects
 * @param {number} postId - The post ID
 * @param {boolean} isPostOwner - Whether current user owns the post
 * @param {Object} loggedInUserProfile - Current user's profile
 * @returns {string} HTML string of rendered comments
 */
function renderCommentsHtml(comments, postId, isPostOwner, loggedInUserProfile) {
    if (!comments || comments.length === 0) return '';

    const commentsArray = Array.isArray(comments) ? comments : [comments];

    return commentsArray.map(comment => {
        const profile = comment.profiles;
        if (!profile) return '';

        const isCommentOwner = loggedInUserProfile &&
            loggedInUserProfile.id === comment.author_id;

        return renderSingleComment(
            comment,
            profile,
            postId,
            isPostOwner,
            isCommentOwner,
            loggedInUserProfile
        );
    }).join('');
}

/**
 * Renders a single comment with all its properties
 * @param {Object} comment - Comment object
 * @param {Object} profile - Commenter's profile
 * @param {number} postId - Post ID
 * @param {boolean} isPostOwner - Whether current user owns the post
 * @param {boolean} isCommentOwner - Whether current user owns the comment
 * @param {Object} loggedInUserProfile - Current user's profile
 * @returns {string} HTML string
 */
function renderSingleComment(comment, profile, postId, isPostOwner, isCommentOwner, loggedInUserProfile) {
    const pfpHtml = profile.pfp_url
        ? `<img src="${profile.pfp_url}" alt="${profile.username}" class="comment-pfp">`
        : `<div class="comment-pfp comment-pfp-placeholder"></div>`;

    const adminButtonsHtml = renderCommentAdminButtons(
        comment.id,
        comment.content,
        isCommentOwner,
        isPostOwner
    );

    const commentDate = new Date(comment.created_at).toLocaleString();
    const editedDate = comment.updated_at
        ? `<span class="comment-edited"> • Edited: ${new Date(comment.updated_at).toLocaleString()}</span>`
        : '';

    const processedContent = parseUserTags(parseFormatting(comment.content));
    const childrenHtml = comment.children
        ? renderCommentsHtml(comment.children, postId, isPostOwner, loggedInUserProfile)
        : '';

    const replyButtonHtml = loggedInUserProfile
        ? `<button onclick="showReplyForm(${comment.id}, ${postId})" class="post-action-btn">Reply</button>`
        : '';

    return `
        <div id="comment-${comment.id}" class="comment-item">
            <div class="comment-main">
                ${pfpHtml}
                <div class="comment-body">
                    <div class="comment-header">
                        <a href="profile.html?user=${profile.wallet_address}" class="footer-link comment-author">
                            ${profile.username}
                        </a>
                        ${adminButtonsHtml}
                    </div>
                    <p class="comment-content">${processedContent}</p>
                    <div class="comment-footer">
                        <small class="comment-date">${commentDate}${editedDate}</small>
                        ${replyButtonHtml}
                    </div>
                </div>
            </div>
            <div id="reply-form-container-${comment.id}"></div>
            <div class="comment-children">${childrenHtml}</div>
        </div>
    `;
}

/**
 * Renders admin buttons for comment (Edit/Delete)
 * @param {number} commentId - Comment ID
 * @param {string} content - Comment content
 * @param {boolean} isCommentOwner - Whether user owns comment
 * @param {boolean} isPostOwner - Whether user owns post
 * @returns {string} HTML string
 */
function renderCommentAdminButtons(commentId, content, isCommentOwner, isPostOwner) {
    if (!isCommentOwner && !isPostOwner) return '';

    const editButton = isCommentOwner
        ? `<button onclick='renderEditCommentView(${commentId}, "${encodeURIComponent(content)}")' class="post-action-btn">Edit</button>`
        : '';

    const deleteButton = `<button onclick="deleteComment(${commentId})" class="post-action-btn delete">Delete</button>`;

    return `<div class="comment-admin-buttons">${editButton}${deleteButton}</div>`;
}

/**
 * Shows reply form for a comment
 * @param {number} parentCommentId - Parent comment ID
 * @param {number} postId - Post ID
 */
function showReplyForm(parentCommentId, postId) {
    // Clear any existing reply forms
    document.querySelectorAll('[id^="reply-form-container-"]')
        .forEach(container => container.innerHTML = '');

    const container = document.getElementById(`reply-form-container-${parentCommentId}`);
    if (!container) return;

    container.innerHTML = `
        <div class="add-comment-form reply-form">
            <input
                type="text"
                id="comment-input-reply-${parentCommentId}"
                placeholder="Write a reply..."
                class="comment-input"
            >
            <button
                onclick="submitComment(${postId}, ${parentCommentId})"
                class="cta-button comment-submit"
            >
                Submit
            </button>
            <button
                onclick="this.parentElement.innerHTML = ''"
                class="cta-button comment-cancel"
            >
                Cancel
            </button>
        </div>
    `;

    document.getElementById(`comment-input-reply-${parentCommentId}`).focus();
}

/**
 * Renders edit view for a comment
 * @param {number} commentId - Comment ID
 * @param {string} currentContent - Current comment content (URL encoded)
 */
function renderEditCommentView(commentId, currentContent) {
    const commentContentEl = document.querySelector(`#comment-${commentId} .comment-content`);
    const commentFooterEl = document.querySelector(`#comment-${commentId} .comment-footer`);

    if (!commentContentEl || !commentFooterEl) return;

    const decodedContent = decodeURIComponent(currentContent);

    commentContentEl.style.display = 'none';
    commentFooterEl.style.display = 'none';

    const editForm = document.createElement('div');
    editForm.className = 'edit-comment-form';
    editForm.innerHTML = `
        <textarea
            id="comment-edit-input-${commentId}"
            class="comment-edit-textarea"
        >${decodedContent}</textarea>
        <div class="edit-comment-actions">
            <button onclick="updateComment(${commentId})" class="cta-button comment-save">
                Save
            </button>
            <button onclick="refreshPageData()" class="cta-button comment-cancel-edit">
                Cancel
            </button>
        </div>
    `;

    commentContentEl.parentNode.insertBefore(editForm, commentContentEl.nextSibling);
}

/* --- UTILITY FUNCTIONS --- */

/**
 * Finds post data from available sources
 * @param {number} postId - Post ID to find
 * @returns {Object|null} Post data object or null
 */
function findPostData(postId) {
    if (typeof currentPostData !== 'undefined') {
        return currentPostData;
    }
    if (viewedUserProfile && viewedUserProfile.posts) {
        return viewedUserProfile.posts.find(p => p.id === postId);
    }
    return null;
}

/**
 * Refreshes page data by calling appropriate load function
 */
function refreshPageData() {
    if (typeof loadPostData === 'function') {
        loadPostData();
    } else if (typeof loadPageData === 'function') {
        loadPageData();
    } else {
        console.warn('No refresh function available');
        location.reload();
    }
}

/**
 * Builds a nested comment tree from flat array
 * @param {Array} comments - Flat array of comments
 * @returns {Array} Nested comment tree
 */
function buildCommentTree(comments) {
    if (!comments || comments.length === 0) return [];

    const commentMap = {};
    const commentTree = [];

    // Create map of all comments
    comments.forEach(comment => {
        commentMap[comment.id] = { ...comment, children: [] };
    });

    // Build tree structure
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
 * Fetches all users for tagging cache
 */
async function fetchAllUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, wallet_address');

        if (error) throw error;
        if (data) allUsersCache = data;
    } catch (error) {
        console.error('Error fetching users for cache:', error);
    }
}

/**
 * Parses @username tags and converts to links
 * @param {string} text - Text to parse
 * @returns {string} Text with username links
 */
function parseUserTags(text) {
    if (!text || !allUsersCache.length) return text;

    return text.replace(/@(\w+)/g, (match, username) => {
        const user = allUsersCache.find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        return user
            ? `<a href="profile.html?user=${user.wallet_address}" class="footer-link">@${user.username}</a>`
            : match;
    });
}

/**
 * Parses BBCode-style formatting tags
 * @param {string} text - Text to parse
 * @returns {string} Text with HTML formatting
 */
function parseFormatting(text) {
    if (!text) return '';

    const safeText = escapeHTML(text);

    return safeText
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
}

/* --- INITIALIZATION --- */

// Fetch users on load for tagging functionality
if (typeof supabaseClient !== 'undefined') {
    fetchAllUsers();
}
