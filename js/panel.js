(function () {
    const API = '/api';
    let currentUser = null;
    let currentSection = 'registrations';
    let cachedRegistrations = [];
    let cachedUsers = [];
    let currentTrashType = 'registrations';
    let confirmCallback = null;
    let currentRegId = null;
    let currentBatchRegId = null;
    let pendingRejectId = null;

    const user = (() => {
        try { return JSON.parse(sessionStorage.getItem('prhinc_user')); } catch { return null; }
    })();

    if (!user) { window.location.href = '/manage'; return; }
    currentUser = user;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('currentUserDisplay').textContent = user.username;
        if (user.role !== 'admin') {
            document.querySelectorAll('[data-section="users"], [data-section="trash"]').forEach(el => el.style.display = 'none');
        }
        initNavigation();
        initLogout();
        initRegistrations();
        initApproved();
        initClasses();
        initUsers();
        initTrash();
        initEmails();
        initConfirmModal();
        initRejectModal();
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
        const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (navItem) navItem.classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(section + 'Section');
        if (el) el.classList.add('active');
        const titles = {
            registrations: 'Registrations', approved: 'Approved Trainees', classes: 'Classes / Batches',
            trainers: 'Trainers', users: 'Users', trash: 'Trash', emails: 'Emails'
        };
        document.getElementById('pageTitle').textContent = titles[section] || section;

        if (section === 'registrations') loadRegistrations();
        else if (section === 'approved') loadApproved();
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
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Request failed');
        return result;
    }

    async function apiGet(endpoint) {
        const res = await fetch(API + endpoint);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Request failed');
        return result;
    }

    function showToast(msg, type) {
        if (window.prhToast) { window.prhToast(msg, type); return; }
        const existing = document.querySelector('.toast-container');
        if (existing) existing.remove();
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.innerHTML = `<div class="toast toast-${type}"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${esc(msg)}</div>`;
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 3500);
    }

    // ---------- CONFIRM MODAL (type "delete") ----------
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
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) cancelConfirm();
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

    // ---------- REJECT REASON MODAL ----------
    function initRejectModal() {
        const modal = document.getElementById('rejectModal');
        const textarea = document.getElementById('rejectReason');
        const sendBtn = document.getElementById('confirmRejectBtn');
        const closeBtns = modal.querySelectorAll('.modal-close');

        textarea.addEventListener('input', () => {
            sendBtn.disabled = textarea.value.trim() === '';
        });

        sendBtn.addEventListener('click', async () => {
            const reason = textarea.value.trim();
            if (!reason) return;
            sendBtn.disabled = true;
            await doReject(pendingRejectId, reason);
            pendingRejectId = null;
            hideModal(modal);
        });

        function cancel() {
            pendingRejectId = null;
            textarea.value = '';
            sendBtn.disabled = true;
            hideModal(modal);
        }
        closeBtns.forEach(el => el.addEventListener('click', cancel));
        modal.addEventListener('click', e => { if (e.target === modal) cancel(); });
    }

    function showRejectModal(id) {
        pendingRejectId = id;
        const textarea = document.getElementById('rejectReason');
        const sendBtn = document.getElementById('confirmRejectBtn');
        textarea.value = '';
        sendBtn.disabled = true;
        showModal(document.getElementById('rejectModal'));
        textarea.focus();
    }

    function showModal(el) { el.classList.remove('hidden'); el.style.display = 'flex'; }
    function hideModal(el) { el.classList.add('hidden'); el.style.display = ''; }

    // ---------- APPROVE / REJECT ----------
    async function doApprove(id) {
        try {
            const res = await apiPost('/registrations', {
                action: 'update_status', id, status: 'approved', updated_by: currentUser.username
            });
            if (res.success) {
                showToast('Registration approved', 'success');
                hideModal(document.getElementById('registrationModal'));
                loadRegistrations();
                sendNotification(id, 'approved');
            }
        } catch (e) {
            showToast(e.message || 'Failed to approve', 'error');
        }
    }

    async function doReject(id, reason) {
        try {
            const res = await apiPost('/registrations', {
                action: 'update_status', id, status: 'rejected',
                rejection_reason: reason, updated_by: currentUser.username
            });
            if (res.success) {
                showToast('Registration rejected', 'success');
                hideModal(document.getElementById('registrationModal'));
                loadRegistrations();
                sendNotification(id, 'rejected', reason);
            }
        } catch (e) {
            showToast(e.message || 'Failed to reject', 'error');
        }
    }

    async function sendNotification(id, type, reason) {
        const reg = cachedRegistrations.find(r => r.id === id);
        if (!reg) return;
        try {
            await apiPost('/send-notification', {
                name: reg.name, email: reg.email, type, reason: reason || ''
            });
            showToast(type === 'approved' ? 'Approval email sent' : 'Rejection email sent', 'success');
        } catch (e) {
            showToast('Status updated but email failed: ' + (e.message || 'unknown error'), 'warning');
        }
    }

    // ---------- REGISTRATIONS ----------
    function initRegistrations() {
        document.getElementById('statusFilter').addEventListener('change', () => loadRegistrations());
        document.getElementById('acceptBtn').addEventListener('click', async () => {
            if (!currentRegId) return;
            if (window.prhConfirm) {
                const ok = await window.prhConfirm('Are you sure you want to approve this registration?', {
                    title: 'Confirm Approval', confirmText: 'Yes, Approve', cancelText: 'Cancel', confirmClass: 'prh-btn--success'
                });
                if (!ok) return;
            } else if (!confirm('Are you sure you want to approve this registration?')) return;
            hideModal(document.getElementById('registrationModal'));
            await doApprove(currentRegId);
        });
        document.getElementById('rejectBtn').addEventListener('click', () => {
            if (!currentRegId) return;
            hideModal(document.getElementById('registrationModal'));
            showRejectModal(currentRegId);
        });
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
            cachedRegistrations = data.registrations || [];
            renderRegistrations(cachedRegistrations);
        } catch (e) {
            showToast(e.message || 'Failed to load', 'error');
        }
    }

    function renderRegistrations(rows) {
        const tbody = document.getElementById('registrationsTable');
        const noData = document.getElementById('noRegistrations');
        tbody.innerHTML = '';
        if (!rows.length) { noData.style.display = 'block'; return; }
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
            tr.querySelector('.approve-reg').addEventListener('click', async () => {
                if (window.prhConfirm) {
                    const ok = await window.prhConfirm('Are you sure you want to approve this registration?', {
                        title: 'Confirm Approval', confirmText: 'Yes, Approve', cancelText: 'Cancel', confirmClass: 'prh-btn--success'
                    });
                    if (!ok) return;
                } else if (!confirm('Are you sure you want to approve this registration?')) return;
                setRegistrationId(r.id);
                await doApprove(r.id);
            });
            tr.querySelector('.reject-reg').addEventListener('click', () => {
                setRegistrationId(r.id);
                showRejectModal(r.id);
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

    function setRegistrationId(id) { currentRegId = id; }

    async function softDeleteRegistration(id) {
        try {
            await apiPost('/registrations', { action: 'delete', id, deleted_by: currentUser.username });
            showToast('Moved to trash', 'success');
            hideModal(document.getElementById('registrationModal'));
            loadRegistrations();
        } catch (e) {
            showToast(e.message || 'Failed to delete', 'error');
        }
    }

    async function saveBatch() {
        const id = currentBatchRegId;
        const batch = document.getElementById('batchInput').value.trim() || document.getElementById('batchSelect').value;
        if (!batch) { showToast('Enter a batch name', 'error'); return; }
        try {
            await apiPost('/registrations', { action: 'batch', id, batch, username: currentUser.username });
            showToast('Batch assigned', 'success');
            hideModal(document.getElementById('batchModal'));
            loadRegistrations();
        } catch (e) {
            showToast(e.message || 'Failed to assign batch', 'error');
        }
    }

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

    // ---------- APPROVED TRAINEES ----------
    function initApproved() {
        // no init needed
    }

    async function loadApproved() {
        try {
            const data = await apiGet('/registrations?status=approved');
            const approved = data.registrations || [];
            renderApproved(approved);
        } catch (e) {
            showToast(e.message || 'Failed to load approved trainees', 'error');
        }
    }

    function renderApproved(rows) {
        const tbody = document.getElementById('approvedTable');
        const noData = document.getElementById('noApproved');
        tbody.innerHTML = '';
        if (!rows.length) { noData.style.display = 'block'; return; }
        noData.style.display = 'none';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${esc(r.name)}</td>
                <td>${esc(r.email)}</td>
                <td>${esc(r.phone || '')}</td>
                <td>${esc(r.batch || '-')}</td>
                <td><input type="text" class="client-input" data-id="${r.id}" value="${esc(r.client || '')}" placeholder="Assign client..." style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px"></td>
                <td>
                    <button class="btn-icon view-reg" data-id="${r.id}" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon save-client" data-id="${r.id}" title="Save Client"><i class="fas fa-save" style="color:var(--primary)"></i></button>
                    <button class="btn-icon reject-reg" data-id="${r.id}" title="Reject"><i class="fas fa-times" style="color:var(--danger)"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.view-reg').addEventListener('click', () => openRegistrationModal(r));
            tr.querySelector('.save-client').addEventListener('click', async () => {
                const input = tr.querySelector('.client-input');
                const client = input.value.trim();
                try {
                    await apiPost('/registrations', { action: 'set_client', id: r.id, client, username: currentUser.username });
                    showToast('Client assigned', 'success');
                } catch (e) {
                    showToast(e.message || 'Failed to save client', 'error');
                }
            });
            tr.querySelector('.reject-reg').addEventListener('click', () => showRejectModal(r.id));
        });
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
                await apiPost('/classes', { action: 'create', ...data });
                showToast('Class created', 'success');
                hideModal(document.getElementById('createClassModal'));
                loadClasses();
            } catch (e) {
                showToast(e.message || 'Failed', 'error');
            }
        });

        document.getElementById('deleteClassBtn').addEventListener('click', () => {
            const id = document.getElementById('deleteClassBtn').dataset.id;
            if (!id) return;
            showConfirmModal('Delete Class', 'Type <strong>delete</strong> to permanently remove this class:', async () => {
                try {
                    await apiPost('/classes', { action: 'delete', id });
                    showToast('Class deleted', 'success');
                    hideModal(document.getElementById('viewClassModal'));
                    loadClasses();
                } catch (e) {
                    showToast(e.message || 'Failed', 'error');
                }
            });
        });
    }

    async function loadClasses() {
        try {
            const data = await apiGet('/classes');
            classes = data.classes || [];
            renderClasses(classes);
        } catch (e) {
            showToast(e.message || 'Failed to load classes', 'error');
        }
    }

    function renderClasses(rows) {
        const container = document.getElementById('classesList');
        const noData = document.getElementById('noClasses');
        container.innerHTML = '';
        if (!rows.length) { noData.style.display = 'block'; return; }
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
    async function loadTrainers() {
        try {
            const data = await apiGet('/trainers');
            const trainers = data.trainers || [];
            const container = document.getElementById('trainersList');
            container.innerHTML = '';
            if (!trainers.length) {
                container.innerHTML = '<div class="no-data"><i class="fas fa-chalkboard-teacher" style="font-size:64px;opacity:0.4;margin-bottom:20px;display:block"></i><p>No trainers yet</p></div>';
                return;
            }
            trainers.forEach(t => {
                const card = document.createElement('div');
                card.className = 'trainer-card';
                card.innerHTML = `<h3>${esc(t.name)}</h3><p>${esc(t.specialty || '')}</p><p>${esc(t.email || '')}</p>`;
                container.appendChild(card);
            });
        } catch (e) {
            showToast(e.message || 'Failed to load trainers', 'error');
        }
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
                await apiPost('/users', { action: 'create', username, password, role, created_by: currentUser.username });
                showToast('User created', 'success');
                hideModal(document.getElementById('createUserModal'));
                loadUsers();
            } catch (e) {
                showToast(e.message || 'Failed', 'error');
            }
        });
    }

    async function loadUsers() {
        try {
            const data = await apiGet('/users');
            cachedUsers = data.users || [];
            renderUsers(cachedUsers);
        } catch (e) {
            showToast(e.message || 'Failed to load users', 'error');
        }
    }

    function renderUsers(rows) {
        const tbody = document.getElementById('usersTable');
        const noData = document.getElementById('noUsers');
        tbody.innerHTML = '';
        if (!rows.length) { noData.style.display = 'block'; return; }
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
            await apiPost('/users', { action: 'delete', id, deleted_by: currentUser.username });
            showToast('User moved to trash', 'success');
            loadUsers();
        } catch (e) {
            showToast(e.message || 'Failed', 'error');
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
            const items = data.registrations || data.users || [];
            renderTrash(items, type);
        } catch (e) {
            showToast(e.message || 'Failed', 'error');
        }
    }

    function renderTrash(items, type) {
        const tbody = document.getElementById('trashTable');
        const noData = document.getElementById('noTrash');
        tbody.innerHTML = '';
        if (!items.length) { noData.style.display = 'block'; return; }
        noData.style.display = 'none';

        document.getElementById('trashCol1').textContent = type === 'users' ? 'Username' : 'Name';
        document.getElementById('trashCol2').textContent = type === 'users' ? 'Role' : 'Email';
        document.getElementById('trashCol3').textContent = 'Deleted At';
        document.getElementById('trashCol4').textContent = 'Deleted By';

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
                try {
                    await apiPost(t === 'users' ? '/users' : '/registrations', { action: 'restore', id, username: currentUser.username });
                    showToast('Restored', 'success');
                    loadTrash(currentTrashType);
                } catch (e) {
                    showToast(e.message || 'Failed to restore', 'error');
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
        try {
            await apiPost(type === 'users' ? '/users' : '/registrations', { action: 'hard_delete', id, username: currentUser.username });
            showToast('Permanently deleted', 'success');
            loadTrash(currentTrashType);
        } catch (e) {
            showToast(e.message || 'Failed', 'error');
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
                await apiPost('/send-email', {
                    recipient: document.getElementById('recipient').value,
                    subject: document.getElementById('emailSubject').value,
                    message: document.getElementById('emailBody').value
                });
                showToast('Email sent', 'success');
                e.target.reset();
            } catch (err) {
                showToast(err.message || 'Failed to send', 'error');
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        });
        loadRecipients();
    }

    async function loadRecipients() {
        try {
            const data = await apiGet('/registrations?status=approved');
            if (data.registrations) {
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

    window.showModal = showModal;
    window.hideModal = hideModal;
})();
