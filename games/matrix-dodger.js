/* =============================================================================
   MATRIX DODGER - Game Logic
   Version: 1.0
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
        width: 40,
        height: 50,
        color: '#ff5555',
        speed: 5,
        jumpPower: 12,
        gravity: 0.6
    },
    fallingCode: {
        width: 30,
        height: 40,
        fontSize: 30,
        characters: ['0', '1'],
        color: '#ff5555'
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 80, diagonalChance: 0 },
        level2: { speed: 2.5, spawnRate: 75, diagonalChance: 0 },
        level3: { speed: 3, spawnRate: 70, diagonalChance: 0.2 },
        level4: { speed: 3.5, spawnRate: 65, diagonalChance: 0.2 },
        level5: { speed: 4, spawnRate: 60, diagonalChance: 0.4 },
        level6: { speed: 4.5, spawnRate: 55, diagonalChance: 0.4 },
        level7: { speed: 5, spawnRate: 50, diagonalChance: 0.6 },
        level8: { speed: 5.5, spawnRate: 45, diagonalChance: 0.6 },
        level9: { speed: 6, spawnRate: 40, diagonalChance: 0.8 },
        level10: { speed: 7, spawnRate: 35, diagonalChance: 0.8 }
    },
    levelsForProgression: 10 // Score needed to level up
};

// =================================================================================
// --- GAME STATE ---
// =================================================================================

let canvas, ctx;
let gameRunning = false;
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
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !player.isJumping && gameRunning) {
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
        
        // Crouch
        if ((e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') && gameRunning) {
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
        if (!player.isJumping && gameRunning) {
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
        if (!player.isJumping && gameRunning) {
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
}

// =================================================================================
// --- GAME LOOP ---
// =================================================================================

function gameLoop() {
    if (!gameRunning) return;
    
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
    ctx.fillStyle = CONFIG.player.color;
    
    // Adjust height when crouching
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    ctx.fillRect(player.x, playerY, CONFIG.player.width, playerHeight);
    
    // Player outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, playerY, CONFIG.player.width, playerHeight);
}

// =================================================================================
// --- FALLING OBJECTS LOGIC ---
// =================================================================================

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    // Spawn rate check
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    // Random character
    const char = CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)];
    
    // Random X position
    const x = Math.random() * (canvas.width - CONFIG.fallingCode.width);
    
    // Determine if diagonal
    const isDiagonal = Math.random() < difficulty.diagonalChance;
    const direction = isDiagonal ? (Math.random() < 0.5 ? -1 : 1) : 0; // -1 left, 0 straight, 1 right
    
    fallingObjects.push({
        x: x,
        y: -CONFIG.fallingCode.height,
        char: char,
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
        if (obj.y > canvas.height || obj.x < -CONFIG.fallingCode.width || obj.x > canvas.width) {
            fallingObjects.splice(i, 1);
            score++; // Successfully dodged
            
            // Level up check
            if (score > 0 && score % CONFIG.levelsForProgression === 0) {
                level++;
            }
        }
    }
}

function drawFallingObjects() {
    ctx.font = `${CONFIG.fallingCode.fontSize}px monospace`;
    ctx.fillStyle = CONFIG.fallingCode.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    fallingObjects.forEach(obj => {
        ctx.fillText(obj.char, obj.x + CONFIG.fallingCode.width / 2, obj.y + CONFIG.fallingCode.height / 2);
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
        
        // Simple rectangle collision
        if (
            player.x < obj.x + CONFIG.fallingCode.width &&
            player.x + CONFIG.player.width > obj.x &&
            playerY < obj.y + CONFIG.fallingCode.height &&
            playerY + playerHeight > obj.y
        ) {
            // Hit!
            fallingObjects.splice(i, 1);
            lives--;
            
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
