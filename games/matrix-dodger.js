/* =============================================================================
   MATRIX DODGER - Game Logic v1.1
   ============================================================================= */

// =================================================================================
// --- GAME CONFIGURATION ---
// =================================================================================

const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        width: 35,
        height: 45,
        color: '#ff5555',
        speed: 6,
        jumpPower: 13,
        gravity: 0.6
    },
    fallingCode: {
        width: 30,
        height: 30,
        fontSize: 24,
        characters: ['0', '1'],
        color: '#ff5555',
        strandLengths: {
            level1: [1, 3],      // Min 1, Max 3 chars
            level3: [3, 5],      // 3-5 chars
            level5: [5, 7],      // 5-7 chars
            level7: [7, 11]      // 7-11 chars
        }
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 90, diagonalChance: 0 },
        level2: { speed: 2.5, spawnRate: 85, diagonalChance: 0 },
        level3: { speed: 3, spawnRate: 75, diagonalChance: 0.2 },
        level4: { speed: 3.5, spawnRate: 70, diagonalChance: 0.2 },
        level5: { speed: 4, spawnRate: 65, diagonalChance: 0.4 },
        level6: { speed: 4.5, spawnRate: 60, diagonalChance: 0.4 },
        level7: { speed: 5, spawnRate: 55, diagonalChance: 0.6 },
        level8: { speed: 5.5, spawnRate: 50, diagonalChance: 0.6 },
        level9: { speed: 6, spawnRate: 45, diagonalChance: 0.75 },
        level10: { speed: 7, spawnRate: 40, diagonalChance: 0.8 }
    },
    levelsForProgression: 10 // Score needed to level up
};

// =================================================================================
// --- GAME STATE ---
// =================================================================================

let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let score = 0;
let level = 1;
let lives = 3;
let highScore = 0;

let player = {
    x: 0,
    y: 0,
    velocityY: 0,
    isJumping: false,
    isCrouching: false,
    groundY: 0
};

let fallingObjects = [];
let keys = {};
let frameCount = 0;

// Mobile touch controls
let mobileControls = {
    left: false,
    right: false,
    jump: false,
    crouch: false
};

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;
    
    // Load high score
    highScore = parseInt(localStorage.getItem('matrixDodgerHighScore')) || 0;
    
    // Initialize player position
    player.x = CONFIG.canvas.width / 2 - CONFIG.player.width / 2;
    player.groundY = CONFIG.canvas.height - CONFIG.player.height - 20;
    player.y = player.groundY;
    
    // Event listeners
    setupEventListeners();
    
    // Start button
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
});

// =================================================================================
// --- EVENT LISTENERS ---
// =================================================================================

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // Jump on spacebar or up arrow
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !player.isJumping && gameRunning && !gamePaused) {
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
        
        // Crouch
        if ((e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') && gameRunning && !gamePaused) {
            player.isCrouching = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        
        // Stop crouching
        if (e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') {
            player.isCrouching = false;
        }
    });
    
    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const crouchBtn = document.getElementById('crouchBtn');
    
    // Touch start
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControls.left = true; });
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControls.right = true; });
    jumpBtn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        if (!player.isJumping && gameRunning && !gamePaused) {
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
    });
    crouchBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobileControls.crouch = true; player.isCrouching = true; });
    
    // Touch end
    leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.left = false; });
    rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.right = false; });
    crouchBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.crouch = false; player.isCrouching = false; });
    
    // Mouse events for desktop testing
    leftBtn.addEventListener('mousedown', () => mobileControls.left = true);
    leftBtn.addEventListener('mouseup', () => mobileControls.left = false);
    rightBtn.addEventListener('mousedown', () => mobileControls.right = true);
    rightBtn.addEventListener('mouseup', () => mobileControls.right = false);
    jumpBtn.addEventListener('mousedown', () => {
        if (!player.isJumping && gameRunning && !gamePaused) {
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
    });
    crouchBtn.addEventListener('mousedown', () => { mobileControls.crouch = true; player.isCrouching = true; });
    crouchBtn.addEventListener('mouseup', () => { mobileControls.crouch = false; player.isCrouching = false; });
}

// =================================================================================
// --- GAME CONTROL ---
// =================================================================================

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    score = 0;
    level = 1;
    lives = 3;
    fallingObjects = [];
    frameCount = 0;
    updateUI();
    gameLoop();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    startGame();
}

function endGame() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('matrixDodgerHighScore', highScore);
        document.getElementById('highScoreNotice').textContent = `🏆 NEW HIGH SCORE! 🏆`;
        document.getElementById('highScoreNotice').classList.add('active');
    } else {
        document.getElementById('highScoreNotice').classList.remove('active');
    }
    
    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOverScreen').classList.add('active');
    
    // Try to submit score (if Supabase table exists)
    trySubmitScore();
}

// =================================================================================
// --- SCORE SUBMISSION ---
// =================================================================================

async function trySubmitScore() {
    // Only try if window.submitScore exists (from games.js)
    if (typeof window.submitScore === 'function') {
        try {
            await window.submitScore('matrix-dodger', score);
            console.log('Score submitted successfully!');
        } catch (error) {
            console.log('Score submission not available (no database table)');
        }
    }
}

// =================================================================================
// --- NOTIFICATIONS ---
// =================================================================================

function showNotification(text, type = 'level') {
    const popup = document.getElementById('notificationPopup');
    const textEl = document.getElementById('notificationText');
    
    textEl.textContent = text;
    popup.className = 'notification-popup active';
    
    if (type === 'life-lost') {
        popup.classList.add('life-lost');
    }
    
    gamePaused = true;
    
    setTimeout(() => {
        popup.classList.remove('active', 'life-lost');
        gamePaused = false;
    }, 1500);
}

// =================================================================================
// --- GAME LOOP ---
// =================================================================================

function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        frameCount++;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update game state
        updatePlayer();
        updateFallingObjects();
        spawnFallingObjects();
        
        // Draw everything
        drawPlayer();
        drawFallingObjects();
        
        // Check collisions
        checkCollisions();
        
        // Update UI
        updateUI();
    }
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// =================================================================================
// --- PLAYER LOGIC ---
// =================================================================================

function updatePlayer() {
    // Horizontal movement
    if (keys['arrowleft'] || keys['a'] || mobileControls.left) {
        player.x -= CONFIG.player.speed;
    }
    if (keys['arrowright'] || keys['d'] || mobileControls.right) {
        player.x += CONFIG.player.speed;
    }
    
    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - CONFIG.player.width) {
        player.x = canvas.width - CONFIG.player.width;
    }
    
    // Jumping physics
    if (player.isJumping) {
        player.velocityY += CONFIG.player.gravity;
        player.y += player.velocityY;
        
        // Land on ground
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }
}

function drawPlayer() {
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    // Draw hooded figure
    ctx.fillStyle = CONFIG.player.color;
    
    // Hood/head (triangle)
    ctx.beginPath();
    ctx.moveTo(player.x + CONFIG.player.width / 2, playerY); // Top center
    ctx.lineTo(player.x, playerY + playerHeight * 0.4); // Left
    ctx.lineTo(player.x + CONFIG.player.width, playerY + playerHeight * 0.4); // Right
    ctx.closePath();
    ctx.fill();
    
    // Body (rectangle)
    ctx.fillRect(
        player.x + CONFIG.player.width * 0.2, 
        playerY + playerHeight * 0.35, 
        CONFIG.player.width * 0.6, 
        playerHeight * 0.65
    );
    
    // Eyes (white dots)
    ctx.fillStyle = '#fff';
    const eyeY = playerY + playerHeight * 0.25;
    ctx.fillRect(player.x + CONFIG.player.width * 0.35, eyeY, 3, 3);
    ctx.fillRect(player.x + CONFIG.player.width * 0.62, eyeY, 3, 3);
}

// =================================================================================
// --- FALLING OBJECTS LOGIC ---
// =================================================================================

function getStrandLength() {
    if (level >= 7) return Math.floor(Math.random() * 5) + 7; // 7-11
    if (level >= 5) return Math.floor(Math.random() * 3) + 5; // 5-7
    if (level >= 3) return Math.floor(Math.random() * 3) + 3; // 3-5
    return Math.floor(Math.random() * 3) + 1; // 1-3
}

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    // Spawn rate check
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    // Generate code strand
    const strandLength = getStrandLength();
    let strand = '';
    for (let i = 0; i < strandLength; i++) {
        strand += CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)];
    }
    
    // Random X position
    const x = Math.random() * (canvas.width - CONFIG.fallingCode.width * strandLength);
    
    // Determine if diagonal
    const isDiagonal = Math.random() < difficulty.diagonalChance;
    const direction = isDiagonal ? (Math.random() < 0.5 ? -1 : 1) : 0;
    
    fallingObjects.push({
        x: x,
        y: -CONFIG.fallingCode.height,
        strand: strand,
        speed: difficulty.speed,
        direction: direction,
        horizontalSpeed: isDiagonal ? 1.5 : 0
    });
}

function updateFallingObjects() {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        // Move down
        obj.y += obj.speed;
        
        // Move horizontally if diagonal
        if (obj.direction !== 0) {
            obj.x += obj.direction * obj.horizontalSpeed;
        }
        
        // Remove if off screen
        const strandWidth = CONFIG.fallingCode.width * obj.strand.length;
        if (obj.y > canvas.height || obj.x < -strandWidth || obj.x > canvas.width) {
            fallingObjects.splice(i, 1);
            score++; // Successfully dodged
            
            // Level up check
            const oldLevel = level;
            level = Math.floor(score / CONFIG.levelsForProgression) + 1;
            
            if (level > oldLevel) {
                showNotification(`LEVEL ${level}!`, 'level');
            }
        }
    }
}

function drawFallingObjects() {
    ctx.font = `${CONFIG.fallingCode.fontSize}px monospace`;
    ctx.fillStyle = CONFIG.fallingCode.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    fallingObjects.forEach(obj => {
        ctx.fillText(obj.strand, obj.x, obj.y);
    });
}

// =================================================================================
// --- COLLISION DETECTION ---
// =================================================================================

function checkCollisions() {
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        const strandWidth = CONFIG.fallingCode.width * obj.strand.length;
        
        // Rectangle collision
        if (
            player.x < obj.x + strandWidth &&
            player.x + CONFIG.player.width > obj.x &&
            playerY < obj.y + CONFIG.fallingCode.height &&
            playerY + playerHeight > obj.y
        ) {
            // Hit!
            fallingObjects.splice(i, 1);
            lives--;
            
            // Show life lost notification
            showNotification(`LIFE LOST! ${lives} LEFT`, 'life-lost');
            
            // Flash effect
            canvas.style.border = '5px solid red';
            setTimeout(() => {
                canvas.style.border = '3px solid #ff5555';
            }, 200);
            
            // Check game over
            if (lives <= 0) {
                endGame();
            }
        }
    }
}

// =================================================================================
// --- DIFFICULTY SYSTEM ---
// =================================================================================

function getDifficultySettings() {
    const difficultyKey = `level${Math.min(level, 10)}`;
    return CONFIG.difficulty[difficultyKey] || CONFIG.difficulty.level10;
}

// =================================================================================
// --- UI UPDATES ---
// =================================================================================

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    
    // Lives as hearts
    const hearts = '❤️'.repeat(lives);
    document.getElementById('lives').textContent = hearts || '💀';
}
