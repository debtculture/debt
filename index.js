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

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const connectors = document.querySelectorAll('.section-connector');
    const windowHeight = window.innerHeight;
    const isMobile = window.innerWidth <= 768;

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;
        if (sectionTop < windowHeight * 0.75 && sectionBottom > 0) {
            section.classList.add('visible');
            if (section.id === 'roadmap') {
                const phases = section.querySelectorAll('.phase, .future-teaser');
                phases.forEach(phase => {
                    const phaseTop = phase.getBoundingClientRect().top;
                    if (phaseTop < windowHeight * 0.85) {
                        phase.classList.add('visible');
                    }
                });
            }
            if (section.id === 'how-to-buy') {
                const steps = section.querySelectorAll('.buy-step');
                steps.forEach(step => step.classList.add('visible'));
            }
            if (section.id === 'faq') {
                section.classList.add('visible');
            }
        }
    });

    connectors.forEach(connector => {
        const connectorTop = connector.getBoundingClientRect().top;
        const connectorBottom = connector.getBoundingClientRect().bottom;
        if (connectorTop < windowHeight * 0.85 && connectorBottom > 0) {
            connector.classList.add('visible');
        }
    });
});

function copyAddress(element) {
    const addressText = element.querySelector('.address-text').textContent.trim();
    navigator.clipboard.writeText(addressText).then(() => {
        element.setAttribute('data-copied', 'true');
        const copiedMessage = element.querySelector('.copied-message');
        if (copiedMessage) {
            copiedMessage.style.display = 'block';
            copiedMessage.style.backgroundColor = '#00ff00';
        }
        setTimeout(() => {
            element.setAttribute('data-copied', 'false');
            if (copiedMessage) copiedMessage.style.display = 'none';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Clipboard not supported. Copy manually: ' + addressText);
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
        phantomLink.target = '_blank';
    }
}

function initializeRoadmapPhases() {
    const isMobile = window.innerWidth <= 768;
    document.querySelectorAll('.future-phase').forEach(phase => {
        // Ensure phases load blurred on both mobile and desktop
        phase.classList.remove('active');
        if (isMobile) {
            localStorage.removeItem(`phase-${phase.querySelector('h2').textContent}`);
        } else {
            // Clear localStorage for desktop on load to ensure blurred state
            localStorage.removeItem(`phase-${phase.querySelector('h2').textContent}`);
        }
        phase.addEventListener('click', () => {
            const isActive = phase.classList.toggle('active');
            // Save state only when toggling
            localStorage.setItem(`phase-${phase.querySelector('h2').textContent}`, isActive);
        });
    });
}

function initializeMatrix() {
    const canvas = document.getElementById('matrix-bg');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recalculate columns for Matrix effect
        columns = Math.ceil(canvas.width / fontSize);
        drops.length = columns;
        for (let i = 0; i < drops.length; i++) {
            if (!drops[i]) drops[i] = 1;
        }
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', resizeCanvas);
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 14;
    let columns = Math.ceil(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(18, 18, 18, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff5555';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 50);
}

// Wallet connection logic
const wallets = [
    { name: 'Phantom', id: 'phantom', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Phantom_Wallet_s3cahc.jpg' },
    { name: 'Solflare', id: 'solflare', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1749488428/Solflare_Wallet_nxcl95.jpg' },
    { name: 'Backpack', id: 'backpack', icon: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1750446379/backpack_rer24o.jpg' }
];

function openWalletModal() {
    const walletModal = document.getElementById('walletModal');
    const walletList = document.getElementById('walletList');
    walletList.innerHTML = '';

    wallets.forEach(wallet => {
        const button = document.createElement('button');
        button.className = 'wallet-option';
        button.innerHTML = `
            <img src="${wallet.icon}" alt="${wallet.name} icon" width="30" height="30" style="margin-right: 10px;">
            ${wallet.name}
        `;
        button.style.cssText = 'display: flex; align-items: center; justify-content: center; padding: 10px; width: 100%; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; transition: background-color 0.3s;';
        button.onmouseover = () => button.style.background = '#ff5555';
        button.onmouseout = () => button.style.background = '#333';
        button.onclick = () => connectWallet(wallet.id);
        walletList.appendChild(button);
    });

    walletModal.style.display = 'flex';
}

function closeWalletModal() {
    const walletModal = document.getElementById('walletModal');
    walletModal.style.display = 'none';
}

async function connectWallet(walletId) {
    const mobileButton = document.getElementById('connectWalletMobile');
    const desktopBubble = document.getElementById('connectWalletDesktop');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddressEl = document.getElementById('walletAddress').querySelector('span');
    const debtBalanceEl = document.getElementById('debtBalance').querySelector('span');
    closeWalletModal();

    try {
        let provider = null;
        let walletName = 'Unknown Wallet';
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        const isInAppBrowser = navigator.userAgent.includes('Phantom') || navigator.userAgent.includes('Solflare') || navigator.userAgent.includes('Backpack');

        const deepLinks = {
            phantom: 'phantom://',
            solflare: 'solflare://',
            backpack: 'backpack://'
        };
        const downloadUrls = {
            phantom: 'https://phantom.app/download',
            solflare: 'https://solflare.com/download',
            backpack: 'https://backpack.app/download'
        };

        if (isMobile && !isInAppBrowser) {
            const wallet = wallets.find(w => w.id === walletId);
            const deepLink = deepLinks[walletId];
            const prompt = `Connect with ${wallet.name}?`;
            if (confirm(prompt)) {
                window.location.href = deepLink;
                setTimeout(() => {
                    if (document.hasFocus()) {
                        window.open(downloadUrls[walletId], '_blank');
                    }
                }, 1000);
            }
            return;
        }

        if (walletId === 'phantom' && (window.solana?.isPhantom || (isInAppBrowser && navigator.userAgent.includes('Phantom')))) {
            provider = window.solana;
            walletName = 'Phantom';
        } else if (walletId === 'solflare' && (window.solflare?.isSolflare || (isInAppBrowser && navigator.userAgent.includes('Solflare')))) {
            provider = window.solflare;
            walletName = 'Solflare';
        } else if (walletId === 'backpack' && window.backpack) {
            provider = window.backpack;
            walletName = 'Backpack';
        } else {
            const wallet = wallets.find(w => w.id === walletId);
            const prompt = `No ${wallet.name} detected. Install it now?`;
            if (confirm(prompt)) {
                window.open(downloadUrls[walletId], '_blank');
            }
            return;
        }

        let publicKey;
        try {
            if (walletId === 'solflare') {
                await provider.connect();
                publicKey = provider.publicKey?.toString();
            } else if (walletId === 'backpack') {
                await provider.connect();
                publicKey = provider.publicKey?.toString();
            } else {
                await provider.connect();
                publicKey = provider.publicKey?.toString();
            }
        } catch (err) {
            throw new Error(`${walletName} connection failed: ${err.message}`);
        }

        if (!publicKey) {
            throw new Error(`Failed to retrieve public key from ${walletName}`);
        }

        if (mobileButton) {
            mobileButton.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
            mobileButton.classList.add('connected');
        }
        if (desktopBubble) {
            desktopBubble.classList.add('connected');
            const span = desktopBubble.querySelector('span');
            span.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
        }

        walletAddressEl.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
        walletInfo.style.display = 'block';

        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('walletType', walletId);

        const balance = await getDebtBalance(publicKey);
        debtBalanceEl.textContent = balance;

        console.log(`${walletName} connected:`, publicKey);

        provider.on('accountChanged', async (newPublicKey) => {
            if (newPublicKey) {
                const newKey = newPublicKey.toString();
                walletAddressEl.textContent = `${newKey.slice(0, 4)}...${newKey.slice(-4)}`;
                localStorage.setItem('walletAddress', newKey);
                const balance = await getDebtBalance(newKey);
                debtBalanceEl.textContent = balance;
                console.log(`${walletName} account changed:`, newKey);
            } else {
                disconnectWallet();
            }
        });
    } catch (error) {
        console.error(`Error connecting ${walletId} wallet:`, error);
        alert(`Failed to connect ${walletId}. Ensure your wallet is unlocked and try again.`);
    }
}
function hideWalletInfo() {
    const walletInfo = document.getElementById('walletInfo');
    walletInfo.style.display = 'none';
}
async function disconnectWallet() {
    const mobileButton = document.getElementById('connectWalletMobile');
    const desktopBubble = document.getElementById('connectWalletDesktop');
    const walletInfo = document.getElementById('walletInfo');
    const walletType = localStorage.getItem('walletType');

    try {
        let provider = null;
        if (walletType === 'phantom' && window.solana?.isPhantom) {
            provider = window.solana;
        } else if (walletType === 'solflare' && window.solflare?.isSolflare) {
            provider = window.solflare;
        } else if (walletType === 'backpack' && window.backpack) {
            provider = window.backpack;
        }

        if (provider && provider.disconnect) {
            await provider.disconnect();
        }

        if (mobileButton) {
            mobileButton.textContent = 'Select Wallet';
            mobileButton.classList.remove('connected');
        }
        if (desktopBubble) {
            desktopBubble.classList.remove('connected');
            const span = desktopBubble.querySelector('span');
            span.textContent = 'Select Wallet';
        }
        walletInfo.style.display = 'none';
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        console.log('Wallet disconnected');
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        alert('Failed to disconnect wallet. Please try again.');
    }
}

async function getDebtBalance(publicKey) {
    try {
        const apiKey = 'c57c8d55-3e55-4160-9d8c-00df2c3fb22e';
        const url = `https://api.helius.xyz/v0/addresses/${publicKey}/balances?api-key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const token = data.tokens.find(t => t.mint === '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
        
        if (token && token.amount) {
            const balance = token.amount / Math.pow(10, token.decimals);
            console.log('Token balance:', balance);
            return `${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $DEBT`;
        } else {
            console.log('No $DEBT token found.');
            return '0 $DEBT';
        }
    } catch (error) {
        console.error('Error fetching $DEBT balance:', error.message);
        return '0 $DEBT';
    }
}

function startMatrixRain() {
    const rainCanvas = document.getElementById('matrix-rain');
    const rainCtx = rainCanvas.getContext('2d');
    rainCanvas.height = window.innerHeight;
    rainCanvas.width = window.innerWidth;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 14;
    const columns = rainCanvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    function drawRain() {
        rainCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
        rainCtx.fillStyle = '#999999';
        rainCtx.font = fontSize + 'px monospace';
        drops.forEach((y, i) => {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            rainCtx.fillText(text, i * fontSize, y * fontSize);
            if (y * fontSize > rainCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }
    setInterval(drawRain, 50); // Keep at 50ms
    window.addEventListener('resize', () => {
        rainCanvas.height = window.innerHeight;
        rainCanvas.width = window.innerWidth;
    });
}

// Audio Player Logic
const playlist = [
  {
    title: "D.E.B.T.",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1755035512/Don_t_Ever_Believe_Them_NEW_i3h7wa.mov"
  },
  {
    title: "Tough Souls",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751153796/D.E.B.T._nkijpl.wav"
  },
  {
    title: "Burn",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Burn_c7qcmi.wav"
  },
  {
    title: "Freedom Fighters",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Freedom_Fighters_somsv2.wav"
  },
  {
    title: "Get Out",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151703/Get_Out_oor74k.wav"
  },
  {
    title: "KABOOM!",
    artist: "Ambient Sounds", 
    src: "https://res.cloudinary.com/dpvptjn4t/video/upload/f_auto,q_auto/v1751151702/KABOOM_pac3lb.wav"
  }
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
    const audioPlayerMobile = document.getElementById('audioPlayerMobile');
    const audioPlayerMobileWrapper = document.getElementById('audioPlayerMobileWrapper');
    const singlePlayButton = document.getElementById('single-play-button');
    const logoBtn = document.getElementById('logo-btn');
    const trackInfoSpan = document.getElementById('track-info').querySelector('span');
    const trackInfoMobileSpan = document.getElementById('track-info-mobile').querySelector('span');

    function loadTrack(index) {
        audio.src = playlist[index].src;
        audio.load();
        playPauseBtn.className = 'audio-btn play';
        playPauseBtnMobile.className = 'audio-btn play';
        audioPlayerMobile.classList.remove('playing');
        trackInfoSpan.textContent = `${playlist[index].title} - ${playlist[index].artist}`;
        trackInfoMobileSpan.textContent = `${playlist[index].title} - ${playlist[index].artist}`;
        trackInfoSpan.style.animationPlayState = 'running';
        trackInfoMobileSpan.style.animationPlayState = 'running';
        audio.play().catch(err => {
            console.error('Auto-play failed:', err);
            playPauseBtn.className = 'audio-btn play';
            playPauseBtnMobile.className = 'audio-btn play';
            audioPlayerMobile.classList.remove('playing');
            trackInfoSpan.style.animationPlayState = 'paused';
            trackInfoMobileSpan.style.animationPlayState = 'paused';
        });
    }

    function togglePlayPause() {
        if (audio.paused) {
            audio.play().catch(err => {
                console.error('Play failed:', err);
                playPauseBtn.className = 'audio-btn play';
                playPauseBtnMobile.className = 'audio-btn play';
                audioPlayerMobile.classList.remove('playing');
                trackInfoSpan.style.animationPlayState = 'paused';
                trackInfoMobileSpan.style.animationPlayState = 'paused';
            });
            playPauseBtn.className = 'audio-btn pause';
            playPauseBtnMobile.className = 'audio-btn pause';
            audioPlayerMobile.classList.add('playing');
            trackInfoSpan.style.animationPlayState = 'running';
            trackInfoMobileSpan.style.animationPlayState = 'running';
        } else {
            audio.pause();
            playPauseBtn.className = 'audio-btn play';
            playPauseBtnMobile.className = 'audio-btn play';
            audioPlayerMobile.classList.remove('playing');
            trackInfoSpan.style.animationPlayState = 'paused';
            trackInfoMobileSpan.style.animationPlayState = 'paused';
        }
    }

    function toggleAudioPlayer() {
        const isActive = audioPlayer.classList.toggle('active');
        logoBtn.classList.toggle('active', isActive);
        logoBtn.setAttribute('aria-expanded', isActive);
        // This block prepares the first track without playing it
        if (isActive && !audio.src) {
            const audio = document.getElementById('audio');
            const playPauseBtn = document.getElementById('play-pause');
            const trackInfoSpan = document.getElementById('track-info').querySelector('span');

            audio.src = playlist[currentTrackIndex].src;
            audio.load();
            playPauseBtn.className = 'audio-btn play'; // Ensure it shows 'play' icon
            trackInfoSpan.textContent = `${playlist[currentTrackIndex].title} - ${playlist[currentTrackIndex].artist}`;
        }
    }

    function showFullPlayerAndPlay() {
        if (window.innerWidth <= 768) {
            singlePlayButton.style.display = 'none';
            audioPlayerMobile.classList.add('active');
            audioPlayerMobile.style.display = 'block';
            if (!audio.src) {
                loadTrack(currentTrackIndex);
            } else {
                togglePlayPause();
            }
        }
    }

    logoBtn.addEventListener('click', toggleAudioPlayer);
    singlePlayButton.addEventListener('click', showFullPlayerAndPlay);
    playPauseBtn.addEventListener('click', togglePlayPause);
    playPauseBtnMobile.addEventListener('click', togglePlayPause);
    prevTrackBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
    });
    prevTrackBtnMobile.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
    });
    nextTrackBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
    });
    nextTrackBtnMobile.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
    });
    audio.addEventListener('ended', () => {
        console.log('Audio ended, currentTrackIndex:', currentTrackIndex, 'Moving to:', (currentTrackIndex + 1) % playlist.length);
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
    });
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
    });

    // Ensure marquee syncs with play state
    audio.addEventListener('play', () => {
        playPauseBtn.className = 'audio-btn pause';
        playPauseBtnMobile.className = 'audio-btn pause';
        trackInfoSpan.style.animationPlayState = 'running';
        trackInfoMobileSpan.style.animationPlayState = 'running';
    });
    audio.addEventListener('pause', () => {
        playPauseBtn.className = 'audio-btn play';
        playPauseBtnMobile.className = 'audio-btn play';
        trackInfoSpan.style.animationPlayState = 'paused';
        trackInfoMobileSpan.style.animationPlayState = 'paused';
    });

    // Keyboard accessibility
    logoBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAudioPlayer();
        }
    });
    singlePlayButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showFullPlayerAndPlay();
        }
    });
    playPauseBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlayPause();
        }
    });
    playPauseBtnMobile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlayPause();
        }
    });
    prevTrackBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentTrackIndex);
        }
    });
    prevTrackBtnMobile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentTrackIndex);
        }
    });
    nextTrackBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
        }
    });
    nextTrackBtnMobile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
        }
    });
}
window.addEventListener('load', async () => {
  initializeAudioPlayer();
    if (typeof solanaWeb3 === 'undefined') {
        console.error('solanaWeb3 library is not loaded. Please include it via CDN.');
    }
    console.log('Load event fired');
    initializeMatrix(); // Red matrix
    startMatrixRain(); // Grey matrix
    setPhantomLink();
    initializeRoadmapPhases();
    window.dispatchEvent(new Event('scroll'));
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

    try {
        const walletType = localStorage.getItem('walletType');
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletType && walletAddress) {
            let provider = null;
            let walletName = 'Unknown Wallet';
            if (walletType === 'phantom' && window.solana?.isPhantom) {
                provider = window.solana;
                walletName = 'Phantom';
            } else if (walletType === 'solflare' && window.solflare?.isSolflare) {
                provider = window.solflare;
                walletName = 'Solflare';
            } else if (walletType === 'backpack' && window.backpack) {
                provider = window.backpack;
                walletName = 'Backpack';
            }

            if (provider) {
                let publicKey;
                if (walletType === 'solflare') {
                    await provider.connect({ onlyIfTrusted: true });
                    publicKey = provider.publicKey?.toString();
                } else {
                    const response = await provider.request({ method: 'connect', params: { onlyIfTrusted: true } });
                    publicKey = response.publicKey?.toString() || provider.publicKey?.toString();
                }

                if (publicKey && publicKey === walletAddress) {
                    const walletInfo = document.getElementById('walletInfo');
                    const walletAddressEl = document.getElementById('walletAddress').querySelector('span');
                    const debtBalanceEl = document.getElementById('walletInfo').querySelector('#debtBalance span');

                    mobileButton.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
                    mobileButton.classList.add('connected');
                    desktopBubble.classList.add('connected');
                    desktopBubble.querySelector('span').textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
                    walletAddressEl.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
                    walletInfo.style.display = 'none';

                    const balance = await getDebtBalance(publicKey);
                    debtBalanceEl.textContent = balance;

                    console.log(`Restored ${walletName} connection:`, publicKey);
                }
            }
        }
    } catch (error) {
        console.error('Error restoring wallet connection:', error);
    }
});

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
    console.log('ToggleSocialBubbles: isActive =', isActive, 'Bubbles classList =', bubbles.classList.toString());
}

function copySleekAddress(element) {
    // 1. Find the hidden span and get the full address
    const addressToCopy = element.querySelector('.full-address-text').textContent.trim();

    // 2. Copy the full address to the clipboard
    navigator.clipboard.writeText(addressToCopy).then(() => {
        // 3. Provide visual feedback
        const originalHTML = element.innerHTML; // Save the original content (icon and short address)
        element.classList.add('copied');
        element.textContent = 'Copied!'; // Change text to "Copied!"

        // 4. Revert back to the original state after 2 seconds
        setTimeout(() => {
            element.innerHTML = originalHTML;
            element.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy address: ', err);
        alert('Failed to copy address.');
    });
}
