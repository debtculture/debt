/* =============================================================================
   LITEPAPER PAGE - Mobile navigation and page interactions
   Version: 2.0 (Optimized)
   ============================================================================= */

// =================================================================================
// --- CONFIGURATION ---
// =================================================================================

/**
 * Mobile menu configuration
 * @constant {Object}
 */
const MOBILE_MENU_CONFIG = {
    menuId: 'mobileMenu',
    hamburgerClass: 'hamburger',
    activeClass: 'active'
};

// =================================================================================
// --- MOBILE NAVIGATION FUNCTIONS ---
// =================================================================================

/**
 * Toggles the mobile hamburger menu visibility
 * Updates aria-expanded attribute for accessibility
 * 
 * @function toggleMenu
 * @global
 */
window.toggleMenu = function() {
    const menu = document.getElementById(MOBILE_MENU_CONFIG.menuId);
    const hamburger = document.querySelector(`.${MOBILE_MENU_CONFIG.hamburgerClass}`);
    
    if (!menu || !hamburger) {
        console.warn('Mobile menu or hamburger element not found');
        return;
    }

    const isOpen = menu.style.display === 'block';
    
    // Toggle menu visibility
    menu.style.display = isOpen ? 'none' : 'block';
    
    // Toggle hamburger animation
    hamburger.classList.toggle(MOBILE_MENU_CONFIG.activeClass, !isOpen);
    
    // Update ARIA attribute for accessibility
    hamburger.setAttribute('aria-expanded', !isOpen);
};

/**
 * Closes the mobile hamburger menu
 * Called when clicking on menu links
 * 
 * @function closeMenu
 * @global
 */
window.closeMenu = function() {
    const menu = document.getElementById(MOBILE_MENU_CONFIG.menuId);
    const hamburger = document.querySelector(`.${MOBILE_MENU_CONFIG.hamburgerClass}`);
    
    if (!menu || !hamburger) {
        console.warn('Mobile menu or hamburger element not found');
        return;
    }

    // Close menu
    menu.style.display = 'none';
    
    // Remove hamburger animation
    hamburger.classList.remove(MOBILE_MENU_CONFIG.activeClass);
    
    // Update ARIA attribute for accessibility
    hamburger.setAttribute('aria-expanded', 'false');
};

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

/**
 * Initialize litepaper page functionality
 * Currently handles mobile menu setup
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    } else {
        console.error('Wallet manager not loaded');
    }
    
    // Mobile menu is initialized via onclick handlers in HTML
    // No additional initialization needed at this time
    
    // Future enhancements could include:
    // - Smooth scrolling to sections
    // - Table of contents navigation
    // - Copy-to-clipboard for contract address
    // - Reading progress indicator
});

// =================================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================================

/**
 * Scrolls smoothly to a section by ID
 * Can be used for table of contents navigation
 * 
 * @function scrollToSection
 * @param {string} sectionId - The ID of the section to scroll to
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    
    if (!section) {
        console.warn(`Section with ID "${sectionId}" not found`);
        return;
    }

    section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/**
 * Copies text to clipboard
 * Useful for contract addresses
 * 
 * @function copyToClipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}
