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
// --- INITIALIZATION ---
// =================================================================================

/**
 * Initialize litepaper page functionality
 * Currently handles mobile menu setup
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager first
    await initWallet();
    
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
