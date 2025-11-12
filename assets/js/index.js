/* =============================================================================
   INDEX PAGE LOGIC
   Version: 2.1 - WORKING Tokenomics Fetch with DexScreener Fallback
   ============================================================================= */

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    } else {
        console.error('Wallet manager not loaded');
    }

    // Existing initialization code
    fetchTokenomicsData();

    // Initialize copy address keyboard support
    const contractAddress = document.querySelector('.contract-address');
    if (contractAddress) {
        contractAddress.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                copyAddress();
            }
        });
    }
});

// =================================================================================
// --- TOKENOMICS DATA FETCHING ---
// =================================================================================

/**
 * Fetches tokenomics data - tries primary API first, falls back to DexScreener
 */
async function fetchTokenomicsData() {
    try {
        showTokenomicsLoading();

        // Try primary API first
        console.log('Attempting to fetch from /api/token-data...');
        try {
            const response = await fetch('/api/token-data?type=tokenomics');
            if (response.ok) {
                const data = await response.json();
                console.log('Primary API succeeded.');
                await processTokenomicsFromAPI(data);
                return; // Success, exit function
            }
        } catch (apiError) {
            console.log('Primary API failed, using DexScreener fallback:', apiError);
        }

        // Fallback to DexScreener public API
        await fetchFromDexScreener();

    } catch (error) {
        console.error('All tokenomics fetch attempts failed:', error);
        showTokenomicsError(error.message);
    }
}

/**
 * Process data from primary API
 */
async function processTokenomicsFromAPI(data) {
    console.log('Primary API raw response:', data);  // Added debug log

    if (!data || !data.supplyData || !data.supplyData[0]) {
        console.warn('Invalid data structure from API, falling back to DexScreener.');
        return null;
    }

    const tokenData = data.supplyData[0];
    const onChainInfo = tokenData.onChainInfo;

    if (!onChainInfo || !onChainInfo.supply || !onChainInfo.decimals) {
        console.warn('Missing supply or decimals data in primary API, falling back to DexScreener.');
        return null;
    }

    const LOCKED_TOKENS = 200363613.139407407;

    const currentSupply = parseInt(onChainInfo.supply) / Math.pow(10, onChainInfo.decimals);
    const lpBalance = data.lpData?.result?.value?.uiAmount || 0;
    const circulatingSupply = currentSupply - LOCKED_TOKENS - lpBalance;
    const circulatingPercentage = (circulatingSupply / currentSupply) * 100;

    // Fetch Dex data for MC and volume
    const dexData = await fetchDexData();
    const marketCap = dexData.marketCap;
    const volume24h = dexData.volume24h;

    updateTokenomicsUI({
        marketCap: formatLargeNumber(marketCap),
        volume24h: formatLargeNumber(volume24h),
        circulatingSupply: formatLargeNumber(circulatingSupply),
        circulatingPercentage: circulatingPercentage.toFixed(2)
    });
}

/**
 * Fetch data from DexScreener
 */
async function fetchDexData() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
        if (!response.ok) throw new Error('DexScreener API failed');

        const data = await response.json();
        if (!data.pairs || data.pairs.length === 0) {
            throw new Error('No pairs found');
        }

        const pair = data.pairs[0]; // Get first/main pair
        return {
            priceUsd: parseFloat(pair.priceUsd) || 0,
            volume24h: parseFloat(pair.volume?.h24) || 0,
            marketCap: parseFloat(pair.fdv) || 0,
            liquidityUsd: parseFloat(pair.liquidity?.usd) || 0,
            liquidityBase: parseFloat(pair.liquidity?.base) || 0
        };
    } catch (error) {
        console.error('Error fetching from DexScreener:', error);
        return { priceUsd: 0, volume24h: 0, marketCap: 0, liquidityUsd: 0, liquidityBase: 0 };
    }
}

/**
 * Fetch all data from DexScreener (fallback method)
 */
async function fetchFromDexScreener() {
    console.log('Using DexScreener as primary data source');

    const dexData = await fetchDexData();

    const marketCap = dexData.marketCap;
    const volume24h = dexData.volume24h;
    const priceUsd = dexData.priceUsd;

    // Fetch accurate current supply using Solana web3
    let currentSupply;
    try {
        const connection = new solanaWeb3.Connection('https://api.helius.xyz/?api-key=c57c8d55-3e55-4160-9d8c-00df2c3fb22e');
        const mint = new solanaWeb3.PublicKey('9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
        const supplyResponse = await connection.getTokenSupply(mint);
        currentSupply = supplyResponse.value.uiAmount;
    } catch (web3Error) {
        console.error('Web3 supply fetch failed, using Dex estimate:', web3Error);
        currentSupply = priceUsd > 0 ? marketCap / priceUsd : 1000000000;
    }

    const lpTokens = dexData.liquidityBase;
    const LOCKED_TOKENS = 200363613.139407;

    const circulatingSupply = currentSupply - LOCKED_TOKENS - lpTokens;
    const circulatingPercentage = (circulatingSupply / currentSupply) * 100;

    updateTokenomicsUI({
        marketCap: formatLargeNumber(marketCap),
        volume24h: formatLargeNumber(volume24h),
        circulatingSupply: formatLargeNumber(circulatingSupply),
        circulatingPercentage: circulatingPercentage.toFixed(2)
    });

    console.log('DexScreener data loaded successfully:', {
        marketCap: formatLargeNumber(marketCap),
        volume24h: formatLargeNumber(volume24h),
        price: priceUsd,
        circulatingSupply: formatLargeNumber(circulatingSupply)
    });
}

/**
 * Shows loading state in tokenomics cards
 */
function showTokenomicsLoading() {
    const loadingText = 'Loading...';
    const elements = ['market-cap', 'volume-24h', 'circulating-supply'];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = loadingText;
            element.style.color = '#999';
        }
    });
}

/**
 * Updates tokenomics UI elements with fetched data
 */
function updateTokenomicsUI(data) {
    const elements = {
        'market-cap': `$${data.marketCap}`,
        'volume-24h': `$${data.volume24h}`,
        'circulating-supply': `${data.circulatingSupply} (${data.circulatingPercentage}%)`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.style.color = '#ff5555'; // Red color for values
        }
    });
}

/**
 * Shows error state in tokenomics cards
 */
function showTokenomicsError(errorMsg) {
    console.error('Tokenomics error:', errorMsg);

    const errorText = 'Data unavailable';
    const elements = ['market-cap', 'volume-24h', 'circulating-supply'];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = errorText;
            element.style.color = '#ff5555';
        }
    });
}

/**
 * Formats large numbers with abbreviations (K, M, B)
 */
function formatLargeNumber(num) {
    if (isNaN(num) || num === null || num === undefined) {
        return '0';
    }

    const absNum = Math.abs(num);

    if (absNum >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (absNum >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (absNum >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// =================================================================================
// --- CONTRACT ADDRESS COPY FUNCTIONALITY ---
// =================================================================================

/**
 * Copies contract address to clipboard
 */
function copyAddress() {
    const contractAddress = '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump';
    const addressElement = document.querySelector('.contract-address');
    const addressTextFull = addressElement.querySelector('.address-text');
    const addressTextMobile = addressElement.querySelector('.address-text-mobile');
    const copyIcon = addressElement.querySelector('.copy-icon');

    navigator.clipboard.writeText(contractAddress)
        .then(() => {
            // Visual feedback
            addressElement.classList.add('copied');

            // Store original text
            const originalTextFull = addressTextFull ? addressTextFull.textContent : '';
            const originalTextMobile = addressTextMobile ? addressTextMobile.textContent : '';

            // Update to "Copied!"
            if (addressTextFull) addressTextFull.textContent = 'Copied!';
            if (addressTextMobile) addressTextMobile.textContent = 'Copied!';
            if (copyIcon) copyIcon.textContent = '✓';

            // Reset after 2 seconds
            setTimeout(() => {
                addressElement.classList.remove('copied');
                if (addressTextFull) addressTextFull.textContent = originalTextFull;
                if (addressTextMobile) addressTextMobile.textContent = originalTextMobile;
                if (copyIcon) copyIcon.textContent = '📋';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy address:', err);
            alert('Failed to copy address. Please copy manually: ' + contractAddress);
        });
}

// =================================================================================
// --- MOBILE NAVIGATION ---
// =================================================================================

/**
 * Toggles mobile hamburger menu
 */
window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    if (!menu || !hamburger) return;

    const isOpen = menu.style.display === 'block';

    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

/**
 * Closes mobile hamburger menu
 */
window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');

    if (!menu || !hamburger) return;

    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};
