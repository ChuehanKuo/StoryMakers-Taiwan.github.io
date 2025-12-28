// ============================================
// StoryMakers Taiwan - Main JavaScript
// ============================================

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');
    const body = document.body;
    
    function closeMenu() {
        if (nav) {
            nav.classList.remove('active');
            body.classList.remove('menu-open');
            body.style.overflow = '';
        }
        if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    }
    
    function openMenu() {
        if (nav) {
            nav.classList.add('active');
            body.classList.add('menu-open');
            body.style.overflow = 'hidden';
        }
        if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
        }
    }
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (nav.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1100 && nav && nav.classList.contains('active')) {
                closeMenu();
            }
        });
    });
    
    // Close mobile menu when clicking on overlay/backdrop
    document.addEventListener('click', function(e) {
        if (nav && mobileMenuToggle && window.innerWidth <= 1100) {
            if (nav.classList.contains('active') && !nav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                closeMenu();
            }
        }
    });
    
    // Close mobile menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav && mobileMenuToggle && window.innerWidth <= 1100) {
            if (nav.classList.contains('active')) {
                closeMenu();
                mobileMenuToggle.focus();
            }
        }
    });
    
    // Set active navigation link based on current page
    setActiveNavLink();
    
    // Smooth scroll for anchor links
    initSmoothScroll();
    
    // Form handling
    initForms();
});

// Set active navigation link
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Form handling
function initForms() {
    const contactForm = document.querySelector('#contact-form');
    const newsletterForm = document.querySelector('#newsletter-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Placeholder - in production, this would submit to a server
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Placeholder - in production, this would submit to a server
            const email = this.querySelector('input[type="email"]').value;
            alert(`Thank you for subscribing! We've added ${email} to our newsletter.`);
            this.reset();
        });
    }
}

// Scroll animations (optional enhancement)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations if supported
if ('IntersectionObserver' in window) {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
}

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
}

// Add loading state to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Only add loading state for form buttons
        if (this.type === 'submit') {
            const originalText = this.textContent;
            this.textContent = 'Sending...';
            this.disabled = true;
            
            // Re-enable after a delay (in production, this would be after form submission)
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 2000);
        }
    });
});

