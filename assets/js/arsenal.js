// This script contains logic specific to the arsenal page.
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mediaGrid = document.querySelector('.media-grid');
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
        } else {
            count = document.querySelectorAll(`.media-item[data-category="${filter}"]`).length;
        }
        if (count > 0) {
            button.textContent += ` (${count})`;
        }

        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            sortedItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
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
});
