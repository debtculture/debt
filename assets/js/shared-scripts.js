// This event listener runs our script after the HTML has been loaded.
document.addEventListener('DOMContentLoaded', () => {
    // We now call our single, reusable function twice with different settings.
    createMatrixEffect(
        'matrix-bg',                  // The ID of the canvas element
        '#ff5555',                    // The color of the characters
        'rgba(18, 18, 18, 0.05)',     // The color of the fading overlay
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' // The characters to use
    );
    createMatrixEffect(
        'matrix-rain',                // The ID of the second canvas element
        '#999999',                    // A different character color
        'rgba(0, 0, 0, 0.05)',        // A different overlay color
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' // A different character set
    );
});

/**
 * Creates a responsive "Matrix" style animation on a given canvas.
 * @param {string} canvasId - The ID of the canvas element to draw on.
 * @param {string} charColor - The hex or rgba color for the characters.
 * @param {string} overlayColor - The rgba color for the fading effect overlay.
 * @param {string} charSet - The string of characters to use in the animation.
 */
function createMatrixEffect(canvasId, charColor, overlayColor, charSet) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let columns, drops, fontSize = 14;

    // Animation Speed Control
    const fps = 20;
    const interval = 1000 / fps;
    let lastTime = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.ceil(canvas.width / fontSize);
        drops = Array(columns).fill(1).map(() => (Math.random() * canvas.height / fontSize));
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function draw() {
        // Use the parameters for colors and characters
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = charColor;
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = charSet.charAt(Math.floor(Math.random() * charSet.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    // Animation Loop using requestAnimationFrame
    function animate(timestamp) {
        const deltaTime = timestamp - lastTime;
        if (deltaTime > interval) {
            lastTime = timestamp - (deltaTime % interval);
            draw();
        }
        requestAnimationFrame(animate);
    }
    
    // Start the animation loop
    animate(0);
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
});
