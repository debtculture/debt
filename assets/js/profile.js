// This script contains all the logic for the user profile page.

// --- Initialize Supabase Client ---
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Global Variable ---
let currentUserProfile = null; // To store the profile data

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

/**
 * Fetches and displays the current user's profile data.
 */
async function loadUserProfile() {
    const profileContent = document.getElementById('profile-content');
    const userWalletAddress = localStorage.getItem('walletAddress');

    if (!userWalletAddress) {
        profileContent.innerHTML = `
            <h2>No User Connected</h2>
            <p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your profile.</p>
        `;
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('wallet_address', userWalletAddress)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            currentUserProfile = data;
            renderProfileView();
        } else {
            profileContent.innerHTML = `
                <h2>Profile Not Found</h2>
                <p>We couldn't find a profile for this wallet. Please create one on the <a href="index.html" class="footer-link">main page</a>.</p>
            `;
        }

    } catch (error) {
        console.error('Error fetching profile:', error);
        profileContent.innerHTML = `<h2>Error</h2><p>There was an error loading the profile.</p>`;
    }
}

/**
 * Renders the standard "view" mode of the profile.
 */
function renderProfileView() {
    const profileContent = document.getElementById('profile-content');
    const joinDate = new Date(currentUserProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const bioText = currentUserProfile.bio ? currentUserProfile.bio.replace(/\n/g, '<br>') : '<i>User has not written a bio yet.</i>';

    const pfpHtml = currentUserProfile.pfp_url 
        ? `<img src="${currentUserProfile.pfp_url}" alt="User Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #ff5555; margin-bottom: 20px;">`
        : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #333; border: 3px solid #ff5555; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; text-align: center;">No Profile<br>Picture</div>`;

    let socialsHtml = '';
    if (currentUserProfile.twitter_handle) {
        socialsHtml += `<a href="https://x.com/${currentUserProfile.twitter_handle}" target="_blank" rel="noopener noreferrer" title="X / Twitter"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723033/X_olwxar.png" alt="X" style="width: 40px; height: 40px;"></a>`;
    }
    if (currentUserProfile.telegram_handle) {
        socialsHtml += `<a href="https://t.me/${currentUserProfile.telegram_handle}" target="_blank" rel="noopener noreferrer" title="Telegram"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Telegram_mvvdgw.png" alt="Telegram" style="width: 40px; height: 40px;"></a>`;
    }
    if (currentUserProfile.discord_handle) {
        socialsHtml += `<a href="#" onclick="alert('Discord: ${currentUserProfile.discord_handle}'); return false;" title="Discord"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750977177/Discord_fa0sy9.png" alt="Discord" style="width: 40px; height: 40px;"></a>`;
    }
    if (currentUserProfile.youtube_url) {
        socialsHtml += `<a href="${currentUserProfile.youtube_url}" target="_blank" rel="noopener noreferrer" title="YouTube"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747358/YouTube_PNG_jt7lcg.png" alt="YouTube" style="width: 40px; height: 40px;"></a>`;
    }
    if (currentUserProfile.magiceden_url) {
        socialsHtml += `<a href="${currentUserProfile.magiceden_url}" target="_blank" rel="noopener noreferrer" title="Magic Eden"><img src="https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762140417/Magic_Eden_gl926b.png" alt="Magic Eden" style="width: 40px; height: 40px;"></a>`;
    }

    // --- THIS IS THE FIX ---
    // Shorten the wallet address for display
    const fullAddress = currentUserProfile.wallet_address;
    const shortAddress = `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;

    profileContent.innerHTML = `
        ${pfpHtml}
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${currentUserProfile.username}</h2>
        
        <div style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">
            ${socialsHtml}
        </div>

        <div style="margin-top: 20px; border-top: 1px solid #444; border-bottom: 1px solid #444; padding: 20px 0;">
            <p style="text-align: left; color: #ccc;"><strong>Bio:</strong></p>
            <p style="text-align: left; min-height: 50px;">${bioText}</p>
        </div>
        <div style="margin-top: 20px; font-family: monospace; color: #aaa; font-size: 0.9rem; word-break: break-all; padding: 0 10px;">
            <p><strong>Wallet:</strong> ${shortAddress}</p>
            <p><strong>Joined:</strong> ${joinDate}</p>
        </div>
        <button id="edit-profile-btn" class="cta-button" style="margin-top: 30px;">Edit Profile</button>
    `;

    document.getElementById('edit-profile-btn').addEventListener('click', renderEditView);
}

/**
 * Renders the "edit" mode of the profile with a form.
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
                <textarea id="bio-input" style="width: 100%; height: 120px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${currentUserProfile.bio || ''}</textarea>
            </div>
            <hr style="border-color: #333;">
            <h3 style="margin-bottom: 10px;">Social Handles & URLs</h3>
            <div>
                <label for="twitter-input" style="display: block; margin-bottom: 5px;">X / Twitter Handle:</label>
                <input type="text" id="twitter-input" value="${currentUserProfile.twitter_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
            </div>
            <div>
                <label for="telegram-input" style="display: block; margin-bottom: 5px;">Telegram Handle:</label>
                <input type="text" id="telegram-input" value="${currentUserProfile.telegram_handle || ''}" placeholder="YourHandle (no @)" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
            </div>
            <div>
                <label for="discord-input" style="display: block; margin-bottom: 5px;">Discord Handle:</label>
                <input type="text" id="discord-input" value="${currentUserProfile.discord_handle || ''}" placeholder="username" style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
            </div>
             <div>
                <label for="youtube-input" style="display: block; margin-bottom: 5px;">YouTube Channel URL:</label>
                <input type="text" id="youtube-input" value="${currentUserProfile.youtube_url || ''}" placeholder="https://youtube.com/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
            </div>
            <div>
                <label for="magiceden-input" style="display: block; margin-bottom: 5px;">Magic Eden Profile URL:</label>
                <input type="text" id="magiceden-input" value="${currentUserProfile.magiceden_url || ''}" placeholder="https://magiceden.io/u/..." style="width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 5px; padding: 10px;">
            </div>
        </div>

        <div style="margin-top: 30px;">
            <button id="save-profile-btn" class="cta-button">Save Changes</button>
            <button id="cancel-edit-btn" class="cta-button" style="background: #555; border-color: #777; margin-left: 15px;">Cancel</button>
        </div>
    `;

    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('cancel-edit-btn').addEventListener('click', renderProfileView);
}

/**
 * Handles the file upload and saves all changes to Supabase.
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
            
            const { error: uploadError } = await supabaseClient.storage
                .from('profile-pictures')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage
                .from('profile-pictures')
                .getPublicUrl(fileName);
            
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

        const { error: dbError } = await supabaseClient
            .from('profiles')
            .update(newProfileData)
            .eq('wallet_address', userWalletAddress);

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
