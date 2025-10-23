// Initialize Matrix from shared
document.addEventListener('DOMContentLoaded', () => {
    fetchTokenomicsData(); // For dashboard
    fetchTickerData(); // For hero ticker
    // Mobile menu toggles from shared-scripts.js
});

// Fetch for tokenomics dashboard (using proxy)
async function fetchTokenomicsData() {
    try {
        const response = await fetch('/api/token-data?type=tokenomics');
        if (!response.ok) throw new Error('Failed to fetch');
        const { supplyData, lpData } = await response.json();
        const tokenData = supplyData[0];
        const supply = tokenData?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.supply;
        const decimals = tokenData?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.decimals;
        const currentSupply = parseFloat(supply) / Math.pow(10, decimals);
        const liquidityPool = lpData.result.value.uiAmount;
        updateTokenomicsTable(currentSupply, liquidityPool);
    } catch (error) {
        console.error("Failed to fetch tokenomics:", error);
        // Set "Unavailable" for all
    }
}

function updateTokenomicsTable(currentSupply, liquidityPool) {
    const initial = 1_000_000_000;
    const vaulted = 150_000_000;
    const burned = initial - currentSupply;
    document.getElementById('tokenomics-mcap').textContent = 'Loading...'; // Placeholder, fetch separately if needed
    document.getElementById('tokenomics-liquidity').textContent = format(liquidityPool);
    document.getElementById('tokenomics-burned').textContent = format(burned);
}

function format(num) {
    return Number(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Fetch for hero ticker (price/mcap/volume—assume similar proxy, or use DexScreener API if available; placeholder for now)
async function fetchTickerData() {
    // Example: Fetch from DexScreener or similar
    document.getElementById('price-data').textContent = '$0.0001'; // Replace with real fetch
    document.getElementById('market-cap-data').textContent = '$100K';
    document.getElementById('volume-data').textContent = '$10K';
}

function copySleekAddress(element) {
    const addressToCopy = element.textContent.trim(); // Adjust if needed
    navigator.clipboard.writeText(addressToCopy).then(() => {
        element.classList.add('copied');
        element.textContent = 'Copied!';
        setTimeout(() => {
            element.textContent = addressToCopy;
            element.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}
