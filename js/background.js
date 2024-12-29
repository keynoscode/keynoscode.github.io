// Global variables and constants
let currentBackgroundIndex = 0;
let bgChangeInterval;
let activeBackground = 1;
const totalImages = 30;
const changeInterval = 4; // Interval in seconds
const imageCache = new Map();

// Paths configuration
let basePath = "../Webpic/Sparkle/computer_background/";
let mobileBasePath = "../Webpic/Sparkle/phone_background/";
let iconBasePath = "../Webpic/Sparkle/icon/";

// Viewport height fix for mobile devices
function updateVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize background elements
function initializeBackgrounds() {
    // Create background elements
    const background1 = document.createElement('div');
    background1.id = 'background1';
    document.body.appendChild(background1);

    const background2 = document.createElement('div');
    background2.id = 'background2';
    document.body.appendChild(background2);

    // Create tooltip element
    const bgInfoTooltip = document.createElement('div');
    bgInfoTooltip.id = 'bg-info-tooltip';
    document.body.appendChild(bgInfoTooltip);
}

// Image preloading with enhanced error handling
function preloadImage(url, callback) {
    if (imageCache.has(url)) {
        callback();
        return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
        if (!imageCache.has(url)) {
            console.warn(`Image load timed out: ${url}`);
            img.src = '';
            callback(new Error('Image load timeout'));
        }
    }, 10000);

    img.onload = () => {
        clearTimeout(timeoutId);
        imageCache.set(url, img);
        callback();
    };

    img.onerror = () => {
        clearTimeout(timeoutId);
        console.error(`Failed to load image: ${url}`);
        callback(new Error('Image load failed'));
    };

    img.src = url;
}

// Background changing logic
function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;
    const isMobile = window.innerWidth <= 768;
    const selectedBasePath = isMobile ? mobileBasePath : basePath;
    const newBackground = `${selectedBasePath}${currentBackgroundIndex + 1}.png`;

    preloadImage(newBackground, (error) => {
        if (!error) {
            fadeBackground(newBackground, isMobile);
        } else {
            console.error('Failed to change background:', error);
            // Attempt to load next image on failure
            currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;
        }
    });
}

// Enhanced fade transition
function fadeBackground(newImage, isMobile) {
    const bg1 = document.getElementById('background1');
    const bg2 = document.getElementById('background2');

    if (!bg1 || !bg2) {
        console.error('Background elements not found');
        return;
    }

    const transitionDuration = isMobile ? 200 : 100;

    if (activeBackground === 1) {
        bg2.style.backgroundImage = `url('${newImage}')`;
        requestAnimationFrame(() => {
            bg2.style.opacity = '1';
            setTimeout(() => {
                bg1.style.opacity = '0';
            }, transitionDuration);
        });
        activeBackground = 2;
    } else {
        bg1.style.backgroundImage = `url('${newImage}')`;
        requestAnimationFrame(() => {
            bg1.style.opacity = '1';
            setTimeout(() => {
                bg2.style.opacity = '0';
            }, transitionDuration);
        });
        activeBackground = 1;
    }
}

// Tooltip management
function showTooltip(message) {
    const tooltip = document.getElementById('bg-info-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `${message} <img src="${iconBasePath}2.png" alt="Icon" style="width: 30px; height: 30px; vertical-align: middle; margin-left: 5px;">`;
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    // Clear existing timeout and set new one
    if (tooltip.hideTimeout) {
        clearTimeout(tooltip.hideTimeout);
    }
    tooltip.hideTimeout = setTimeout(hideTooltip, 7000);
}

function hideTooltip() {
    const tooltip = document.getElementById('bg-info-tooltip');
    if (!tooltip) return;

    tooltip.style.opacity = '0';
    setTimeout(() => {
        tooltip.style.visibility = 'hidden';
    }, 20);
}

// Background source change handler
function initializeBackgroundSource() {
    const sourceSelect = document.getElementById('background-source');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', function() {
            const newBasePath = this.value;
            basePath = newBasePath;
            mobileBasePath = newBasePath.replace('computer_background', 'phone_background');
            iconBasePath = newBasePath.replace('computer_background', 'icon');
        });
    }
}

// Background change button handler
function initializeBackgroundButton() {
    const bgChangeBtn = document.getElementById('bg-change-btn');
    if (bgChangeBtn) {
        bgChangeBtn.addEventListener('click', function() {
            if (!bgChangeInterval) {
                bgChangeInterval = setInterval(changeBackground, changeInterval * 1000);
                this.textContent = "停止換背景";
                showTooltip(`背景圖最大數量: ${totalImages}，背景每 ${changeInterval} 秒切換`);
            } else {
                clearInterval(bgChangeInterval);
                bgChangeInterval = null;
                this.textContent = "換背景";
                hideTooltip();
            }
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeBackgrounds();
    initializeBackgroundSource();
    initializeBackgroundButton();
    updateVH();
});

// Window event listeners
window.addEventListener('resize', debounce(updateVH, 250));
window.addEventListener('beforeunload', () => {
    if (bgChangeInterval) {
        clearInterval(bgChangeInterval);
    }
});
