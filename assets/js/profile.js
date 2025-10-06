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

    profileContent.innerHTML = `
        ${pfpHtml}
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">${currentUserProfile.username}</h2>
        <div style="margin-top: 20px; border-top: 1px solid #444; border-bottom: 1px solid #444; padding: 20px 0;">
            <p style="text-align: left; color: #ccc;"><strong>Bio:</strong></p>
            <p style="text-align: left; min-height: 50px;">${bioText}</p>
        </div>
        <div style="margin-top: 20px; font-family: monospace; color: #aaa; font-size: 0.9rem;">
            <p><strong>Wallet:</strong> ${currentUserProfile.wallet_address}</p>
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
    const currentBio = currentUserProfile.bio || '';
    
    profileContent.innerHTML = `
        <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555;">Editing Profile</h2>
        
        <div style="text-align: left; margin-top: 20px;">
            <label for="pfp-upload" style="display: block; margin-bottom: 10px; font-weight: bold;">Upload New Profile Picture:</label>
            <input type="file" id="pfp-upload" accept="image/png, image/jpeg, image/gif" style="width: 100%; color: #eee; background: #111; border: 1px solid #ff5555; border-radius: 5px; padding: 10px;">
        </div>

        <div style="text-align: left; margin-top: 20px;">
            <label for="bio-input" style="display: block; margin-bottom: 10px; font-weight: bold;">Your Bio:</label>
            <textarea id="bio-input" style="width: 100%; height: 150px; background: #111; color: #eee; border: 1px solid #ff5555; border-radius: 5px; padding: 10px; font-family: 'Inter', sans-serif;">${currentBio}</textarea>
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

    const bioInput = document.getElementById('bio-input');
    const pfpUploadInput = document.getElementById('pfp-upload');
    const userWalletAddress = localStorage.getItem('walletAddress');

    try {
        const newBio = bioInput.value;
        const file = pfpUploadInput.files[0];
        let pfpUrlToSave = currentUserProfile.pfp_url; // Default to the existing URL

        // --- Step 1: Handle the File Upload (if a new file was selected) ---
        if (file) {
            saveButton.textContent = 'Uploading Image...';
            const fileExt = file.name.split('.').pop();
            const fileName = `${userWalletAddress}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload the file to the 'profile-pictures' bucket
            const { error: uploadError } = await supabaseClient.storage
                .from('profile-pictures')
                .upload(filePath, file, { upsert: true }); // 'upsert: true' overwrites the file if it already exists

            if (uploadError) throw uploadError;

            // Get the public URL of the file we just uploaded
            const { data: urlData } = supabaseClient.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);
            
            pfpUrlToSave = urlData.publicUrl;
        }

        // --- Step 2: Update the database with the new bio and/or PFP URL ---
        saveButton.textContent = 'Saving Profile...';
        const { error: dbError } = await supabaseClient
            .from('profiles')
            .update({ 
                bio: newBio,
                pfp_url: pfpUrlToSave
            })
            .eq('wallet_address', userWalletAddress);

        if (dbError) throw dbError;

        alert('Profile saved successfully!');
        loadUserProfile(); // Reload the profile to show all changes

    } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Could not save profile: ${error.message}`);
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}
