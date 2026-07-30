(function () {
    const API = '/api';
    let currentUser = null;
    let currentSection = 'registrations';
    let cachedRegistrations = [];
    let cachedUsers = [];
    let currentTrashType = 'registrations';
    let confirmCallback = null;

    const user = (() => {
        try { return JSON.parse(sessionStorage.getItem('prhinc_user')); } catch { return null; }
    })();

    if (!user) {
        window.location.href = '/manage';
        return;
    }
    currentUser = user;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('currentUserDisplay').textContent = user.username;
        if (user.role !== 'admin') {
            document.querySelectorAll('[data-section="users"], [data-section="trash"]').forEach(el => el.style.display = 'none');
        }
        initNavigation();
        initLogout();
        initRegistrations();
        initClasses();
        initTrainers();
        initUsers();
        initTrash();
        initEmails();
        initConfirmModal();
        loadSection('registrations');
    });

    function initNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) loadSection(section);
            });
        });
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    function loadSection(section) {
        currentSection = section;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(section + 'Section');
        if (el) el.classList.add('active');
        document.getElementById('pageTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);

        if (section === 'registrations') loadRegistrations();
        else if (section === 'users') loadUsers();
        else if (section === 'trash') loadTrash(currentTrashType);
        else if (section === 'classes') loadClasses();
        else if (section === 'trainers') loadTrainers();
    }

    function initLogout() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('prhinc_user');
            window.location.href = '/manage';
        });
    }

    async function apiPost(endpoint, data) {
        const res = await fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }

    async function apiGet(endpoint) {
        const res = await fetch(API + endpoint);
        return res.json();
    }

    // ---------- TOAST ----------
    function showToast(msg, type) {
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast toast-${type}"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}</div>`;
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 3500);
    }

    // ---------- CONFIRM MODAL ----------
    function initConfirmModal() {
        const modal = document.getElementById('confirmModal');
        const input = document.getElementById('confirmInput');
        const btn = document.getElementById('confirmDeleteBtn');
        const error = document.getElementById('confirmError');
        const closeBtns = modal.querySelectorAll('.modal-close');

        input.addEventListener('input', () => {
            const match = input.value.trim() === 'delete';
            btn.disabled = !match;
            error.style.display = match ? 'none' : 'block';
        });

        btn.addEventListener('click', () => {
            if (input.value.trim() === 'delete' && confirmCallback) {
                const cb = confirmCallback;
                confirmCallback = null;
                cb();
                hideModal(modal);
            }
        });

        function cancelConfirm() {
            confirmCallback = null;
            hideModal(modal);
        }
        closeBtns.forEach(el => el.addEventListener('click', cancelConfirm));
        modal.addEventListener('click', e => { if (e.target === modal) cancelConfirm(); });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                cancelConfirm();
            }
        });
    }

    function showConfirmModal(title, message, callback) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').innerHTML = message;
        document.getElementById('confirmInput').value = '';
        document.getElementById('confirmDeleteBtn').disabled = true;
        document.getElementById('confirmError').style.display = 'none';
        confirmCallback = callback;
        showModal(modal);
    }

    function showModal(el) { el.classList.remove('hidden'); el.style.display = 'flex'; }
    function hideModal(el) { el.classList.add('hidden'); el.style.display = ''; }

    // ---------- REGISTRATIONS ----------
    function initRegistrations() {
        document.getElementById('statusFilter').addEventListener('change', () => loadRegistrations());
        document.getElementById('acceptBtn').addEventListener('click', () => updateRegistrationStatus('approved'));
        document.getElementById('rejectBtn').addEventListener('click', () => updateRegistrationStatus('rejected'));
        document.getElementById('saveBatchBtn').addEventListener('click', saveBatch);
        document.getElementById('deleteRegBtn').addEventListener('click', () => {
            const id = document.getElementById('deleteRegBtn').dataset.id;
            if (!id) return;
            showConfirmModal('Delete Registration', 'Type <strong>delete</strong> to permanently remove this registration:', () => softDeleteRegistration(id));
        });
        document.getElementById('assignBatchBtn').addEventListener('click', () => {
            const id = document.getElementById('assignBatchBtn').dataset.id;
            openBatchModal(id);
        });
    }

    async function loadRegistrations() {
        const filter = document.getElementById('statusFilter').value;
        try {
            const data = await apiGet(`/registrations?status=${filter}`);
            if (data.success) {
                cachedRegistrations = data.registrations || [];
                renderRegistrations(cachedRegistrations);
            } else {
                showToast(data.error || 'Failed to load', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function renderRegistrations(rows) {
        const tbody = document.getElementById('registrationsTable');
        const noData = document.getElementById('noRegistrations');
        tbody.innerHTML = '';
        if (!rows.length) {
            tbody.innerHTML = '';
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const statusClass = r.status === 'approved' ? 'status-approved' : r.status === 'rejected' ? 'status-rejected' : 'status-pending';
            tr.innerHTML = `
                <td>${esc(r.name)}</td>
                <td>${esc(r.email)}</td>
                <td>${esc(r.phone || '')}</td>
                <td>${esc(r.education || '')}</td>
                <td>${r.registration_date ? new Date(r.registration_date).toLocaleDateString() : ''}</td>
                <td>${esc(r.batch || '-')}</td>
                <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                <td>
                    <button class="btn-icon view-reg" data-id="${r.id}" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon approve-reg" data-id="${r.id}" title="Approve"><i class="fas fa-check" style="color:var(--success)"></i></button>
                    <button class="btn-icon reject-reg" data-id="${r.id}" title="Reject"><i class="fas fa-times" style="color:var(--danger)"></i></button>
                </td>
            `;
            tbody.appendChild(tr);

            tr.querySelector('.view-reg').addEventListener('click', () => openRegistrationModal(r));
            tr.querySelector('.approve-reg').addEventListener('click', () => {
                setRegistrationId(r.id);
                updateRegistrationStatus('approved');
            });
            tr.querySelector('.reject-reg').addEventListener('click', () => {
                setRegistrationId(r.id);
                updateRegistrationStatus('rejected');
            });
        });
    }

    function openRegistrationModal(r) {
        setRegistrationId(r.id);
        const details = document.getElementById('registrationDetails');
        details.innerHTML = `
            <div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${esc(r.name)}</span></div>
            <div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">${esc(r.email)}</span></div>
            <div class="detail-row"><span class="detail-label">Phone:</span><span class="detail-value">${esc(r.phone || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">Education:</span><span class="detail-value">${esc(r.education || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">Address:</span><span class="detail-value">${esc(r.address || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">Batch:</span><span class="detail-value">${esc(r.batch || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value">${r.status}</span></div>
            <div class="detail-row"><span class="detail-label">Registered:</span><span class="detail-value">${r.registration_date ? new Date(r.registration_date).toLocaleString() : '-'}</span></div>
        `;
        document.getElementById('assignBatchBtn').dataset.id = r.id;
        document.getElementById('deleteRegBtn').dataset.id = r.id;
        showModal(document.getElementById('registrationModal'));
    }

    let currentRegId = null;
    function setRegistrationId(id) { currentRegId = id; }

    async function updateRegistrationStatus(status) {
        if (!currentRegId) return;
        try {
            const res = await apiPost('/registrations', { action: 'update_status', id: currentRegId, status, updated_by: currentUser.username });
            if (res.success) {
                showToast(`Registration ${status}`, 'success');
                hideModal(document.getElementById('registrationModal'));
                loadRegistrations();
            } else {
                showToast(res.error || 'Failed', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    async function softDeleteRegistration(id) {
        try {
            const res = await apiPost('/registrations', { action: 'delete', id, deleted_by: currentUser.username });
            if (res.success) {
                showToast('Moved to trash', 'success');
                hideModal(document.getElementById('registrationModal'));
                loadRegistrations();
            } else {
                showToast(res.error || 'Failed to delete', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    let currentBatchRegId = null;
    function openBatchModal(id) {
        currentBatchRegId = id;
        document.getElementById('batchInput').value = '';
        document.getElementById('batchSelect').value = '';
        const select = document.getElementById('batchSelect');
        select.innerHTML = '<option value="">Custom...</option>';
        cachedRegistrations.forEach(r => {
            if (r.batch && ![...select.options].some(o => o.value === r.batch)) {
                const opt = document.createElement('option');
                opt.value = r.batch;
                opt.textContent = r.batch;
                select.appendChild(opt);
            }
        });
        showModal(document.getElementById('batchModal'));
    }

    async function saveBatch() {
        const id = currentBatchRegId;
        const batch = document.getElementById('batchInput').value.trim() || document.getElementById('batchSelect').value;
        if (!batch) { showToast('Enter a batch name', 'error'); return; }
        try {
            const res = await apiPost('/registrations', { action: 'batch', id, batch, username: currentUser.username });
            if (res.success) {
                showToast('Batch assigned', 'success');
                hideModal(document.getElementById('batchModal'));
                loadRegistrations();
            } else {
                showToast(res.error || 'Failed to assign batch', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    // ---------- CLASSES ----------
    let classes = [];
    function initClasses() {
        document.getElementById('createClassBtn').addEventListener('click', () => {
            document.getElementById('classModalTitle').textContent = 'Create New Class';
            document.getElementById('createClassForm').reset();
            populateTraineeCheckboxes();
            showModal(document.getElementById('createClassModal'));
        });

        document.getElementById('createClassForm').addEventListener('submit', async e => {
            e.preventDefault();
            const data = {
                name: document.getElementById('className').value,
                start_date: document.getElementById('startDate').value,
                end_date: document.getElementById('endDate').value,
                trainer: document.getElementById('classTrainer').value,
                trainees: [...document.querySelectorAll('#traineeCheckboxes input:checked')].map(cb => cb.value)
            };
            try {
                const res = await apiPost('/classes', { action: 'create', ...data });
                if (res.success) {
                    showToast('Class created', 'success');
                    hideModal(document.getElementById('createClassModal'));
                    loadClasses();
                } else {
                    showToast(res.error || 'Failed', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }
        });

        document.getElementById('deleteClassBtn').addEventListener('click', () => {
            const id = document.getElementById('deleteClassBtn').dataset.id;
            if (!id) return;
            showConfirmModal('Delete Class', 'Type <strong>delete</strong> to permanently remove this class:', async () => {
                try {
                    const res = await apiPost('/classes', { action: 'delete', id });
                    if (res.success) {
                        showToast('Class deleted', 'success');
                        hideModal(document.getElementById('viewClassModal'));
                        loadClasses();
                    } else {
                        showToast(res.error || 'Failed', 'error');
                    }
                } catch (e) {
                    showToast('Network error', 'error');
                }
            });
        });
    }

    async function loadClasses() {
        try {
            const data = await apiGet('/classes');
            if (data.success) {
                classes = data.classes || [];
                renderClasses(classes);
            } else {
                showToast(data.error || 'Failed to load classes', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function renderClasses(rows) {
        const container = document.getElementById('classesList');
        const noData = document.getElementById('noClasses');
        container.innerHTML = '';
        if (!rows.length) {
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';
        rows.forEach(c => {
            const card = document.createElement('div');
            card.className = 'class-card';
            card.innerHTML = `
                <h3>${esc(c.name)}</h3>
                <p><i class="fas fa-user"></i> ${esc(c.trainer || 'No trainer')}</p>
                <p><i class="fas fa-calendar"></i> ${c.start_date ? new Date(c.start_date).toLocaleDateString() : '?'} - ${c.end_date ? new Date(c.end_date).toLocaleDateString() : '?'}</p>
                <p><i class="fas fa-users"></i> ${c.trainee_count || 0} trainees</p>
                <button class="btn-secondary view-class" data-id="${c.id}" style="margin-top:12px">View Details</button>
            `;
            container.appendChild(card);
            card.querySelector('.view-class').addEventListener('click', () => openViewClassModal(c.id));
        });
    }

    async function openViewClassModal(id) {
        try {
            const data = await apiGet(`/classes?id=${id}`);
            if (data.success && data.class) {
                const c = data.class;
                document.getElementById('viewClassName').textContent = c.name;
                document.getElementById('viewClassTrainer').textContent = c.trainer || '-';
                document.getElementById('viewClassDuration').textContent = `${c.start_date ? new Date(c.start_date).toLocaleDateString() : '?'} - ${c.end_date ? new Date(c.end_date).toLocaleDateString() : '?'}`;
                document.getElementById('deleteClassBtn').dataset.id = c.id;
                const tbody = document.getElementById('viewClassTrainees');
                tbody.innerHTML = '';
                (c.trainees || []).forEach(t => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${esc(t.name)}</td><td>${esc(t.email)}</td><td>${esc(t.phone || '')}</td>
                        <td><button class="btn-icon" onclick="alert('Remove trainee - not implemented')"><i class="fas fa-user-minus"></i></button></td>`;
                    tbody.appendChild(tr);
                });
                showModal(document.getElementById('viewClassModal'));
            } else {
                showToast(data.error || 'Class not found', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function populateTraineeCheckboxes() {
        const container = document.getElementById('traineeCheckboxes');
        container.innerHTML = '';
        cachedRegistrations.filter(r => r.status === 'approved').forEach(r => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `<input type="checkbox" value="${r.id}"> ${esc(r.name)} (${esc(r.email)})`;
            container.appendChild(label);
        });
    }

    // ---------- TRAINERS ----------
    let trainers = [];
    async function loadTrainers() {
        try {
            const data = await apiGet('/trainers');
            if (data.success) {
                trainers = data.trainers || [];
                renderTrainers(trainers);
            } else {
                showToast(data.error || 'Failed to load trainers', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function renderTrainers(rows) {
        const container = document.getElementById('trainersList');
        container.innerHTML = '';
        if (!rows.length) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-chalkboard-teacher" style="font-size:64px;opacity:0.4;margin-bottom:20px;display:block"></i><p>No trainers yet</p></div>';
            return;
        }
        rows.forEach(t => {
            const card = document.createElement('div');
            card.className = 'trainer-card';
            card.innerHTML = `<h3>${esc(t.name)}</h3><p>${esc(t.specialty || '')}</p><p>${esc(t.email || '')}</p>`;
            container.appendChild(card);
        });
    }

    // ---------- USERS ----------
    function initUsers() {
        document.getElementById('createUserBtn').addEventListener('click', () => {
            document.getElementById('createUserForm').reset();
            showModal(document.getElementById('createUserModal'));
        });

        document.getElementById('createUserForm').addEventListener('submit', async e => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value.trim();
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;
            if (!username || !password) { showToast('Fill in all fields', 'error'); return; }
            try {
                const res = await apiPost('/users', { action: 'create', username, password, role, created_by: currentUser.username });
                if (res.success) {
                    showToast('User created', 'success');
                    hideModal(document.getElementById('createUserModal'));
                    loadUsers();
                } else {
                    showToast(res.error || 'Failed', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }
        });
    }

    async function loadUsers() {
        try {
            const data = await apiGet('/users');
            if (data.success) {
                cachedUsers = data.users || [];
                renderUsers(cachedUsers);
            } else {
                showToast(data.error || 'Failed to load users', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function renderUsers(rows) {
        const tbody = document.getElementById('usersTable');
        const noData = document.getElementById('noUsers');
        tbody.innerHTML = '';
        if (!rows.length) {
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';
        rows.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${esc(u.username)}</td>
                <td>${esc(u.role)}</td>
                <td>${esc(u.created_by || '-')}</td>
                <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-icon delete-user" data-id="${u.id}" data-username="${esc(u.username)}" title="Delete"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.delete-user').addEventListener('click', () => {
                const id = tr.querySelector('.delete-user').dataset.id;
                const uname = tr.querySelector('.delete-user').dataset.username;
                showConfirmModal('Delete User', `Type <strong>delete</strong> to move user <strong>${esc(uname)}</strong> to trash:`, () => softDeleteUser(id));
            });
        });
    }

    async function softDeleteUser(id) {
        try {
            const res = await apiPost('/users', { action: 'delete', id, deleted_by: currentUser.username });
            if (res.success) {
                showToast('User moved to trash', 'success');
                loadUsers();
            } else {
                showToast(res.error || 'Failed', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    // ---------- TRASH ----------
    function initTrash() {
        document.querySelectorAll('.trash-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.trash-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTrashType = tab.dataset.type;
                loadTrash(currentTrashType);
            });
        });
    }

    async function loadTrash(type) {
        const endpoint = type === 'users' ? '/users?trash=1' : '/registrations?trash=1';
        try {
            const data = await apiGet(endpoint);
            if (data.success) {
                const items = data.registrations || data.users || [];
                renderTrash(items, type);
            } else {
                showToast(data.error || 'Failed', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function renderTrash(items, type) {
        const tbody = document.getElementById('trashTable');
        const noData = document.getElementById('noTrash');
        tbody.innerHTML = '';
        if (!items.length) {
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';

        if (type === 'users') {
            document.getElementById('trashCol1').textContent = 'Username';
            document.getElementById('trashCol2').textContent = 'Role';
            document.getElementById('trashCol3').textContent = 'Deleted At';
            document.getElementById('trashCol4').textContent = 'Deleted By';
        } else {
            document.getElementById('trashCol1').textContent = 'Name';
            document.getElementById('trashCol2').textContent = 'Email';
            document.getElementById('trashCol3').textContent = 'Deleted At';
            document.getElementById('trashCol4').textContent = 'Deleted By';
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            if (type === 'users') {
                tr.innerHTML = `
                    <td>${esc(item.username)}</td>
                    <td>${esc(item.role)}</td>
                    <td>${item.deleted_at ? new Date(item.deleted_at).toLocaleString() : ''}</td>
                    <td>${esc(item.deleted_by || '-')}</td>
                    <td>
                        <button class="btn-icon restore-trash" data-id="${item.id}" data-type="${type}" title="Restore"><i class="fas fa-undo" style="color:var(--primary)"></i></button>
                        <button class="btn-icon hard-delete-trash" data-id="${item.id}" data-type="${type}" title="Permanently Delete"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${esc(item.name)}</td>
                    <td>${esc(item.email)}</td>
                    <td>${item.deleted_at ? new Date(item.deleted_at).toLocaleString() : ''}</td>
                    <td>${esc(item.deleted_by || '-')}</td>
                    <td>
                        <button class="btn-icon restore-trash" data-id="${item.id}" data-type="${type}" title="Restore"><i class="fas fa-undo" style="color:var(--primary)"></i></button>
                        <button class="btn-icon hard-delete-trash" data-id="${item.id}" data-type="${type}" title="Permanently Delete"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
                    </td>
                `;
            }
            tbody.appendChild(tr);

            tr.querySelector('.restore-trash').addEventListener('click', async () => {
                const id = tr.querySelector('.restore-trash').dataset.id;
                const t = tr.querySelector('.restore-trash').dataset.type;
                const endpoint = t === 'users' ? '/users' : '/registrations';
                const res = await apiPost(endpoint, { action: 'restore', id, username: currentUser.username });
                if (res.success) {
                    showToast('Restored', 'success');
                    loadTrash(currentTrashType);
                } else {
                    showToast(res.error || 'Failed to restore', 'error');
                }
            });

            tr.querySelector('.hard-delete-trash').addEventListener('click', () => {
                const id = tr.querySelector('.hard-delete-trash').dataset.id;
                const t = tr.querySelector('.hard-delete-trash').dataset.type;
                showConfirmModal('Permanent Delete', 'Type <strong>delete</strong> to permanently remove this item. This cannot be undone:', () => hardDeleteItem(id, t));
            });
        });
    }

    async function hardDeleteItem(id, type) {
        const endpoint = type === 'users' ? '/users' : '/registrations';
        try {
            const res = await apiPost(endpoint, { action: 'hard_delete', id, username: currentUser.username });
            if (res.success) {
                showToast('Permanently deleted', 'success');
                loadTrash(currentTrashType);
            } else {
                showToast(res.error || 'Failed', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    // ---------- EMAILS ----------
    function initEmails() {
        document.getElementById('emailForm').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            try {
                const res = await apiPost('/send-email', {
                    recipient: document.getElementById('recipient').value,
                    subject: document.getElementById('emailSubject').value,
                    message: document.getElementById('emailBody').value
                });
                if (res.success) {
                    showToast('Email sent', 'success');
                    e.target.reset();
                } else {
                    showToast(res.error || 'Failed to send', 'error');
                }
            } catch (err) {
                showToast('Network error', 'error');
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        });

        loadRecipients();
    }

    async function loadRecipients() {
        try {
            const data = await apiGet('/registrations?status=approved');
            if (data.success && data.registrations) {
                const select = document.getElementById('recipient');
                select.innerHTML = '<option value="">Select recipient...</option>';
                data.registrations.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.email;
                    opt.textContent = `${r.name} <${r.email}>`;
                    select.appendChild(opt);
                });
            }
        } catch (e) { /* ignore */ }
    }

    // ---------- UTILS ----------
    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // Make modal helpers accessible globally for inline handlers
    window.showModal = showModal;
    window.hideModal = hideModal;
})();
