// Admin Panel JavaScript
const SEAFILE_TOKEN = '049ba3c36e01e10997b45e41ecb30c6492e283de';
const SEAFILE_REPO_ID = '4185aea9-389a-4d7e-96ce-88eee187e0c7';
const SEAFILE_SERVER = 'https://cloud.seafile.com';
const DATA_FILE = '/data.json';

// Admin credentials
const ADMIN_EMAIL = 'juliusmatro01@gmail.com';
const ADMIN_PASSWORD = 'admintest123';

// Default data structure
const defaultData = {
    registrations: [],
    classes: [],
    trainers: [
        { name: 'Mariz Garcia', email: 'mariz.garcia@prhinc.com' },
        { name: 'Suman Kunder', email: 'suman.kunder@prhinc.com' },
        { name: 'Jela Coloma', email: 'jela.coloma@prhinc.com' },
        { name: 'Christine Azarcon', email: 'christine.azarcon@prhinc.com' }
    ]
};

// State
let appData = null;
let currentRegistration = null;
let currentClassId = null;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Authentication
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showDashboard();
    }
}

function showDashboard() {
    loginPage.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.getElementById('adminEmail').textContent = ADMIN_EMAIL;
    loadData();
}

function showLogin() {
    loginPage.classList.remove('hidden');
    dashboard.classList.add('hidden');
    sessionStorage.removeItem('adminLoggedIn');
}

// Event Listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', showLogin);
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Mobile menu
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Create class
    document.getElementById('createClassBtn').addEventListener('click', openCreateClassModal);
    
    // Create class form
    document.getElementById('createClassForm').addEventListener('submit', handleCreateClass);
    
    // View class
    document.getElementById('deleteClassBtn').addEventListener('click', handleDeleteClass);
    
    // Email form
    document.getElementById('emailForm').addEventListener('submit', handleSendEmail);
    
    // Message form
    document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
    
    // Registration actions
    document.getElementById('acceptBtn').addEventListener('click', () => updateRegistrationStatus('accepted'));
    document.getElementById('rejectBtn').addEventListener('click', () => updateRegistrationStatus('rejected'));
    document.getElementById('sendMessageBtn').addEventListener('click', openMessageBox);
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', renderRegistrations);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModals();
        });
    });
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('Login attempt:', { email, password });
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        loginError.textContent = '';
        alert('Login successful!');
        showDashboard();
    } else {
        loginError.textContent = 'Invalid email or password';
        alert('Invalid credentials!\nYou entered: ' + email + ' / ' + password);
    }
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    navItems.forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}Section`).classList.add('active');
    
    document.getElementById('pageTitle').textContent = e.currentTarget.querySelector('span').textContent;
    
    // Close mobile menu
    sidebar.classList.remove('active');
}

// Data Operations
async function loadData() {
    try {
        const response = await fetch(
            `${SEAFILE_SERVER}/api2/repos/${SEAFILE_REPO_ID}/file/?p=${DATA_FILE}`,
            { headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` } }
        );
        
        if (response.ok) {
            const content = await response.text();
            appData = JSON.parse(content);
        } else {
            appData = { ...defaultData };
            await saveData();
        }
        
        renderAll();
    } catch (error) {
        console.error('Error loading data:', error);
        appData = { ...defaultData };
        renderAll();
    }
}

async function saveData() {
    try {
        // Get upload link
        const linkResponse = await fetch(
            `${SEAFILE_SERVER}/api2/repos/${SEAFILE_REPO_ID}/upload-link/`,
            { headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` } }
        );
        const uploadLink = await linkResponse.json();
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' }), 'data.json');
        formData.append('parent_dir', '/');
        formData.append('replace', '1');
        
        // Upload
        await fetch(uploadLink, {
            method: 'POST',
            headers: { 'Authorization': `Token ${SEAFILE_TOKEN}` },
            body: formData
        });
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Render Functions
function renderAll() {
    renderRegistrations();
    renderClasses();
    renderTrainers();
    renderRecipientDropdown();
}

function renderRegistrations() {
    const filter = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('registrationsTable');
    const noData = document.getElementById('noRegistrations');
    
    let filtered = appData.registrations;
    if (filter !== 'all') {
        filtered = filtered.filter(r => r.status === filter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }
    
    noData.style.display = 'none';
    tbody.innerHTML = filtered.map(reg => `
        <tr>
            <td>${escapeHtml(reg.name)}</td>
            <td>${escapeHtml(reg.email)}</td>
            <td>${escapeHtml(reg.phone)}</td>
            <td>${escapeHtml(reg.address)}</td>
            <td>${escapeHtml(reg.education)}</td>
            <td>${formatDate(reg.registrationDate)}</td>
            <td><span class="status-badge status-${reg.status}">${reg.status}</span></td>
            <td>
                <button class="btn-primary btn-small" onclick="viewRegistration('${reg.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderClasses() {
    const container = document.getElementById('classesList');
    const noData = document.getElementById('noClasses');
    
    if (appData.classes.length === 0) {
        container.innerHTML = '';
        noData.style.display = 'block';
        return;
    }
    
    noData.style.display = 'none';
    container.innerHTML = appData.classes.map(cls => `
        <div class="class-card" onclick="viewClass('${cls.id}')">
            <h3>${escapeHtml(cls.name)}</h3>
            <p><i class="fas fa-user"></i> ${escapeHtml(cls.trainer)}</p>
            <p><i class="fas fa-calendar"></i> ${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}</p>
            <div class="trainee-count">
                <i class="fas fa-users"></i> ${cls.trainees.length} Trainees
            </div>
        </div>
    `).join('');
}

function renderTrainers() {
    const container = document.getElementById('trainersList');
    container.innerHTML = appData.trainers.map(trainer => `
        <div class="trainer-card">
            <div class="trainer-avatar">${getInitials(trainer.name)}</div>
            <h3>${escapeHtml(trainer.name)}</h3>
            <p>${escapeHtml(trainer.email)}</p>
        </div>
    `).join('');
}

function renderRecipientDropdown() {
    const select = document.getElementById('recipient');
    select.innerHTML = '<option value="">Select a recipient</option>';
    
    appData.registrations.forEach(reg => {
        select.innerHTML += `<option value="${reg.id}">${escapeHtml(reg.name)} (${escapeHtml(reg.email)})</option>`;
    });
}

function renderTraineeCheckboxes() {
    const container = document.getElementById('traineeCheckboxes');
    const accepted = appData.registrations.filter(r => r.status === 'accepted');
    
    if (accepted.length === 0) {
        container.innerHTML = '<p>No accepted trainees available</p>';
        return;
    }
    
    container.innerHTML = accepted.map(reg => `
        <div class="checkbox-item">
            <input type="checkbox" id="trainee-${reg.id}" value="${reg.id}">
            <label for="trainee-${reg.id}">${escapeHtml(reg.name)} (${escapeHtml(reg.email)})</label>
        </div>
    `).join('');
}

// Registration Actions
window.viewRegistration = function(id) {
    currentRegistration = appData.registrations.find(r => r.id === id);
    if (!currentRegistration) return;
    
    const details = document.getElementById('registrationDetails');
    details.innerHTML = `
        <div class="detail-group">
            <span class="detail-label">Name</span>
            <span class="detail-value">${escapeHtml(currentRegistration.name)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Email</span>
            <span class="detail-value">${escapeHtml(currentRegistration.email)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Phone</span>
            <span class="detail-value">${escapeHtml(currentRegistration.phone)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Address</span>
            <span class="detail-value">${escapeHtml(currentRegistration.address)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Education</span>
            <span class="detail-value">${escapeHtml(currentRegistration.education)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Registration Date</span>
            <span class="detail-value">${formatDate(currentRegistration.registrationDate)}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge status-${currentRegistration.status}">${currentRegistration.status}</span></span>
        </div>
    `;
    
    document.getElementById('registrationModal').classList.remove('hidden');
};

async function updateRegistrationStatus(status) {
    if (!currentRegistration) return;
    
    currentRegistration.status = status;
    await saveData();
    renderRegistrations();
    closeModals();
    showToast(`Registration ${status} successfully`);
}

// Class Actions
function openCreateClassModal() {
    renderTraineeCheckboxes();
    
    const trainerSelect = document.getElementById('classTrainer');
    trainerSelect.innerHTML = '<option value="">Select a trainer</option>';
    appData.trainers.forEach(trainer => {
        trainerSelect.innerHTML += `<option value="${trainer.name}">${escapeHtml(trainer.name)}</option>`;
    });
    
    document.getElementById('createClassModal').classList.remove('hidden');
}

async function handleCreateClass(e) {
    e.preventDefault();
    
    const name = document.getElementById('className').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const trainer = document.getElementById('classTrainer').value;
    
    const checkboxes = document.querySelectorAll('#traineeCheckboxes input:checked');
    const trainees = Array.from(checkboxes).map(cb => {
        const reg = appData.registrations.find(r => r.id === cb.value);
        return {
            id: reg.id,
            name: reg.name,
            email: reg.email,
            phone: reg.phone,
            registrationDate: reg.registrationDate
        };
    });
    
    const newClass = {
        id: generateId(),
        name,
        startDate,
        endDate,
        trainer,
        trainees,
        createdAt: new Date().toISOString()
    };
    
    appData.classes.push(newClass);
    await saveData();
    renderClasses();
    closeModals();
    document.getElementById('createClassForm').reset();
    showToast('Class created successfully');
}

window.viewClass = function(id) {
    currentClassId = id;
    const cls = appData.classes.find(c => c.id === id);
    if (!cls) return;
    
    document.getElementById('viewClassName').textContent = cls.name;
    document.getElementById('viewClassTrainer').textContent = cls.trainer;
    document.getElementById('viewClassDuration').textContent = `${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}`;
    document.getElementById('viewClassEndDate').textContent = formatDate(cls.endDate);
    
    const tbody = document.getElementById('viewClassTrainees');
    tbody.innerHTML = cls.trainees.map(t => `
        <tr>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(t.email)}</td>
            <td>${escapeHtml(t.phone)}</td>
            <td>${formatDate(t.registrationDate)}</td>
            <td>
                <button class="btn-danger btn-small" onclick="removeTraineeFromClass('${cls.id}', '${t.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('viewClassModal').classList.remove('hidden');
};

window.removeTraineeFromClass = async function(classId, traineeId) {
    const cls = appData.classes.find(c => c.id === classId);
    if (!cls) return;
    
    cls.trainees = cls.trainees.filter(t => t.id !== traineeId);
    await saveData();
    
    // Re-render the modal
    viewClass(classId);
    renderClasses();
    showToast('Trainee removed from class');
};

async function handleDeleteClass() {
    if (!currentClassId) return;
    
    if (confirm('Are you sure you want to delete this class?')) {
        appData.classes = appData.classes.filter(c => c.id !== currentClassId);
        await saveData();
        renderClasses();
        closeModals();
        showToast('Class deleted successfully');
    }
}

// Email Actions
async function handleSendEmail(e) {
    e.preventDefault();
    
    const recipientId = document.getElementById('recipient').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    
    if (!recipientId) {
        showToast('Please select a recipient', 'error');
        return;
    }
    
    const recipient = appData.registrations.find(r => r.id === recipientId);
    
    // In a real app, this would send an actual email
    // For now, we'll log it and show a success message
    console.log('Email sent:', {
        to: recipient.email,
        subject,
        body
    });
    
    // Store email in data
    if (!appData.emails) appData.emails = [];
    appData.emails.push({
        id: generateId(),
        to: recipient.email,
        toName: recipient.name,
        subject,
        body,
        sentAt: new Date().toISOString()
    });
    
    await saveData();
    document.getElementById('emailForm').reset();
    showToast('Email sent successfully');
}

// Message Actions
function openMessageBox() {
    if (!currentRegistration) return;
    
    document.getElementById('messageRecipient').value = `${currentRegistration.name} (${currentRegistration.email})`;
    document.getElementById('messageBoxModal').classList.remove('hidden');
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const content = document.getElementById('messageContent').value;
    
    // Store message
    if (!appData.messages) appData.messages = [];
    appData.messages.push({
        id: generateId(),
        to: currentRegistration.email,
        toName: currentRegistration.name,
        content,
        sentAt: new Date().toISOString()
    });
    
    await saveData();
    document.getElementById('messageForm').reset();
    closeModals();
    showToast('Message sent successfully');
}

// Utility Functions
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.querySelector('.toast-icon');
    
    toastMessage.textContent = message;
    toastIcon.className = `toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
    toastIcon.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Expose functions to global scope
window.viewRegistration = viewRegistration;
window.viewClass = viewClass;
window.removeTraineeFromClass = removeTraineeFromClass;
