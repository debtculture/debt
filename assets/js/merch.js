// This script now only contains logic specific to the merchandise page.
document.addEventListener('DOMContentLoaded', () => {
    initializeCarousels();
});

function initializeCarousels() {
    document.querySelectorAll('.merch-carousel').forEach(carousel => {
        const images = carousel.querySelectorAll('img');
        const leftArrow = carousel.querySelector('.carousel-arrow.left');
        const rightArrow = carousel.querySelector('.carousel-arrow.right');
        let currentIndex = 0;

        function showImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle('active', i === index);
            });
        }

        leftArrow.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(currentIndex);
        });

        rightArrow.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        });

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
