/* =============================================================================
   SHARED SCRIPTS - Matrix effect animation for background canvases
   IMPROVEMENTS: Debounced resize, performance detection, fallbacks
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
    },
    // Performance thresholds
    performance: {
        highEnd: { fps: 30, fullEffect: true },
        midRange: { fps: 20, fullEffect: true },
        lowEnd: { fps: 15, fullEffect: false },
        minimal: { fps: 10, fullEffect: false }
    }
};

/**
 * Detects device performance level
 * @returns {string} Performance tier: 'highEnd', 'midRange', 'lowEnd', or 'minimal'
 */
function detectPerformanceTier() {
    // Check for performance API
    if (!window.performance || !window.performance.memory) {
        return 'midRange'; // Default fallback
    }

    // Check device memory (if available)
    const deviceMemory = navigator.deviceMemory; // In GB
    if (deviceMemory) {
        if (deviceMemory >= 8) return 'highEnd';
        if (deviceMemory >= 4) return 'midRange';
        if (deviceMemory >= 2) return 'lowEnd';
        return 'minimal';
    }

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 2;
    if (cores >= 8) return 'highEnd';
    if (cores >= 4) return 'midRange';
    if (cores >= 2) return 'lowEnd';
    return 'minimal';
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

        this.ctx = this.canvas.getContext('2d', { alpha: true });
        if (!this.ctx) {
            console.error(`Could not get 2D context for canvas "${config.canvasId}"`);
            return;
        }

        this.charColor = config.charColor;
        this.overlayColor = config.overlayColor;
        this.charSet = config.charSet;
        this.fontSize = config.fontSize;
        this.resetChance = config.resetChance;
        
        // Detect performance and adjust settings
        this.performanceTier = detectPerformanceTier();
        const perfSettings = MATRIX_CONFIG.performance[this.performanceTier];
        this.fps = perfSettings.fps;
        this.fullEffect = perfSettings.fullEffect;
        
        this.interval = 1000 / this.fps;
        this.lastTime = 0;
        this.animationId = null;
        this.columns = 0;
        this.drops = [];
        this.isVisible = !document.hidden;
        this.performanceMode = false;

        // Create debounced resize handler
        this.debouncedResize = debounce(() => this.resizeCanvas(), 250);

        this.init();
    }

    /**
     * Initialize the canvas and start animation
     */
    init() {
        console.log(`Matrix effect initialized at ${this.performanceTier} tier (${this.fps} FPS)`);
        
        this.resizeCanvas();
        this.bindEvents();
        
        // Only start animation if user prefers motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            this.start();
        } else {
            console.log('Matrix effect disabled: user prefers reduced motion');
        }
        
        // Monitor performance
        this.startPerformanceMonitoring();
    }

    /**
     * Resize canvas to fit window and recalculate columns
     */
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        // For low-end devices, use lower resolution
        const scale = this.fullEffect ? dpr : Math.min(dpr, 1);
        
        this.canvas.width = window.innerWidth * scale;
        this.canvas.height = window.innerHeight * scale;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        
        this.ctx.scale(scale, scale);
        
        this.columns = Math.ceil(window.innerWidth / this.fontSize);
        this.drops = Array(this.columns)
            .fill(0)
            .map(() => Math.random() * (window.innerHeight / this.fontSize));
    }

    /**
     * Bind event listeners with debouncing
     */
    bindEvents() {
        // Use debounced resize handler
        window.addEventListener('resize', this.debouncedResize);
        
        // Handle visibility changes for battery saving
        this.visibilityHandler = () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) {
                this.start();
            } else {
                this.stop();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    /**
     * Draw a single frame of the animation
     */
    draw() {
        // Apply fading overlay
        this.ctx.fillStyle = this.overlayColor;
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw characters
        this.ctx.fillStyle = this.charColor;
        this.ctx.font = `${this.fontSize}px monospace`;

        // In performance mode, draw fewer columns
        const step = this.performanceMode ? 2 : 1;

        for (let i = 0; i < this.drops.length; i += step) {
            const char = this.charSet.charAt(
                Math.floor(Math.random() * this.charSet.length)
            );
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            this.ctx.fillText(char, x, y);

            // Reset drop to top if it reaches bottom
            if (y > window.innerHeight && Math.random() > this.resetChance) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }
    }

    /**
     * Animation loop with FPS limiting
     */
    animate(timestamp) {
        if (!this.isVisible) return;

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
        if (!this.animationId && this.isVisible) {
            this.lastTime = performance.now();
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
     * Monitor performance and adjust if needed
     */
    startPerformanceMonitoring() {
        // Only monitor on lower-end devices
        if (this.performanceTier === 'highEnd') return;

        let frameCount = 0;
        let lastCheck = performance.now();

        const checkPerformance = () => {
            frameCount++;
            
            if (frameCount >= 60) {
                const now = performance.now();
                const actualFps = (frameCount / (now - lastCheck)) * 1000;
                
                // If actual FPS is significantly lower than target, enable performance mode
                if (actualFps < this.fps * 0.7 && !this.performanceMode) {
                    console.warn('Enabling performance mode due to low FPS');
                    this.performanceMode = true;
                    this.fps = Math.max(10, this.fps - 5);
                    this.interval = 1000 / this.fps;
                }
                
                frameCount = 0;
                lastCheck = now;
            }
            
            if (this.animationId) {
                setTimeout(checkPerformance, 100);
            }
        };

        setTimeout(checkPerformance, 1000);
    }

    /**
     * Cleanup and destroy the effect
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.debouncedResize);
        document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
}

/**
 * Initialize matrix effects when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        console.log('Matrix effects disabled: user prefers reduced motion');
        
        // Show static background instead
        const canvases = document.querySelectorAll('#matrix-bg, #matrix-rain');
        canvases.forEach(canvas => {
            canvas.style.opacity = '0.1';
        });
        
        return;
    }

    // Create primary matrix effect
    const primaryEffect = new MatrixEffect(MATRIX_CONFIG.primary);
    
    // Create secondary matrix effect (only on mid-range and above)
    const performanceTier = detectPerformanceTier();
    let secondaryEffect = null;
    
    if (performanceTier === 'highEnd' || performanceTier === 'midRange') {
        secondaryEffect = new MatrixEffect(MATRIX_CONFIG.secondary);
    } else {
        console.log('Secondary matrix effect disabled for performance');
        const secondaryCanvas = document.getElementById('matrix-rain');
        if (secondaryCanvas) {
            secondaryCanvas.style.display = 'none';
        }
    }

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

/**
 * Utility: Check if animations should be enabled
 * @returns {boolean} True if animations are enabled
 */
function shouldEnableAnimations() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Utility: Get current performance tier
 * @returns {string} Performance tier
 */
function getCurrentPerformanceTier() {
    return detectPerformanceTier();
}

// Export utilities
window.shouldEnableAnimations = shouldEnableAnimations;
window.getCurrentPerformanceTier = getCurrentPerformanceTier;

/* =============================================================================
   IMPROVEMENTS MADE:
   
   1. PERFORMANCE DETECTION:
      - Automatically detects device capabilities (RAM, CPU cores)
      - Adjusts FPS and effect complexity based on hardware
      - Four tiers: highEnd, midRange, lowEnd, minimal
   
   2. DEBOUNCED RESIZE:
      - Resize handler now uses 250ms debounce
      - Prevents excessive recalculations during window resize
   
   3. ADAPTIVE PERFORMANCE:
      - Monitors actual FPS during runtime
      - Automatically enables "performance mode" if FPS drops
      - Reduces column density in performance mode
   
   4. REDUCED MOTION SUPPORT:
      - Respects prefers-reduced-motion media query
      - Shows static background instead of animation
   
   5. VISIBILITY API:
      - Pauses animations when tab is hidden
      - Saves battery and CPU on mobile devices
   
   6. DEVICE-SPECIFIC OPTIMIZATIONS:
      - Low-end devices get single effect only
      - Uses lower canvas resolution on weak hardware
      - Adjusts FPS based on device tier
   
   7. MEMORY MANAGEMENT:
      - Proper cleanup of event listeners
      - Cancels animation frames on destroy
   
   USAGE:
   - No changes needed in HTML
   - Effects automatically adjust to device
   - Utilities available via window object
   
   ============================================================================= */
