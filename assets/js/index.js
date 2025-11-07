/* =============================================================================
   INDEX PAGE LOGIC
   Version: 2.1 - WORKING Tokenomics Fetch with DexScreener Fallback
   ============================================================================= */

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
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
                await processTokenomicsFromAPI(data);
                return; // Success, exit function
            }
        } catch (apiError) {
            console.log('Primary API failed, using DexScreener fallback');
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
    if (!data || !data.supplyData || !data.supplyData[0]) {
        throw new Error('Invalid data structure from API');
    }
    
    const tokenData = data.supplyData[0];
    const onChainInfo = tokenData.onChainInfo;
    
    if (!onChainInfo || !onChainInfo.supply || !onChainInfo.decimals) {
        throw new Error('Missing supply or decimals data');
    }
    
    const INITIAL_SUPPLY = 1000000000;
    const LOCKED_TOKENS = 150000000;
    
    const currentSupply = parseInt(onChainInfo.supply) / Math.pow(10, onChainInfo.decimals);
    const lpBalance = data.lpData?.result?.value?.uiAmount || 0;
    const circulatingSupply = currentSupply - LOCKED_TOKENS - lpBalance;
    const circulatingPercentage = (circulatingSupply / INITIAL_SUPPLY) * 100;
    
    // Fetch price from DexScreener
    const priceData = await fetchPriceFromDexScreener();
    const price = priceData?.priceUsd || 0;
    const marketCap = circulatingSupply * price;
    const volume24h = priceData?.volume24h || 0;
    
    updateTokenomicsUI({
        marketCap: formatLargeNumber(marketCap),
        volume24h: formatLargeNumber(volume24h),
        circulatingSupply: formatLargeNumber(circulatingSupply),
        circulatingPercentage: circulatingPercentage.toFixed(2)
    });
}

/**
 * Fetch price data from DexScreener
 */
async function fetchPriceFromDexScreener() {
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
            marketCap: parseFloat(pair.fdv) || 0
        };
    } catch (error) {
        console.error('Error fetching price from DexScreener:', error);
        return { priceUsd: 0, volume24h: 0, marketCap: 0 };
    }
}

/**
 * Fetch all data from DexScreener (fallback method)
 */
async function fetchFromDexScreener() {
    console.log('Using DexScreener as primary data source');
    
    const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
    
    if (!response.ok) {
        throw new Error(`DexScreener returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
        throw new Error('No trading pairs found on DexScreener');
    }
    
    const pair = data.pairs[0];
    
    // Extract data from DexScreener response
    const marketCap = parseFloat(pair.fdv) || 0;
    const volume24h = parseFloat(pair.volume?.h24) || 0;
    const priceUsd = parseFloat(pair.priceUsd) || 0;
    
    // Calculate circulating supply
    const INITIAL_SUPPLY = 1000000000; // 1B
    const LOCKED_TOKENS = 150000000;   // 150M
    
    // Use liquidity as proxy for LP tokens
    const liquidityUsd = parseFloat(pair.liquidity?.usd) || 0;
    const estimatedLPTokens = priceUsd > 0 ? liquidityUsd / priceUsd : 0;
    
    // Estimate burned tokens (Initial - Current circulating estimate)
    const estimatedCirculating = priceUsd > 0 ? marketCap / priceUsd : INITIAL_SUPPLY - LOCKED_TOKENS;
    const circulatingSupply = Math.min(estimatedCirculating, INITIAL_SUPPLY - LOCKED_TOKENS);
    const circulatingPercentage = (circulatingSupply / INITIAL_SUPPLY) * 100;
    
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
