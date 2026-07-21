# PRHInc Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page website for PRHInc promoting free 10-day call center training, similar to hirebloom.com design.

**Architecture:** Static HTML/CSS/JS single-page application with smooth scroll navigation, responsive design, and interactive components (FAQ accordion, form validation).

**Tech Stack:** HTML5, CSS3, JavaScript (vanilla), Unsplash stock images

---

### Task 1: Project Setup & Base HTML

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/main.js`

**Step 1: Create base HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRHInc - Free Call Center Training</title>
    <link rel="stylesheet" href="css/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="#home" class="nav-logo">
                <img src="images/prhinclogo.png" alt="PRHInc Logo" class="logo-img">
            </a>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span class="hamburger"></span>
            </button>
            <ul class="nav-menu">
                <li><a href="#home" class="nav-link">Home</a></li>
                <li><a href="#faq" class="nav-link">FAQ</a></li>
                <li><a href="#history" class="nav-link">History</a></li>
                <li><a href="#inspired" class="nav-link">Inspired</a></li>
                <li><a href="#register" class="nav-link nav-cta">Register</a></li>
            </ul>
        </div>
    </nav>

    <!-- Main Content -->
    <main>
        <!-- Sections will be added in subsequent tasks -->
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-container">
            <!-- Footer content -->
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>
```

**Step 2: Create CSS file with reset and variables**

```css
/* CSS Reset */
*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* CSS Variables */
:root {
    --primary: #0891B2;
    --primary-dark: #0E7490;
    --primary-light: #06B6D4;
    --dark: #0F172A;
    --light: #F8FAFC;
    --white: #FFFFFF;
    --gray-100: #F1F5F9;
    --gray-200: #E2E8F0;
    --gray-300: #CBD5E1;
    --gray-600: #475569;
    --gray-800: #1E293B;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --radius: 8px;
    --radius-lg: 16px;
    --transition: all 0.3s ease;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    color: var(--dark);
    background-color: var(--white);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
}

h1 { font-size: 3rem; }
h2 { font-size: 2.25rem; }
h3 { font-size: 1.5rem; }

p {
    margin-bottom: 1rem;
}

a {
    text-decoration: none;
    color: inherit;
}

img {
    max-width: 100%;
    height: auto;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Section Padding */
.section {
    padding: 80px 0;
}

/* Button Styles */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: var(--radius);
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    font-size: 1rem;
}

.btn-primary {
    background-color: var(--primary);
    color: var(--white);
}

.btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.btn-secondary {
    background-color: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
}

.btn-secondary:hover {
    background-color: var(--primary);
    color: var(--white);
}
```

**Step 3: Create JavaScript file with navigation**

```javascript
// Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
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
```

**Step 4: Test by opening index.html in browser**

Expected: Empty page with navigation bar visible

---

### Task 2: Navigation Bar Styling

**Files:**
- Modify: `css/styles.css`

**Step 1: Add navbar styles**

```css
/* Navbar */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--white);
    box-shadow: var(--shadow);
    z-index: 1000;
    padding: 15px 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    display: flex;
    align-items: center;
}

.logo-img {
    height: 40px;
    width: auto;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 30px;
    align-items: center;
}

.nav-link {
    font-weight: 500;
    color: var(--dark);
    transition: var(--transition);
}

.nav-link:hover {
    color: var(--primary);
}

.nav-cta {
    background-color: var(--primary);
    color: var(--white) !important;
    padding: 10px 20px;
    border-radius: var(--radius);
}

.nav-cta:hover {
    background-color: var(--primary-dark);
}

/* Mobile Navigation */
.nav-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
}

.hamburger {
    display: block;
    width: 25px;
    height: 3px;
    background-color: var(--dark);
    position: relative;
    transition: var(--transition);
}

.hamburger::before,
.hamburger::after {
    content: '';
    position: absolute;
    width: 25px;
    height: 3px;
    background-color: var(--dark);
    transition: var(--transition);
}

.hamburger::before {
    top: -8px;
}

.hamburger::after {
    top: 8px;
}

@media (max-width: 768px) {
    .nav-toggle {
        display: block;
    }

    .nav-menu {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background-color: var(--white);
        flex-direction: column;
        padding: 20px;
        gap: 15px;
        box-shadow: var(--shadow);
        transform: translateY(-150%);
        transition: var(--transition);
    }

    .nav-menu.active {
        transform: translateY(0);
    }

    .nav-cta {
        width: 100%;
        text-align: center;
    }
}
```

**Step 2: Test navigation**

Expected: Responsive navbar with hamburger menu on mobile

---

### Task 3: Hero Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add hero HTML**

```html
<section id="home" class="hero">
    <div class="hero-overlay"></div>
    <div class="hero-content">
        <h1>Free 10 Days Call Center Training</h1>
        <p>Start your career in BPO with comprehensive training from industry experts</p>
        <a href="#register" class="btn btn-primary btn-lg">Join Now</a>
    </div>
</section>
```

**Step 2: Add hero CSS**

```css
/* Hero Section */
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-image: url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding-top: 80px;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(14, 116, 144, 0.85));
}

.hero-content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    padding: 0 20px;
    color: var(--white);
}

.hero h1 {
    font-size: 3.5rem;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero p {
    font-size: 1.25rem;
    margin-bottom: 30px;
    opacity: 0.95;
}

.btn-lg {
    padding: 16px 32px;
    font-size: 1.125rem;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.25rem;
    }

    .hero p {
        font-size: 1rem;
    }
}
```

**Step 3: Test hero section**

Expected: Full-screen hero with background image, overlay, and centered content

---

### Task 4: What We Teach Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add section HTML**

```html
<section id="what-we-teach" class="section what-we-teach">
    <div class="container">
        <h2 class="section-title">What We Teach?</h2>
        <p class="section-subtitle">Comprehensive training to prepare you for a successful BPO career</p>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <h3>Being Professional</h3>
                <p>Learn workplace etiquette, professional communication, and how to present yourself in a corporate environment.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <h3>Know the Standards</h3>
                <p>Understand BPO industry standards, metrics, and quality assurance requirements.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <h3>Production Floor</h3>
                <p>Experience real call center operations and learn how to work effectively in a production environment.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                </div>
                <h3>Mock Calling</h3>
                <p>Practice real call scenarios with feedback to build confidence and improve your communication skills.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
                <h3>Brainstorming</h3>
                <p>Develop problem-solving skills and learn to think on your feet during challenging call situations.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <h3>Team Collaboration</h3>
                <p>Learn to work effectively with teams and understand the importance of collaboration in BPO.</p>
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* Section Titles */
.section-title {
    text-align: center;
    margin-bottom: 15px;
    color: var(--dark);
}

.section-subtitle {
    text-align: center;
    color: var(--gray-600);
    margin-bottom: 50px;
    font-size: 1.125rem;
}

/* Features Grid */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.feature-card {
    background-color: var(--white);
    padding: 30px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    text-align: center;
    transition: var(--transition);
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.feature-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: var(--white);
}

.feature-card h3 {
    margin-bottom: 15px;
    color: var(--dark);
}

.feature-card p {
    color: var(--gray-600);
    margin-bottom: 0;
}
```

**Step 3: Test section**

Expected: 6 feature cards in a responsive grid

---

### Task 5: What to Expect Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add section HTML**

```html
<section id="what-to-expect" class="section what-to-expect bg-light">
    <div class="container">
        <div class="expect-content">
            <div class="expect-text">
                <h2>What to Expect?</h2>
                <p class="expect-intro">Our training program is designed to transform you into a confident, skilled BPO professional.</p>
                
                <ul class="expect-list">
                    <li>
                        <span class="check-icon">✓</span>
                        <span>Learn how to pass different sets of assessment and interview</span>
                    </li>
                    <li>
                        <span class="check-icon">✓</span>
                        <span>Immerse in an English-speaking environment inside our facility</span>
                    </li>
                    <li>
                        <span class="check-icon">✓</span>
                        <span>Build confidence in your English communication skills</span>
                    </li>
                    <li>
                        <span class="check-icon">✓</span>
                        <span>By the end of training, expect a transformed, career-ready you</span>
                    </li>
                    <li>
                        <span class="check-icon">✓</span>
                        <span>Direct endorsement to Sutherland after completing the 10-day training</span>
                    </li>
                </ul>
            </div>
            <div class="expect-image">
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600" alt="Training Session">
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* What to Expect */
.bg-light {
    background-color: var(--gray-100);
}

.expect-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
}

.expect-text h2 {
    margin-bottom: 20px;
}

.expect-intro {
    font-size: 1.125rem;
    color: var(--gray-600);
    margin-bottom: 30px;
}

.expect-list {
    list-style: none;
}

.expect-list li {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
    font-size: 1.05rem;
}

.check-icon {
    width: 24px;
    height: 24px;
    background-color: var(--primary);
    color: var(--white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 700;
    flex-shrink: 0;
}

.expect-image img {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    height: auto;
}

@media (max-width: 768px) {
    .expect-content {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .expect-image {
        order: -1;
    }
}
```

**Step 3: Test section**

Expected: Two-column layout with text on left, image on right

---

### Task 6: Meet Our Team Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add section HTML**

```html
<section id="team" class="section team">
    <div class="container">
        <h2 class="section-title">Meet Our Team</h2>
        <p class="section-subtitle">Experienced professionals dedicated to your success</p>
        
        <div class="team-grid">
            <div class="team-card">
                <div class="team-image">
                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400" alt="Suman Kunder">
                </div>
                <h3>Suman Kunder</h3>
                <p class="team-role">Lead Trainer</p>
            </div>

            <div class="team-card">
                <div class="team-image">
                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400" alt="Mariz Garcia">
                </div>
                <h3>Mariz Garcia</h3>
                <p class="team-role">Training Specialist</p>
            </div>

            <div class="team-card">
                <div class="team-image">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400" alt="Jela Coloma">
                </div>
                <h3>Jela Coloma</h3>
                <p class="team-role">Communication Coach</p>
            </div>

            <div class="team-card">
                <div class="team-image">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" alt="Mariz Garcia">
                </div>
                <h3>Mariz Garcia</h3>
                <p class="team-role">BPO Specialist</p>
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* Team Section */
.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
}

.team-card {
    text-align: center;
    padding: 30px 20px;
    background-color: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.team-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.team-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 20px;
    border: 4px solid var(--primary-light);
}

.team-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.team-card h3 {
    margin-bottom: 5px;
    color: var(--dark);
}

.team-role {
    color: var(--primary);
    font-weight: 500;
}
```

**Step 3: Test section**

Expected: 4 team member cards with circular images

---

### Task 7: FAQ Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`

**Step 1: Add FAQ HTML**

```html
<section id="faq" class="section faq">
    <div class="container">
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-subtitle">Everything you need to know about our training program</p>
        
        <div class="faq-list">
            <div class="faq-item">
                <button class="faq-question">
                    <span>How long is the training?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>The training program runs for 10 days. It's an intensive program designed to equip you with all the skills needed to succeed in the BPO industry.</p>
                </div>
            </div>

            <div class="faq-item">
                <button class="faq-question">
                    <span>What is the training schedule?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>Training is typically from 9:00 AM to 5:00 PM. We ensure you get comprehensive training within these hours.</p>
                </div>
            </div>

            <div class="faq-item">
                <button class="faq-question">
                    <span>What are the benefits?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>The training provides benefits to your skills and learning, helping you improve yourself professionally. Additionally, free lunch and water are provided every day during the training period.</p>
                </div>
            </div>

            <div class="faq-item">
                <button class="faq-question">
                    <span>What to bring during the training?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>Please bring the following items:</p>
                    <ul>
                        <li>Pen</li>
                        <li>Notebook</li>
                        <li>Nametag</li>
                        <li>Tumbler</li>
                    </ul>
                </div>
            </div>

            <div class="faq-item">
                <button class="faq-question">
                    <span>What are the requirements to join?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>It is recommended that you take the assessment at Sutherland first. This allows our trainers to get your SHL results so they know what areas to focus on during your training.</p>
                </div>
            </div>

            <div class="faq-item">
                <button class="faq-question">
                    <span>Can I invite someone?</span>
                    <span class="faq-icon">+</span>
                </button>
                <div class="faq-answer">
                    <p>Yes, you can! We just need a printed copy of their high school or college diploma for documentation purposes.</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add FAQ CSS**

```css
/* FAQ Section */
.faq-list {
    max-width: 800px;
    margin: 0 auto;
}

.faq-item {
    background-color: var(--white);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    margin-bottom: 15px;
    overflow: hidden;
}

.faq-question {
    width: 100%;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--dark);
    text-align: left;
    font-family: inherit;
}

.faq-question:hover {
    color: var(--primary);
}

.faq-icon {
    font-size: 1.5rem;
    font-weight: 300;
    transition: var(--transition);
    color: var(--primary);
}

.faq-item.active .faq-icon {
    transform: rotate(45deg);
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.faq-item.active .faq-answer {
    max-height: 500px;
}

.faq-answer p,
.faq-answer ul {
    padding: 0 20px 20px;
    color: var(--gray-600);
    line-height: 1.8;
}

.faq-answer ul {
    padding-left: 40px;
}

.faq-answer li {
    margin-bottom: 8px;
}
```

**Step 3: Add FAQ JavaScript**

```javascript
// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});
```

**Step 4: Test FAQ**

Expected: Accordion-style FAQ with smooth expand/collapse

---

### Task 8: History Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add history HTML**

```html
<section id="history" class="section history">
    <div class="container">
        <div class="history-content">
            <div class="history-text">
                <h2>From Classroom to Career</h2>
                <p class="history-subtitle">The Story of Palayan City's Free Call Center Training Program</p>
                
                <p>Palayan City's journey toward becoming an emerging Business Process Outsourcing (BPO) talent hub began with a simple yet powerful vision—to create opportunities for its people through education, skills development, and employment.</p>
                
                <p>The foundation was laid in <strong>2013</strong> during the administration of <strong>Mayor Adrianne Mae Cuevas</strong>, when the <strong>Palayan City Institute of Technology (PCIT)</strong> expanded its free technical and vocational education through TESDA scholarship programs.</p>
                
                <p>On <strong>January 20, 2014</strong>, PCIT officially launched its <strong>Call Center Training Wave 5</strong>, marking one of the earliest documented free call center training programs in Palayan City.</p>
                
                <p>Today, under the leadership of <strong>Mayor Viandrei Nicole J. Cuevas</strong>, the city's commitment to workforce development continues to grow through partnerships with industry leaders like <strong>PRHInc.</strong></p>
                
                <div class="history-quote">
                    <blockquote>"Opportunity creates confidence. Confidence creates success. And success begins with one chance to learn."</blockquote>
                </div>
                
                <a href="#register" class="btn btn-primary">Be Part of the History</a>
            </div>
            <div class="history-image">
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600" alt="Training Session">
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* History Section */
.history-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
}

.history-text h2 {
    margin-bottom: 10px;
}

.history-subtitle {
    font-size: 1.25rem;
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 30px;
}

.history-text p {
    color: var(--gray-600);
    margin-bottom: 20px;
}

.history-quote {
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    padding: 30px;
    border-radius: var(--radius-lg);
    margin: 30px 0;
}

.history-quote blockquote {
    color: var(--white);
    font-size: 1.25rem;
    font-style: italic;
    text-align: center;
    line-height: 1.6;
}

.history-image img {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    height: auto;
}

@media (max-width: 768px) {
    .history-content {
        grid-template-columns: 1fr;
        gap: 40px;
    }
}
```

**Step 3: Test history section**

Expected: Two-column layout with story text and image

---

### Task 9: Inspired Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add inspired HTML**

```html
<section id="inspired" class="section inspired bg-light">
    <div class="container">
        <h2 class="section-title">Be Inspired with Our Success Stories</h2>
        <p class="section-subtitle">Real stories from real people who transformed their careers</p>
        
        <div class="success-grid">
            <div class="success-card">
                <div class="success-image">
                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400" alt="Veronica Ortiz">
                </div>
                <div class="success-content">
                    <h3>Veronica Ortiz</h3>
                    <p class="success-location">from Cabanatuan</p>
                    <p class="success-story">"PRHInc. changed my life. I never thought I could work in a call center, but after the 10-day training, I gained the confidence and skills I needed. Now I'm proudly part of Sutherland!"</p>
                </div>
            </div>

            <div class="success-card">
                <div class="success-image">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" alt="Success Story">
                </div>
                <div class="success-content">
                    <h3>Your Story Here</h3>
                    <p class="success-location">from Palayan City</p>
                    <p class="success-story">Complete the training and become our next success story. Share your journey from training to career with PRHInc.!</p>
                </div>
            </div>
        </div>

        <div class="share-story">
            <h3>Share Your PRHInc. to Sutherland Story</h3>
            <p>Have you completed our training and landed a job? We'd love to hear from you!</p>
            <a href="#" class="btn btn-secondary">Share Your Story</a>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* Inspired Section */
.success-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
    margin-bottom: 50px;
}

.success-card {
    background-color: var(--white);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.success-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.success-image {
    height: 250px;
    overflow: hidden;
}

.success-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition);
}

.success-card:hover .success-image img {
    transform: scale(1.05);
}

.success-content {
    padding: 25px;
}

.success-content h3 {
    margin-bottom: 5px;
    color: var(--dark);
}

.success-location {
    color: var(--primary);
    font-weight: 500;
    margin-bottom: 15px;
}

.success-story {
    color: var(--gray-600);
    font-style: italic;
    margin-bottom: 0;
}

.share-story {
    text-align: center;
    padding: 40px;
    background-color: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
}

.share-story h3 {
    margin-bottom: 15px;
    color: var(--dark);
}

.share-story p {
    color: var(--gray-600);
    margin-bottom: 25px;
}
```

**Step 3: Test section**

Expected: Success story cards with images and testimonial text

---

### Task 10: Registration Section

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`

**Step 1: Add registration HTML**

```html
<section id="register" class="section register">
    <div class="container">
        <div class="register-content">
            <div class="register-info">
                <h2>Register Now</h2>
                <p class="register-subtitle">Start your journey to a rewarding BPO career</p>
                
                <div class="register-benefits">
                    <div class="benefit-item">
                        <span class="benefit-icon">✓</span>
                        <span>100% Free Training</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">✓</span>
                        <span>Free Lunch & Water Daily</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">✓</span>
                        <span>Industry Expert Trainers</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">✓</span>
                        <span>Direct Endorsement to Sutherland</span>
                    </div>
                </div>
            </div>
            
            <div class="register-form-container">
                <form class="register-form" id="registrationForm">
                    <div class="form-group">
                        <label for="fullName">Full Name *</label>
                        <input type="text" id="fullName" name="fullName" required placeholder="Enter your full name">
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required placeholder="Enter your email">
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
                    </div>
                    
                    <div class="form-group">
                        <label for="address">Address *</label>
                        <textarea id="address" name="address" rows="3" required placeholder="Enter your complete address"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="education">Educational Attainment *</label>
                        <select id="education" name="education" required>
                            <option value="">Select your education level</option>
                            <option value="highschool">High School</option>
                            <option value="senior-high">Senior High School</option>
                            <option value="college">College</option>
                            <option value="graduate">Graduate</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">Register Now</button>
                    
                    <p class="form-note">Note: This is a demo form. Your registration will be reviewed by our team.</p>
                </form>
            </div>
        </div>
    </div>
</section>
```

**Step 2: Add CSS styles**

```css
/* Register Section */
.register-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: start;
}

.register-info h2 {
    margin-bottom: 10px;
}

.register-subtitle {
    font-size: 1.125rem;
    color: var(--gray-600);
    margin-bottom: 30px;
}

.register-benefits {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.benefit-item {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 1.05rem;
}

.benefit-icon {
    width: 24px;
    height: 24px;
    background-color: var(--primary);
    color: var(--white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 700;
}

.register-form-container {
    background-color: var(--white);
    padding: 40px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}

.register-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: 600;
    color: var(--dark);
}

.form-group input,
.form-group textarea,
.form-group select {
    padding: 12px 16px;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius);
    font-size: 1rem;
    font-family: inherit;
    transition: var(--transition);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
    color: var(--gray-300);
}

.btn-block {
    width: 100%;
    padding: 16px;
    font-size: 1.125rem;
}

.form-note {
    text-align: center;
    color: var(--gray-600);
    font-size: 0.875rem;
    margin-top: 10px;
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .register-content {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .register-form-container {
        padding: 25px;
    }
}
```

**Step 3: Add form JavaScript**

```javascript
// Form Validation
const form = document.getElementById('registrationForm');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Simple validation
        let isValid = true;
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'education'];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                isValid = false;
                // Add error styling
                const input = form.querySelector(`[name="${field}"]`);
                input.style.borderColor = '#ef4444';
            } else {
                // Remove error styling
                const input = form.querySelector(`[name="${field}"]`);
                input.style.borderColor = '#e2e8f0';
            }
        });
        
        if (isValid) {
            // Show success message
            alert('Thank you for your registration! We will contact you soon.');
            form.reset();
        } else {
            alert('Please fill in all required fields.');
        }
    });
}
```

**Step 4: Test registration form**

Expected: Two-column layout with form on right, benefits on left

---

### Task 11: Footer

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add footer HTML**

```html
<footer class="footer">
    <div class="footer-container">
        <div class="footer-content">
            <div class="footer-brand">
                <img src="images/prhinclogo.png" alt="PRHInc Logo" class="footer-logo">
                <p>Empowering Palayanos through free call center training and BPO career opportunities.</p>
            </div>
            
            <div class="footer-links">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#faq">FAQ</a></li>
                    <li><a href="#history">History</a></li>
                    <li><a href="#inspired">Inspired</a></li>
                    <li><a href="#register">Register</a></li>
                </ul>
            </div>
            
            <div class="footer-contact">
                <h4>Contact Us</h4>
                <p>Palayan City Institute of Technology</p>
                <p>Palayan City, Nueva Ecija</p>
                <p>Email: info@prhinc.com</p>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2026 PRHInc. All rights reserved.</p>
        </div>
    </div>
</footer>
```

**Step 2: Add CSS styles**

```css
/* Footer */
.footer {
    background-color: var(--dark);
    color: var(--white);
    padding: 60px 0 20px;
}

.footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
}

.footer-logo {
    height: 50px;
    margin-bottom: 20px;
}

.footer-brand p {
    color: var(--gray-300);
    max-width: 300px;
}

.footer-links h4,
.footer-contact h4 {
    margin-bottom: 20px;
    font-size: 1.125rem;
}

.footer-links ul {
    list-style: none;
}

.footer-links li {
    margin-bottom: 12px;
}

.footer-links a {
    color: var(--gray-300);
    transition: var(--transition);
}

.footer-links a:hover {
    color: var(--primary-light);
}

.footer-contact p {
    color: var(--gray-300);
    margin-bottom: 8px;
}

.footer-bottom {
    border-top: 1px solid var(--gray-800);
    padding-top: 20px;
    text-align: center;
}

.footer-bottom p {
    color: var(--gray-600);
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .footer-brand p {
        max-width: 100%;
    }
}
```

**Step 3: Test footer**

Expected: Dark footer with three columns

---

### Task 12: Animations & Polish

**Files:**
- Modify: `css/styles.css`
- Modify: `js/main.js`

**Step 1: Add scroll animations CSS**

```css
/* Animations */
.fade-in {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in.visible {
    opacity: 1;
    transform: translateY(0);
}

.slide-in-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.slide-in-left.visible {
    opacity: 1;
    transform: translateX(0);
}

.slide-in-right {
    opacity: 0;
    transform: translateX(50px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.slide-in-right.visible {
    opacity: 1;
    transform: translateX(0);
}
```

**Step 2: Add scroll animation JavaScript**

```javascript
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
```

**Step 3: Add smooth scroll for navigation**

```javascript
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
```

**Step 4: Add active link CSS**

```css
.nav-link.active {
    color: var(--primary);
}

.nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--primary);
}
```

**Step 5: Test animations**

Expected: Smooth fade-in animations as you scroll

---

### Task 13: Final Testing & Optimization

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Step 1: Add meta tags for SEO**

```html
<meta name="description" content="PRHInc offers free 10-day call center training in Palayan City. Start your BPO career with industry experts. Direct endorsement to Sutherland.">
<meta name="keywords" content="call center training, BPO training, free training, Palayan City, Sutherland, PRHInc">
<meta name="author" content="PRHInc">
```

**Step 2: Add Open Graph tags**

```html
<meta property="og:title" content="PRHInc - Free Call Center Training">
<meta property="og:description" content="Start your BPO career with our free 10-day call center training program.">
<meta property="og:image" content="images/prhinclogo.png">
<meta property="og:url" content="https://prhinc.com">
```

**Step 3: Optimize images**

- Ensure all images have alt text
- Consider lazy loading for below-fold images

**Step 4: Test responsiveness**

- Test on desktop, tablet, and mobile
- Check all navigation links work
- Verify form validation works
- Test FAQ accordion

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete PRHInc website with all sections and animations"
```
