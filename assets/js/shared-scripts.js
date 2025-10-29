/* =============================================================================
   SHARED SCRIPTS - Matrix effect animation for background canvases
   ============================================================================= */

/**
 * Matrix Effect Configuration
 */
const MATRIX_CONFIG = {
    primary: {
        canvasId: 'matrix-bg',
        charColor: '#ff5555',
        overlayColor: 'rgba(18, 18, 18, 0.05)',
        charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        fontSize: 14,
        fps: 20,
        resetChance: 0.975
    },
    secondary: {
        canvasId: 'matrix-rain',
        charColor: '#999999',
        overlayColor: 'rgba(0, 0, 0, 0.05)',
        charSet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        fontSize: 14,
        fps: 20,
        resetChance: 0.975
    }
};

/**
 * MatrixEffect Class - Handles the Matrix-style animation on a canvas
 */
class MatrixEffect {
    constructor(config) {
        this.canvas = document.getElementById(config.canvasId);
        if (!this.canvas) {
            console.warn(`Canvas with ID "${config.canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error(`Could not get 2D context for canvas "${config.canvasId}"`);
            return;
        }

        this.charColor = config.charColor;
        this.overlayColor = config.overlayColor;
        this.charSet = config.charSet;
        this.fontSize = config.fontSize;
        this.fps = config.fps;
        this.resetChance = config.resetChance;
        
        this.interval = 1000 / this.fps;
        this.lastTime = 0;
        this.animationId = null;
        this.columns = 0;
        this.drops = [];

        this.init();
    }

    /**
     * Initialize the canvas and start animation
     */
    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.start();
    }

    /**
     * Resize canvas to fit window and recalculate columns
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.ceil(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns)
            .fill(0)
            .map(() => Math.random() * (this.canvas.height / this.fontSize));
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Draw a single frame of the animation
     */
    draw() {
        // Apply fading overlay
        this.ctx.fillStyle = this.overlayColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw characters
        this.ctx.fillStyle = this.charColor;
        this.ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            const char = this.charSet.charAt(
                Math.floor(Math.random() * this.charSet.length)
            );
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            this.ctx.fillText(char, x, y);

            // Reset drop to top if it reaches bottom
            if (y > this.canvas.height && Math.random() > this.resetChance) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }
    }

    /**
     * Animation loop with FPS limiting
     */
    animate(timestamp) {
        const deltaTime = timestamp - this.lastTime;

        if (deltaTime > this.interval) {
            this.lastTime = timestamp - (deltaTime % this.interval);
            this.draw();
        }

        this.animationId = requestAnimationFrame((ts) => this.animate(ts));
    }

    /**
     * Start the animation
     */
    start() {
        if (!this.animationId) {
            this.animationId = requestAnimationFrame((ts) => this.animate(ts));
        }
    }

    /**
     * Stop the animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Cleanup and destroy the effect
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resizeHandler);
    }
}

/**
 * Initialize matrix effects when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create primary matrix effect
    const primaryEffect = new MatrixEffect(MATRIX_CONFIG.primary);
    
    // Create secondary matrix effect
    const secondaryEffect = new MatrixEffect(MATRIX_CONFIG.secondary);

    // Store references globally for potential cleanup
    window.matrixEffects = {
        primary: primaryEffect,
        secondary: secondaryEffect
    };

    // Optional: Cleanup on page unload (for SPAs)
    window.addEventListener('beforeunload', () => {
        if (window.matrixEffects) {
            window.matrixEffects.primary?.destroy();
            window.matrixEffects.secondary?.destroy();
        }
    });
});
