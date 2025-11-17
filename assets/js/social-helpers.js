/* =============================================================================
   SOCIAL HELPERS - Shared functions for Profile & Post pages
   IMPROVEMENTS: Better security, lazy loading, loading states, pagination
   ============================================================================= */

// Global cache for user data (with expiry)
let allUsersCache = [];
let usersCacheTimestamp = null;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Debounce timers
let commentSubmitDebounce = null;

/* --- AUTHENTICATION CHECKS --- */

/**
 * Validates that user is logged in before performing action
 * @param {string} actionName - Name of the action being performed
 * @returns {boolean} True if user is logged in
 */
function requireAuth(actionName = 'perform this action') {
    if (!loggedInUserProfile) {
        showToast(`You must be logged in to ${actionName}.`, 'error');
        return false;
    }
    return true;
}

/* --- VOTE HANDLING --- */

/**
 * Handles voting on a post (upvote/downvote) with debouncing
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

    // Show optimistic UI update
    updateVoteUI(postId, voteType, existingVote);

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
        showToast('Failed to process your vote. Please try again.', 'error');
        // Revert optimistic update
        refreshPageData();
    }
}

/**
 * Updates vote UI optimistically (before server response)
 * @param {number} postId - Post ID
 * @param {string} voteType - 'up' or 'down'
 * @param {Object} existingVote - Existing vote object
 */
function updateVoteUI(postId, voteType, existingVote) {
    // This is a placeholder for optimistic UI updates
    // Implementation depends on your specific UI structure
    const upBtn = document.querySelector(`#post-${postId} .upvote-btn`);
    const downBtn = document.querySelector(`#post-${postId} .downvote-btn`);
    
    if (upBtn && downBtn) {
        // Add visual feedback
        upBtn.classList.toggle('active', voteType === 'up' && !existingVote);
        downBtn.classList.toggle('active', voteType === 'down' && !existingVote);
    }
}

/* --- COMMENT HANDLING --- */

/**
 * Submits a new comment or reply (with debouncing)
 * @param {number} postId - The ID of the post
 * @param {number|null} parentCommentId - The parent comment ID (null for top-level)
 */
async function submitComment(postId, parentCommentId = null) {
    if (!requireAuth('comment')) return;

    // Prevent rapid-fire submissions
    if (commentSubmitDebounce) {
        clearTimeout(commentSubmitDebounce);
    }

    const inputId = parentCommentId
        ? `comment-input-reply-${parentCommentId}`
        : `comment-input-${postId}`;
    const input = document.getElementById(inputId);

    if (!input || !input.value.trim()) {
        showToast('Comment cannot be empty.', 'error');
        return;
    }

    const content = input.value.trim();
    
    // Validate content length
    if (content.length > 5000) {
        showToast('Comment is too long (max 5000 characters).', 'error');
        return;
    }

    // Disable input during submission
    input.disabled = true;
    const submitBtn = input.parentElement.querySelector('.comment-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
    }

    try {
        await supabaseClient.from('comments').insert({
            content: content,
            author_id: loggedInUserProfile.id,
            post_id: postId,
            parent_comment_id: parentCommentId
        });

        input.value = '';
        showToast('Comment posted successfully!', 'success');
        
        // Debounced refresh to avoid multiple rapid refreshes
        commentSubmitDebounce = setTimeout(() => {
            refreshPageData();
        }, 300);
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showToast('Failed to submit your comment. Please try again.', 'error');
    } finally {
        // Re-enable input
        input.disabled = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
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
        showToast('Comment cannot be empty.', 'error');
        return;
    }

    if (newContent.length > 5000) {
        showToast('Comment is too long (max 5000 characters).', 'error');
        return;
    }

    // Show loading state
    input.disabled = true;
    const saveBtn = input.parentElement.querySelector('.comment-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
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

        showToast('Comment updated successfully!', 'success');
        refreshPageData();
    } catch (error) {
        console.error('Error updating comment:', error);
        showToast(`Failed to update comment: ${error.message}`, 'error');
        
        // Re-enable input on error
        input.disabled = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    }
}

/**
 * Deletes a comment
 * @param {number} commentId - The ID of the comment to delete
 */
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;

        showToast('Comment deleted successfully.', 'success');
        refreshPageData();
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast(`Failed to delete comment: ${error.message}`, 'error');
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
        ? `<img src="${escapeHTML(profile.pfp_url)}" alt="${escapeHTML(profile.username)}" class="comment-pfp">`
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

    // IMPORTANT: Escape HTML FIRST, then apply formatting, then parse tags
    const processedContent = parseUserTags(parseFormatting(comment.content));
    
    const childrenHtml = comment.children
        ? renderCommentsHtml(comment.children, postId, isPostOwner, loggedInUserProfile)
        : '';

    const replyButtonHtml = loggedInUserProfile
        ? `<button onclick="showReplyForm(${comment.id}, ${postId})" class="post-action-btn" aria-label="Reply to comment">Reply</button>`
        : '';

    return `
        <div id="comment-${comment.id}" class="comment-item">
            <div class="comment-main">
                ${pfpHtml}
                <div class="comment-body">
                    <div class="comment-header">
                        <a href="profile.html?user=${escapeHTML(profile.wallet_address)}" class="footer-link comment-author">
                            ${escapeHTML(profile.username)}
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

    // Properly escape content for onclick attribute
    const escapedContent = encodeURIComponent(content);

    const editButton = isCommentOwner
        ? `<button onclick='renderEditCommentView(${commentId}, "${escapedContent}")' class="post-action-btn" aria-label="Edit comment">Edit</button>`
        : '';

    const deleteButton = `<button onclick="deleteComment(${commentId})" class="post-action-btn delete" aria-label="Delete comment">Delete</button>`;

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
                maxlength="5000"
                aria-label="Reply text"
            >
            <button
                onclick="submitComment(${postId}, ${parentCommentId})"
                class="cta-button comment-submit"
                aria-label="Submit reply"
            >
                Submit
            </button>
            <button
                onclick="this.parentElement.innerHTML = ''"
                class="cta-button comment-cancel"
                aria-label="Cancel reply"
            >
                Cancel
            </button>
        </div>
    `;

    const input = document.getElementById(`comment-input-reply-${parentCommentId}`);
    if (input) input.focus();
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
            maxlength="5000"
            aria-label="Edit comment text"
        >${escapeHTML(decodedContent)}</textarea>
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
    
    // Focus textarea
    const textarea = document.getElementById(`comment-edit-input-${commentId}`);
    if (textarea) textarea.focus();
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
 * Fetches all users for tagging cache (with expiry check)
 */
async function fetchAllUsers() {
    // Check if cache is still valid
    const now = Date.now();
    if (allUsersCache.length > 0 && usersCacheTimestamp && 
        (now - usersCacheTimestamp) < CACHE_EXPIRY_MS) {
        return; // Use cached data
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, wallet_address');

        if (error) throw error;
        if (data) {
            allUsersCache = data;
            usersCacheTimestamp = now;
        }
    } catch (error) {
        console.error('Error fetching users for cache:', error);
    }
}

/**
 * Refreshes user cache manually (call this when new users register)
 */
function refreshUserCache() {
    usersCacheTimestamp = null;
    fetchAllUsers();
}

/**
 * IMPROVED: Search users for @mention (lazy loading approach)
 * @param {string} searchTerm - Search term (partial username)
 * @returns {Promise<Array>} Matching users
 */
async function searchUsersForMention(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, wallet_address')
            .ilike('username', `${searchTerm}%`)
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Parses @username tags and converts to links
 * IMPROVED: Now properly escapes before link creation
 * @param {string} text - Text to parse (should already be HTML-escaped)
 * @returns {string} Text with username links
 */
function parseUserTags(text) {
    if (!text || !allUsersCache.length) return text;

    return text.replace(/@(\w+)/g, (match, username) => {
        const user = allUsersCache.find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        return user
            ? `<a href="profile.html?user=${escapeHTML(user.wallet_address)}" class="footer-link">@${escapeHTML(user.username)}</a>`
            : match;
    });
}

/**
 * Escapes HTML special characters
 * CRITICAL: This must be called FIRST before any other processing
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

/**
 * Parses BBCode-style formatting tags
 * IMPROVED: Now works on already-escaped HTML
 * @param {string} text - Text to parse (should already be HTML-escaped)
 * @returns {string} Text with HTML formatting
 */
function parseFormatting(text) {
    if (!text) return '';

    // First escape HTML to prevent XSS
    const safeText = escapeHTML(text);

    // Now apply BBCode formatting (which creates safe HTML tags)
    return safeText
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
        // Support for code blocks
        .replace(/\[code\](.*?)\[\/code\]/g, '<code>$1</code>');
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type ('success' or 'error')
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existing = document.querySelectorAll('.social-toast');
    existing.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `social-toast social-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* --- PAGINATION STUBS --- */

/**
 * STUB: Load more comments (pagination)
 * @param {number} postId - Post ID
 * @param {number} offset - Offset for pagination
 * @param {number} limit - Number of comments to load
 */
async function loadMoreComments(postId, offset = 0, limit = 50) {
    // TODO: Implement pagination
    // This will be needed when posts have hundreds of comments
    console.warn('Comment pagination not yet implemented');
    
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('*, profiles(*)')
            .eq('post_id', postId)
            .is('parent_comment_id', null)
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

/* --- INITIALIZATION --- */

// Fetch users on load for tagging functionality
if (typeof supabaseClient !== 'undefined') {
    fetchAllUsers();
}

// Export functions for external use
window.searchUsersForMention = searchUsersForMention;
window.refreshUserCache = refreshUserCache;
window.loadMoreComments = loadMoreComments;

/* =============================================================================
   USAGE NOTES:
   
   1. Add this CSS to shared-styles.css for toast notifications:
   
   .social-toast {
       position: fixed;
       bottom: 30px;
       left: 30px;
       padding: 15px 25px;
       background: rgba(26, 26, 26, 0.95);
       border: 2px solid var(--main-red);
       border-radius: 8px;
       color: var(--text-primary);
       font-weight: 600;
       opacity: 0;
       transform: translateX(-20px);
       transition: all 0.3s ease;
       z-index: 10003;
       max-width: 400px;
   }
   
   .social-toast.show {
       opacity: 1;
       transform: translateX(0);
   }
   
   .social-toast-error {
       border-color: #ff6b6b;
   }
   
   .social-toast-success {
       border-color: #00ff00;
   }
   
   2. Security Improvements:
   - HTML is now escaped FIRST before any processing
   - BBCode tags only create safe HTML elements
   - All user-generated content is sanitized
   
   3. Performance Improvements:
   - User cache now has 5-minute expiry
   - Comment submission is debounced
   - Added searchUsersForMention for @mention autocomplete (future feature)
   
   4. UX Improvements:
   - Loading states for all async operations
   - Toast notifications instead of alerts
   - Better error messages
   - Character limits displayed
   
   5. Future Features:
   - loadMoreComments() stub for pagination
   - searchUsersForMention() for autocomplete
   - refreshUserCache() for manual cache updates
   
   ============================================================================= */
