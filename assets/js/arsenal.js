// This script contains logic specific to the arsenal page.
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mediaGrid = document.querySelector('.media-grid');
    const shillContainer = document.querySelector('.shill-posts-container');
    const mediaItems = mediaGrid.querySelectorAll('.media-item');

    // --- Sort Grid Items Alphabetically on Load ---
    const sortedItems = Array.from(mediaItems).sort((a, b) => {
        const titleA = a.querySelector('.media-title').textContent.trim().toLowerCase();
        const titleB = b.querySelector('.media-title').textContent.trim().toLowerCase();
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
    });
    // Re-append items to the grid in the new sorted order
    sortedItems.forEach(item => mediaGrid.appendChild(item));
    
    // --- Setup Filter Buttons (with Counts) ---
    filterButtons.forEach(button => {
        const filter = button.dataset.filter;
        let count = 0;
        
        if (filter === 'all') {
            count = mediaItems.length;
        } else if (filter === 'shill') {
            count = shillContainer.querySelectorAll('.shill-item').length;
        } else {
            count = document.querySelectorAll(`.media-item[data-category="${filter}"]`).length;
        }
        
        // Add count if it's greater than 0
        if (count > 0) {
            button.textContent += ` (${count})`;
        }

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

    // --- Lazy Loading Logic ---
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

    // --- HELPER FUNCTIONS FOR THIS PAGE ---
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

});
