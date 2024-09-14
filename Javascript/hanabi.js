document.getElementById("firework-btn").addEventListener("click", createFirework);

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
}

document.getElementById("firework-btn").addEventListener("click", createFirework);

function createFirework() {
    const numberOfParticles = 30; // Number of particles in the firework
    const fireworkContainer = document.createElement('div');
    fireworkContainer.classList.add('firework-container');

    // Set a controlled random initial position close to the center of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const randomOffsetX = (Math.random() - 0.5) * window.innerWidth * 0.7; // 20% of screen width
    const randomOffsetY = (Math.random() - 0.5) * window.innerHeight * 0.58; // 20% of screen height

    const x = centerX + randomOffsetX;
    const y = centerY + randomOffsetY;

    fireworkContainer.style.left = `${x}px`;
    fireworkContainer.style.top = `${y}px`;

    // Create multiple particles
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
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
}
