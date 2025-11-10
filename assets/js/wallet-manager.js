/* =============================================================================
   WALLET MANAGER - Centralized Wallet Connection & Profile Management
   Used across all pages for consistent wallet integration
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const WALLET_CONFIG = {
    supabaseUrl: 'https://pvbguojrkigzvnuwjawy.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw',
    wallets: [
        { name: 'Phantom', id: 'phantom', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Phantom_Wallet_s3cahc.jpg' },
        { name: 'Solflare', id: 'solflare', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Solflare_Wallet_nxcl95.jpg' },
        { name: 'Backpack', id: 'backpack', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750446379/backpack_rer24o.jpg' }
    ],
    defaultWalletIcon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748890233/Wallet_PNG_sxrfdx.png'
};

// =================================================================================
// --- GLOBAL STATE ---
// =================================================================================

let supabaseClient = null;
let currentWalletAddress = null;
let currentProfile = null;
let walletProvider = null;

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

/**
 * Initialize the wallet manager
 * Call this from DOMContentLoaded on every page
 */
async function initializeWalletManager() {
    // Initialize Supabase client
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(WALLET_CONFIG.supabaseUrl, WALLET_CONFIG.supabaseAnonKey);
    } else {
        console.error('Supabase library not loaded');
        return;
    }

    // Prevent Ethereum conflicts
    window.ethereum = undefined;

    // Create wallet UI element if it doesn't exist
    createWalletUIElement();

    // Restore previous session if exists
    await restoreWalletSession();
}

// =================================================================================
// --- UI CREATION ---
// =================================================================================

/**
 * Creates the wallet connection UI element and injects it into navbar
 */
function createWalletUIElement() {
    // Check if element already exists
    if (document.getElementById('wallet-connect-btn')) return;

    // Find the navbar actions container
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) {
        console.error('Nav actions container not found');
        return;
    }

    // Create wallet button element
    const walletBtn = document.createElement('button');
    walletBtn.id = 'wallet-connect-btn';
    walletBtn.className = 'wallet-connect-btn';
    walletBtn.innerHTML = `
        <img src="${WALLET_CONFIG.defaultWalletIcon}" alt="Connect Wallet" class="wallet-icon">
        <span class="wallet-badge" style="display: none;">!</span>
    `;
    
    // Insert before Buy $DEBT button
    const buyButton = navActions.querySelector('.cta-button');
    if (buyButton) {
        navActions.insertBefore(walletBtn, buyButton);
    } else {
        navActions.appendChild(walletBtn);
    }

    // Add click handler
    walletBtn.addEventListener('click', handleWalletButtonClick);

    // Create wallet modal (hidden by default)
    createWalletModal();
    
    // Create profile creation modal (hidden by default)
    createProfileModal();
}

/**
 * Creates the wallet selection modal
 */
function createWalletModal() {
    if (document.getElementById('wallet-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'wallet-modal';
    modal.className = 'wallet-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h2>Connect Wallet</h2>
                <button class="wallet-modal-close" onclick="closeWalletModal()">&times;</button>
            </div>
            <div class="wallet-modal-body">
                <p>Choose your wallet to connect:</p>
                <div id="wallet-list" class="wallet-list"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Populate wallet options
    const walletList = document.getElementById('wallet-list');
    WALLET_CONFIG.wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.className = 'wallet-option';
        button.innerHTML = `
            <img src="${wallet.icon}" alt="${wallet.name}">
            <span>${wallet.name}</span>
        `;
        button.onclick = () => connectWallet(wallet.id);
        walletList.appendChild(button);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWalletModal();
        }
    });
}

/**
 * Creates the profile creation modal
 */
function createProfileModal() {
    if (document.getElementById('profile-creation-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'profile-creation-modal';
    modal.className = 'wallet-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h2>Create Your Profile</h2>
                <button class="wallet-modal-close" onclick="closeProfileModal()">&times;</button>
            </div>
            <div class="wallet-modal-body">
                <p>Choose a username to complete your profile:</p>
                <input type="text" id="profile-username-input" class="profile-username-input" placeholder="Enter username..." maxlength="20">
                <p class="username-rules">3-20 characters, lowercase letters and numbers only</p>
                <div class="profile-modal-actions">
                    <button class="cta-button" onclick="createProfile()">Create Profile</button>
                    <button class="cta-button cancel" onclick="closeProfileModal()">Maybe Later</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProfileModal();
        }
    });

    // Handle Enter key in username input
    document.getElementById('profile-username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createProfile();
        }
    });
}

// =================================================================================
// --- WALLET CONNECTION LOGIC ---
// =================================================================================

/**
 * Handles wallet button click based on current state
 */
async function handleWalletButtonClick() {
    if (!currentWalletAddress) {
        // Not connected - open wallet selection modal
        openWalletModal();
    } else if (!currentProfile) {
        // Connected but no profile - open profile creation modal
        openProfileModal();
    } else {
        // Connected with profile - navigate to profile page
        window.location.href = `profile.html?user=${currentWalletAddress}`;
    }
}

/**
 * Opens the wallet selection modal
 */
function openWalletModal() {
    document.getElementById('wallet-modal').style.display = 'flex';
}

/**
 * Closes the wallet selection modal
 */
function closeWalletModal() {
    document.getElementById('wallet-modal').style.display = 'none';
}

/**
 * Opens the profile creation modal
 */
function openProfileModal() {
    const modal = document.getElementById('profile-creation-modal');
    modal.style.display = 'flex';
    // Focus the input
    setTimeout(() => {
        document.getElementById('profile-username-input').focus();
    }, 100);
}

/**
 * Closes the profile creation modal
 */
function closeProfileModal() {
    document.getElementById('profile-creation-modal').style.display = 'none';
    document.getElementById('profile-username-input').value = '';
}

/**
 * Connects to specified wallet
 */
async function connectWallet(walletId) {
    closeWalletModal();
    
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const provider = getWalletProvider(walletId);
    const isMobileWebBrowser = isMobile && !provider;

    // Mobile deep linking
    if (isMobileWebBrowser) {
        const deepLink = {
            phantom: `https://phantom.app/ul/browse/${window.location.href}`,
            solflare: `https://solflare.com/ul/v1/browse/${window.location.href}`,
            backpack: `https://backpack.app/ul/browse/${window.location.href}`
        }[walletId];
        
        window.location.href = deepLink;
        return;
    }
    
    try {
        if (!provider) {
            promptToInstallWallet(walletId);
            return;
        }

        await provider.connect();
        const publicKey = provider.publicKey.toString();
        if (!publicKey) throw new Error('Public key not found.');

        // Save connection
        currentWalletAddress = publicKey;
        walletProvider = provider;
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletId);

        // Check for existing profile
        await checkAndLoadProfile(publicKey);

        // Update UI
        updateWalletUI();

        // Listen for account changes
        provider.on('accountChanged', handleAccountChange);

        // If no profile exists, prompt creation
        if (!currentProfile) {
            openProfileModal();
        }

    } catch (error) {
        console.error(`Error connecting ${walletId}:`, error);
        alert(`Failed to connect ${walletId}. Ensure your wallet is unlocked.`);
    }
}

/**
 * Disconnects the current wallet
 */
async function disconnectWallet() {
    const walletType = localStorage.getItem('walletType');
    
    try {
        const provider = getWalletProvider(walletType);
        if (provider && provider.disconnect) {
            await provider.disconnect();
        }
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
    }

    // Clear state
    currentWalletAddress = null;
    currentProfile = null;
    walletProvider = null;
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');

    // Update UI
    updateWalletUI();
}

/**
 * Restores wallet session from localStorage
 */
async function restoreWalletSession() {
    const walletType = localStorage.getItem('walletType');
    const walletAddress = localStorage.getItem('walletAddress');
    
    if (!walletType || !walletAddress) {
        updateWalletUI();
        return;
    }

    try {
        const provider = getWalletProvider(walletType);
        if (provider) {
            await provider.connect({ onlyIfTrusted: true });
            const publicKey = provider.publicKey?.toString();
            
            if (publicKey && publicKey === walletAddress) {
                currentWalletAddress = publicKey;
                walletProvider = provider;
                await checkAndLoadProfile(publicKey);
                updateWalletUI();
                provider.on('accountChanged', handleAccountChange);
            } else {
                disconnectWallet();
            }
        }
    } catch (error) {
        console.error('Error restoring wallet session:', error);
        disconnectWallet();
    }
}

/**
 * Handles wallet account changes
 */
async function handleAccountChange(newPublicKey) {
    if (newPublicKey) {
        const newKey = newPublicKey.toString();
        currentWalletAddress = newKey;
        localStorage.setItem('walletAddress', newKey);
        await checkAndLoadProfile(newKey);
        updateWalletUI();
    } else {
        disconnectWallet();
    }
}

// =================================================================================
// --- PROFILE MANAGEMENT ---
// =================================================================================

/**
 * Checks if profile exists for wallet address and loads it
 */
async function checkAndLoadProfile(walletAddress) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, pfp_url, wallet_address, id')
            .eq('wallet_address', walletAddress)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        currentProfile = data;

        // Update last_seen if profile exists
        if (data) {
            supabaseClient
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('wallet_address', walletAddress)
                .then(({ error }) => {
                    if (error) console.error('Error updating last_seen:', error);
                });
        }

        return data;
    } catch (error) {
        console.error('Error checking user profile:', error);
        return null;
    }
}

/**
 * Creates a new profile for the connected wallet
 */
async function createProfile() {
    const usernameInput = document.getElementById('profile-username-input');
    const username = usernameInput.value.trim().toLowerCase();

    // Validation
    if (!username) {
        alert('Please enter a username');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        alert('Username must be between 3 and 20 characters');
        return;
    }

    if (!/^[a-z0-9]+$/.test(username)) {
        alert('Username can only contain lowercase letters and numbers');
        return;
    }

    if (!currentWalletAddress) {
        alert('Please connect your wallet first');
        closeProfileModal();
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                wallet_address: currentWalletAddress,
                username: username
            })
            .select()
            .single();

        if (error) {
            if (error.message.includes('duplicate key')) {
                alert('This username is already taken. Please choose another.');
            } else {
                throw error;
            }
        } else if (data) {
            currentProfile = data;
            closeProfileModal();
            updateWalletUI();
            
            // Show success message
            alert(`Success! Your profile "${data.username}" has been created.`);
        }

    } catch (error) {
        console.error('Error creating profile:', error);
        alert('An error occurred while creating your profile. Please try again.');
    }
}

// =================================================================================
// --- UI UPDATES ---
// =================================================================================

/**
 * Updates the wallet button UI based on current state
 */
function updateWalletUI() {
    const walletBtn = document.getElementById('wallet-connect-btn');
    const walletIcon = walletBtn.querySelector('.wallet-icon');
    const walletBadge = walletBtn.querySelector('.wallet-badge');
    
    if (!currentWalletAddress) {
        // Disconnected state
        walletIcon.src = WALLET_CONFIG.defaultWalletIcon;
        walletIcon.alt = 'Connect Wallet';
        walletBtn.classList.remove('connected', 'has-profile');
        walletBtn.style.background = '';
        walletBadge.style.display = 'none';
        walletBtn.title = 'Connect Wallet';
        
    } else if (!currentProfile) {
        // Connected but no profile
        walletIcon.src = WALLET_CONFIG.defaultWalletIcon;
        walletIcon.alt = 'Create Profile';
        walletBtn.classList.add('connected');
        walletBtn.classList.remove('has-profile');
        walletBtn.style.background = 'linear-gradient(135deg, rgba(85, 255, 85, 0.2), rgba(34, 139, 34, 0.2))';
        walletBadge.style.display = 'block';
        walletBtn.title = 'Create Profile';
        
    } else {
        // Connected with profile
        if (currentProfile.pfp_url) {
            walletIcon.src = currentProfile.pfp_url;
            walletIcon.alt = currentProfile.username;
        } else {
            walletIcon.src = WALLET_CONFIG.defaultWalletIcon;
            walletIcon.alt = currentProfile.username;
        }
        walletBtn.classList.add('connected', 'has-profile');
        walletBtn.style.background = currentProfile.pfp_url ? '' : 'linear-gradient(135deg, rgba(85, 255, 85, 0.3), rgba(34, 139, 34, 0.3))';
        walletBadge.style.display = 'none';
        walletBtn.title = `View ${currentProfile.username}'s profile`;
    }
}

// =================================================================================
// --- HELPER FUNCTIONS ---
// =================================================================================

/**
 * Gets the wallet provider for specified wallet ID
 */
function getWalletProvider(walletId) {
    if (walletId === 'phantom' && window.solana?.isPhantom) return window.solana;
    if (walletId === 'solflare' && window.solflare?.isSolflare) return window.solflare;
    if (walletId === 'backpack' && window.backpack) return window.backpack;
    return null;
}

/**
 * Prompts user to install specified wallet
 */
function promptToInstallWallet(walletId) {
    const wallet = WALLET_CONFIG.wallets.find(w => w.id === walletId);
    const downloadUrls = {
        phantom: 'https://phantom.app/download',
        solflare: 'https://solflare.com/download',
        backpack: 'https://backpack.app/download'
    };
    
    if (confirm(`${wallet.name} is not installed. Would you like to download it?`)) {
        window.open(downloadUrls[walletId], '_blank');
    }
}

// =================================================================================
// --- EXPORT FUNCTIONS (for use in other scripts) ---
// =================================================================================

// Make functions globally available
window.initializeWalletManager = initializeWalletManager;
window.closeWalletModal = closeWalletModal;
window.closeProfileModal = closeProfileModal;
window.createProfile = createProfile;
window.disconnectWallet = disconnectWallet;

// Export state getters for use in other scripts
window.getWalletAddress = () => currentWalletAddress;
window.getUserProfile = () => currentProfile;
window.isWalletConnected = () => !!currentWalletAddress;
