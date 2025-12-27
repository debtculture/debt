/* =============================================================================
   MATRIX DODGER - Game Logic v1.7
   SIMPLE VERTICAL COLUMNS - No diagonal offsets!
   MULTIPLE SPAWNS - 2-5 columns can fall at once
   CLEAN COLLISION - Simple rectangle checks per character
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
            level1: [2, 4],      // 2-4 characters tall
            level3: [3, 6],      // 3-6 characters
            level5: [4, 8],      // 4-8 characters
            level7: [5, 10]      // 5-10 characters
        }
    },
    difficulty: {
        level1: { speed: 2, spawnRate: 100, minColumns: 1, maxColumns: 1 },
        level2: { speed: 2.5, spawnRate: 90, minColumns: 1, maxColumns: 2 },
        level3: { speed: 3, spawnRate: 85, minColumns: 1, maxColumns: 2 },
        level4: { speed: 3.5, spawnRate: 75, minColumns: 2, maxColumns: 3 },
        level5: { speed: 4, spawnRate: 70, minColumns: 2, maxColumns: 3 },
        level6: { speed: 4.5, spawnRate: 65, minColumns: 2, maxColumns: 4 },
        level7: { speed: 5, spawnRate: 60, minColumns: 2, maxColumns: 4 },
        level8: { speed: 5.5, spawnRate: 55, minColumns: 3, maxColumns: 5 },
        level9: { speed: 6, spawnRate: 50, minColumns: 3, maxColumns: 5 },
        level10: { speed: 7, spawnRate: 45, minColumns: 3, maxColumns: 5 }
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
        
        // Pause game
        if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameRunning) {
            togglePause();
            return;
        }
        
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

function togglePause() {
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        showNotification('PAUSED', 'pause');
    } else {
        document.getElementById('notificationPopup').classList.remove('active');
    }
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
    
    if (type !== 'pause') {
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
    } else {
        // Redraw static scene when paused
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawFallingObjects();
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
// --- FALLING OBJECTS - SIMPLE VERTICAL COLUMNS ---
// =================================================================================

function getColumnLength() {
    if (level >= 7) return Math.floor(Math.random() * 6) + 5;   // 5-10
    if (level >= 5) return Math.floor(Math.random() * 5) + 4;   // 4-8
    if (level >= 3) return Math.floor(Math.random() * 4) + 3;   // 3-6
    return Math.floor(Math.random() * 3) + 2;  // 2-4
}

function spawnFallingObjects() {
    const difficulty = getDifficultySettings();
    
    if (frameCount % difficulty.spawnRate !== 0) return;
    
    // Spawn multiple columns
    const numColumns = Math.floor(Math.random() * (difficulty.maxColumns - difficulty.minColumns + 1)) + difficulty.minColumns;
    
    // Divide screen into sections to avoid overlap
    const sectionWidth = canvas.width / numColumns;
    
    for (let i = 0; i < numColumns; i++) {
        const columnLength = getColumnLength();
        
        // Generate column characters
        const column = [];
        for (let j = 0; j < columnLength; j++) {
            column.push(CONFIG.fallingCode.characters[Math.floor(Math.random() * CONFIG.fallingCode.characters.length)]);
        }
        
        // Position within this section
        const sectionStart = i * sectionWidth;
        const sectionEnd = (i + 1) * sectionWidth - CONFIG.fallingCode.charWidth;
        const x = sectionStart + Math.random() * (sectionEnd - sectionStart);
        
        fallingObjects.push({
            x: x,
            y: -columnLength * CONFIG.fallingCode.charHeight,
            column: column,
            speed: difficulty.speed
        });
    }
}

function updateFallingObjects() {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        obj.y += obj.speed;
        
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
        obj.column.forEach((char, index) => {
            const charY = obj.y + (index * CONFIG.fallingCode.charHeight);
            const charX = obj.x + CONFIG.fallingCode.charWidth / 2;
            
            ctx.fillText(char, charX, charY);
        });
    });
}

// =================================================================================
// --- COLLISION DETECTION - SIMPLE & CLEAN ---
// =================================================================================

function checkCollisions() {
    const playerHeight = player.isCrouching ? CONFIG.player.height / 2 : CONFIG.player.height;
    const playerY = player.isCrouching ? player.y + CONFIG.player.height / 2 : player.y;
    
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        
        // Check each character in the column
        for (let j = 0; j < obj.column.length; j++) {
            const charY = obj.y + (j * CONFIG.fallingCode.charHeight);
            
            // Simple rectangle collision
            if (
                player.x < obj.x + CONFIG.fallingCode.charWidth &&
                player.x + CONFIG.player.width > obj.x &&
                playerY < charY + CONFIG.fallingCode.charHeight &&
                playerY + playerHeight > charY
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
