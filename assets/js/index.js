/* =============================================================================
   INDEX PAGE LOGIC
   Version: 2.0 - Fixed Tokenomics Fetch with Circulating Supply
   Handles tokenomics data fetching and contract address copying
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
 * Fetches tokenomics data from API and updates dashboard
 */
async function fetchTokenomicsData() {
    try {
        // Show loading state
        showTokenomicsLoading();
        
        // Fetch from secure API endpoint
        const response = await fetch('/api/token-data?type=tokenomics');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!data || !data.supplyData || !data.supplyData[0]) {
            throw new Error('Invalid data structure received from API');
        }
        
        const tokenData = data.supplyData[0];
        const onChainInfo = tokenData.onChainInfo;
        
        // Validate onChainInfo
        if (!onChainInfo || !onChainInfo.supply || !onChainInfo.decimals) {
            throw new Error('Missing supply or decimals data');
        }
        
        // Constants
        const INITIAL_SUPPLY = 1000000000; // 1 billion
        const LOCKED_TOKENS = 150000000; // 150 million vaulted
        
        // Calculate current supply
        const currentSupply = parseInt(onChainInfo.supply) / Math.pow(10, onChainInfo.decimals);
        
        // Calculate burned tokens
        const totalBurned = INITIAL_SUPPLY - currentSupply;
        
        // Get LP balance
        const lpBalance = data.lpData?.result?.value?.uiAmount || 0;
        
        // Calculate circulating supply: Total - Burned - Locked - LP
        const circulatingSupply = currentSupply - LOCKED_TOKENS - lpBalance;
        
        // Calculate percentage of circulating supply
        const circulatingPercentage = (circulatingSupply / INITIAL_SUPPLY) * 100;
        
        // Get market cap (you may need to fetch price from another API)
        // For now using placeholder - replace with actual price API
        const price = 0.000001; // Placeholder - fetch real price
        const marketCap = circulatingSupply * price;
        
        // Get 24h volume (placeholder - fetch from price API)
        const volume24h = 5000000; // Placeholder
        
        // Update UI with calculated values
        updateTokenomicsUI({
            marketCap: formatLargeNumber(marketCap),
            volume24h: formatLargeNumber(volume24h),
            circulatingSupply: formatLargeNumber(circulatingSupply),
            circulatingPercentage: circulatingPercentage.toFixed(2)
        });
        
        console.log('Tokenomics loaded successfully:', {
            currentSupply: formatLargeNumber(currentSupply),
            totalBurned: formatLargeNumber(totalBurned),
            lockedTokens: formatLargeNumber(LOCKED_TOKENS),
            lpBalance: formatLargeNumber(lpBalance),
            circulatingSupply: formatLargeNumber(circulatingSupply),
            circulatingPercentage: circulatingPercentage.toFixed(2) + '%'
        });
        
    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        showTokenomicsError(error.message);
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
            element.style.color = '#ff5555';
        }
    });
}

/**
 * Updates tokenomics UI elements with fetched data
 * @param {Object} data - Tokenomics data object
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
            element.style.color = '#ff5555'; // Reset to red
        }
    });
}

/**
 * Shows error state in tokenomics cards
 * @param {string} errorMsg - Error message for logging
 */
function showTokenomicsError(errorMsg) {
    console.error('Tokenomics error details:', errorMsg);
    
    const errorText = 'Error loading';
    const elements = ['market-cap', 'volume-24h', 'circulating-supply'];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = errorText;
            element.style.color = '#ff5555';
        }
    });
    
    // Log helpful debugging info
    console.log('Debugging info:');
    console.log('- Check if /api/token-data endpoint is accessible');
    console.log('- Verify API returns { supplyData: [...], lpData: {...} }');
    console.log('- Ensure CORS is configured properly');
}

/**
 * Formats large numbers with abbreviations (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
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

// =================================================================================
// --- ALTERNATIVE TOKENOMICS FETCH (Fallback using Helius directly) ---
// =================================================================================

/**
 * Alternative fetch method if main API fails
 * Uses Helius API directly (requires API key to be exposed - not recommended for production)
 */
async function fetchTokenomicsDataFallback() {
    try {
        console.log('Attempting fallback tokenomics fetch...');
        
        // Note: This exposes your API key and should only be used for testing
        // In production, always use a backend proxy
        const HELIUS_API_KEY = 'YOUR_HELIUS_API_KEY_HERE'; // Replace with actual key
        
        // Fetch supply data
        const supplyResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'supply-request',
                method: 'getTokenSupply',
                params: ['9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump']
            })
        });
        
        const supplyData = await supplyResponse.json();
        console.log('Fallback supply data:', supplyData);
        
        // Process data similar to main fetch function
        // ... implement calculation logic here
        
    } catch (error) {
        console.error('Fallback fetch also failed:', error);
        showTokenomicsError('All fetch attempts failed');
    }
}
