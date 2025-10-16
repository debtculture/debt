document.addEventListener('DOMContentLoaded', () => {
    fetchTokenomicsData();
});

async function fetchTokenomicsData() {
    try {
        // We use our secure serverless function to get the data
        const response = await fetch('/api/token-data?type=tokenomics');
        if (!response.ok) throw new Error('Network response was not ok');
        const { supplyData, lpData } = await response.json();

        // --- Process Data ---
        const tokenData = supplyData[0];
        const supply = tokenData?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.supply;
        const decimals = tokenData?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.decimals;
        const currentSupply = parseFloat(supply) / Math.pow(10, decimals);
        const liquidityPool = lpData.result.value.uiAmount;
        const initial = 1000000000;
        const burned = initial - currentSupply;
        
        // This is a placeholder for now until we can fetch live price data
        const price = 0.000080; // Example static price
        const marketCap = currentSupply * price;

        // --- Update UI ---
        document.getElementById('tokenomics-mcap').textContent = `$${marketCap.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        document.getElementById('tokenomics-liquidity').textContent = `$${(liquidityPool * price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        document.getElementById('tokenomics-burned').textContent = burned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    } catch (error) {
        console.error("Failed to fetch tokenomics data:", error);
        document.getElementById('tokenomics-mcap').textContent = "Unavailable";
        document.getElementById('tokenomics-liquidity').textContent = "Unavailable";
        document.getElementById('tokenomics-burned').textContent = "Unavailable";
    }
}

// --- Mobile Menu Toggle Functions ---
window.toggleMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    hamburger.classList.toggle("active", !isOpen);
}

window.closeMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    menu.style.display = "none";
    hamburger.classList.remove("active");
}
