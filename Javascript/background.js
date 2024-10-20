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
//------------------------------------------------------------------------------------------------------

let currentBackgroundIndex = 0;
let bgChangeInterval;

const computerBasePath = "../Webpic/Sparkle/computer_background/";
const mobileBasePath = "../Webpic/Sparkle/phone_background/";
const totalImages = 30;
const changeInterval = 5.3; // Interval in seconds between background changes

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

//------------------------------------------------------------------------------------------------------

// Modify the tooltip message
document.getElementById("bg-change-btn").addEventListener("click", function () {
    if (!bgChangeInterval) {
        bgChangeInterval = setInterval(changeBackground, changeInterval * 1500); // Change every 'changeInterval' seconds
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
//------------------------------------------------------------------------------------------------------
// background change (issue: As background fade in and out, sometime it will show the base background, and especially when it lagging)
function preloadImage(url, callback) {
    const img = new Image();
    img.src = url;
    img.onload = callback; // Once the image is loaded, proceed with the transition
}

function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;
    const isMobile = window.innerWidth <= 768;
    const basePath = isMobile ? mobileBasePath : computerBasePath;
    const newBackground = `${basePath}${currentBackgroundIndex + 1}.png`;

    // Preload the new background before starting the fade
    preloadImage(newBackground, () => {
        fadeBackground(newBackground);
    });
}

function fadeBackground(newImage) {
    const bg1 = document.getElementById('background1');
    const bg2 = document.getElementById('background2');

    if (activeBackground === 1) {
        bg2.style.backgroundImage = `url('${newImage}')`;
        bg2.style.opacity = 1; // Start fading in background2

        setTimeout(() => {
            bg1.style.opacity = 0; // Fade out background1 after background2 has started fading in
        }, 100); // Delay to avoid showing the base background
        activeBackground = 2;
    } else {
        bg1.style.backgroundImage = `url('${newImage}')`;
        bg1.style.opacity = 1; // Start fading in background1

        setTimeout(() => {
            bg2.style.opacity = 0; // Fade out background2 after background1 has started fading in
        }, 100); // Delay to avoid showing the base background
        activeBackground = 1;
    }
}

function fadeInBackground(imageUrl) {
    const body = document.body;
    body.style.transition = "background-image 0.7s ease-in-out"; // 0.7秒淡入效果
    body.style.backgroundImage = `url('${imageUrl}')`;
    body.style.backgroundSize = "cover"; // Ensure the background covers the whole screen
    body.style.backgroundPosition = "center";
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
