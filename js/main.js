// EmailJS Configuration - REPLACE THESE VALUES
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';
const EMAILJS_SERVICE_ID = 'service_9x384tl';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE';

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
    });
}

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add animation classes to elements
document.querySelectorAll('.feature-card, .team-card, .success-card, .faq-item').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

document.querySelectorAll('.expect-text, .history-text, .register-info').forEach(el => {
    el.classList.add('slide-in-left');
    observer.observe(el);
});

document.querySelectorAll('.expect-image, .history-image, .register-form-container').forEach(el => {
    el.classList.add('slide-in-right');
    observer.observe(el);
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section[id]');

function highlightNav() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNav);

// Send Confirmation Email
async function sendConfirmationEmail(userData) {
    // Check if EmailJS is configured
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE') {
        console.log('EmailJS not configured yet. Skipping email.');
        return true;
    }
    
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            education: userData.education
        });
        console.log('Confirmation email sent successfully');
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

// Form Validation
const form = document.getElementById('registrationForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        let isValid = true;
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'education'];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                isValid = false;
                const input = form.querySelector(`[name="${field}"]`);
                input.style.borderColor = '#ef4444';
            } else {
                const input = form.querySelector(`[name="${field}"]`);
                input.style.borderColor = '#e2e8f0';
            }
        });
        
        if (isValid) {
            const registration = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: data.education,
                registrationDate: new Date().toISOString(),
                status: 'pending'
            };
            
            try {
                // Save to Seafile
                await saveRegistration(registration);
                
                // Send confirmation email
                const emailSent = await sendConfirmationEmail(registration);
                
                if (emailSent) {
                    alert('Thank you for your registration! A confirmation email has been sent to your email address.');
                } else {
                    alert('Thank you for your registration! We will contact you soon.');
                }
                
                form.reset();
            } catch (error) {
                alert('Registration saved. Please try again later.');
                console.error('Error:', error);
            }
        } else {
            alert('Please fill in all required fields.');
        }
    });
}

// Save registration to Seafile
async function saveRegistration(registration) {
    const SEAFILE_TOKEN = '049ba3c36e01e10997b45e41ecb30c6492e283de';
    const SEAFILE_REPO_ID = '4185aea9-389a-4d7e-96ce-88eee187e0c7';
    const SEAFILE_SERVER = 'https://cloud.seafile.com';
    const DATA_FILE = '/data.json';
    
    let appData;
    try {
        const response = await fetch(
            `${SEAFILE_SERVER}/api2/repos/${SEAFILE_REPO_ID}/file/?p=${DATA_FILE}`,
            { headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` } }
        );
        
        if (response.ok) {
            const content = await response.text();
            appData = JSON.parse(content);
        } else {
            appData = { registrations: [], classes: [], trainers: [] };
        }
    } catch (error) {
        appData = { registrations: [], classes: [], trainers: [] };
    }
    
    appData.registrations.push(registration);
    
    const linkResponse = await fetch(
        `${SEAFILE_SERVER}/api2/repos/${SEAFILE_REPO_ID}/upload-link/`,
        { headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` } }
    );
    const uploadLink = await linkResponse.json();
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' }), 'data.json');
    uploadFormData.append('parent_dir', '/');
    uploadFormData.append('replace', '1');
    
    await fetch(uploadLink, {
        method: 'POST',
        headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` },
        body: uploadFormData
    });
}
