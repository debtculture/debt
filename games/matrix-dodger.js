/* =============================================================================
   MATRIX DODGER - Game Logic v1.3
   VERTICAL CODE COLUMNS - Characters fall in vertical stacks!
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
        gravity: 0.6,
        // Custom sprite image (set via Cloudinary URL)
        customImage: null,
        imageObj: null
    },
    fallingCode: {
        charWidth: 25,     // Horizontal spacing for vertical columns
        charHeight: 28,    // Vertical spacing between characters in column
        fontSize: 24,
        characters: ['0', '1'],
        color: '#ff5555',
        columnLengths: {
            level1: [1, 3],      // 1-3 characters in vertical column
            level3: [3, 5],      // 3-5 characters
            level5: [5, 7],      // 5-7 characters
            level7: [7, 10]      // 7-10 characters
        }
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 100, diagonalChance: 0 },
        level2: { speed: 2.5, spawnRate: 95, diagonalChance: 0 },
        level3: { speed: 3, spawnRate: 85, diagonalChance: 0.15 },
        level4: { speed: 3.5, spawnRate: 80, diagonalChance: 0.2 },
        level5: { speed: 4, spawnRate: 75, diagonalChance: 0.3 },
        level6: { speed: 4.5, spawnRate: 70, diagonalChance: 0.35 },
        level7: { speed: 5, spawnRate: 65, diagonalChance: 0.45 },
        level8: { speed: 5.5, spawnRate: 60, diagonalChance: 0.5 },
        level9: { speed: 6, spawnRate: 55, diagonalChance: 0.6 },
        level10: { speed: 7, spawnRate: 50, diagonalChance: 0.7 }
    },
    pointsPerLevel: 50
};

// =================================================================================
// --- CUSTOM SPRITE LOADER ---
// =================================================================================

function loadCustomSprite(imageUrl) {
    const img = new Image();
    img.onload = () => {
        CONFIG.player.imageObj = img;
        CONFIG.player.customImage = imageUrl;
        console.log('Custom sprite loaded successfully!');
    };
    img.onerror = () => {
        console.error('Failed to load custom sprite, using default');
        CONFIG.player.imageObj = null;
    };
    img.src = imageUrl;
}

// Uncomment and add your Cloudinary URL here:
// loadCustomSprite('YOUR_CLOUDINARY_URL_HERE');

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
    
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;
    
    highScore = parseInt(localStorage.getItem('matrixDodgerHighScore')) || 0;
    
    player.x = CONFIG.canvas.width / 2 - CONFIG.player.width / 2;
    player.groundY = CONFIG.canvas.height - CONFIG.player.height - 20;
    player.y = player.groundY;
    
    setupEventListeners();
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
});

// =================================================================================
// --- EVENT LISTENERS ---
// =================================================================================

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !player.isJumping && gameRunning && !gamePaused) {
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
        
        if ((e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') && gameRunning && !gamePaused) {
            player.isCrouching = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        
        if (e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') {
            player.isCrouching = false;
        }
    });
    
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const crouchBtn = document.getElementById('crouchBtn');
    
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
    
    leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.left = false; });
    rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.right = false; });
    crouchBtn.addEventListener('touchend', (e) => { e.preventDefault(); mobileControls.crouch = false; player.isCrouching = false; });
    
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
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('matrixDodgerHighScore', highScore);
        document.getElementById('highScoreNotice').textContent = `🏆 NEW HIGH SCORE! 🏆`;
        document.getElementById('highScoreNotice').classList.add('active');
    } else {
        document.getElementById('highScoreNotice').classList.remove('active');
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOverScreen').classList.add('active');
    
    trySubmitScore();
}

async function trySubmitScore() {
    if (typeof window.submitScore === 'function') {
        try {
            await window.submitScore('matrix-dodger', score);
            console.log('Score submitted successfully!');
        } catch (error) {
            console.log('Score submission not available');
        }
    }
}

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
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        updatePlayer();
        updateFallingObjects();
        spawnFallingObjects();
        
        drawPlayer();
        drawFallingObjects();
        
        checkCollisions();
        
        updateUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// =================================================================================
// --- PLAYER LOGIC ---
// =================================================================================

function updatePlayer() {
    if (keys['arrowleft'] || keys['a'] || mobileControls.left) {
        player.x -= CONFIG.player.speed;
    }
    if (keys['arrowright'] || keys['d'] || mobileControls.right) {
        player.x += CONFIG.player.speed;
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - CONFIG.player.width) {
        player.x = canvas.width - CONFIG.player.width;
    }
    
    if (player.isJumping) {
        player.velocityY += CONFIG.player.gravity;
        player.y += player.velocityY;
        
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
    
    if (CONFIG.player.imageObj) {
        ctx.drawImage(
            CONFIG.player.imageObj,
            player.x,
            playerY,
            CONFIG.player.width,
            playerHeight
        );
        return;
    }
    
    ctx.fillStyle = CONFIG.player.color;
    
    ctx.beginPath();
    ctx.moveTo(player.x + CONFIG.player.width / 2, playerY);
    ctx.lineTo(player.x, playerY + playerHeight * 0.4);
    ctx.lineTo(player.x + CONFIG.player.width, playerY + playerHeight * 0.4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillRect(
        player.x + CONFIG.player.width * 0.2, 
        playerY + playerHeight * 0.35, 
        CONFIG.player.width * 0.6, 
        playerHeight * 0.65
    );
    
    ctx.fillStyle = '#fff';
    const eyeY = playerY + playerHeight * 0.25;
    ctx.fillRect(player.x + CONFIG.player.width * 0.35, eyeY, 3, 3);
    ctx.fillRect(player.x + CONFIG.player.width * 0.62, eyeY, 3, 3);
}

// =================================================================================
// --- FALLING OBJECTS - VERTICAL COLUMNS! ---
// =================================================================================

function getColumnLength() {
    if (level >= 7) return Math.floor(Math.random() * 4) + 7;  // 7-10
    if (level >= 5) return Math.floor(Math.random() * 3) + 5;  // 5-7
    if (level >= 3) return Math.floor(Math.random() * 3) + 3;  // 3-5
    return Math.floor(Math.random() * 3) + 1;  // 1-3
}

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    // Generate vertical column of characters
    const columnLength = getColumnLength();
    const column = [];
    for (let i = 0; i < columnLength; i++) {
        column.push(CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)]);
    }
    
    // Calculate column dimensions
    const columnHeight = CONFIG.fallingCode.charHeight * columnLength;
    
    // Random X position
    const x = Math.random() * (canvas.width - CONFIG.fallingCode.charWidth);
    
    // Determine if diagonal
    const isDiagonal = Math.random() < difficulty.diagonalChance;
    const direction = isDiagonal ? (Math.random() < 0.5 ? -1 : 1) : 0;
    
    fallingObjects.push({
        x: x,
        y: -columnHeight,  // Start above screen
        column: column,    // Array of characters
        width: CONFIG.fallingCode.charWidth,
        height: columnHeight,
        speed: difficulty.speed,
        direction: direction,
        horizontalSpeed: isDiagonal ? 1 : 0
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
        if (obj.y > canvas.height || obj.x < -obj.width || obj.x > canvas.width) {
            fallingObjects.splice(i, 1);
            score++;
            
            const oldLevel = level;
            level = Math.floor(score / CONFIG.pointsPerLevel) + 1;
            
            if (level > oldLevel) {
                showNotification(`LEVEL ${level}!`, 'level');
            }
        }
    }
}

function drawFallingObjects() {
    ctx.font = `${CONFIG.fallingCode.fontSize}px monospace`;
    ctx.fillStyle = CONFIG.fallingCode.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    fallingObjects.forEach(obj => {
        // Draw each character in the vertical column
        obj.column.forEach((char, index) => {
            const charY = obj.y + (index * CONFIG.fallingCode.charHeight);
            ctx.fillText(
                char, 
                obj.x + CONFIG.fallingCode.charWidth / 2, 
                charY
            );
        });
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
        
        // Check collision with entire vertical column
        if (
            player.x < obj.x + obj.width &&
            player.x + CONFIG.player.width > obj.x &&
            playerY < obj.y + obj.height &&
            playerY + playerHeight > obj.y
        ) {
            // Hit!
            fallingObjects.splice(i, 1);
            lives--;
            
            showNotification(`LIFE LOST! ${lives} LEFT`, 'life-lost');
            
            canvas.style.border = '5px solid red';
            setTimeout(() => {
                canvas.style.border = '3px solid #ff5555';
            }, 200);
            
            if (lives <= 0) {
                endGame();
            }
        }
    }
}

function getDifficultySettings() {
    const difficultyKey = `level${Math.min(level, 10)}`;
    return CONFIG.difficulty[difficultyKey] || CONFIG.difficulty.level10;
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    
    const hearts = '❤️'.repeat(lives);
    document.getElementById('lives').textContent = hearts || '💀';
}
