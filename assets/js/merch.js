// Merch Page Script - Initializes carousels on load
document.addEventListener('DOMContentLoaded', () => {
    initializeCarousels();
});

// Utility to throttle rapid clicks (prevents bugs from fast tapping)
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = new Date().getTime();
        if (now - lastCall < delay) return;
        lastCall = now;
        func(...args);
    };
}

function initializeCarousels() {
    // Set up each product carousel
    document.querySelectorAll('.merch-carousel').forEach(carousel => {
        const images = carousel.querySelectorAll('img');
        if (images.length === 0) return; // Skip if no images
        const leftArrow = carousel.querySelector('.carousel-arrow.left');
        const rightArrow = carousel.querySelector('.carousel-arrow.right');
        let currentIndex = 0;

        function showImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle('active', i === index);
            });
        }

        leftArrow.addEventListener('click', throttle(() => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(currentIndex);
        }, 300));

        rightArrow.addEventListener('click', throttle(() => {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        }, 300));

        // Initialize the first image
        showImage(currentIndex);
    });
}

// --- Mobile Menu Toggle Functions ---
window.toggleMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    hamburger.classList.toggle("active", !isOpen);
}
window.closeMenu = function() {
    const menu = document.getElementById("mobileMenu");
    const hamburger = document.querySelector(".hamburger");
    menu.style.display = "none";
    hamburger.classList.remove("active");
}
