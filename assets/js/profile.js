// This script contains all the logic for the user profile page.

// --- Initialize Supabase Client ---
// We need to initialize the Supabase client here, just like we do in index.js,
// so this page can communicate with our database.
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Main Logic ---
// This runs our main function once the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

/**
 * Fetches and displays the current user's profile data.
 */
async function loadUserProfile() {
    const profileContent = document.getElementById('profile-content');
    
    // 1. Get the connected wallet address from localStorage.
    // When a user connects on the main page, we save their address in the browser's storage.
    const userWalletAddress = localStorage.getItem('walletAddress');

    // 2. Check if a user is "logged in".
    if (!userWalletAddress) {
        profileContent.innerHTML = `
            <h2>No User Connected</h2>
            <p>Please connect your wallet on the <a href="index.html" class="footer-link">main page</a> to view your profile.</p>
        `;
        return; // Stop the function here if no wallet is connected.
    }

    // 3. Fetch the profile from the Supabase database.
    try {
        const { data, error } = await supabaseClient
            .from('profiles') // The name of our table in Supabase
            .select('*') // Get all columns for the user
            .eq('wallet_address', userWalletAddress) // Find the row where the wallet_address matches
            .single(); // We expect only one result

        // Handle any errors during the fetch
        if (error) {
            // A specific error 'PGRST116' means 0 rows were found. This is a normal case we can handle.
            // For any other error, we should display a technical message.
            if (error.code === 'PGRST116') {
                 profileContent.innerHTML = `
                    <h2>Profile Not Found</h2>
                    <p>We couldn't find a profile for this wallet. Please create one on the <a href="index.html" class="footer-link">main page</a>.</p>
                `;
                return;
            } else {
                // For other, unexpected errors
                throw error;
            }
        }

        // 4. If data is found, display it on the page.
        if (data) {
            // Format the 'created_at' timestamp into a more readable date.
            const joinDate = new Date(data.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // We use template literals (the backticks ``) to create an HTML block.
            // This will replace the "Loading profile..." message.
            profileContent.innerHTML = `
                <h2 style="font-size: 2.5rem; color: #ff5555; text-shadow: 0 0 10px #ff5555; margin-bottom: 15px;">${data.username}</h2>
                <p style="font-family: monospace; color: #ccc; margin-bottom: 5px;"><strong>Wallet:</strong> ${data.wallet_address}</p>
                <p style="color: #ccc;"><strong>Joined On:</strong> ${joinDate}</p>
                
                <div style="margin-top: 30px; border-top: 1px solid #ff5555; padding-top: 20px;">
                    <p><i>Profile customization and features coming soon...</i></p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error fetching profile:', error);
        profileContent.innerHTML = `
            <h2>Error</h2>
            <p>There was an error loading the profile. Please try again later.</p>
            <p style="font-size: 0.8rem; color: #888;">${error.message}</p>
        `;
    }
}
