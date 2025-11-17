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
    
    // Detect if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const mobileHelper = isMobile ? `
        <div class="mobile-wallet-helper">
            <strong>📱 Mobile Users:</strong>
            Open debtculture.xyz in your wallet's built-in browser (Phantom, Solflare, or Backpack app) to connect your wallet.
        </div>
    ` : '';
    
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h2>Connect Wallet</h2>
                <button class="wallet-modal-close" onclick="closeWalletModal()">&times;</button>
            </div>
            <div class="wallet-modal-body">
                ${mobileHelper}
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
                   <button class="cta-button disconnect" onclick="disconnectWalletFromModal()">Disconnect Wallet</button>
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
    
    // Create dropdown if it doesn't exist
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'wallet-dropdown';
        dropdown.className = 'wallet-dropdown';
        dropdown.innerHTML = `
            <div class="wallet-dropdown-option" onclick="navigateToProfile()">
                👤 My Profile
            </div>
            <div class="wallet-dropdown-option disconnect" onclick="disconnectWallet(); closeWalletDropdown();">
                🚪 Disconnect
            </div>
        `;
        
        const walletBtn = document.getElementById('wallet-connect-btn');
        walletBtn.parentElement.appendChild(dropdown);
        
        // Position dropdown below button
        const rect = walletBtn.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // On mobile, position relative to button with adjustments
            dropdown.style.top = `${rect.bottom + 5}px`;
            dropdown.style.right = '10px';
            dropdown.style.left = 'auto';
        } else {
            // Desktop positioning
           dropdown.style.top = `${rect.bottom + 5}px`;
           dropdown.style.left = `${rect.left}px`;
        }
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeDropdownOnClickOutside);
        }, 0);
    } else {
        closeWalletDropdown();
    }
}

/**
 * Closes the wallet dropdown
 */
function closeWalletDropdown() {
    const dropdown = document.getElementById('wallet-dropdown');
    if (dropdown) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdownOnClickOutside);
    }
}

/**
 * Closes dropdown when clicking outside
 */
function closeDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('wallet-dropdown');
    const walletBtn = document.getElementById('wallet-connect-btn');
    if (dropdown && !dropdown.contains(e.target) && !walletBtn.contains(e.target)) {
        closeWalletDropdown();
    }
}

/**
 * Navigates to user's profile page
 */
function navigateToProfile() {
    window.location.href = `profile.html?user=${currentWalletAddress}`;
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
    document.getElementById('profile-creation-modal').style.display = 'flex';
}

/**
 * Closes the profile creation modal
 */
function closeProfileModal() {
    document.getElementById('profile-creation-modal').style.display = 'none';
}

/**
 * Connects to specified wallet
 */
async function connectWallet(walletType) {
    try {
        const provider = getWalletProvider(walletType);
        
        if (!provider) {
            promptToInstallWallet(walletType);
            return;
        }

        // Connect to wallet
        await provider.connect();
        
        const publicKey = provider.publicKey?.toString();
        if (!publicKey) {
            alert('Failed to retrieve wallet address');
            return;
        }

        // Store wallet info
        currentWalletAddress = publicKey;
        walletProvider = provider;
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletType);

        // Check for existing profile
        await checkAndLoadProfile(publicKey);

        // Update UI
        updateWalletUI();
        closeWalletModal();

        // Listen for account changes
        provider.on('accountChanged', handleAccountChange);

        // If no profile exists, prompt to create one
        if (!currentProfile) {
            setTimeout(() => {
                openProfileModal();
            }, 500);
        }

    } catch (error) {
        console.error('Error connecting wallet:', error);
        if (error.message !== 'User rejected the request.') {
            alert('Failed to connect wallet. Please try again.');
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

    currentWalletAddress = null;
    currentProfile = null;
    walletProvider = null;
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    
    updateWalletUI();
}

/**
 * Restores wallet session from localStorage if it exists
 */
async function restoreWalletSession() {
    try {
        const savedAddress = localStorage.getItem('walletAddress');
        const savedWallet = localStorage.getItem('walletType');
        
        if (savedAddress && savedWallet) {
            console.log('🔄 Attempting to restore wallet session:', savedWallet);
            
            // Wait for wallet provider to load (max 3 seconds)
            const provider = await waitForWalletProvider(savedWallet, 3000);
            
            if (provider) {
                console.log('✅ Wallet provider found:', savedWallet);
                
                try {
                    // Attempt silent reconnection
                    await provider.connect({ onlyIfTrusted: true });
                    const publicKey = provider.publicKey?.toString();
                    
                    console.log('🔑 Public key after connect:', publicKey);
                    
                    if (publicKey && publicKey === savedAddress) {
                        currentWalletAddress = publicKey;
                        walletProvider = provider;
                        
                        // Load profile
                        await checkAndLoadProfile(publicKey);
                        
                        // Update UI to show connected state
                        updateWalletUI();
                        
                        // Listen for account changes
                        provider.on('accountChanged', handleAccountChange);
                        provider.on('disconnect', () => disconnectWallet());
                        
                        console.log('✅ Wallet session fully restored!');
                    } else {
                        console.log('⚠️ Wallet address mismatch or no public key');
                        disconnectWallet();
                    }
                } catch (connectError) {
                    console.log('⚠️ Silent reconnect failed:', connectError.message);
                    // User probably revoked permission - clear session
                    disconnectWallet();
                }
            } else {
                console.log('⚠️ Wallet provider not available after waiting');
            }
        } else {
            console.log('ℹ️ No saved wallet session found');
        }
    } catch (error) {
        console.error('❌ Error restoring wallet session:', error);
        disconnectWallet();
    }
}

/**
 * Waits for wallet provider to become available
 * @param {string} walletId - The wallet ID (phantom, solflare, backpack)
 * @param {number} timeout - Max time to wait in milliseconds
 * @returns {Promise<Object|null>} The wallet provider or null if timeout
 */
function waitForWalletProvider(walletId, timeout = 3000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkProvider = () => {
            const provider = getWalletProvider(walletId);
            
            if (provider) {
                resolve(provider);
            } else if (Date.now() - startTime < timeout) {
                // Check again in 100ms
                setTimeout(checkProvider, 100);
            } else {
                // Timeout - wallet provider not available
                resolve(null);
            }
        };
        
        checkProvider();
    });
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
        
    } else if (!currentProfile) {
        // Connected but no profile
        walletIcon.src = WALLET_CONFIG.defaultWalletIcon;
        walletIcon.alt = 'Create Profile';
        walletBtn.classList.add('connected');
        walletBtn.classList.remove('has-profile');
        walletBtn.style.background = '#00ff00';
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
        walletBtn.style.background = currentProfile.pfp_url ? '' : '#00ff00';
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
    
    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        alert(`📱 To use ${wallet.name} on mobile:\n\n1. Open the ${wallet.name} app on your phone\n2. Use the in-app browser to visit debtculture.xyz\n3. Click the wallet button to connect`);
    } else {
        if (confirm(`${wallet.name} browser extension not detected.\n\nWould you like to download it?`)) {
            window.open(downloadUrls[walletId], '_blank');
        }
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
window.closeWalletDropdown = closeWalletDropdown;

// Export state getters for use in other scripts
window.getWalletAddress = () => currentWalletAddress;
window.getUserProfile = () => currentProfile;
window.isWalletConnected = () => !!currentWalletAddress;
