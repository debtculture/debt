/* =============================================================================
   MATRIX DODGER - Game Logic v1.7 (FIXED FREEZE BUG)
   Fixed: Level up notification properly unpauses game
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
        charHeight: 30,
        fontSize: 24,
        characters: ['0', '1'],
        color: '#ff5555',
        columnLengths: {
            level1: [2, 4],
            level3: [3, 6],
            level5: [4, 8],
            level7: [5, 10]
        },
        speedVariance: 1.5
    },
    difficulty: {
        level1: { baseSpeed: 2, spawnRate: 100, minColumns: 1, maxColumns: 1 },
        level2: { baseSpeed: 2.5, spawnRate: 90, minColumns: 1, maxColumns: 2 },
        level3: { baseSpeed: 3, spawnRate: 85, minColumns: 1, maxColumns: 2 },
        level4: { baseSpeed: 3.5, spawnRate: 75, minColumns: 2, maxColumns: 3 },
        level5: { baseSpeed: 4, spawnRate: 70, minColumns: 2, maxColumns: 3 },
        level6: { baseSpeed: 4.5, spawnRate: 65, minColumns: 2, maxColumns: 4 },
        level7: { baseSpeed: 5, spawnRate: 60, minColumns: 2, maxColumns: 4 },
        level8: { baseSpeed: 5.5, spawnRate: 55, minColumns: 3, maxColumns: 5 },
        level9: { baseSpeed: 6, spawnRate: 50, minColumns: 3, maxColumns: 5 },
        level10: { baseSpeed: 7, spawnRate: 45, minColumns: 3, maxColumns: 5 }
    },
    levelThresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000] // Score needed for each level
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
let hearts = []; // Falling heart powerups

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
let heartDropSchedule = [250, 500, 1000, 2000, 4000, 7000, 10000]; // Hearts drop at these scores
let nextHeartIndex = 0; // Track which heart is next

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
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('pauseBtnMobile').addEventListener('click', togglePause);
});

// =================================================================================
// --- EVENT LISTENERS ---
// =================================================================================

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
            if (gameRunning) {
                e.preventDefault();
                togglePause();
            }
            return;
        }
        
        if (gamePaused) return;
        
        keys[e.key.toLowerCase()] = true;
        
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !player.isJumping && gameRunning) {
            e.preventDefault();
            player.isJumping = true;
            player.velocityY = -CONFIG.player.jumpPower;
        }
        
        if ((e.key === 'Shift' || e.key === 'ArrowDown' || e.key === 's') && gameRunning) {
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
    document.getElementById('pauseBtn').style.display = 'block';
    document.getElementById('pauseBtnMobile').style.display = 'block';
    gameRunning = true;
    gamePaused = false;
    score = 0;
    level = 1;
    lives = 3;
    fallingObjects = [];
    hearts = [];
    nextHeartIndex = 0;
    frameCount = 0;
    updatePauseButton();
    updateUI();
    gameLoop();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    startGame();
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    updatePauseButton();
    
    if (gamePaused) {
        showNotification('PAUSED\nPress P or ⏸ to Resume', 'pause');
    } else {
        document.getElementById('notificationPopup').classList.remove('active');
    }
}

function updatePauseButton() {
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseBtnMobile = document.getElementById('pauseBtnMobile');
    const text = gamePaused ? '▶ RESUME' : '⏸ PAUSE';
    pauseBtn.textContent = text;
    pauseBtnMobile.textContent = text;
}

function endGame() {
    gameRunning = false;
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('pauseBtnMobile').style.display = 'none';
    
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
    
    // Only pause for life lost, NOT for level up (prevents freeze bug)
    if (type === 'life-lost') {
        gamePaused = true;
        
        setTimeout(() => {
            popup.classList.remove('active', 'life-lost');
            if (gameRunning) {
                gamePaused = false;
            }
        }, 1500);
    } else if (type === 'level') {
        // Level up: just show notification, don't pause
        fallingObjects = []; // Still clear the board
        setTimeout(() => {
            popup.classList.remove('active');
        }, 1500);
    }
    // Pause type stays on screen until manually dismissed
}

// =================================================================================
// --- GAME LOOP ---
// =================================================================================

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!gamePaused) {
        frameCount++;
        updatePlayer();
        updateFallingObjects();
        updateHearts();
        spawnFallingObjects();
        spawnHeart();
        checkCollisions();
        checkHeartCollection();
        updateUI();
    }
    
    drawPlayer();
    drawFallingObjects();
    drawHearts();
    
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
// --- FALLING OBJECTS ---
// =================================================================================

function getColumnLength() {
    if (level >= 7) return Math.floor(Math.random() * 6) + 5;
    if (level >= 5) return Math.floor(Math.random() * 5) + 4;
    if (level >= 3) return Math.floor(Math.random() * 4) + 3;
    return Math.floor(Math.random() * 3) + 2;
}

function getVariedSpeed(baseSpeed) {
    const variance = (Math.random() - 0.5) * CONFIG.fallingCode.speedVariance;
    return baseSpeed + variance;
}

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    const numColumns = Math.floor(Math.random() * (difficulty.maxColumns - difficulty.minColumns + 1)) + difficulty.minColumns;
    const sectionWidth = canvas.width / numColumns;
    
    for (let i = 0; i < numColumns; i++) {
        const columnLength = getColumnLength();
        
        const column = [];
        for (let j = 0; j < columnLength; j++) {
            column.push(CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)]);
        }
        
        const sectionStart = i * sectionWidth;
        const sectionEnd = (i + 1) * sectionWidth - CONFIG.fallingCode.charWidth;
        const x = sectionStart + Math.random() * (sectionEnd - sectionStart);
        
        fallingObjects.push({
            x: x,
            y: -columnLength * CONFIG.fallingCode.charHeight,
            column: column,
            speed: getVariedSpeed(difficulty.baseSpeed)
        });
    }
}

function updateFallingObjects() {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        obj.y += obj.speed;
        
        if (obj.y > canvas.height) {
            fallingObjects.splice(i, 1);
            // Award points per character in the strand!
            score += obj.column.length;
            
            // Calculate new level based on score thresholds
            const oldLevel = level;
            level = getLevelFromScore(score);
            
            if (level > oldLevel) {
                showNotification(`LEVEL ${level}!`, 'level');
            }
        }
    }
}

function getLevelFromScore(currentScore) {
    const thresholds = CONFIG.levelThresholds;
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (currentScore >= thresholds[i]) {
            return i + 1; // Levels are 1-indexed
        }
    }
    return 1;
}

function drawFallingObjects() {
    ctx.font = `${CONFIG.fallingCode.fontSize}px monospace`;
    ctx.fillStyle = CONFIG.fallingCode.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    fallingObjects.forEach(obj => {
        obj.column.forEach((char, index) => {
            const charY = obj.y + (index * CONFIG.fallingCode.charHeight);
            const charX = obj.x + CONFIG.fallingCode.charWidth / 2;
            
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
        
        for (let j = 0; j < obj.column.length; j++) {
            const charY = obj.y + (j * CONFIG.fallingCode.charHeight);
            
            if (
                player.x < obj.x + CONFIG.fallingCode.charWidth &&
                player.x + CONFIG.player.width > obj.x &&
                playerY < charY + CONFIG.fallingCode.charHeight &&
                playerY + playerHeight > charY
            ) {
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
                
                break;
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

// =================================================================================
// --- HEART POWERUP SYSTEM ---
// =================================================================================

function spawnHeart() {
    // Check if we've reached the next heart score threshold
    if (nextHeartIndex < heartDropSchedule.length && 
        score >= heartDropSchedule[nextHeartIndex] && 
        hearts.length === 0) {
        
        const x = Math.random() * (canvas.width - 30);
        hearts.push({
            x: x,
            y: -40,
            width: 30,
            height: 30,
            speed: 2
        });
        nextHeartIndex++; // Move to next heart in schedule
    }
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        hearts[i].y += hearts[i].speed;
        
        // Remove if off screen
        if (hearts[i].y > canvas.height) {
            hearts.splice(i, 1);
        }
    }
}

function drawHearts() {
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    hearts.forEach(heart => {
        ctx.fillText('❤️', heart.x + heart.width / 2, heart.y);
    });
}

function checkHeartCollection() {
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        
        if (
            player.x < heart.x + heart.width &&
            player.x + CONFIG.player.width > heart.x &&
            playerY < heart.y + heart.height &&
            playerY + playerHeight > heart.y
        ) {
            // Caught heart!
            hearts.splice(i, 1);
            if (lives < 5) { // Cap at 5 lives
                lives++;
                
                // Show notification
                canvas.style.border = '5px solid gold';
                setTimeout(() => {
                    canvas.style.border = '3px solid #ff5555';
                }, 300);
            }
        }
    }
}
