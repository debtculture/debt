/* =============================================================================
   ARSENAL PAGE LOGIC - Dynamic rendering of media and shill posts
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize page content
    renderShillPosts();
    renderMediaGrid();
    initializeFilters();
    initializeLazyLoading();
});

/* --- RENDERING FUNCTIONS --- */

/**
 * Renders all shill posts dynamically from arsenal-data.js
 */
function renderShillPosts() {
    const container = document.getElementById('shill-posts-container');
    if (!container) return;

    let html = '';

    // Iterate through each shill post category
    for (const [key, section] of Object.entries(shillPosts)) {
        html += `<div class="shill-item">`;
        html += `<h3>${section.title}</h3>`;

        // Render each variant in the section
        section.variants.forEach((variant, index) => {
            html += `<pre id="${variant.id}">${variant.text}</pre>`;
            html += `<button class="copy-btn" onclick="copyToClipboard('${variant.id}')">Copy Variant ${index + 1}</button>`;
        });

        html += `</div>`;
    }

    container.innerHTML = html;
}

/**
 * Renders all media items dynamically from arsenal-data.js
 */
function renderMediaGrid() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;

    // Sort media items alphabetically by title
    const sortedItems = [...mediaItems].sort((a, b) => 
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    );

    const html = sortedItems.map(item => {
        // Handle two data structures:
        // - Images/Memes: single 'url' property for both thumbnail and download
        // - GIFs/Videos: separate 'thumbnail' and 'downloadUrl' properties
        const imageUrl = item.url || item.thumbnail;
        const downloadUrl = item.url || item.downloadUrl;

        return `
            <div class="media-item" data-category="${item.category}">
                <div class="media-image-container">
                    <img data-src="${imageUrl}" 
                         alt="${item.title}" 
                         loading="lazy">
                    <div class="media-overlay">
                        <a href="${downloadUrl}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           download 
                           class="overlay-btn" 
                           title="Download">⬇️</a>
                    </div>
                </div>
                <div class="media-title">${item.title}</div>
            </div>
        `;
    }).join('');

    grid.innerHTML = html;
}

/* --- FILTER INITIALIZATION --- */

/**
 * Initializes filter buttons with counts and click handlers
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mediaGrid = document.querySelector('.media-grid');
    const shillContainer = document.querySelector('.shill-posts-container');
    const mediaItems = document.querySelectorAll('.media-item');

    // Add counts to filter buttons
    filterButtons.forEach(button => {
        const filter = button.dataset.filter;
        let count = 0;
        
        if (filter === 'all') {
            count = mediaItems.length;
        } else if (filter === 'shill') {
            // Count total number of shill post variants
            count = Object.values(shillPosts).reduce((total, section) => 
                total + section.variants.length, 0
            );
        } else {
            count = document.querySelectorAll(`.media-item[data-category="${filter}"]`).length;
        }
        
        // Add count if greater than 0
        if (count > 0) {
            button.textContent += ` (${count})`;
        }

        // Add click handler
        button.addEventListener('click', () => handleFilterClick(button, filterButtons, mediaGrid, shillContainer, mediaItems));
    });
}

/**
 * Handles filter button clicks
 * @param {HTMLElement} button - Clicked filter button
 * @param {NodeList} filterButtons - All filter buttons
 * @param {HTMLElement} mediaGrid - Media grid container
 * @param {HTMLElement} shillContainer - Shill posts container
 * @param {NodeList} mediaItems - All media items
 */
function handleFilterClick(button, filterButtons, mediaGrid, shillContainer, mediaItems) {
    // Update active state
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;

    // Handle shill posts view
    if (filter === 'shill') {
        mediaGrid.style.display = 'none';
        shillContainer.style.display = 'block';
        return;
    }

    // Handle media grid view
    shillContainer.style.display = 'none';
    mediaGrid.style.display = 'grid';

    // Filter media items
    mediaItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

/* --- LAZY LOADING --- */

/**
 * Initializes lazy loading for images using Intersection Observer
 */
function initializeLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                };
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/* --- UTILITY FUNCTIONS --- */

/**
 * Copies text content to clipboard
 * @param {string} elementId - ID of the element containing text to copy
 */
window.copyToClipboard = function(elementId) {
    const preElement = document.getElementById(elementId);
    if (!preElement) {
        console.error(`Element with ID "${elementId}" not found`);
        return;
    }

    const textToCopy = preElement.innerText;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            const button = preElement.nextElementSibling;
            if (!button) return;

            const originalText = button.textContent;
            button.textContent = 'Copied!';
            
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text:', err);
            alert('Failed to copy. Please try again.');
        });
}

/* --- MOBILE MENU FUNCTIONS --- */

/**
 * Toggles mobile navigation menu
 */
window.toggleMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    
    if (!menu || !hamburger) return;

    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    hamburger.classList.toggle("active", !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
}

/**
 * Closes mobile navigation menu
 */
window.closeMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    
    if (!menu || !hamburger) return;

    menu.style.display = "none";
    hamburger.classList.remove("active");
    hamburger.setAttribute('aria-expanded', false);
}
