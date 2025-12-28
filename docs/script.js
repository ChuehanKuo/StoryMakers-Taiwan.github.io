// Smooth scrolling for navigation links
const animationClass = 'scroll-animation';

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });

            // Add animation class
            targetElement.classList.add(animationClass);

            // Remove animation class after animation ends
            targetElement.addEventListener('animationend', () => {
                targetElement.classList.remove(animationClass);
            }, { once: true });
        }
    });
});

