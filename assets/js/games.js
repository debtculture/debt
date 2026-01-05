/* =============================================================================
   GAMES PAGE LOGIC
   Version: 1.0
   ============================================================================= */

// =================================================================================
// --- SUPABASE CLIENT INITIALIZATION ---
// =================================================================================

// Initialize Supabase client (since wallet-manager doesn't export it)
const supabaseClient = supabase.createClient(
    'https://pvbguojrkigzvnuwjawy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Ymd1b2pya2lnenZudXdqYXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjMwMjIsImV4cCI6MjA3NDk5OTAyMn0.DeUDUPCyPfUifEqRmj6f85qXthbW3rF1qPjNhdRqVlw'
);

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager
    await initWallet();
    
    // Load high scores from localStorage
    loadHighScores();
    
    // Load leaderboard
    loadLeaderboard('matrix-dodger');
    
    // Setup tab listeners
    setupLeaderboardTabs();
});

// =================================================================================
// --- HIGH SCORES (FROM SUPABASE) ---
// =================================================================================

/**
 * Loads high scores from Supabase and displays them
 */
async function loadHighScores() {
    try {
        // Get the #1 global high score for Matrix Dodger
        const { data: scores } = await supabaseClient
            .from('game_scores')
            .select('score, player_name, profiles(username)')
            .eq('game_name', 'matrix-dodger')
            .order('score', { ascending: false })
            .limit(1);
        
        if (scores && scores.length > 0) {
            const topScore = scores[0];
            const highScore = topScore.score;
            const playerName = topScore.profiles?.username || topScore.player_name || 'Anonymous';
            
            const matrixScoreEl = document.getElementById('matrix-high-score');
            if (matrixScoreEl) {
                matrixScoreEl.textContent = `${highScore.toLocaleString()} (${playerName})`;
            }
        } else {
            // No scores yet, show 0
            const matrixScoreEl = document.getElementById('matrix-high-score');
            if (matrixScoreEl) {
                matrixScoreEl.textContent = '0';
            }
        }
        
    } catch (error) {
        console.error('Error loading high scores:', error);
        // Fallback to localStorage if Supabase fails
        const matrixHighScore = localStorage.getItem('matrixDodgerHighScore') || 0;
        const matrixScoreEl = document.getElementById('matrix-high-score');
        if (matrixScoreEl) {
            matrixScoreEl.textContent = matrixHighScore;
        }
    }
}

// =================================================================================
// --- LEADERBOARD SYSTEM ---
// =================================================================================

/**
 * Loads leaderboard data for a specific game
 * @param {string} gameName - Name of the game ('matrix-dodger', etc.)
 */
async function loadLeaderboard(gameName) {
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    // Show loading state
    leaderboardContent.innerHTML = '<div class="leaderboard-loading"><p>Loading leaderboard...</p></div>';
    
    try {
        // Fetch top 10 scores for this game
        const { data: scores, error } = await supabaseClient
            .from('game_scores')
            .select(`
                score,
                player_name,
                profiles (username, wallet_address)
            `)
            .eq('game_name', gameName)
            .order('score', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Error loading leaderboard:', error);
            throw error;
        }
        
        // Render leaderboard
        renderLeaderboard(scores);
        
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        leaderboardContent.innerHTML = `
            <div class="leaderboard-empty">
                <p>Leaderboard coming soon! Play games to set the first scores.</p>
            </div>
        `;
    }
}

/**
 * Renders leaderboard rows
 * @param {Array} scores - Array of score objects
 */
function renderLeaderboard(scores) {
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    if (!scores || scores.length === 0) {
        leaderboardContent.innerHTML = `
            <div class="leaderboard-empty">
                <p>No scores yet. Be the first to play!</p>
            </div>
        `;
        return;
    }
    
    const html = scores.map((scoreData, index) => {
        const rank = index + 1;
        const playerName = scoreData.profiles?.username || scoreData.player_name || 'Anonymous';
        const score = scoreData.score;
        
        // Add medal emojis for top 3
        let rankDisplay = rank;
        if (rank === 1) rankDisplay = '🥇 ' + rank;
        else if (rank === 2) rankDisplay = '🥈 ' + rank;
        else if (rank === 3) rankDisplay = '🥉 ' + rank;
        
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        return `
            <div class="leaderboard-row ${rankClass}">
                <div class="rank-col">${rankDisplay}</div>
                <div class="player-col">${playerName}</div>
                <div class="score-col">${score.toLocaleString()}</div>
            </div>
        `;
    }).join('');
    
    leaderboardContent.innerHTML = html;
}

/**
 * Sets up event listeners for leaderboard tabs
 */
function setupLeaderboardTabs() {
    const tabs = document.querySelectorAll('.leaderboard-tab');
    
    tabs.forEach(tab => {
        if (!tab.classList.contains('disabled')) {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active to clicked tab
                tab.classList.add('active');
                
                // Load leaderboard for selected game
                const gameName = tab.dataset.game;
                if (gameName) {
                    loadLeaderboard(gameName);
                }
            });
        }
    });
}

// =================================================================================
// --- SCORE SUBMISSION (FOR GAME PAGES TO USE) ---
// =================================================================================

/**
 * Submits a score to the leaderboard
 * This function can be called from individual game pages
 * 
 * @param {string} gameName - Name of the game
 * @param {number} score - Player's score
 * @param {string} playerName - Player's name (optional, uses connected wallet username)
 * @returns {Promise<boolean>} Success status
 */
async function submitScore(gameName, score, playerName = null) {
    try {
        // Get logged-in user wallet
        const userWallet = localStorage.getItem('walletAddress');
        
        // If no wallet connected, use provided playerName or 'Anonymous'
        if (!userWallet) {
            const displayName = playerName || 'Anonymous';
            
            const { error } = await supabaseClient
                .from('game_scores')
                .insert({
                    game_name: gameName,
                    score: score,
                    player_name: displayName
                });
            
            if (error) throw error;
            return true;
        }
        
        // Get user profile
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .eq('wallet_address', userWallet)
            .single();
        
        if (!profile) {
            console.warn('User profile not found, submitting as anonymous');
            const displayName = playerName || 'Anonymous';
            
            const { error } = await supabaseClient
                .from('game_scores')
                .insert({
                    game_name: gameName,
                    score: score,
                    player_name: displayName
                });
            
            if (error) throw error;
            return true;
        }
        
        // Submit score with user profile
        const { error } = await supabaseClient
            .from('game_scores')
            .insert({
                game_name: gameName,
                score: score,
                player_id: profile.id,
                player_name: profile.username
            });
        
        if (error) throw error;
        
        console.log('Score submitted successfully!');
        return true;
        
    } catch (error) {
        console.error('Error submitting score:', error);
        return false;
    }
}

// Make submitScore available globally for game pages
window.submitScore = submitScore;
