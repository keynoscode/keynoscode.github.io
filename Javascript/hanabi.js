// To fix the annoying address bar resize problem
function updateVH() {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    // Set a custom property '--vh' to the root element (used in CSS)
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Run this function on page load
updateVH();

// Recalculate the viewport height on window resize (to handle orientation change, etc.)
window.addEventListener('resize', updateVH);
//----------------------------------

document.getElementById("firework-btn").addEventListener("click", createFirework);

let cooldown = false;

function createFirework() {
    if (cooldown) return; // Prevent action if cooldown is active
    cooldown = true; // Activate cooldown

    const numberOfParticles = 30; // Number of particles in the firework
    const fireworkContainer = document.createElement('d');

    // Set a controlled random initial position close to the center of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const randomOffsetX = (Math.random() - 0.5) * window.innerWidth * 0.7; // 70% of screen width
    const randomOffsetY = (Math.random() - 0.5) * window.innerHeight * 0.6; // 60% of screen height

    const x = centerX + randomOffsetX;
    const y = centerY + randomOffsetY;

    fireworkContainer.style.left = `${x}px`;
    fireworkContainer.style.top = `${y}px`;

    // Create multiple particles
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('pt');
        fireworkContainer.appendChild(particle);

        // Random angle and velocity for each particle
        const angle = Math.random() * 360;
        const velocity = Math.random() * 5 + 3;

        // Convert the angle to X and Y velocity components
        const radians = angle * (Math.PI / 180);
        const xVelocity = Math.cos(radians) * velocity;
        const yVelocity = Math.sin(radians) * velocity;

        // Set custom properties for each particle (for use in the CSS)
        particle.style.setProperty('--x', `${xVelocity}rem`);
        particle.style.setProperty('--y', `${yVelocity}rem`);
    }

    document.body.appendChild(fireworkContainer);

    // Remove the firework container after the animation ends
    fireworkContainer.addEventListener('animationend', () => {
        fireworkContainer.remove();
    });

    // Set a timeout to reset the cooldown flag after 0.5 seconds
    setTimeout(() => {
        cooldown = false;
    }, 500); // milliseconds
}

let autoFireworkInterval;

// Fireworks Auto-Set Button Behind the Main Button
document.getElementById("auto-firework-btn").addEventListener("click", function () {
    // Start setting off fireworks every second
    if (!autoFireworkInterval) {
        autoFireworkInterval = setInterval(createFirework, 500);
        this.textContent = "停止自動歡愉";
    } else {
        clearInterval(autoFireworkInterval);
        autoFireworkInterval = null;
        this.textContent = "自動歡愉";
    }
});

let currentBackgroundIndex = 0;
let bgChangeInterval;

const computerBasePath = "../Webpic/Sparkle/computer_background/";
const mobileBasePath = "../Webpic/Sparkle/phone_background/";
const totalImages = 30;
const changeInterval = 4; // Interval in seconds between background changes

// Tooltip element for background information
const bgInfoTooltip = document.createElement('div');
bgInfoTooltip.id = 'bg-info-tooltip';
document.body.appendChild(bgInfoTooltip);

// Background layers

const background1 = document.createElement('b1');
background1.id = 'background1';
document.body.appendChild(background1);

const background2 = document.createElement('b2');
background2.id = 'background2';
document.body.appendChild(background2);

let activeBackground = 1; // Track which background is active

// Modify the tooltip message
document.getElementById("bg-change-btn").addEventListener("click", function () {
    if (!bgChangeInterval) {
        bgChangeInterval = setInterval(changeBackground, changeInterval * 1000); // Change every 'changeInterval' seconds
        this.textContent = "停止換背景";

        // Show tooltip with the updated message and image
        showTooltip(`背景圖最大數量: ${totalImages}，背景每 ${changeInterval} 秒切換`);
    } else {
        clearInterval(bgChangeInterval);
        bgChangeInterval = null;
        this.textContent = "換背景";

        // Hide tooltip when stopping the background change
        hideTooltip();
    }
});

function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;

    const isMobile = window.innerWidth <= 768;
    const basePath = isMobile ? mobileBasePath : computerBasePath;
    const newBackground = `${basePath}${currentBackgroundIndex + 1}.png`;

    fadeBackground(newBackground);
}

function fadeBackground(newImage) {
    const bg1 = document.getElementById('background1');
    const bg2 = document.getElementById('background2');

    if (activeBackground === 1) {
        bg2.style.backgroundImage = `url('${newImage}')`;
        bg2.style.opacity = 1; // Fade in background2
        bg1.style.opacity = 0; // Fade out background1
        activeBackground = 2; // Switch active background
    } else {
        bg1.style.backgroundImage = `url('${newImage}')`;
        bg1.style.opacity = 1; // Fade in background1
        bg2.style.opacity = 0; // Fade out background2
        activeBackground = 1; // Switch active background
    }
}

// Show tooltip with information
function showTooltip(message) {
    const tooltip = document.getElementById('bg-info-tooltip');
    tooltip.innerHTML = `${message} <img src="../Webpic/Sparkle/icon/02.png" alt="Icon" style="width: 30px; height: 30px; vertical-align: middle; margin-left: 5px;">`;
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = 1;

    // Automatically hide the tooltip after 7 seconds
    setTimeout(hideTooltip, 7000);
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('bg-info-tooltip');
    tooltip.style.opacity = 0;
    setTimeout(() => {
        tooltip.style.visibility = 'hidden';
    }, 500); // Wait for fade-out to complete
}