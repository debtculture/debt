/* =============================================================================
   INDEX PAGE LOGIC
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
        // Fetch from secure API endpoint
        const response = await fetch('/api/token-data?type=tokenomics');
        
        if (!response.ok) {
            throw new Error('Failed to fetch tokenomics data');
        }
        
        const { supplyData, lpData } = await response.json();
        
        if (!supplyData || !supplyData[0]) {
            throw new Error('Invalid data structure received');
        }
        
        const tokenData = supplyData[0];
        const onChainInfo = tokenData.onChainInfo;
        
        // Calculate values
        const initialSupply = 1000000000; // 1 billion
        const currentSupply = parseInt(onChainInfo.supply) / Math.pow(10, onChainInfo.decimals);
        const burned = initialSupply - currentSupply;
        
        // Get LP balance
        const lpBalance = lpData?.result?.value?.uiAmount || 0;
        
        // Update UI with formatted values
        updateTokenomicsUI({
            marketCap: formatLargeNumber(currentSupply * 0.000001), // Placeholder calculation
            volume24h: formatLargeNumber(5000000), // Placeholder - requires price API
            currentSupply: formatLargeNumber(currentSupply),
            totalBurned: formatLargeNumber(burned)
        });
        
    } catch (error) {
        console.error('Error fetching tokenomics:', error);
        showTokenomicsError();
    }
}

/**
 * Updates tokenomics UI elements with fetched data
 * @param {Object} data - Tokenomics data object
 */
function updateTokenomicsUI(data) {
    const elements = {
        'market-cap': `$${data.marketCap}`,
        'volume-24h': `$${data.volume24h}`,
        'current-supply': data.currentSupply,
        'total-burned': data.totalBurned
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * Shows error state in tokenomics cards
 */
function showTokenomicsError() {
    const errorText = 'Error loading';
    const elements = ['market-cap', 'volume-24h', 'current-supply', 'total-burned'];
    
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
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
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
    
    navigator.clipboard.writeText(contractAddress)
        .then(() => {
            // Visual feedback
            addressElement.classList.add('copied');
            const originalText = addressElement.querySelector('.address-text').textContent;
            addressElement.querySelector('.address-text').textContent = 'Copied!';
            addressElement.querySelector('.copy-icon').textContent = '✓';
            
            // Reset after 2 seconds
            setTimeout(() => {
                addressElement.classList.remove('copied');
                addressElement.querySelector('.address-text').textContent = originalText;
                addressElement.querySelector('.copy-icon').textContent = '📋';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy address:', err);
            alert('Failed to copy address. Please copy manually.');
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
