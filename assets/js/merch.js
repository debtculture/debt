/* =============================================================================
   MERCH PAGE - Product carousel and interactions
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

const CAROUSEL_CONFIG = {
    throttleDelay: 300,
    transitionDuration: 500
};

const SHOPIFY_PRODUCT_URL = 'https://debt-merch.myshopify.com/products/debt-logo-mug-anti-system-coffee-mug';

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
    initializePurchaseModal();
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
// --- PURCHASE MODAL FUNCTIONALITY ---
// =================================================================================

/**
 * Initializes the purchase modal and button handlers
 */
function initializePurchaseModal() {
    const buyBtn = document.getElementById('buyMugBtn');
    const modal = document.getElementById('purchaseModal');
    const closeBtn = document.getElementById('closeModal');
    const iframe = document.getElementById('shopifyFrame');

    if (!buyBtn || !modal || !closeBtn || !iframe) {
        console.error('Purchase modal elements not found');
        return;
    }

    /**
     * Opens the purchase modal
     */
    const openModal = () => {
        iframe.src = SHOPIFY_PRODUCT_URL;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    /**
     * Closes the purchase modal
     */
    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Clear iframe src to stop any ongoing processes
        iframe.src = '';
    };

    // Event listeners
    buyBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
