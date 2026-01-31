/* =============================================================================
   MERCH PAGE - Updated for sold out status and coming soon features
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const CAROUSEL_CONFIG = {
    throttleDelay: 300,
    transitionDuration: 500
};

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Throttles function calls to prevent rapid firing
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall < delay) return;
        lastCall = now;
        func(...args);
    };
}

// =================================================================================
// --- MAIN INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    await initWallet();
    
    initializeCarousels();
    initializeAnimations();
});

// =================================================================================
// --- CAROUSEL FUNCTIONALITY ---
// =================================================================================

/**
 * Initializes all product carousels on the page
 */
function initializeCarousels() {
    const carousels = document.querySelectorAll('.merch-carousel');
    
    carousels.forEach(carousel => {
        setupCarousel(carousel);
    });
}

/**
 * Sets up a single carousel with navigation
 * @param {HTMLElement} carousel - Carousel container element
 */
function setupCarousel(carousel) {
    const images = carousel.querySelectorAll('img');
    
    // Skip if no images found
    if (images.length === 0) {
        console.warn('Carousel has no images:', carousel);
        return;
    }

    const leftArrow = carousel.querySelector('.carousel-arrow.left');
    const rightArrow = carousel.querySelector('.carousel-arrow.right');
    
    if (!leftArrow || !rightArrow) {
        console.error('Carousel arrows not found:', carousel);
        return;
    }

    let currentIndex = 0;

    /**
     * Shows image at specified index
     * @param {number} index - Image index to show
     */
    const showImage = (index) => {
        images.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    };

    /**
     * Navigates to previous image
     */
    const showPrevious = throttle(() => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    }, CAROUSEL_CONFIG.throttleDelay);

    /**
     * Navigates to next image
     */
    const showNext = throttle(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    }, CAROUSEL_CONFIG.throttleDelay);

    // Attach event listeners
    leftArrow.addEventListener('click', showPrevious);
    rightArrow.addEventListener('click', showNext);

    // Keyboard navigation support
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            showPrevious();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            showNext();
        }
    });

    // Initialize first image
    showImage(currentIndex);

    // Make carousel focusable for keyboard navigation
    if (!carousel.hasAttribute('tabindex')) {
        carousel.setAttribute('tabindex', '0');
    }
}

// =================================================================================
// --- ANIMATIONS ---
// =================================================================================

/**
 * Initializes page animations and effects
 */
function initializeAnimations() {
    // Fade in stats on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe stats and timeline items
    const animatedElements = document.querySelectorAll(
        '.stat-card, .timeline-item, .collection-status'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Progress bar animation
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        setTimeout(() => {
            progressFill.style.width = progressFill.getAttribute('style').match(/width:\s*(\d+%)/)[1];
        }, 500);
    }
}

// =================================================================================
// --- UTILITY: Check if wallet manager is available ---
// =================================================================================

/**
 * Initialize wallet if available, otherwise skip
 */
async function initWallet() {
    if (typeof window.initWalletManager === 'function') {
        try {
            await window.initWalletManager();
        } catch (error) {
            console.log('Wallet manager not available or failed to initialize');
        }
    }
}
