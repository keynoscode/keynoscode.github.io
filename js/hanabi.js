// Configuration object for easy customization
const FIREWORK_CONFIG = {
    PARTICLES_PER_FIREWORK: 30,
    COOLDOWN_DELAY: 400,
    AUTO_FIREWORK_DELAY: 400,
    SCREEN_WIDTH_FACTOR: 0.7,
    SCREEN_HEIGHT_FACTOR: 0.6,
    MIN_VELOCITY: 3,
    MAX_VELOCITY: 8,
    PARTICLE_COLORS: [
        '#FF0000', // Red
        '#FF0000', // Red
        '#FF4500', // Orange Red
        '#FF4500', // Orange Red
        '#FFA500', // Orange
        '#FFFF00', // Yellow
        '#FFD700', // Gold
        '#FFD700', // Gold
        '#00FFFF', // Cyan
        '#00FFFF', // Cyan
        '#4169E1', // Royal Blue
        '#1E90FF', // Dodger Blue
        '#B0E0E6', // Powder Blue
        '#00BFFF', // Deep Sky Blue
        '#87CEEB', // Sky Blue
        '#87CEFA', // Light Sky Blue
        '#ADD8E6', // Light Blue
    ]
};

// State management
let cooldown = false;
let autoFireworkInterval = null;

/**
 * Creates a single firework effect
 * @returns {void}
 */
function createFirework() {
    if (cooldown) return;
    cooldown = true;

    const fireworkContainer = document.createElement('div');
    fireworkContainer.className = 'firework-container';

    // Calculate position with improved randomization
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const randomOffsetX = (Math.random() - 0.5) * window.innerWidth * FIREWORK_CONFIG.SCREEN_WIDTH_FACTOR;
    const randomOffsetY = (Math.random() - 0.5) * window.innerHeight * FIREWORK_CONFIG.SCREEN_HEIGHT_FACTOR;
    
    const x = Math.max(0, Math.min(window.innerWidth, centerX + randomOffsetX));
    const y = Math.max(0, Math.min(window.innerHeight, centerY + randomOffsetY));

    fireworkContainer.style.left = `${x}px`;
    fireworkContainer.style.top = `${y}px`;

    // Create particles with enhanced properties
    createParticles(fireworkContainer);

    // Add container to DOM
    document.body.appendChild(fireworkContainer);

    // Cleanup after animation
    fireworkContainer.addEventListener('animationend', (e) => {
        if (e.target === fireworkContainer) {
            fireworkContainer.remove();
        }
    });

    // Reset cooldown
    setTimeout(() => {
        cooldown = false;
    }, FIREWORK_CONFIG.COOLDOWN_DELAY);
}

/**
 * Creates particles for a firework
 * @param {HTMLElement} container - The container element for particles
 */
function createParticles(container) {
    for (let i = 0; i < FIREWORK_CONFIG.PARTICLES_PER_FIREWORK; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';

        // Enhanced particle properties
        const angle = Math.random() * 360;
        const velocity = Math.random() * 
            (FIREWORK_CONFIG.MAX_VELOCITY - FIREWORK_CONFIG.MIN_VELOCITY) + 
            FIREWORK_CONFIG.MIN_VELOCITY;

        const radians = angle * (Math.PI / 180);
        const xVelocity = Math.cos(radians) * velocity;
        const yVelocity = Math.sin(radians) * velocity;

        // Set particle properties
        particle.style.setProperty('--x', `${xVelocity}rem`);
        particle.style.setProperty('--y', `${yVelocity}rem`);
        particle.style.backgroundColor = getRandomColor();
        
        // Add trail effect
        particle.style.setProperty('--scale', Math.random() * 0.5 + 0.5);
        
        container.appendChild(particle);
    }
}

/**
 * Returns a random color from the configuration
 * @returns {string} A random color hex code
 */
function getRandomColor() {
    return FIREWORK_CONFIG.PARTICLE_COLORS[
        Math.floor(Math.random() * FIREWORK_CONFIG.PARTICLE_COLORS.length)
    ];
}

/**
 * Toggles automatic firework display
 * @param {boolean} force - Optional parameter to force a specific state
 */
function toggleAutoFireworks(force) {
    const button = document.getElementById("auto-firework-btn");
    const shouldActivate = force !== undefined ? force : !autoFireworkInterval;

    if (shouldActivate && !autoFireworkInterval) {
        autoFireworkInterval = setInterval(createFirework, FIREWORK_CONFIG.AUTO_FIREWORK_DELAY);
        button.textContent = "停止自動歡愉";
        button.classList.add('active');
    } else if (!shouldActivate && autoFireworkInterval) {
        clearInterval(autoFireworkInterval);
        autoFireworkInterval = null;
        button.textContent = "自動歡愉";
        button.classList.remove('active');
    }
}

/**
 * Cleanup function to prevent memory leaks
 */
function cleanup() {
    if (autoFireworkInterval) {
        clearInterval(autoFireworkInterval);
        autoFireworkInterval = null;
    }
    
    const containers = document.querySelectorAll('.firework-container');
    containers.forEach(container => container.remove());
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const fireworkBtn = document.getElementById("firework-btn");
    const autoFireworkBtn = document.getElementById("auto-firework-btn");

    if (fireworkBtn && !cooldown) {
        fireworkBtn.addEventListener("click", createFirework);
    }

    if (autoFireworkBtn) {
        autoFireworkBtn.addEventListener("click", () => toggleAutoFireworks());
    }

    // Cleanup on page hide/unload
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('unload', cleanup);
});

// Add resize handler to ensure fireworks stay within viewport
window.addEventListener('resize', () => {
    const containers = document.querySelectorAll('.firework-container');
    containers.forEach(container => {
        const rect = container.getBoundingClientRect();
        if (rect.left < 0 || rect.right > window.innerWidth ||
            rect.top < 0 || rect.bottom > window.innerHeight) {
            container.remove();
        }
    });
});
