/* =============================================================================
   TOOLS PAGE LOGIC - FIXED VERSION
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const TOKEN_MINT = '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump';
const TRADABLE_SUPPLY = 940000000;

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    }
    
    // Generate initial tweet
    generateTweet();
});

// =================================================================================
// --- TWEET GENERATOR ---
// =================================================================================

const TWEETS = [
    "Don't fade $DEBT. Doxxed Dev, LP Burned, 16+ months old. A real community at a $100k mcap. The floor is concrete, the narrative is undefeated. You're still early.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Tired of rugs? @DebtCulture's $DEBT is the answer.\n✅ Doxxed Founder\n✅ LP Burned\n✅ 16+ Months Strong\nA safe floor at $100k mcap is a gift.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The system is a lie. @DebtCulture is the truth. $DEBT isn't just a memecoin; it's a movement. \"Don't Ever Believe Them.\" An easy bet on #Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Looking for a real community that's been building for over a year? Check out @DebtCulture. $DEBT is the play. Doxxed dev, burned LP, $100k mcap. As safe as it gets.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The alpha is simple: $DEBT.\n16 months old. Doxxed leader. Burned LP. $100k mc.\n@DebtCulture is the real deal.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Why are people still sleeping on @DebtCulture? $DEBT has been here for 16 months, has a doxxed dev, and burned LP. The risk/reward at $100k mcap is insane.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Don't get fooled by fakes. The original $DEBT rebellion is @DebtCulture. 16+ months of building, doxxed founder, and a community that never quit. This is the one.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "This might be the last time you see @DebtCulture's $DEBT under $200k market cap. A 16-month-old project with this foundation won't stay this low forever.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The @DebtCulture community is one of the strongest on #Solana. Fully doxxed dev, locked treasury, and a 16-month track record. $DEBT is programmed to win.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Alpha: $DEBT\nWhy: Doxxed dev, burned LP, 16mo history, cult community, $100k mc.\nThe real rebellion is at @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Stop gambling on 1-hour old coins. Invest in a real community with @DebtCulture and $DEBT. 16+ months strong, doxxed dev, burned LP, only $100k mcap. This is the ground floor.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "$DEBT by @DebtCulture has survived every market condition for 16 months. That's not luck, that's a foundation. Doxxed, safe, undervalued at $100k.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The narrative is unmatched: \"Don't Ever Believe Them.\" $DEBT isn't just a token, it's a rebellion against the debt-based system. Join @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "When $DEBT hit $340k mcap with ZERO marketing, I knew this was special. Now at $100k with a stronger foundation? Easy decision.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "66M+ tokens burned. 150M locked in treasury. Doxxed founder. 16 months of building. $DEBT by @DebtCulture is the safest play on Solana right now.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "You want a 100x? Start with a project that won't rug. $DEBT checks every box: doxxed, burned LP, renounced, 16mo track record. Still only $100k mcap.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The War Room on Telegram is where real $DEBT holders coordinate. No paper hands, just conviction. Join @DebtCulture and see what we're building.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Don't Ever Believe Them. The central banks lied. The politicians lied. $DEBT is the truth. 16 months of rebellion on #Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "If you're looking for the next 50-100x, you need three things: safety, narrative, and low mcap. $DEBT has all three. @DebtCulture is the play.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The founder of @DebtCulture is doxxed and has been building for 16+ months. That's not a dev, that's a leader. $DEBT is different.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Renounced contract. 0% tax. LP burned forever. Treasury locked until 2026. This is what real tokenomics looks like. $DEBT by @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Every day $DEBT survives is proof of concept. 16 months in crypto is a lifetime. The community is diamond-handed. @DebtCulture is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The copycats keep trying to steal the $DEBT name, but there's only one original: @DebtCulture. 16 months of receipts. Don't get fooled.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "At $100k mcap, $DEBT is criminally undervalued. The website alone is worth more than that. This won't last. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Bull market survivors are rare. $DEBT has been through it all for 16 months. Doxxed, safe, undervalued. The smart money is accumulating.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "You don't need another rug. You need $DEBT. Fully doxxed founder, burned LP, locked treasury, 16+ month track record. @DebtCulture is the way.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The rebellion against the debt system isn't just a narrative, it's a movement. $DEBT by @DebtCulture has been building this for over a year.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "$DEBT hit $340k with zero marketing. Imagine what happens when the world finds out. Still only $100k mcap. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "Looking for a low-risk, high-reward play? $DEBT checks all the safety boxes and sits at $100k. This is the definition of asymmetric upside.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    "The floor is concrete. The narrative is undefeated. The community is diamond-handed. $DEBT by @DebtCulture is the safest bet in crypto.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump"
];

let currentTweet = '';

function generateTweet() {
    const randomIndex = Math.floor(Math.random() * TWEETS.length);
    currentTweet = TWEETS[randomIndex];
    document.getElementById('tweet-display').textContent = currentTweet;
}

function copyTweet() {
    if (!currentTweet) {
        alert('Generate a tweet first!');
        return;
    }
    
    navigator.clipboard.writeText(currentTweet)
        .then(() => {
            const copyBtn = document.querySelector('.tool-btn.secondary');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'rgba(85, 255, 85, 0.2)';
            copyBtn.style.borderColor = '#55ff55';
            copyBtn.style.color = '#55ff55';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy tweet:', err);
            alert('Failed to copy. Please select and copy manually.');
        });
}

// =================================================================================
// --- MARKET CAP CALCULATOR ---
// =================================================================================

function calculateValue() {
    const tokenAmount = parseFloat(document.getElementById('token-amount').value);
    const marketCap = parseFloat(document.getElementById('market-cap').value);
    const resultDiv = document.getElementById('calc-result');
    
    if (!tokenAmount || tokenAmount <= 0) {
        resultDiv.textContent = 'Please enter a valid token amount';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    if (!marketCap || marketCap <= 0) {
        resultDiv.textContent = 'Please enter a valid market cap';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    const usdValue = (tokenAmount / TRADABLE_SUPPLY) * marketCap;
    const formatted = usdValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    resultDiv.textContent = formatted;
    resultDiv.className = 'calc-result success';
}

function calculatePreset(marketCap) {
    const tokenAmount = parseFloat(document.getElementById('token-amount').value);
    const resultDiv = document.getElementById('calc-result');
    
    if (!tokenAmount || tokenAmount <= 0) {
        resultDiv.textContent = 'Please enter a token amount first';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    const usdValue = (tokenAmount / TRADABLE_SUPPLY) * marketCap;
    const mcapFormatted = formatMarketCap(marketCap);
    const valueFormatted = usdValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    resultDiv.textContent = `At ${mcapFormatted}: ${valueFormatted}`;
    resultDiv.className = 'calc-result success';
}

function formatMarketCap(mcap) {
    if (mcap >= 1000000000) {
        return `$${(mcap / 1000000000).toFixed(1)}B`;
    } else if (mcap >= 1000000) {
        return `$${(mcap / 1000000).toFixed(0)}M`;
    } else if (mcap >= 1000) {
        return `$${(mcap / 1000).toFixed(0)}K`;
    }
    return `$${mcap}`;
}

// =================================================================================
// --- PORTFOLIO TRACKER (FIXED WITH HELIUS RPC) ---
// =================================================================================

async function trackPortfolio() {
    const address = document.getElementById('portfolio-address').value.trim();
    const resultDiv = document.getElementById('portfolio-result');
    
    if (!address) {
        resultDiv.textContent = 'Please enter a wallet address';
        resultDiv.className = 'portfolio-result error';
        return;
    }
    
    try {
        let publicKey;
        try {
            publicKey = new solanaWeb3.PublicKey(address);
        } catch (e) {
            resultDiv.textContent = 'Invalid Solana wallet address format';
            resultDiv.className = 'portfolio-result error';
            return;
        }
        
        resultDiv.innerHTML = '<span class="portfolio-loading">⏳ Loading portfolio data...</span>';
        resultDiv.className = 'portfolio-result';
        
        // Use Helius free RPC - more reliable than public endpoints
        const connection = new solanaWeb3.Connection(
            'https://mainnet.helius-rpc.com/?api-key=28b47570-97d1-48c1-93aa-acec85f6bc87',
            'confirmed'
        );
        
        const tokenMint = new solanaWeb3.PublicKey(TOKEN_MINT);
        let tokenBalance = 0;
        let foundTokens = false;
        
        console.log('🔍 Searching for $DEBT tokens...');
        
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                mint: tokenMint
            });
            
            console.log('📊 Token accounts found:', tokenAccounts.value.length);
            
            if (tokenAccounts.value.length > 0) {
                tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                foundTokens = true;
                console.log('✅ Token balance:', tokenBalance);
            }
        } catch (err) {
            console.error('❌ Error fetching token accounts:', err);
        }
        
        if (!foundTokens || tokenBalance === 0) {
            resultDiv.innerHTML = 'No $DEBT tokens found in this wallet.<br><small>Verify the address is correct.</small>';
            resultDiv.className = 'portfolio-result error';
            return;
        }
        
        // Fetch price from DexScreener
        let currentPrice = 0;
        let currentMcap = 100000;
        
        try {
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`);
            const dexData = await dexResponse.json();
            
            if (dexData.pairs && dexData.pairs[0]) {
                currentPrice = parseFloat(dexData.pairs[0].priceUsd) || 0;
                currentMcap = parseFloat(dexData.pairs[0].fdv) || 100000;
            }
        } catch (err) {
            console.error('DexScreener fetch failed:', err);
            currentPrice = currentMcap / TRADABLE_SUPPLY;
        }
        
        const currentValue = tokenBalance * currentPrice;
        
        resultDiv.innerHTML = `
            <div class="portfolio-stat">
                <span class="portfolio-stat-label">$DEBT Holdings</span>
                <span class="portfolio-stat-value">${tokenBalance.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div class="portfolio-stat">
                <span class="portfolio-stat-label">Current Value</span>
                <span class="portfolio-stat-value">$${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="portfolio-stat">
                <span class="portfolio-stat-label">Current Market Cap</span>
                <span class="portfolio-stat-value">${formatMarketCap(currentMcap)}</span>
            </div>
        `;
        resultDiv.className = 'portfolio-result success';
        
    } catch (error) {
        console.error('Portfolio tracking error:', error);
        resultDiv.innerHTML = `
            <span class="portfolio-loading" style="color: #ff6b6b;">
                ❌ Error: ${error.message || 'Failed to load portfolio'}
                <br><br>
                Please try again or verify the address.
            </span>
        `;
        resultDiv.className = 'portfolio-result error';
    }
}

// =================================================================================
// --- MOBILE NAVIGATION ---
// =================================================================================

window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!menu || !hamburger) return;
    
    const isOpen = menu.style.display === 'block';
    
    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!menu || !hamburger) return;
    
    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};
