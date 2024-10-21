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

let basePath = "../Webpic/Sparkle/computer_background/";
let mobileBasePath = "../Webpic/Sparkle/phone_background/";
let iconBasePath = "../Webpic/Sparkle/icon/";
const totalImages = 30;
const changeInterval = 5; // Interval in seconds between background changes

// Add an event listener to the dropdown menu
document.getElementById('background-source').addEventListener('change', function () {
    basePath = this.value; // Set desktop base path
    mobileBasePath = this.value.replace('computer_background', 'phone_background'); // Set mobile base path
    iconBasePath = this.value.replace('computer_background', 'icon'); // Set the icon path dynamically
});

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
//------------------------------------------------------------------------------------------------------
// background change (issue: As background fade in and out, sometime it will show the base background, and especially when it lagging, Fixed.)
function preloadImage(url, callback) {
    const img = new Image();
    img.src = url;
    img.onload = callback; // Once the image is loaded, proceed with the transition
}

function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;
    const isMobile = window.innerWidth <= 768;
    const selectedBasePath = isMobile ? mobileBasePath : basePath;
    console.log("Is mobile: ", isMobile); // Log to see if it's detecting mobile correctly
    console.log("Selected path: ", selectedBasePath); // Log the path being used

    const newBackground = `${selectedBasePath}${currentBackgroundIndex + 1}.png`;

    // Preload the new background before starting the fade
    preloadImage(newBackground, () => {
        fadeBackground(newBackground, isMobile); // Pass isMobile to fadeBackground
    });
}

function fadeBackground(newImage, isMobile) {
    const bg1 = document.getElementById('background1');
    const bg2 = document.getElementById('background2');

    if (activeBackground === 1) {
        bg2.style.backgroundImage = `url('${newImage}')`;
        bg2.style.opacity = 1; // Fading in background2

        setTimeout(() => {
            bg1.style.opacity = 0; // Fade out background1
        }, isMobile ? 200 : 100); // Add slightly more delay for mobile to ensure smoothness
        activeBackground = 2;
    } else {
        bg1.style.backgroundImage = `url('${newImage}')`;
        bg1.style.opacity = 1; // Start fading in background1

        setTimeout(() => {
            bg2.style.opacity = 0; // Fade out background2
        }, isMobile ? 200 : 100); // Add slightly more delay for mobile to ensure smoothness
        activeBackground = 1;
    }

    function preloadImage(url, callback) {
        const img = new Image();
        img.src = url;
        img.onload = callback; // Call the callback once the image is loaded
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
    tooltip.innerHTML = `${message} <img src="${iconBasePath}2.png" alt="Icon" style="width: 30px; height: 30px; vertical-align: middle; margin-left: 5px;">`;
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