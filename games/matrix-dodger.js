/* =============================================================================
   MATRIX DODGER - Game Logic v1.4
   VISUAL DIAGONAL OFFSET - Characters staggered for Matrix effect!
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
        customImage: null,
        imageObj: null
    },
    fallingCode: {
        charWidth: 25,
        charHeight: 28,
        fontSize: 24,
        characters: ['0', '1'],
        color: '#ff5555',
        offsetIncrement: 15,  // How much to offset each character horizontally
        columnLengths: {
            level1: [1, 3],
            level3: [3, 5],
            level5: [5, 7],
            level7: [7, 10]
        }
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 100, offsetChance: 0 },      // No offset
        level2: { speed: 2.5, spawnRate: 95, offsetChance: 0 },     // No offset
        level3: { speed: 3, spawnRate: 85, offsetChance: 0.2 },     // 20% offset
        level4: { speed: 3.5, spawnRate: 80, offsetChance: 0.25 },  // 25% offset
        level5: { speed: 4, spawnRate: 75, offsetChance: 0.35 },    // 35% offset
        level6: { speed: 4.5, spawnRate: 70, offsetChance: 0.4 },   // 40% offset
        level7: { speed: 5, spawnRate: 65, offsetChance: 0.5 },     // 50% offset
        level8: { speed: 5.5, spawnRate: 60, offsetChance: 0.55 },  // 55% offset
        level9: { speed: 6, spawnRate: 55, offsetChance: 0.65 },    // 65% offset
        level10: { speed: 7, spawnRate: 50, offsetChance: 0.75 }    // 75% offset
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
    
    // Clear board on level up
    if (type === 'level') {
        fallingObjects = [];
    }
    
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
// --- FALLING OBJECTS - VISUAL DIAGONAL OFFSET! ---
// =================================================================================

function getColumnLength() {
    if (level >= 7) return Math.floor(Math.random() * 4) + 7;
    if (level >= 5) return Math.floor(Math.random() * 3) + 5;
    if (level >= 3) return Math.floor(Math.random() * 3) + 3;
    return Math.floor(Math.random() * 3) + 1;
}

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    // Generate vertical column
    const columnLength = getColumnLength();
    const column = [];
    for (let i = 0; i < columnLength; i++) {
        column.push(CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)]);
    }
    
    // Determine if this column should have visual offset (diagonal appearance)
    const hasOffset = Math.random() < difficulty.offsetChance;
    const offsetDirection = hasOffset ? (Math.random() < 0.5 ? 1 : -1) : 0;
    
    // Calculate total width needed (base + offsets)
    const totalOffset = hasOffset ? (columnLength - 1) * CONFIG.fallingCode.offsetIncrement : 0;
    const totalWidth = CONFIG.fallingCode.charWidth + Math.abs(totalOffset);
    
    // Random X position (make sure entire offset column fits)
    const maxX = canvas.width - totalWidth;
    const x = Math.random() * Math.max(50, maxX);
    
    const columnHeight = CONFIG.fallingCode.charHeight * columnLength;
    
    fallingObjects.push({
        x: x,
        y: -columnHeight,
        column: column,
        width: totalWidth,
        height: columnHeight,
        speed: difficulty.speed,
        hasOffset: hasOffset,
        offsetDirection: offsetDirection  // 1 = right, -1 = left, 0 = none
    });
}

function updateFallingObjects() {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        // Only move down (NO horizontal movement)
        obj.y += obj.speed;
        
        // Remove if off screen
        if (obj.y > canvas.height) {
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
        // Draw each character with optional horizontal offset
        obj.column.forEach((char, index) => {
            const charY = obj.y + (index * CONFIG.fallingCode.charHeight);
            
            // Calculate X position with visual offset
            let charX = obj.x + CONFIG.fallingCode.charWidth / 2;
            if (obj.hasOffset) {
                charX += (index * CONFIG.fallingCode.offsetIncrement * obj.offsetDirection);
            }
            
            ctx.fillText(char, charX, charY);
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
        
        // Check collision with entire column area (including offset width)
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
