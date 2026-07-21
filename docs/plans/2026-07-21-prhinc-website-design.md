# PRHInc Website Design Document

## Overview
PRHInc (Palayan Recruitment Hub Incorporated) website for promoting free 10-day call center training program. Inspired by hirebloom.com design but tailored for BPO training services.

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **No framework:** Static site, easy deployment
- **Hosting:** Any static host (GitHub Pages, Netlify, etc.)

## Design System

### Color Palette
- **Primary:** #0891B2 (Teal/Cyan)
- **Secondary:** #0E7490 (Darker Teal)
- **Accent:** #06B6D4 (Light Cyan)
- **Dark:** #0F172A (Slate Dark)
- **Light:** #F8FAFC (Slate Light)
- **White:** #FFFFFF

### Typography
- **Headings:** Inter or system fonts
- **Body:** Inter or system fonts
- **Weights:** 400 (body), 600 (semibold), 700 (bold)

### Components
- Rounded corners (8px-16px)
- Subtle shadows
- Smooth transitions
- Responsive grid

## Structure

### Single Page Application
All content in one HTML file with JavaScript-based navigation.

### Navigation
```
[PRHI Logo] | Home | FAQ | History | Inspired | Register
```
- Fixed/sticky navigation bar
- Logo on left, links on right
- Mobile hamburger menu

## Pages/Sections

### 1. Home Section
- **Hero:**
  - Background: Stock photo (call center/training)
  - Overlay: Semi-transparent dark
  - Heading: "Free 10 Days Call Center Training"
  - Subtext: Brief description
  - CTA Button: "Join Now" → scrolls to Register

- **What We Teach:**
  - Card grid (3-4 cards)
  - Items: Being Professional, Know the Standards, Production Floor, Mock Calling, Brainstorming
  - Icons + descriptions

- **What to Expect:**
  - Feature list with icons
  - Assessment preparation
  - English environment
  - Career transformation
  - Endorsement to Sutherland

- **Meet Our Team:**
  - Team member cards
  - Photo, name, role
  - Members: Suman Kunder, Mariz Garcia, Jela Coloma, Mariz Garcia

- **FAQ Preview:**
  - Accordion-style FAQ
  - 5 questions with answers
  - "See All FAQ" link → scrolls to FAQ section

### 2. FAQ Section
- Full accordion FAQ
- Questions:
  1. How long is the training?
  2. Training Schedule?
  3. What are the benefits?
  4. What to bring during training?
  5. Requirements to join?
  6. Can I invite?

### 3. History Section
- **Hero:** "From Classroom to Career"
- **Story:** Palayan City's BPO training journey
- **Timeline:** 2013 PCIT expansion → 2014 Call Center Training Wave 5 → Present
- **CTA:** "Be Part of the History" → Join Now

### 4. Inspired Section
- **Hero:** "Be Inspired with Our Success Stories"
- **Success Stories:**
  - Veronica Ortiz from Cabanatuan
  - Placeholder for more stories
- **Share Your Story:** Form/button to submit story

### 5. Register Section
- **Form Fields:**
  - Full Name (text)
  - Email Address (email)
  - Phone Number (tel)
  - Address (textarea)
  - Educational Attainment (select: High School, College, etc.)
- **Submit Button:** "Register Now"
- **Note:** Design only, no backend

### 6. Footer
- Logo
- Quick links (Home, FAQ, History, Inspired, Register)
- Contact info
- Social media placeholders
- Copyright

## Stock Images (Unsplash/Pexels)

### Hero Background
- https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920 (call center agents)

### What We Teach Icons
- Use CSS icons or SVG inline

### Team Photos
- Placeholder with initials or stock photos

### Success Stories
- https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400 (professional woman)
- https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400 (professional man)

### History Section
- https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200 (training/classroom)

## Responsive Design

### Breakpoints
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

### Mobile Considerations
- Hamburger menu
- Stack cards vertically
- Reduce padding/margins
- Full-width buttons

## Animations
- Scroll-triggered fade-ins
- Smooth scroll navigation
- Hover effects on cards/buttons
- FAQ accordion expand/collapse

## File Structure
```
PRHInc/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── images/
│   └── prhinclogo.png
└── docs/
    └── plans/
        └── 2026-07-21-prhinc-website-design.md
```
