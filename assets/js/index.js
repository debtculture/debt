// --- Initialize Supabase Client ---
const supabaseUrl = 'https://pvbguojrkigzvnuwjawy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
let userWalletAddress = null;
// This event listener initializes all the scripts for the main page once the HTML is ready.
window.addEventListener('load', async () => {
    // Check for Solana library
    if (typeof solanaWeb3 === 'undefined') {
        console.error('solanaWeb3 library is not loaded. Please include it via CDN.');
    }

    // Initialize UI components
    initializeAudioPlayer();
    setPhantomLink();
    initializeRoadmapInteraction();

    // Set up event listeners for wallet buttons
    const mobileButton = document.getElementById('connectWalletMobile');
    const desktopBubble = document.getElementById('connectWalletDesktop');
    
    mobileButton.addEventListener('click', () => {
        if (mobileButton.classList.contains('connected')) {
            document.getElementById('walletInfo').classList.toggle('visible');
        } else {
            openWalletModal();
        }
    });
    
    desktopBubble.addEventListener('click', () => {
        if (desktopBubble.classList.contains('connected')) {
            document.getElementById('walletInfo').classList.toggle('visible');
        } else {
            openWalletModal();
        }
    });

    // Attempt to restore a previously connected wallet session
    await restoreWalletSession();

    // Trigger scroll animations on load
    window.dispatchEvent(new Event('scroll'));

    // Add a click listener for our new profile button
    const createProfileButton = document.getElementById('create-profile-btn');
    if (createProfileButton) {
        createProfileButton.addEventListener('click', handleSignUp);
    }
});


// --- UI & GENERAL INTERACTIVITY ---

// This line is added by some wallets like Phantom. Setting it to undefined prevents potential conflicts.
window.ethereum = undefined;

function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    menu.setAttribute('aria-expanded', !isOpen);
    hamburger.classList.toggle("active", !isOpen);
}

function closeMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.style.display = "none";
    menu.setAttribute('aria-expanded', 'false');
}

function toggleDropdown() {
    const dropdown = document.getElementById("mobileDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function scrollToSection(selector) {
    const element = document.querySelector(selector);
    const headerOffset = 60; // Adjust for fixed header height
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = content.classList.contains('active');
    
    document.querySelectorAll('.accordion-content').forEach(item => {
        item.classList.remove('active');
        item.style.maxHeight = '0';
        item.style.padding = '0 15px';
        item.previousElementSibling.classList.remove('active', 'pulse');
        item.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
    
    if (!isActive) {
        content.classList.add('active');
        content.style.maxHeight = `${content.scrollHeight + 30}px`;
        content.style.padding = '15px';
        header.classList.add('active', 'pulse');
        header.setAttribute('aria-expanded', 'true');
        setTimeout(() => header.classList.remove('pulse'), 1000);
    }
}

function toggleSocialBubbles() {
    const container = document.querySelector('.join-rebellion-container');
    const button = document.querySelector('.join-rebellion');
    const bubbles = document.querySelector('.social-bubbles');
    if (!container || !button || !bubbles) {
        console.error('ToggleSocialBubbles: Element not found', { container, button, bubbles });
        return;
    }
    const isActive = bubbles.classList.toggle('active');
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-expanded', isActive);
}

function copySleekAddress(element) {
    const addressToCopy = element.querySelector('.full-address-text').textContent.trim();
    navigator.clipboard.writeText(addressToCopy).then(() => {
        const originalHTML = element.innerHTML;
        element.classList.add('copied');
        element.textContent = 'Copied!';
        setTimeout(() => {
            element.innerHTML = originalHTML;
            element.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy address: ', err);
        alert('Failed to copy address.');
    });
}

function setPhantomLink() {
    const phantomLink = document.getElementById('phantomLink');
    if (!phantomLink) {
        console.error('Phantom link element not found');
        return;
    }
    try {
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        phantomLink.href = isMobile && /Android/i.test(navigator.userAgent)
            ? 'https://play.google.com/store/apps/details?id=app.phantom'
            : isMobile
            ? 'https://apps.apple.com/app/phantom-crypto-wallet/id1598432977'
            : 'https://phantom.app/download';
        phantomLink.target = '_blank';
    } catch (error) {
        console.error('Error setting Phantom link:', error);
        phantomLink.href = 'https://phantom.app/'; // Fallback URL
    }
}

function initializeRoadmapInteraction() {
    document.querySelectorAll('.roadmap-blur').forEach(phase => {
        // Clear any saved state on page load to ensure they always start blurred
        const phaseKey = `phase-revealed-${phase.querySelector('h2').textContent.trim()}`;
        localStorage.removeItem(phaseKey);
        phase.classList.remove('active'); // Explicitly remove .active class on load

        // Add the click listener
        phase.addEventListener('click', () => {
            const isActive = phase.classList.toggle('active');
            // Save the new state so it persists if the user scrolls away and back
            if (isActive) {
                localStorage.setItem(phaseKey, 'true');
            } else {
                localStorage.removeItem(phaseKey);
            }
        });
    });
}

// Handles scroll-triggered animations for sections and elements
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const connectors = document.querySelectorAll('.section-connector');
    const windowHeight = window.innerHeight;

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;
        if (sectionTop < windowHeight * 0.75 && sectionBottom > 0) {
            section.classList.add('visible');
            if (section.id === 'roadmap') {
                const phases = section.querySelectorAll('.phase, .future-teaser');
                phases.forEach(phase => {
                    if (phase.getBoundingClientRect().top < windowHeight * 0.85) {
                        phase.classList.add('visible');
                    }
                });
            }
            if (section.id === 'how-to-buy') {
                section.querySelectorAll('.buy-step').forEach(step => step.classList.add('visible'));
            }
        }
    });

    connectors.forEach(connector => {
        const connectorTop = connector.getBoundingClientRect().top;
        if (connectorTop < windowHeight * 0.85 && connector.getBoundingClientRect().bottom > 0) {
            connector.classList.add('visible');
        }
    });
});


// --- WALLET CONNECTION LOGIC ---

const wallets = [
    { name: 'Phantom', id: 'phantom', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Phantom_Wallet_s3cahc.jpg' },
    { name: 'Solflare', id: 'solflare', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Solflare_Wallet_nxcl95.jpg' },
    { name: 'Backpack', id: 'backpack', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750446379/backpack_rer24o.jpg' }
];

function openWalletModal() {
    const walletModal = document.getElementById('walletModal');
    const walletList = document.getElementById('walletList');
    walletList.innerHTML = ''; // Clear previous list

    wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.className = 'wallet-option';
        button.innerHTML = `<img src="${wallet.icon}" alt="${wallet.name} icon" width="30" height="30" style="margin-right: 10px;"> ${wallet.name}`;
        button.style.cssText = 'display: flex; align-items: center; justify-content: center; padding: 10px; width: 100%; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; transition: background-color 0.3s;';
        button.onmouseover = () => button.style.background = '#ff5555';
        button.onmouseout = () => button.style.background = '#333';
        button.onclick = () => connectWallet(wallet.id);
        walletList.appendChild(button);
    });

    walletModal.style.display = 'flex';
}

function closeWalletModal() {
    document.getElementById('walletModal').style.display = 'none';
}

function hideWalletInfo() {
    document.getElementById('walletInfo').style.display = 'none';
}

async function connectWallet(walletId) {
    closeWalletModal();
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const provider = getWalletProvider(walletId);
    // This checks if we are on a mobile device but NOT inside a wallet's built-in browser.
    const isMobileWebBrowser = isMobile && !provider;

    // ** THIS IS THE RESTORED LOGIC FOR MOBILE **
    if (isMobileWebBrowser) {
        const wallet = wallets.find(w => w.id === walletId);
        // Universal Links are more reliable for opening apps from a mobile browser.
        const deepLink = {
            phantom: `https://phantom.app/ul/browse/${window.location.href}`,
            solflare: `https://solflare.com/ul/v1/browse/${window.location.href}`,
            backpack: `https://backpack.app/ul/browse/${window.location.href}`
        }[walletId];
        
        // This will try to open the app.
        window.location.href = deepLink;
        return; // We stop here because the app will take over.
    }
    
    // This is the original logic for Desktop and In-App browsers, which works correctly.
    try {
        if (!provider) {
            promptToInstallWallet(walletId);
            return;
        }
        await provider.connect();
        const publicKey = provider.publicKey.toString();
        if (!publicKey) throw new Error('Public key not found.');

        updateUIForConnectedState(publicKey);
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletId);
        provider.on('accountChanged', handleAccountChange);

    } catch (error) {
        console.error(`Error connecting ${walletId}:`, error);
        alert(`Failed to connect ${walletId}. Ensure your wallet is unlocked.`);
    }
}

async function disconnectWallet() {
    const walletType = localStorage.getItem('walletType');
    try {
        const provider = getWalletProvider(walletType);
        if (provider && provider.disconnect) {
            await provider.disconnect();
        }
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
    } finally {
        updateUIForDisconnectedState();
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
    }
}

async function restoreWalletSession() {
    const walletType = localStorage.getItem('walletType');
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletType || !walletAddress) return;

    try {
        const provider = getWalletProvider(walletType);
        if (provider) {
            await provider.connect({ onlyIfTrusted: true });
            const publicKey = provider.publicKey?.toString();
            if (publicKey && publicKey === walletAddress) {
                updateUIForConnectedState(publicKey);
                provider.on('accountChanged', handleAccountChange);
            } else {
                // If the trusted connection fails or address mismatches, disconnect.
                disconnectWallet();
            }
        }
    } catch (error) {
        console.error('Error restoring wallet session:', error);
        disconnectWallet(); // Ensure clean state on error
    }
}

async function getDebtBalance(publicKey) {
    try {
        // We call our new secure endpoint, passing the public key
        const url = `/api/token-data?type=balance&publicKey=${publicKey}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // The rest of this function remains exactly the same
        const token = data.tokens.find(t => t.mint === '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
        if (token && token.amount) {
            const balance = token.amount / Math.pow(10, token.decimals);
            return `${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $DEBT`;
        }
        return '0 $DEBT';

    } catch (error) {
        console.error('Error fetching $DEBT balance:', error.message);
        return 'Balance unavailable';
    }
}

// --- Profile Check Logic ---
async function checkUserProfile(walletAddress) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            // Fetch username and pfp_url. This is more efficient for our next task.
            .select('username, pfp_url') 
            .eq('wallet_address', walletAddress)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        return data;  
    } catch (error) {
        console.error('Error checking user profile:', error);
        return null;
    }
}

// --- WALLET HELPER FUNCTIONS ---

function getWalletProvider(walletId) {
    if (walletId === 'phantom' && window.solana?.isPhantom) return window.solana;
    if (walletId === 'solflare' && window.solflare?.isSolflare) return window.solflare;
    if (walletId === 'backpack' && window.backpack) return window.backpack;
    return null;
}

function promptToInstallWallet(walletId) {
    const wallet = wallets.find(w => w.id === walletId);
    const downloadUrls = {
        phantom: 'https://phantom.app/download',
        solflare: 'https://solflare.com/download',
        backpack: 'https://backpack.app/download'
    };
    if (confirm(`No ${wallet.name} detected. Would you like to install it now?`)) {
        window.open(downloadUrls[walletId], '_blank');
    }
}

async function updateUIForConnectedState(publicKey) {
    const shortAddress = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    
    // Check for a profile first
    const profile = await checkUserProfile(publicKey);
    
    // --- THIS IS THE UPDATED LOGIC ---
    // If a profile exists, use the username. Otherwise, use the short address.
    const displayName = profile ? profile.username : shortAddress;

    // Update buttons with the correct display name
    document.getElementById('connectWalletMobile').textContent = displayName;
    document.getElementById('connectWalletMobile').classList.add('connected');
    document.getElementById('connectWalletDesktop').querySelector('span').textContent = displayName;
    document.getElementById('connectWalletDesktop').classList.add('connected');
    
    // Update wallet info box content
    document.getElementById('walletAddress').querySelector('span').textContent = shortAddress; // This can remain the short address
    const balance = await getDebtBalance(publicKey);
    document.getElementById('debtBalance').querySelector('span').textContent = balance;

    userWalletAddress = publicKey;

    // Update the 'last_seen' timestamp for the connected user
    supabaseClient
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('wallet_address', publicKey)
        .then(({ error }) => {
            if (error) console.error('Error updating last_seen:', error);
        });

    // Show the correct button/link based on whether a profile exists
    if (profile) {
        document.getElementById('profile-nav-link').style.display = 'block';
        document.getElementById('profile-nav-link-mobile').style.display = 'block';
        document.getElementById('create-profile-btn').style.display = 'none';
    } else {
        document.getElementById('profile-nav-link').style.display = 'none';
        document.getElementById('profile-nav-link-mobile').style.display = 'none';
        document.getElementById('create-profile-btn').style.display = 'inline-block';
    }
}

function updateUIForDisconnectedState() {
    // Reset buttons
    document.getElementById('connectWalletMobile').textContent = 'Select Wallet';
    document.getElementById('connectWalletMobile').classList.remove('connected');
    document.getElementById('connectWalletDesktop').querySelector('span').textContent = 'Select Wallet';
    document.getElementById('connectWalletDesktop').classList.remove('connected');

    // Hide everything
    document.getElementById('walletInfo').style.display = 'none';
    document.getElementById('create-profile-btn').style.display = 'none';
    document.getElementById('profile-nav-link').style.display = 'none';
    document.getElementById('profile-nav-link-mobile').style.display = 'none';

    // Clear address when user disconnects
    userWalletAddress = null;
}

async function handleAccountChange(newPublicKey) {
    if (newPublicKey) {
        const newKey = newPublicKey.toString();
        updateUIForConnectedState(newKey);
        localStorage.setItem('walletAddress', newKey);
    } else {
        disconnectWallet();
    }
}


// --- AUDIO PLAYER LOGIC ---

const playlist = [
    { title: "D.E.B.T.", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1755035512/Don_t_Ever_Believe_Them_NEW_i3h7wa.mov" },
    { title: "Tough Souls", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751153796/D.E.B.T._nkijpl.wav" },
    { title: "Burn", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Burn_c7qcmi.wav" },
    { title: "Freedom Fighters", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Freedom_Fighters_somsv2.wav" },
    { title: "Get Out", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Get_Out_oor74k.wav" },
    { title: "KABOOM!", artist: "Ambient Sounds", src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151702/KABOOM_pac3lb.wav" }
];
let currentTrackIndex = 0;

function initializeAudioPlayer() {
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('play-pause');
    const prevTrackBtn = document.getElementById('prev-track');
    const nextTrackBtn = document.getElementById('next-track');
    const playPauseBtnMobile = document.getElementById('play-pause-mobile');
    const prevTrackBtnMobile = document.getElementById('prev-track-mobile');
    const nextTrackBtnMobile = document.getElementById('next-track-mobile');
    const audioPlayer = document.getElementById('audio-player');
    const singlePlayButton = document.getElementById('single-play-button');
    const logoBtn = document.getElementById('logo-btn');

    function loadTrack(index) {
        const track = playlist[index];
        audio.src = track.src;
        audio.load();
        updateTrackInfo(track.title, track.artist);
        setPlayPauseState(false); // Set to paused state
        audio.play().catch(err => console.error('Auto-play failed:', err));
    }

    function togglePlayPause() {
        if (audio.paused) {
            audio.play().catch(err => console.error('Play failed:', err));
        } else {
            audio.pause();
        }
    }
    
    function setPlayPauseState(isPlaying) {
        const trackInfoSpan = document.getElementById('track-info').querySelector('span');
        const trackInfoMobileSpan = document.getElementById('track-info-mobile').querySelector('span');
        const audioPlayerMobile = document.getElementById('audioPlayerMobile');

        playPauseBtn.className = isPlaying ? 'audio-btn pause' : 'audio-btn play';
        playPauseBtnMobile.className = isPlaying ? 'audio-btn pause' : 'audio-btn play';
        trackInfoSpan.style.animationPlayState = isPlaying ? 'running' : 'paused';
        trackInfoMobileSpan.style.animationPlayState = isPlaying ? 'running' : 'paused';
        audioPlayerMobile.classList.toggle('playing', isPlaying);
    }

    function updateTrackInfo(title, artist) {
        const trackInfoSpan = document.getElementById('track-info').querySelector('span');
        const trackInfoMobileSpan = document.getElementById('track-info-mobile').querySelector('span');
        const text = `${title} - ${artist}`;
        trackInfoSpan.textContent = text;
        trackInfoMobileSpan.textContent = text;
    }

    function changeTrack(direction) {
        currentTrackIndex = (currentTrackIndex + direction + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
    }

    // Event Listeners
    logoBtn.addEventListener('click', () => {
        const isActive = audioPlayer.classList.toggle('active');
        logoBtn.classList.toggle('active', isActive);
        if (isActive && !audio.src) { // First time opening
            loadTrack(currentTrackIndex);
            audio.pause(); // Load but don't play immediately
            setPlayPauseState(false);
        }
    });
    
    singlePlayButton.addEventListener('click', () => {
        singlePlayButton.style.display = 'none';
        document.getElementById('audioPlayerMobile').style.display = 'block';
        if (!audio.src) {
            loadTrack(currentTrackIndex);
        } else {
            togglePlayPause();
        }
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    playPauseBtnMobile.addEventListener('click', togglePlayPause);
    prevTrackBtn.addEventListener('click', () => changeTrack(-1));
    prevTrackBtnMobile.addEventListener('click', () => changeTrack(-1));
    nextTrackBtn.addEventListener('click', () => changeTrack(1));
    nextTrackBtnMobile.addEventListener('click', () => changeTrack(1));

    audio.addEventListener('play', () => setPlayPauseState(true));
    audio.addEventListener('pause', () => setPlayPauseState(false));
    audio.addEventListener('ended', () => changeTrack(1));
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        changeTrack(1); // Try next track on error
    });
}
// --- Profile Creation Logic ---

async function handleSignUp() {
    // 1. Check if a wallet is connected using our new variable
    if (!userWalletAddress) {
        alert('Please connect your wallet first!');
        return;
    }

    // 2. Prompt the user for a username (a simple pop-up box)
    const username = prompt('Please enter your desired username:');
    if (!username) { // User clicked cancel or left it blank
        return;
    }

    // 3. Try to save the new profile to the 'profiles' table in Supabase
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                wallet_address: userWalletAddress,
                username: username.toLowerCase()
            })
            .select()
            .single();

        if (error) {
            // Handle potential errors, like a duplicate username
            if (error.message.includes('duplicate key')) {
                alert('This username or wallet address is already taken. Please try another.');
            } else {
                // For other errors, show the technical message
                throw error;
            }
        } else if (data) {
            alert(`Success! Your profile "${data.username}" has been created.`);
            // Now that a profile is created, we re-run our main UI update function.
            // This will hide the 'Create Profile' button AND show the 'Profile' links.
            updateUIForConnectedState(userWalletAddress);
        }

    } catch (error) {
        console.error('Error creating profile:', error);
        alert('An error occurred while creating your profile. Please try again.');
    }
}
