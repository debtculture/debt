// This event listener ensures that the script runs only after the entire HTML document has been loaded and parsed.
// This is crucial for preventing errors where the script tries to find an element (like a canvas) before it exists.
document.addEventListener('DOMContentLoaded', () => {
    initializeMatrix();
    startMatrixRain();
});

// --- Matrix Background Scripts ---

function initializeMatrix() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let columns, drops, fontSize = 14;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.ceil(canvas.width / fontSize);
        drops = Array(columns).fill(1).map(() => (Math.random() * canvas.height / fontSize));
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    function draw() {
        ctx.fillStyle = 'rgba(18, 18, 18, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff5555';
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 50);
}

function startMatrixRain() {
    const rainCanvas = document.getElementById('matrix-rain');
    if (!rainCanvas) return;
    const rainCtx = rainCanvas.getContext('2d');
    let columns, drops, fontSize = 14;

    function resizeCanvas() {
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;
        columns = Math.ceil(rainCanvas.width / fontSize);
        drops = Array(columns).fill(1).map(() => (Math.random() * rainCanvas.height / fontSize));
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function drawRain() {
        rainCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        rainCtx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
        rainCtx.fillStyle = '#999999';
        rainCtx.font = fontSize + 'px monospace';
        drops.forEach((y, i) => {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            rainCtx.fillText(text, i * fontSize, y * fontSize);
            if (y * fontSize > rainCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }
    setInterval(drawRain, 50);
}
