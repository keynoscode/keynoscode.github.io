/*document.getElementById("firework-btn").addEventListener("click", createFirework);

function createFirework() {
    // Create a firework div element
    const firework = document.createElement('div');
    firework.classList.add('firework');
    
    // Set random position for the firework
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    firework.style.left = `${x}px`;
    firework.style.top = `${y}px`;

    // Append to the body
    document.body.appendChild(firework);

    // Remove the firework element after the animation ends
    firework.addEventListener('animationend', () => {
        firework.remove();
    });
}*/

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
document.getElementById("auto-firework-btn").addEventListener("click", function() {
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

// 背景图路径的通用部分（电脑和手机）
const computerBasePath = "../Webpic/Sparkle/computer_background/";
const mobileBasePath = "../Webpic/Sparkle/phone_background/";
const totalImages = 30; 

// 监听「換背景」按钮点击事件
document.getElementById("bg-change-btn").addEventListener("click", function() {
    if (!bgChangeInterval) {
        bgChangeInterval = setInterval(changeBackground, 4000); // 每4秒切换一次
        this.textContent = "停止換背景";
    } else {
        clearInterval(bgChangeInterval);
        bgChangeInterval = null;
        this.textContent = "換背景";
    }
});

// 淡入动画效果
function fadeInBackground(imageUrl) {
    const body = document.body;
    body.style.transition = "background-image 0.7s ease-in-out"; // 0.7秒淡入效果
    body.style.backgroundImage = `url('${imageUrl}')`;
}

function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % totalImages;

    // 检查是手机还是电脑，并设置相应的背景图
    const isMobile = window.innerWidth <= 768; // 如果宽度小于等于768px，则判断为手机
    const basePath = isMobile ? mobileBasePath : computerBasePath;
    const newBackground = `${basePath}${currentBackgroundIndex + 1}.png`;

    fadeInBackground(newBackground);
}
