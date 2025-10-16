document.addEventListener('DOMContentLoaded', () => {
    // Initialize interactivity for the roadmap section
    initializeRoadmapInteraction();
});

// --- ROADMAP INTERACTION (MOVED FROM INDEX.JS) ---
function initializeRoadmapInteraction() {
    document.querySelectorAll('.roadmap-blur').forEach(phase => {
        // Define a unique key for this phase in local storage
        const phaseKey = `phase-revealed-${phase.querySelector('h2').textContent.trim()}`;
        
        // On page load, always start blurred
        localStorage.removeItem(phaseKey);
        phase.classList.remove('active');

        // Add the click listener to toggle the blur
        phase.addEventListener('click', () => {
            const isActive = phase.classList.toggle('active');
            if (isActive) {
                localStorage.setItem(phaseKey, 'true');
            } else {
                localStorage.removeItem(phaseKey);
            }
        });
    });
}


// --- MOBILE MENU TOGGLE FUNCTIONS ---
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
