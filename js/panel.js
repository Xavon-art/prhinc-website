// Panel JavaScript

// State
let appData = null;
let currentRegistration = null;
let currentClassId = null;

// Check authentication
if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'manage.html';
}

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminEmail').textContent = 'juliusmatro01@gmail.com';
    setupEventListeners();
    loadData();
    startRealtimePolling();
});

let lastUpdateTime = null;
let pollingInterval = null;

function startRealtimePolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        const anyModalOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
        if (anyModalOpen) return;
        await loadData();
        lastUpdateTime = Date.now();
        updateLastUpdated();
    }, 10000);
}

function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    if (!lastUpdateTime) { el.textContent = ''; return; }
    const d = new Date(lastUpdateTime);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    el.textContent = `Updated ${h}:${m}:${s}`;
}

// Event Listeners
function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'manage.html';
    });
    
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
    
    // Delete class
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

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    navItems.forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}Section`).classList.add('active');
    
    document.getElementById('pageTitle').textContent = e.currentTarget.querySelector('span').textContent;
    
    sidebar.classList.remove('active');
}

// Data Operations
async function loadData() {
    try {
        const registrations = await tursoSelect('SELECT * FROM registrations ORDER BY registration_date DESC');
        const classes = await tursoSelect('SELECT * FROM classes ORDER BY created_at DESC');
        const trainers = await tursoSelect('SELECT * FROM trainers');
        const emails = await tursoSelect('SELECT * FROM emails ORDER BY sent_at DESC');
        const messages = await tursoSelect('SELECT * FROM messages ORDER BY sent_at DESC');

        appData = {
            registrations: registrations.map(r => ({
                id: r.id,
                name: r.name,
                email: r.email,
                phone: r.phone,
                address: r.address,
                education: r.education,
                registrationDate: r.registration_date,
                status: r.status
            })),
            classes: classes.map(c => ({
                id: c.id,
                name: c.name,
                startDate: c.start_date,
                endDate: c.end_date,
                trainer: c.trainer,
                trainees: JSON.parse(c.trainees || '[]'),
                createdAt: c.created_at
            })),
            trainers: trainers.map(t => ({ name: t.name, email: t.email })),
            emails: emails.map(e => ({
                id: e.id,
                to: e.recipient,
                toName: e.recipient_name,
                subject: e.subject,
                body: e.body,
                sentAt: e.sent_at
            })),
            messages: messages.map(m => ({
                id: m.id,
                to: m.recipient,
                toName: m.recipient_name,
                content: m.content,
                sentAt: m.sent_at
            }))
        };

        renderAll();
        lastUpdateTime = Date.now();
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading data:', error);
        appData = { registrations: [], classes: [], trainers: [], emails: [], messages: [] };
        renderAll();
    }
}

async function saveData() {
    try {
        const batches = [];

        for (const reg of appData.registrations) {
            batches.push({
                type: 'execute',
                stmt: {
                    sql: 'INSERT OR REPLACE INTO registrations (id, name, email, phone, address, education, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [reg.id, reg.name, reg.email, reg.phone, reg.address, reg.education, reg.registrationDate, reg.status]
                }
            });
        }

        for (const cls of appData.classes) {
            batches.push({
                type: 'execute',
                stmt: {
                    sql: 'INSERT OR REPLACE INTO classes (id, name, start_date, end_date, trainer, trainees, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [cls.id, cls.name, cls.startDate, cls.endDate, cls.trainer, JSON.stringify(cls.trainees), cls.createdAt]
                }
            });
        }

        for (const email of appData.emails) {
            batches.push({
                type: 'execute',
                stmt: {
                    sql: 'INSERT OR REPLACE INTO emails (id, recipient, recipient_name, subject, body, sent_at) VALUES (?, ?, ?, ?, ?, ?)',
                    args: [email.id, email.to, email.toName, email.subject, email.body, email.sentAt]
                }
            });
        }

        for (const msg of appData.messages) {
            batches.push({
                type: 'execute',
                stmt: {
                    sql: 'INSERT OR REPLACE INTO messages (id, recipient, recipient_name, content, sent_at) VALUES (?, ?, ?, ?, ?)',
                    args: [msg.id, msg.to, msg.toName, msg.content, msg.sentAt]
                }
            });
        }

        if (batches.length > 0) {
            await tursoBatch(batches);
        }
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
    if (typeof prhToast === 'function') prhToast(`Registration ${status} successfully`, 'success');
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
    if (typeof prhToast === 'function') prhToast('Class created successfully', 'success');
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
    
    viewClass(classId);
    renderClasses();
    if (typeof prhToast === 'function') prhToast('Trainee removed from class', 'success');
};

async function handleDeleteClass() {
    if (!currentClassId) return;
    
    var confirmed = await prhConfirm('Are you sure you want to delete this class? This action cannot be undone.', {
        title: 'Delete Class',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true
    });
    
    if (confirmed) {
        appData.classes = appData.classes.filter(c => c.id !== currentClassId);
        await saveData();
        renderClasses();
        closeModals();
        if (typeof prhToast === 'function') prhToast('Class deleted successfully', 'success');
    }
}

// Email Actions
async function handleSendEmail(e) {
    e.preventDefault();
    
    const recipientId = document.getElementById('recipient').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    
    if (!recipientId) {
        if (typeof prhToast === 'function') prhToast('Please select a recipient', 'error');
        return;
    }
    
    const recipient = appData.registrations.find(r => r.id === recipientId);
    
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
    if (typeof prhToast === 'function') prhToast('Email sent successfully', 'success');
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
    if (typeof prhToast === 'function') prhToast('Message sent successfully', 'success');
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
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
