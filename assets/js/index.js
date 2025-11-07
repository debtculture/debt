/* =============================================================================
   INDEX PAGE LOGIC
   Version: 2.4 - CORRECTED Circulating Supply Formula
   Circulating = Current Supply - Locked (173.3M) - LP
   Percentage = Circulating / Current Supply (not starting supply)
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
 * Fetches tokenomics data using Solana RPC + DexScreener
 */
async function fetchTokenomicsData() {
    try {
        showTokenomicsLoading();
        
        console.log('Fetching tokenomics data...');
        
        // Fetch actual on-chain supply from Solana RPC
        const supplyData = await fetchTokenSupplyFromSolana();
        
        // Fetch price/volume from DexScreener
        const priceData = await fetchPriceFromDexScreener();
        
        // Fetch LP balance
        const lpBalance = await fetchLPBalance();
        
        // Constants
        const STARTING_SUPPLY = 1000000000;    // 1 billion starting supply
        const LOCKED_TOKENS = 173333331;       // 173.3M locked tokens (CORRECTED)
        
        // Current supply from blockchain
        const currentSupply = supplyData.supply;
        
        // Calculate burned tokens
        const burnedTokens = STARTING_SUPPLY - currentSupply;
        
        // Calculate circulating supply: Current Supply - Locked - LP
        const circulatingSupply = currentSupply - LOCKED_TOKENS - lpBalance;
        
        // Calculate percentage: Circulating / Current Supply (not starting supply)
        const circulatingPercentage = (circulatingSupply / currentSupply) * 100;
        
        // Calculate market cap using circulating supply
        const price = priceData.priceUsd;
        const marketCap = circulatingSupply * price;
        const volume24h = priceData.volume24h;
        
        updateTokenomicsUI({
            marketCap: formatLargeNumber(marketCap),
            volume24h: formatLargeNumber(volume24h),
            circulatingSupply: formatLargeNumber(circulatingSupply),
            circulatingPercentage: circulatingPercentage.toFixed(2)
        });
        
        console.log('Tokenomics loaded successfully:');
        console.log('├─ Starting Supply:', formatLargeNumber(STARTING_SUPPLY));
        console.log('├─ Current Supply:', formatLargeNumber(currentSupply));
        console.log('├─ Burned Tokens:', formatLargeNumber(burnedTokens));
        console.log('├─ Locked Tokens:', formatLargeNumber(LOCKED_TOKENS));
        console.log('├─ LP Balance:', formatLargeNumber(lpBalance));
        console.log('├─ Circulating Supply:', formatLargeNumber(circulatingSupply));
        console.log('├─ Percentage:', circulatingPercentage.toFixed(2) + '% (of current supply)');
        console.log('├─ Price:', '$' + price);
        console.log('└─ Market Cap:', '$' + formatLargeNumber(marketCap));
        
    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        showTokenomicsError(error.message);
    }
}

/**
 * Fetch actual token supply from Solana RPC
 */
async function fetchTokenSupplyFromSolana() {
    try {
        // Use public Solana RPC endpoint
        const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenSupply',
                params: ['9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump']
            })
        });
        
        if (!response.ok) {
            throw new Error('Solana RPC request failed');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const supply = data.result.value.uiAmount;
        
        console.log('✓ Fetched current supply from Solana:', formatLargeNumber(supply));
        
        return { supply };
        
    } catch (error) {
        console.error('✗ Error fetching supply from Solana:', error);
        // Fallback to estimated supply
        return { supply: 850000000 }; // Estimated fallback
    }
}

/**
 * Fetch price data from DexScreener
 */
async function fetchPriceFromDexScreener() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump');
        
        if (!response.ok) {
            throw new Error('DexScreener API failed');
        }
        
        const data = await response.json();
        
        if (!data.pairs || data.pairs.length === 0) {
            throw new Error('No pairs found');
        }
        
        const pair = data.pairs[0];
        
        console.log('✓ Fetched price from DexScreener');
        
        return {
            priceUsd: parseFloat(pair.priceUsd) || 0,
            volume24h: parseFloat(pair.volume?.h24) || 0
        };
        
    } catch (error) {
        console.error('✗ Error fetching price from DexScreener:', error);
        return { priceUsd: 0, volume24h: 0 };
    }
}

/**
 * Fetch LP token balance
 */
async function fetchLPBalance() {
    try {
        // LP address for the main Raydium pool
        const LP_ADDRESS = 'Gdq6x3LDVsEaAv5UH2kyQ7ydptqNRitjWirsDGzaYDD8';
        
        const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountBalance',
                params: [LP_ADDRESS]
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch LP balance');
        }
        
        const data = await response.json();
        
        if (data.result && data.result.value) {
            const lpBalance = data.result.value.uiAmount || 0;
            console.log('✓ Fetched LP balance:', formatLargeNumber(lpBalance));
            return lpBalance;
        }
        
        return 0;
        
    } catch (error) {
        console.error('✗ Error fetching LP balance:', error);
        return 0; // Return 0 if can't fetch
    }
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
