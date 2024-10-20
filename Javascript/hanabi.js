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
