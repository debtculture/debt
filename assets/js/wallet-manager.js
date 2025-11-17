/* =============================================================================
   WALLET MANAGER - Centralized Wallet Connection & Profile Management
   IMPROVEMENTS: Loading states, keyboard handlers, better UX, accessibility
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
let accountChangeDebounceTimer = null;

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

    // Setup keyboard handlers
    setupGlobalKeyboardHandlers();

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
    walletBtn.setAttribute('aria-label', 'Connect Wallet');
    walletBtn.innerHTML = `
        <img src="${WALLET_CONFIG.defaultWalletIcon}" alt="Connect Wallet" class="wallet-icon">
        <span class="wallet-badge" style="display: none;" aria-label="Action required">!</span>
    `;
    
    // Insert BEFORE Buy $DEBT button (first child of nav-actions)
    navActions.insertBefore(walletBtn, navActions.firstChild);

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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'wallet-modal-title');
    
    // Detect if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const mobileHelper = isMobile ? `
        <div class="mobile-wallet-helper" role="alert">
            <strong>📱 Mobile Users:</strong>
            Open debtculture.xyz in your wallet's built-in browser (Phantom, Solflare, or Backpack app) to connect your wallet.
        </div>
    ` : '';
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h2 id="wallet-modal-title">Connect Wallet</h2>
                <button class="wallet-modal-close" onclick="closeWalletModal()" aria-label="Close modal">&times;</button>
            </div>
            <div class="wallet-modal-body">
                ${mobileHelper}
                <p>Choose your wallet to connect:</p>
                <div id="wallet-list" class="wallet-list" role="list"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Populate wallet options
    const walletList = document.getElementById('wallet-list');
    WALLET_CONFIG.wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.className = 'wallet-option';
        button.setAttribute('role', 'listitem');
        button.setAttribute('aria-label', `Connect with ${wallet.name}`);
        button.innerHTML = `
            <img src="${wallet.icon}" alt="${wallet.name} logo">
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'profile-modal-title');
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h2 id="profile-modal-title">Create Your Profile</h2>
                <button class="wallet-modal-close" onclick="closeProfileModal()" aria-label="Close modal">&times;</button>
            </div>
            <div class="wallet-modal-body">
                <p>Choose a username to complete your profile:</p>
                <input 
                    type="text" 
                    id="profile-username-input" 
                    class="profile-username-input" 
                    placeholder="Enter username..." 
                    maxlength="20"
                    aria-label="Username"
                    aria-describedby="username-rules"
                >
                <p id="username-rules" class="username-rules">3-20 characters, lowercase letters and numbers only</p>
                <div class="profile-modal-actions">
                    <button class="cta-button" onclick="createProfile()" aria-label="Create profile">Create Profile</button>
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
        // Connected with profile - show dropdown menu
        toggleWalletDropdown();
    }
}

/**
 * Toggles the wallet dropdown menu
 */
function toggleWalletDropdown() {
    let dropdown = document.getElementById('wallet-dropdown');
    
    if (dropdown) {
        closeWalletDropdown();
        return;
    }

    const walletBtn = document.getElementById('wallet-connect-btn');
    if (!walletBtn) return;

    const rect = walletBtn.getBoundingClientRect();

    dropdown = document.createElement('div');
    dropdown.id = 'wallet-dropdown';
    dropdown.className = 'wallet-dropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 10}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;

    // Profile link
    const profileOption = document.createElement('div');
    profileOption.className = 'wallet-dropdown-option';
    profileOption.setAttribute('role', 'menuitem');
    profileOption.textContent = 'View Profile';
    profileOption.onclick = () => {
        window.location.href = `profile.html?user=${currentWalletAddress}`;
    };

    // Disconnect option
    const disconnectOption = document.createElement('div');
    disconnectOption.className = 'wallet-dropdown-option disconnect';
    disconnectOption.setAttribute('role', 'menuitem');
    disconnectOption.textContent = 'Disconnect';
    disconnectOption.onclick = disconnectWallet;

    dropdown.appendChild(profileOption);
    dropdown.appendChild(disconnectOption);
    document.body.appendChild(dropdown);

    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleDropdownOutsideClick);
    }, 0);
}

/**
 * Closes the wallet dropdown menu
 */
function closeWalletDropdown() {
    const dropdown = document.getElementById('wallet-dropdown');
    if (dropdown) {
        dropdown.remove();
        document.removeEventListener('click', handleDropdownOutsideClick);
    }
}

/**
 * Handles clicks outside the dropdown
 */
function handleDropdownOutsideClick(event) {
    const dropdown = document.getElementById('wallet-dropdown');
    const walletBtn = document.getElementById('wallet-connect-btn');
    
    if (dropdown && !dropdown.contains(event.target) && event.target !== walletBtn) {
        closeWalletDropdown();
    }
}

/**
 * Opens the wallet selection modal
 */
function openWalletModal() {
    const modal = document.getElementById('wallet-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Focus first wallet option for accessibility
        setTimeout(() => {
            const firstWallet = modal.querySelector('.wallet-option');
            if (firstWallet) firstWallet.focus();
        }, 100);
    }
}

/**
 * Closes the wallet selection modal
 */
function closeWalletModal() {
    const modal = document.getElementById('wallet-modal');
    if (modal) {
        modal.style.display = 'none';
        // Return focus to wallet button
        const walletBtn = document.getElementById('wallet-connect-btn');
        if (walletBtn) walletBtn.focus();
    }
}

/**
 * Opens the profile creation modal
 */
function openProfileModal() {
    const modal = document.getElementById('profile-creation-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Focus username input for accessibility
        setTimeout(() => {
            const input = document.getElementById('profile-username-input');
            if (input) input.focus();
        }, 100);
    }
}

/**
 * Closes the profile creation modal
 */
function closeProfileModal() {
    const modal = document.getElementById('profile-creation-modal');
    if (modal) {
        modal.style.display = 'none';
        // Clear input
        const input = document.getElementById('profile-username-input');
        if (input) input.value = '';
        // Return focus to wallet button
        const walletBtn = document.getElementById('wallet-connect-btn');
        if (walletBtn) walletBtn.focus();
    }
}

/**
 * Connects to specified wallet
 * @param {string} walletId - ID of the wallet to connect
 */
async function connectWallet(walletId) {
    const provider = getWalletProvider(walletId);
    
    if (!provider) {
        promptToInstallWallet(walletId);
        return;
    }

    // Show loading state
    showLoadingState('Connecting wallet...');

    try {
        // Request connection
        const response = await provider.connect();
        const publicKey = response.publicKey.toString();

        currentWalletAddress = publicKey;
        walletProvider = provider;
        
        // Store in localStorage
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletId);

        // Setup account change listener with debouncing
        if (provider.on) {
            provider.on('accountChanged', debounce(handleAccountChange, 300));
        }

        // Check if profile exists
        await checkAndLoadProfile(publicKey);

        // Update UI
        updateWalletUI();
        closeWalletModal();
        hideLoadingState();

        // Show profile creation prompt if needed
        if (!currentProfile) {
            setTimeout(() => openProfileModal(), 500);
        }

    } catch (error) {
        console.error('Error connecting wallet:', error);
        hideLoadingState();
        
        // User-friendly error messages
        if (error.message?.includes('User rejected')) {
            showError('Connection cancelled. Please try again when ready.');
        } else {
            showError('Failed to connect wallet. Please try again.');
        }
    }
}

/**
 * Disconnects the current wallet
 */
async function disconnectWallet() {
    try {
        if (walletProvider && walletProvider.disconnect) {
            await walletProvider.disconnect();
        }
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
    }

    // Clear state
    currentWalletAddress = null;
    currentProfile = null;
    walletProvider = null;

    // Clear localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');

    // Update UI
    updateWalletUI();
    closeWalletDropdown();

    // Show success message
    showSuccess('Wallet disconnected successfully.');
}

/**
 * Restores wallet session from localStorage
 */
async function restoreWalletSession() {
    const savedAddress = localStorage.getItem('walletAddress');
    const savedWalletType = localStorage.getItem('walletType');

    if (!savedAddress || !savedWalletType) return;

    const provider = getWalletProvider(savedWalletType);
    if (!provider) return;

    try {
        // Check if wallet is still connected
        if (provider.isConnected && provider.publicKey) {
            const publicKey = provider.publicKey.toString();
            
            if (publicKey === savedAddress) {
                currentWalletAddress = savedAddress;
                walletProvider = provider;

                // Setup account change listener with debouncing
                if (provider.on) {
                    provider.on('accountChanged', debounce(handleAccountChange, 300));
                }

                await checkAndLoadProfile(savedAddress);
                updateWalletUI();
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
 * Handles wallet account changes (debounced)
 */
async function handleAccountChange(newPublicKey) {
    if (newPublicKey) {
        showLoadingState('Switching account...');
        
        const newKey = newPublicKey.toString();
        currentWalletAddress = newKey;
        localStorage.setItem('walletAddress', newKey);
        await checkAndLoadProfile(newKey);
        updateWalletUI();
        
        hideLoadingState();
        
        if (!currentProfile) {
            setTimeout(() => openProfileModal(), 500);
        }
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
        showError('Please enter a username');
        usernameInput.focus();
        return;
    }

    if (username.length < 3 || username.length > 20) {
        showError('Username must be between 3 and 20 characters');
        usernameInput.focus();
        return;
    }

    if (!/^[a-z0-9]+$/.test(username)) {
        showError('Username can only contain lowercase letters and numbers');
        usernameInput.focus();
        return;
    }

    if (!currentWalletAddress) {
        showError('Please connect your wallet first');
        closeProfileModal();
        return;
    }

    // Show loading state
    showLoadingState('Creating profile...');

    try {
        // NOTE: Username uniqueness is enforced by database constraint
        // Server will return error if username is taken
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                wallet_address: currentWalletAddress,
                username: username
            })
            .select()
            .single();

        if (error) {
            hideLoadingState();
            
            if (error.message.includes('duplicate key')) {
                showError('This username is already taken. Please choose another.');
                usernameInput.focus();
            } else {
                throw error;
            }
        } else if (data) {
            currentProfile = data;
            closeProfileModal();
            updateWalletUI();
            hideLoadingState();
            
            // Show success message
            showSuccess(`Profile "${data.username}" created successfully!`);
        }

    } catch (error) {
        console.error('Error creating profile:', error);
        hideLoadingState();
        showError('An error occurred while creating your profile. Please try again.');
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
    if (!walletBtn) return;
    
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
        walletBtn.setAttribute('aria-label', 'Connect Wallet');
        
    } else if (!currentProfile) {
        // Connected but no profile
        walletIcon.src = WALLET_CONFIG.defaultWalletIcon;
        walletIcon.alt = 'Create Profile';
        walletBtn.classList.add('connected');
        walletBtn.classList.remove('has-profile');
        walletBtn.style.background = '#00ff00';
        walletBadge.style.display = 'block';
        walletBtn.title = 'Create Profile';
        walletBtn.setAttribute('aria-label', 'Connected - Create Profile');
        
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
        walletBtn.style.background = currentProfile.pfp_url ? '' : '#00ff00';
        walletBadge.style.display = 'none';
        walletBtn.title = `View ${currentProfile.username}'s profile`;
        walletBtn.setAttribute('aria-label', `Logged in as ${currentProfile.username}`);
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
    
    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Generate deep link for mobile
        const deepLinks = {
            phantom: `https://phantom.app/ul/browse/debtculture.xyz?ref=debtculture`,
            solflare: `https://solflare.com/ul/v1/browse/debtculture.xyz`,
            backpack: `https://backpack.app/ul/browse/debtculture.xyz`
        };
        
        const message = `📱 To use ${wallet.name} on mobile:\n\n1. Open the ${wallet.name} app on your phone\n2. Use the in-app browser to visit debtculture.xyz\n3. Click the wallet button to connect`;
        
        if (confirm(message + '\n\nOpen app now?')) {
            window.location.href = deepLinks[walletId] || downloadUrls[walletId];
        }
    } else {
        if (confirm(`${wallet.name} browser extension not detected.\n\nWould you like to download it?`)) {
            window.open(downloadUrls[walletId], '_blank');
        }
    }
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Shows loading overlay with message
 * @param {string} message - Loading message
 */
function showLoadingState(message = 'Loading...') {
    let loader = document.getElementById('wallet-loading-overlay');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'wallet-loading-overlay';
        loader.className = 'wallet-loading-overlay';
        loader.setAttribute('role', 'alert');
        loader.setAttribute('aria-live', 'polite');
        document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
        <div class="wallet-loading-content">
            <div class="wallet-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    loader.style.display = 'flex';
}

/**
 * Hides loading overlay
 */
function hideLoadingState() {
    const loader = document.getElementById('wallet-loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Shows error toast notification
 * @param {string} message - Error message
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * Shows success toast notification
 * @param {string} message - Success message
 */
function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * Shows toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type ('success' or 'error')
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existing = document.querySelectorAll('.wallet-toast');
    existing.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `wallet-toast wallet-toast-${type}`;
    toast.setAttribute('role', 'alert');
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

/**
 * Setup global keyboard event handlers
 */
function setupGlobalKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
        // ESC key closes modals
        if (e.key === 'Escape') {
            const walletModal = document.getElementById('wallet-modal');
            const profileModal = document.getElementById('profile-creation-modal');
            
            if (walletModal && walletModal.style.display === 'flex') {
                closeWalletModal();
            } else if (profileModal && profileModal.style.display === 'flex') {
                closeProfileModal();
            }
            
            // Close dropdown
            closeWalletDropdown();
        }
    });
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
window.closeWalletDropdown = closeWalletDropdown;

// Export state getters for use in other scripts
window.getWalletAddress = () => currentWalletAddress;
window.getUserProfile = () => currentProfile;
window.isWalletConnected = () => !!currentWalletAddress;

// =================================================================================
// --- FUTURE FEATURE STUBS ---
// =================================================================================

/**
 * STUB: Sign message with wallet (for NFT verification)
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signed message
 */
async function signMessage(message) {
    if (!walletProvider || !currentWalletAddress) {
        throw new Error('Wallet not connected');
    }
    
    // TODO: Implement message signing
    // This will be used for NFT minting, airdrop claims, etc.
    console.warn('signMessage not yet implemented');
    return null;
}

/**
 * STUB: Check NFT holdings (for gated features)
 * @returns {Promise<Array>} Array of NFT mint addresses
 */
async function checkNFTHoldings() {
    if (!currentWalletAddress) {
        throw new Error('Wallet not connected');
    }
    
    // TODO: Integrate with Helius/RPC to fetch NFTs
    console.warn('checkNFTHoldings not yet implemented');
    return [];
}

// Export future feature stubs
window.signMessage = signMessage;
window.checkNFTHoldings = checkNFTHoldings;

/* =============================================================================
   USAGE NOTES:
   
   1. Add this CSS to shared-styles.css:
   
   .wallet-loading-overlay {
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: rgba(0, 0, 0, 0.8);
       backdrop-filter: blur(5px);
       display: none;
       align-items: center;
       justify-content: center;
       z-index: 10002;
   }
   
   .wallet-loading-content {
       text-align: center;
       color: var(--text-primary);
   }
   
   .wallet-spinner {
       width: 50px;
       height: 50px;
       border: 4px solid rgba(255, 59, 59, 0.2);
       border-top-color: var(--main-red);
       border-radius: 50%;
       animation: spin 0.8s linear infinite;
       margin: 0 auto 20px;
   }
   
   @keyframes spin {
       to { transform: rotate(360deg); }
   }
   
   .wallet-toast {
       position: fixed;
       bottom: 30px;
       right: 30px;
       padding: 15px 25px;
       background: rgba(26, 26, 26, 0.95);
       border: 2px solid var(--main-red);
       border-radius: 8px;
       color: var(--text-primary);
       font-weight: 600;
       opacity: 0;
       transform: translateY(20px);
       transition: all 0.3s ease;
       z-index: 10003;
       max-width: 400px;
   }
   
   .wallet-toast.show {
       opacity: 1;
       transform: translateY(0);
   }
   
   .wallet-toast-error {
       border-color: #ff6b6b;
   }
   
   .wallet-toast-success {
       border-color: #00ff00;
   }
   
   ============================================================================= */
