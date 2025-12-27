/* =============================================================================
   MATRIX DODGER - Game Logic v1.5
   PER-CHARACTER COLLISION - Hit only individual digits, not whole column!
   VARIED OFFSETS - Each character can have different offset for variety
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
        charWidth: 20,     // Collision width per character
        charHeight: 28,
        fontSize: 24,
        characters: ['0', '1'],
        color: '#ff5555',
        maxOffset: 60,     // Maximum horizontal offset
        columnLengths: {
            level1: [1, 3],
            level3: [3, 5],
            level5: [5, 7],
            level7: [7, 10]
        }
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 100, offsetChance: 0 },
        level2: { speed: 2.5, spawnRate: 95, offsetChance: 0 },
        level3: { speed: 3, spawnRate: 85, offsetChance: 0.2 },
        level4: { speed: 3.5, spawnRate: 80, offsetChance: 0.3 },
        level5: { speed: 4, spawnRate: 75, offsetChance: 0.4 },
        level6: { speed: 4.5, spawnRate: 70, offsetChance: 0.5 },
        level7: { speed: 5, spawnRate: 65, offsetChance: 0.6 },
        level8: { speed: 5.5, spawnRate: 60, offsetChance: 0.65 },
        level9: { speed: 6, spawnRate: 55, offsetChance: 0.75 },
        level10: { speed: 7, spawnRate: 50, offsetChance: 0.85 }
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
// --- FALLING OBJECTS - VARIED OFFSETS PER CHARACTER! ---
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
    
    const columnLength = getColumnLength();
    const hasOffset = Math.random() < difficulty.offsetChance;
    
    // Generate column with individual character data
    const characters = [];
    let currentOffset = 0;
    
    for (let i = 0; i < columnLength; i++) {
        const char = CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)];
        
        // Each character can have varied offset for more variety
        if (hasOffset) {
            // Sometimes increment smoothly, sometimes jump randomly
            if (Math.random() < 0.7) {
                // Smooth increment (classic diagonal)
                currentOffset += Math.random() * 20 + 10;
            } else {
                // Random jump (creates varied patterns)
                currentOffset = Math.random() * CONFIG.fallingCode.maxOffset;
            }
        }
        
        characters.push({
            char: char,
            offsetX: Math.min(currentOffset, CONFIG.fallingCode.maxOffset)
        });
    }
    
    // Random starting X position
    const x = Math.random() * (canvas.width - CONFIG.fallingCode.maxOffset - CONFIG.fallingCode.charWidth);
    
    fallingObjects.push({
        x: x,
        y: -columnLength * CONFIG.fallingCode.charHeight,
        characters: characters,  // Array of {char, offsetX}
        speed: difficulty.speed
    });
}

function updateFallingObjects() {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
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
        obj.characters.forEach((charData, index) => {
            const charY = obj.y + (index * CONFIG.fallingCode.charHeight);
            const charX = obj.x + charData.offsetX + CONFIG.fallingCode.charWidth / 2;
            
            ctx.fillText(charData.char, charX, charY);
        });
    });
}

// =================================================================================
// --- COLLISION DETECTION - PER CHARACTER! ---
// =================================================================================

function checkCollisions() {
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        // Check collision with EACH INDIVIDUAL CHARACTER
        for (let j = 0; j < obj.characters.length; j++) {
            const charData = obj.characters[j];
            const charY = obj.y + (j * CONFIG.fallingCode.charHeight);
            const charX = obj.x + charData.offsetX;
            
            // Collision with this specific character
            if (
                player.x < charX + CONFIG.fallingCode.charWidth &&
                player.x + CONFIG.player.width > charX &&
                playerY < charY + CONFIG.fallingCode.charHeight &&
                playerY + playerHeight > charY
            ) {
                // Hit this character!
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
                
                break; // Stop checking other characters in this column
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
