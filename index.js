// This event listener initializes all the scripts for the main page once the HTML is ready.
window.addEventListener('load', async () => {
    // Check for Solana library
    if (typeof solanaWeb3 === 'undefined') {
        console.error('solanaWeb3 library is not loaded. Please include it via CDN.');
    }

    // Initialize UI components
    initializeAudioPlayer();
    setPhantomLink();
    initializeRoadmapPhases();

    // Set up event listeners for wallet buttons
    const mobileButton = document.getElementById('connectWalletMobile');
    const desktopBubble = document.getElementById('connectWalletDesktop');
    
    mobileButton.addEventListener('click', () => {
        if (mobileButton.classList.contains('connected')) {
            const walletInfo = document.getElementById('walletInfo');
            walletInfo.style.display = walletInfo.style.display === 'block' ? 'none' : 'block';
        } else {
            openWalletModal();
        }
    });
    
    desktopBubble.addEventListener('click', () => {
        if (desktopBubble.classList.contains('connected')) {
            const walletInfo = document.getElementById('walletInfo');
            walletInfo.style.display = walletInfo.style.display === 'block' ? 'none' : 'block';
        } else {
            openWalletModal();
        }
    });

    // Attempt to restore a previously connected wallet session
    await restoreWalletSession();

    // Trigger scroll animations on load
    window.dispatchEvent(new Event('scroll'));
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

function initializeRoadmapPhases() {
    const isMobile = window.innerWidth <= 768;
    document.querySelectorAll('.future-phase').forEach(phase => {
        phase.classList.remove('active');
        const phaseKey = `phase-${phase.querySelector('h2').textContent.trim()}`;
        localStorage.removeItem(phaseKey); // Ensure blurred state on load

        phase.addEventListener('click', () => {
            const isActive = phase.classList.toggle('active');
            localStorage.setItem(phaseKey, isActive);
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
    try {
        const provider = getWalletProvider(walletId);
        if (!provider) {
            promptToInstallWallet(walletId);
            return;
        }

        await provider.connect();
        const publicKey = provider.publicKey.toString();
        
        if (!publicKey) throw new Error(`Failed to retrieve public key from ${walletId}`);

        updateUIForConnectedState(publicKey);
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletId);

        provider.on('accountChanged', handleAccountChange);
    } catch (error) {
        console.error(`Error connecting ${walletId} wallet:`, error);
        alert(`Failed to connect ${walletId}. Ensure your wallet is unlocked and try again.`);
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
        const apiKey = 'c57c8d55-3e55-4160-9d8c-00df2c3fb22e';
        const url = `https://api.helius.xyz/v0/addresses/${publicKey}/balances?api-key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
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
    
    // Update buttons
    document.getElementById('connectWalletMobile').textContent = shortAddress;
    document.getElementById('connectWalletMobile').classList.add('connected');
    document.getElementById('connectWalletDesktop').querySelector('span').textContent = shortAddress;
    document.getElementById('connectWalletDesktop').classList.add('connected');

    // Update and show wallet info box
    document.getElementById('walletAddress').querySelector('span').textContent = shortAddress;
    const balance = await getDebtBalance(publicKey);
    document.getElementById('debtBalance').querySelector('span').textContent = balance;
    document.getElementById('walletInfo').style.display = 'block';
}

function updateUIForDisconnectedState() {
    // Reset buttons
    document.getElementById('connectWalletMobile').textContent = 'Select Wallet';
    document.getElementById('connectWalletMobile').classList.remove('connected');
    document.getElementById('connectWalletDesktop').querySelector('span').textContent = 'Select Wallet';
    document.getElementById('connectWalletDesktop').classList.remove('connected');

    // Hide wallet info box
    document.getElementById('walletInfo').style.display = 'none';
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
