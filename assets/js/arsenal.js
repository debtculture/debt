/* =============================================================================
   ARSENAL PAGE LOGIC - Dynamic rendering of media and shill posts
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Render content dynamically from arsenal-data.js
    renderShillPosts();
    renderMediaGrid();
    
    // Initialize page functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mediaGrid = document.querySelector('.media-grid');
    const shillContainer = document.querySelector('.shill-posts-container');
    const mediaItems = mediaGrid.querySelectorAll('.media-item');

    // Sort Grid Items Alphabetically
    const sortedItems = Array.from(mediaItems).sort((a, b) => {
        const titleA = a.querySelector('.media-title').textContent.trim().toLowerCase();
        const titleB = b.querySelector('.media-title').textContent.trim().toLowerCase();
        return titleA.localeCompare(titleB);
    });
    
    // Re-append items in sorted order
    sortedItems.forEach(item => mediaGrid.appendChild(item));
    
    // Setup Filter Buttons with Counts
    filterButtons.forEach(button => {
        const filter = button.dataset.filter;
        let count = 0;
        
        if (filter === 'all') {
            count = mediaItems.length;
        } else if (filter === 'shill') {
            count = shillContainer.querySelectorAll('.copy-btn').length;
        } else {
            count = document.querySelectorAll(`.media-item[data-category="${filter}"]`).length;
        }
        
        // Add count if greater than 0
        if (count > 0) {
            button.textContent += ` (${count})`;
        }

        // Add click handler
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
    
            const clickedFilter = button.dataset.filter;
    
            if (clickedFilter === 'shill') {
                mediaGrid.style.display = 'none';
                shillContainer.style.display = 'block';
            } else {
                shillContainer.style.display = 'none';
                mediaGrid.style.display = 'grid';
        
                sortedItems.forEach(item => {
                    if (clickedFilter === 'all' || item.dataset.category === clickedFilter) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }
        });
    });

    // Initialize Lazy Loading
    initializeLazyLoading();
});

/* --- RENDERING FUNCTIONS --- */

/**
 * Renders all shill posts dynamically from arsenal-data.js
 */
function renderShillPosts() {
    const container = document.querySelector('.shill-posts-container');
    if (!container) return;

    let html = '';

    // Iterate through each shill post section
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
    const grid = document.querySelector('.media-grid');
    if (!grid) return;

    const html = mediaItems.map(item => `
        <div class="media-item" data-category="${item.category}">
            <div class="media-image-container">
                <img data-src="${item.thumbnail}" 
                     alt="${item.title}" 
                     loading="lazy">
                <div class="media-overlay">
                    <a href="${item.downloadUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       download 
                       class="overlay-btn" 
                       title="Download">⬇️</a>
                </div>
            </div>
            <div class="media-title">${item.title}</div>
        </div>
    `).join('');

    grid.innerHTML = html;
}

/* --- LAZY LOADING --- */

/**
 * Initializes lazy loading for images using Intersection Observer
 */
function initializeLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imgObserver = new IntersectionObserver((entries, observer) => {
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

    lazyImages.forEach(img => imgObserver.observe(img));
}

/* --- UTILITY FUNCTIONS --- */

/**
 * Copies text content to clipboard
 * @param {string} elementId - ID of the element containing text to copy
 */
window.copyToClipboard = function(elementId) {
    const preElement = document.getElementById(elementId);
    if (!preElement) return;
    
    const textToCopy = preElement.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const button = preElement.nextElementSibling;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy.');
    });
}

/* --- MOBILE MENU FUNCTIONS --- */

/**
 * Toggles mobile navigation menu
 */
window.toggleMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    hamburger.classList.toggle("active", !isOpen);
}

/**
 * Closes mobile navigation menu
 */
window.closeMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    menu.style.display = "none";
    hamburger.classList.remove("active");
}
