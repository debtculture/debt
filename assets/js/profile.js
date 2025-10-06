// This script contains all the logic for the user profile page.

// --- Initialize Supabase Client ---
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Global Variable ---
let currentUserProfile = null; // To store the profile data of the person being viewed

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

/**
 * Fetches and displays a user's profile, determined by the URL or localStorage.
 */
async function loadUserProfile() {
    const profileContent = document.getElementById('profile-content');
    
    // --- NEW LOGIC: Determine which profile to load ---
    const urlParams = new URLSearchParams(window.location.search);
    let addressToLoad = urlParams.get('user'); // Get wallet address from URL (e.g., ?user=ADDRESS)

    // If no user is specified in the URL, fall back to the logged-in user
    if (!addressToLoad) {
        addressToLoad = localStorage.getItem('walletAddress');
    }

    // If still no address, then nobody is logged in and no profile is specified.
    if (!addressToLoad) {
        profileContent.innerHTML = `<h2>No User Found</h2><p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your own profile.</p>`;
        return;
    }

    try {
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('wallet_address', addressToLoad) // Use the determined address
            .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        if (profileData) {
            currentUserProfile = profileData;
            const { data: postsData, error: postsError } = await supabaseClient
                .from('posts').select('*').eq('author_id', currentUserProfile.id).order('created_at', { ascending: false });

            if (postsError) throw postsError;
            renderProfileView(postsData || []);
        } else {
            profileContent.innerHTML = `<h2>Profile Not Found</h2><p>A profile for this wallet address does not exist.</p>`;
        }

    } catch (error) {
        console.error('Error loading page data:', error);
        profileContent.innerHTML = `<h2>Error</h2><p>There was an error loading the profile.</p>`;
    }
}

/**
 * Renders the profile and posts, conditionally showing admin buttons.
 * @param {Array} posts - An array of post objects.
 */
function renderProfileView(posts) {
    const profileContent = document.getElementById('profile-content');
    
    // --- NEW LOGIC: Check if the viewer is the owner of this profile ---
    const loggedInUserAddress = localStorage.getItem('walletAddress');
    const isOwner = loggedInUserAddress === currentUserProfile.wallet_address;

    const bioText = currentUserProfile.bio ? currentUserProfile.bio.replace(/\n/g, '<br>') : '<i>User has not written a bio yet.</i>';
    const pfpHtml = currentUserProfile.pfp_url ? `<img src="${currentUserProfile.pfp_url}" alt="User Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #ff5555; margin-bottom: 20px;">` : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #333; border: 3px solid #ff5555; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; text-align: center;">No Profile<br>Picture</div>`;

    let socialsHtml = '';
    // ... social links generation ... (no changes needed here)

    let postsHtml = '';
    if (posts.length > 0) {
        postsHtml = posts.map(post => {
            const postDate = new Date(post.created_at).toLocaleString();
            const updatedDateHtml = post.updated_at ? `<span style="color: #aaa; font-style: italic;">&nbsp;• Edited: ${new Date(post.updated_at).toLocaleString()}</span>` : '';
            
            // --- NEW: Conditionally show Edit/Delete buttons ---
            const adminButtonsHtml = isOwner ? `
                <div>
                    <button onclick='renderEditPostView(${post.id}, "${encodeURIComponent(post.content)}")' class="post-action-btn">Edit</button>
                    <button onclick="deletePost(${post.id})" class="post-action-btn delete">Delete</button>
                </div>
            ` : '';

            return `
                <div class="post-item" style="border-bottom: 1px solid #333; padding: 15px 5px; text-align: left; margin-bottom: 15px;">
                    <p style="margin: 0; color: #eee; white-space: pre-wrap; word-wrap: break-word;">${post.content}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <small style="color: #888;">${postDate}${updatedDateHtml}</small>
                        ${adminButtonsHtml}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        postsHtml = `<p style="color: #888;"><i>No posts yet.</i></p>`;
    }

    profileContent.innerHTML = `
        <style>.post-action-btn { background: #333; /* ... */ }</style>
        ${pfpHtml}
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${currentUserProfile.username}</h2>
        <div style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">${socialsHtml}</div>
        <div style="margin-top: 20px; border-top: 1px solid #444; /* ... */">${bioText}</div>
        
        ${isOwner ? `<button id="edit-profile-btn" class="cta-button" style="margin-top: 30px; font-size: 1rem; padding: 10px 20px;">Edit Profile Details</button>` : ''}
        
        <hr style="border-color: #333; margin: 40px 0;">

        <div id="posts-section">
            <div class="posts-header">
                <h3>Posts</h3>
                ${isOwner ? `<button id="create-post-btn" class="cta-button">Create New Post</button>` : ''}
            </div>
            <div id="posts-list">${postsHtml}</div>
        </div>
    `;

    // Only add event listeners if the buttons exist on the page
    if (isOwner) {
        document.getElementById('edit-profile-btn').addEventListener('click', renderEditView);
        document.getElementById('create-post-btn').addEventListener('click', renderCreatePostView);
    }
}

/**
 * Renders a form for EDITING an existing post.
 */
function renderEditPostView(postId, currentContent) {
    const postsSection = document.getElementById('posts-section');
    const decodedContent = decodeURIComponent(currentContent);
    postsSection.innerHTML = `
        <h3 style="font-size: 2rem; color: #ff5555;">Edit Post</h3>
        <div style="text-align: left; margin-top: 20px;">
            <textarea id="post-edit-input" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${decodedContent}</textarea>
        </div>
        <div style="margin-top: 20px;">
            <button onclick="updatePost(${postId})" class="cta-button">Save Update</button>
            <button onclick="loadUserProfile()" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>
    `;
}

/**
 * Updates an existing post in the database.
 */
async function updatePost(postId) {
    const newContent = document.getElementById('post-edit-input').value;
    if (!newContent.trim()) {
        alert("Post content cannot be empty.");
        return;
    }
    try {
        const { error } = await supabaseClient.from('posts').update({ content: newContent }).eq('id', postId);
        if (error) throw error;
        alert('Post updated successfully!');
        loadUserProfile();
    } catch (error) {
        console.error('Error updating post:', error);
        alert(`Could not update post: ${error.message}`);
    }
}

/**
 * Deletes a post from the database.
 */
async function deletePost(postId) {
    const isConfirmed = confirm("Are you sure you want to permanently delete this post?");
    if (!isConfirmed) return;
    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
        if (error) throw error;
        alert('Post deleted successfully.');
        loadUserProfile();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Could not delete post: ${error.message}`);
    }
}

/**
 * Renders a form for creating a new post.
 */
function renderCreatePostView() {
    const postsSection = document.getElementById('posts-section');
    postsSection.innerHTML = `
        <h3 style="font-size: 2rem; color: #ff5555;">New Post</h3>
        <div style="text-align: left; margin-top: 20px;">
            <textarea id="post-content-input" placeholder="What's on your mind?" style="width: 100%; height: 200px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;"></textarea>
        </div>
        <div style="margin-top: 20px;">
            <button id="submit-post-btn" class="cta-button">Submit Post</button>
            <button id="cancel-post-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>
    `;
    document.getElementById('submit-post-btn').addEventListener('click', saveNewPost);
    document.getElementById('cancel-post-btn').addEventListener('click', loadUserProfile);
}

/**
 * Saves a new post to the Supabase database.
 */
async function saveNewPost() {
    const submitButton = document.getElementById('submit-post-btn');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    const content = document.getElementById('post-content-input').value;
    if (!content.trim()) {
        alert("Post content cannot be empty.");
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Post';
        return;
    }
    try {
        const { error } = await supabaseClient.from('posts').insert({ content: content, author_id: currentUserProfile.id });
        if (error) throw error;
        alert('Post submitted successfully!');
        loadUserProfile();
    } catch (error) {
        console.error('Error submitting post:', error);
        alert(`Could not submit post: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Post';
    }
}

/**
 * Renders the "edit" mode for the PROFILE DETAILS.
 */
function renderEditView() {
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = `
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">Editing Profile</h2>
        <div style="text-align: left; margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 15px;">
            <div><label for="pfp-upload" style="display: block; margin-bottom: 10px; font-weight: bold;">Upload New Profile Picture:</label><input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" style="width: 100%; color: #eee; background: #111; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="bio-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Your Bio:</label><textarea id="bio-input" style="width: 100%; height: 120px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${currentUserProfile.bio || ''}</textarea></div>
            <hr style="border-color: #333;"><h3 style="margin-bottom: 10px;">Social Handles & URLs</h3>
            <div><label for="twitter-input" style="display: block; margin-bottom: 5px;">X / Twitter Handle:</label><input type="text" id="twitter-input" value="${currentUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="telegram-input" style="display: block; margin-bottom: 5px;">Telegram Handle:</label><input type="text" id="telegram-input" value="${currentUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="discord-input" style="display: block; margin-bottom: 5px;">Discord Handle:</label><input type="text" id="discord-input" value="${currentUserProfile.discord_handle || ''}" placeholder="username" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="youtube-input" style="display: block; margin-bottom: 5px;">YouTube Channel URL:</label><input type="text" id="youtube-input" value="${currentUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
            <div><label for="magiceden-input" style="display: block; margin-bottom: 5px;">Magic Eden Profile URL:</label><input type="text" id="magiceden-input" value="${currentUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;"></div>
        </div>
        <div style="margin-top: 30px;"><button id="save-profile-btn" class="cta-button">Save Changes</button><button id="cancel-edit-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button></div>
    `;
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}

/**
 * Saves PROFILE changes from the edit form to Supabase.
 */
async function saveProfileChanges() {
    const saveButton = document.getElementById('save-profile-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    const userWalletAddress = localStorage.getItem('walletAddress');
    try {
        const file = document.getElementById('pfp-upload').files[0];
        let pfpUrlToSave = currentUserProfile.pfp_url;
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
        };
        const { error: dbError } = await supabaseClient.from('profiles').update(newProfileData).eq('wallet_address', userWalletAddress);
        if (dbError) throw dbError;
        alert('Profile saved successfully!');
        loadUserProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Could not save profile: ${error.message}`);
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}
