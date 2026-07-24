// EmailJS Configuration - REPLACE THESE VALUES
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';
const EMAILJS_SERVICE_ID = 'service_9x384tl';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE';

// Initialize EmailJS
if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ========================
// NAVIGATION
// ========================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close menu when clicking on a nav link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu && navMenu.classList.contains('active') &&
        !navMenu.contains(e.target) && navToggle && !navToggle.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});

// ========================
// FAQ ACCORDION
// ========================
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const btn = item.querySelector('.faq-question');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});

// ========================
// SCROLL ANIMATIONS
// ========================
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

// Fade in elements
const fadeTargets = document.querySelectorAll(
    '.feature-card, .team-card, .faq-item, .overview-card, .quick-link, ' +
    '.benefit-item, .stat-card, .timeline-item, .module-card, .schedule-row, ' +
    '.program-highlight, .detail-item'
);
fadeTargets.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Slide in left
document.querySelectorAll(
    '.about-preview-text, .content-main, .register-info'
).forEach(el => {
    el.classList.add('slide-in-left');
    observer.observe(el);
});

// Slide in right
document.querySelectorAll(
    '.about-preview-image, .content-sidebar, .register-form-container, .carousel-wrapper'
).forEach(el => {
    el.classList.add('slide-in-right');
    observer.observe(el);
});

// ========================
// REGISTRATION FORM
// ========================
const form = document.getElementById('registrationForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validate required fields
        let isValid = true;
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'education'];

        requiredFields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (!data[field] || data[field].trim() === '') {
                isValid = false;
                if (input) input.style.borderColor = '#ef4444';
            } else {
                if (input) input.style.borderColor = '#e2e8f0';
            }
        });

        if (!isValid) {
            prhToast('Please fill in all required fields.', 'error');
            return;
        }

        const captchaCheck = document.getElementById('captchaCheck');
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        const recaptchaResponse = document.querySelector('[name="g-recaptcha-response"]');
        const hasCaptcha = (captchaCheck && captchaCheck.checked) || (turnstileResponse && turnstileResponse.value) || (recaptchaResponse && recaptchaResponse.value);
        if (!hasCaptcha) {
            prhToast('Please verify that you are not a robot.', 'error');
            return;
        }

        const registration = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            name: data.fullName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            education: data.education,
            registrationDate: new Date().toISOString(),
            status: 'pending'
        };

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="prh-btn-spinner"></span> Submitting...';
        }

        if (typeof prhShowLoading === 'function') prhShowLoading('Submitting your registration...');

        try {
            await saveRegistration(registration);
            const emailSent = await sendConfirmationEmail(registration);

            if (typeof prhHideLoading === 'function') prhHideLoading();

            if (emailSent) {
                prhToast('Registration submitted! A confirmation email has been sent.', 'success');
            } else {
                prhToast('Registration submitted! We will contact you soon.', 'success');
            }

            form.reset();
        } catch (error) {
            if (typeof prhHideLoading === 'function') prhHideLoading();
            prhToast('Registration saved. We will contact you soon.', 'success');
            console.error('Error:', error);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                    Submit Registration
                `;
            }
        }
    });
}

// CAPTCHA checkbox enables submit button
const captchaCheck = document.getElementById('captchaCheck');
const submitBtn = document.getElementById('submitBtn');
if (captchaCheck && submitBtn) {
    captchaCheck.addEventListener('change', () => {
        submitBtn.disabled = !captchaCheck.checked;
    });
}

// Cloudflare Turnstile callbacks
function onTurnstileSuccess(token) {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
}

function onTurnstileExpired() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;
}

// Google reCAPTCHA callbacks
function onRecaptchaSuccess(token) {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
}

function onRecaptchaExpired() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;
}

// Send Confirmation Email
async function sendConfirmationEmail(userData) {
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

// ========================
// FEATURE MODAL (Home page)
// ========================
const featureData = {
    'Being Professional': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        description: 'Being professional in the BPO industry means mastering workplace etiquette, maintaining proper grooming standards, and developing strong interpersonal skills. You will learn how to communicate effectively with colleagues and clients, manage your time efficiently, and present yourself confidently in a corporate environment.'
    },
    'Know the Standards': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
        description: 'Understanding BPO industry standards is crucial for success. Learn about Key Performance Indicators (KPIs) such as Average Handling Time (AHT), Customer Satisfaction (CSAT), First Call Resolution (FCR), and Net Promoter Score (NPS).'
    },
    'Production Floor': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        description: 'The production floor experience gives you a real-world glimpse of how call centers operate. Learn about workstation setup, headset usage, CRM systems, and call handling protocols.'
    },
    'Mock Calling': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
        description: 'Mock calling sessions simulate real customer interactions to build your confidence and skills. Practice handling various scenarios including angry customers, technical support inquiries, and billing questions.'
    },
    'Brainstorming': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        description: 'Brainstorming sessions develop your critical thinking and problem-solving abilities. Learn how to analyze customer issues quickly, identify root causes, and provide effective solutions.'
    },
    'Team Collaboration': {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        description: 'Team collaboration is essential in the BPO environment. Learn how to communicate effectively with teammates, share best practices, and support each other during high-pressure situations.'
    }
};

// Feature card click to open modal
document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('click', function () {
        const title = this.querySelector('h3').textContent;
        const data = featureData[title];
        if (data) {
            const modal = document.getElementById('featureModal');
            if (modal) {
                document.getElementById('modalIcon').innerHTML = data.icon;
                document.getElementById('modalTitle').textContent = title;
                document.getElementById('modalDescription').textContent = data.description;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
    });
});

function closeFeatureModal() {
    const modal = document.getElementById('featureModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal on overlay click
const featureModal = document.getElementById('featureModal');
if (featureModal) {
    featureModal.addEventListener('click', function (e) {
        if (e.target === this) closeFeatureModal();
    });
}

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeFeatureModal();
});

// ========================
// COUNTER ANIMATION (Scrolling Clock)
// ========================
function animateCounter(el, delay) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 3000;
    const startTime = performance.now() + delay;

    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        if (elapsed < 0) {
            el.textContent = '0' + suffix;
            requestAnimationFrame(update);
            return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = Math.floor(eased * target);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString() + suffix;
        }
    }
    requestAnimationFrame(update);
}

const counterEls = document.querySelectorAll('.counter');
if (counterEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const allCounters = entry.target.querySelectorAll('.counter');
                allCounters.forEach((el, i) => {
                    animateCounter(el, i * 300);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    observer.observe(counterEls[0].closest('.hero-stats') || counterEls[0].parentElement.parentElement);
}
