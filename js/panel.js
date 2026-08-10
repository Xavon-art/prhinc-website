(function () {
    const API = '/api';
    let currentUser = null;
    let currentSection = 'registrations';
    let cachedRegistrations = [];
    let cachedUsers = [];
    let currentTrashType = 'registrations';
    let selectedTrash = new Set();
    let confirmCallback = null;
    let confirmTypeWord = 'delete';
    let currentRegId = null;
    let currentBatchRegId = null;
    let currentAddTraineeClassId = null;
    let currentAddTraineeOptions = [];
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
        initModalCloseButtons();
        initNavigation();
        initLogout();
        initRegistrations();
        initApproved();
        initClasses();
        initUsers();
        initTrainers();
        initTrash();
        initConfirmModal();
        initRejectModal();
        loadSection('registrations');
    });

    function initModalCloseButtons() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => hideModal(modal));
            });
            modal.addEventListener('click', e => { if (e.target === modal) hideModal(modal); });
        });
    }

    function initNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) loadSection(section);
            });
        });
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
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
            trainers: 'Trainers', users: 'Users', trash: 'Trash'
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
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (window.prhConfirm) {
                const ok = await window.prhConfirm('Are you sure you want to log out?', {
                    title: 'Logout', confirmText: 'Yes, Logout', cancelText: 'Cancel', confirmClass: 'prh-btn--danger'
                });
                if (!ok) return;
            } else if (!confirm('Are you sure you want to log out?')) return;
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
            const match = input.value.trim() === confirmTypeWord;
            btn.disabled = !match;
            error.style.display = match ? 'none' : 'block';
        });

        btn.addEventListener('click', () => {
            if (input.value.trim() === confirmTypeWord && confirmCallback) {
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

    function showConfirmModal(title, message, callback, typeWord) {
        confirmTypeWord = typeWord || 'delete';
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').innerHTML = message;
        const input = document.getElementById('confirmInput');
        input.value = '';
        input.placeholder = `Type '${confirmTypeWord}' here`;
        document.getElementById('confirmError').textContent = `You must type "${confirmTypeWord}" exactly`;
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
                    <div class="row-actions">
                        <button class="btn-icon row-kebab" data-id="${r.id}" title="Actions"><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.row-kebab').addEventListener('click', (e) => {
                e.stopPropagation();
                setRegistrationId(r.id);
                openRowActions(e.currentTarget, [
                    { icon: 'fa-eye', label: 'View', action: () => openRegistrationModal(r) },
                    { icon: 'fa-check', label: 'Approve', color: 'var(--success)', action: async () => {
                        if (window.prhConfirm) {
                            const ok = await window.prhConfirm('Are you sure you want to approve this registration?', {
                                title: 'Confirm Approval', confirmText: 'Yes, Approve', cancelText: 'Cancel', confirmClass: 'prh-btn--success'
                            });
                            if (!ok) return;
                        } else if (!confirm('Are you sure you want to approve this registration?')) return;
                        await doApprove(r.id);
                    } },
                    { icon: 'fa-times', label: 'Reject', color: 'var(--danger)', action: () => showRejectModal(r.id) },
                    { icon: 'fa-trash', label: 'Delete', color: 'var(--danger)', action: () => showConfirmModal('Delete Registration', 'Type <strong>delete</strong> to move this registration to trash:', () => softDeleteRegistration(r.id)) }
                ]);
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
        const batch = document.getElementById('batchSelect').value;
        if (!batch) { showToast('No batch selected. Create a class first.', 'error'); return; }
        try {
            const assigned = await getAssignedMap();
            const currentAssigned = assigned.get(id);
            if (currentAssigned && currentAssigned !== batch) {
                showToast(`This trainee is already assigned to "${currentAssigned}".`, 'error');
                return;
            }
            await apiPost('/registrations', { action: 'batch', id, batch, username: currentUser.username });
            showToast('Batch assigned', 'success');
            hideModal(document.getElementById('batchModal'));
            loadRegistrations();
            loadApproved();
        } catch (e) {
            showToast(e.message || 'Failed to assign batch', 'error');
        }
    }

    async function openBatchModal(id) {
        currentBatchRegId = id;
        const select = document.getElementById('batchSelect');
        const emptyMsg = document.getElementById('batchEmptyMsg');
        const saveBtn = document.getElementById('saveBatchBtn');
        select.innerHTML = '<option value="">Select a batch...</option>';
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
        try {
            const data = await apiGet('/classes');
            const classes = data.classes || [];
            classes.forEach(c => {
                if (![...select.options].some(o => o.value === c.name)) {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = c.name;
                    select.appendChild(opt);
                }
            });
            if (classes.length === 0) {
                if (emptyMsg) emptyMsg.style.display = 'block';
                if (saveBtn) saveBtn.disabled = true;
            }
        } catch (e) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (saveBtn) saveBtn.disabled = true;
        }
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
                <td>
                    <button class="btn-icon view-reg" data-id="${r.id}" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon reject-reg" data-id="${r.id}" title="Reject"><i class="fas fa-times" style="color:var(--danger)"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.view-reg').addEventListener('click', () => openRegistrationModal(r));
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
            populateTrainerSelect();
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

        document.getElementById('addTraineeBtn').addEventListener('click', () => {
            const id = document.getElementById('addTraineeBtn').dataset.id;
            if (id) openAddTraineeModal(id);
        });

        document.getElementById('addTraineeSaveBtn').addEventListener('click', async () => {
            const classId = currentAddTraineeClassId;
            if (!classId) return;
            const checked = [...document.querySelectorAll('#addTraineeList input:checked')].map(cb => cb.value);
            if (!checked.length) { showToast('Select at least one trainee', 'error'); return; }
            const btn = document.getElementById('addTraineeSaveBtn');
            btn.disabled = true;
            try {
                for (const tid of checked) {
                    await apiPost('/classes', { action: 'add_trainee', id: classId, traineeId: tid });
                }
                showToast(`Added ${checked.length} trainee${checked.length > 1 ? 's' : ''}`, 'success');
                hideModal(document.getElementById('addTraineeModal'));
                openViewClassModal(classId);
                loadClasses();
                sendAddedToClassEmails(classId, checked);
            } catch (e) {
                showToast(e.message || 'Failed to add trainee', 'error');
            } finally {
                btn.disabled = false;
            }
        });
    }

    async function sendAddedToClassEmails(classId, traineeIds) {
        try {
            const data = await apiGet(`/classes?id=${classId}`);
            const cls = data.class;
            showToast('Sending email notifications...', 'info');
            let sent = 0, failed = 0;
            for (const tid of traineeIds) {
                const opt = currentAddTraineeOptions.find(o => o.id === tid);
                if (!opt) continue;
                try {
                    await apiPost('/send-notification', {
                        name: opt.name,
                        email: opt.email,
                        type: 'added_to_class',
                        batch: cls.name,
                        start_date: cls.start_date,
                        end_date: cls.end_date
                    });
                    sent++;
                } catch (e) {
                    failed++;
                }
            }
            if (sent > 0 && failed === 0) {
                showToast('Emails sent successfully', 'success');
            } else if (sent > 0 && failed > 0) {
                showToast(`Added ${sent} trainee${sent > 1 ? 's' : ''}, but ${failed} email${failed > 1 ? 's' : ''} failed to send`, 'warning');
            } else {
                showToast('Trainees added, but no emails were sent', 'warning');
            }
        } catch (e) {
            showToast('Trainees added, but failed to send emails', 'warning');
        }
    }

    async function openAddTraineeModal(classId) {
        currentAddTraineeClassId = classId;
        const listEl = document.getElementById('addTraineeList');
        listEl.innerHTML = '<p style="color:#94a3b8;font-size:13px">Loading approved trainees...</p>';
        showModal(document.getElementById('addTraineeModal'));
        try {
            const [approvedData, classesData] = await Promise.all([
                apiGet('/registrations?status=approved'),
                apiGet('/classes')
            ]);
            const approved = approvedData.registrations || [];
            const currentClass = (classesData.classes || []).find(c => c.id === classId);
            const inThisClass = new Set(currentClass ? currentClass.trainees : []);
            const assignedElsewhere = new Map();
            (classesData.classes || []).forEach(c => {
                (c.trainees || []).forEach(tid => {
                    if (!assignedElsewhere.has(tid)) assignedElsewhere.set(tid, c.name);
                });
            });
            (approvedData.registrations || []).forEach(r => {
                if (r.batch && !assignedElsewhere.has(r.id)) assignedElsewhere.set(r.id, r.batch);
            });
            const available = approved.filter(r => !inThisClass.has(r.id) && !assignedElsewhere.has(r.id));
            currentAddTraineeOptions = available.map(r => ({ id: r.id, name: r.name, email: r.email }));
            listEl.innerHTML = '';
            if (!available.length) {
                listEl.innerHTML = '<p style="color:#ef4444;font-size:13px">No available trainees. All approved trainees are already assigned.</p>';
                return;
            }
            available.forEach(r => {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                label.innerHTML = `<input type="checkbox" value="${esc(r.id)}"> ${esc(r.name)} (${esc(r.email)})`;
                listEl.appendChild(label);
            });
        } catch (e) {
            listEl.innerHTML = '<p style="color:#ef4444;font-size:13px">Failed to load approved trainees.</p>';
        }
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
                document.getElementById('addTraineeBtn').dataset.id = c.id;
                const tbody = document.getElementById('viewClassTrainees');
                tbody.innerHTML = '';
                (c.trainees || []).forEach(t => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${esc(t.name)}</td><td>${esc(t.email)}</td><td>${esc(t.phone || '')}</td>
                        <td><button class="btn-icon remove-trainee" data-id="${esc(t.id)}" title="Remove trainee"><i class="fas fa-user-minus"></i></button></td>`;
                    tbody.appendChild(tr);
                    tr.querySelector('.remove-trainee').addEventListener('click', () => removeTrainee(c.id, t.id, t.name));
                });
                showModal(document.getElementById('viewClassModal'));
            } else {
                showToast(data.error || 'Class not found', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    async function removeTrainee(classId, traineeId, traineeName) {
        showConfirmModal('Remove Trainee', `Type <strong>remove</strong> to remove trainee <strong>${esc(traineeName || '')}</strong> from this class:`, async () => {
            try {
                await apiPost('/classes', { action: 'remove_trainee', id: classId, traineeId });
                showToast('Trainee removed', 'success');
                openViewClassModal(classId);
                loadClasses();
            } catch (e) {
                showToast(e.message || 'Failed to remove trainee', 'error');
            }
        }, 'remove');
    }

    async function getAssignedMap() {
        const map = new Map();
        try {
            const [classesData, approvedData] = await Promise.all([
                apiGet('/classes'),
                apiGet('/registrations?status=approved')
            ]);
            (classesData.classes || []).forEach(c => {
                (c.trainees || []).forEach(tid => {
                    if (!map.has(tid)) map.set(tid, c.name);
                });
            });
            (approvedData.registrations || []).forEach(r => {
                if (r.batch && !map.has(r.id)) map.set(r.id, r.batch);
            });
        } catch (e) { /* ignore, fall back to no restrictions */ }
        return map;
    }

    async function populateTraineeCheckboxes() {
        const container = document.getElementById('traineeCheckboxes');
        container.innerHTML = '<p style="color:#94a3b8;font-size:13px">Loading approved trainees...</p>';
        try {
            const data = await apiGet('/registrations?status=approved');
            const approved = data.registrations || [];
            const assigned = await getAssignedMap();
            container.innerHTML = '';
            if (!approved.length) {
                container.innerHTML = '<p style="color:#94a3b8;font-size:13px">No approved trainees to assign yet.</p>';
                return;
            }
            approved.forEach(r => {
                const label = document.createElement('label');
                const already = assigned.get(r.id);
                const cls = already ? 'checkbox-label disabled-trainee' : 'checkbox-label';
                label.className = cls;
                const disabled = already ? ' disabled' : '';
                const note = already ? ` <span class="assigned-tag">(already assigned to ${esc(already)})</span>` : '';
                label.innerHTML = `<input type="checkbox" value="${esc(r.id)}"${disabled}> ${esc(r.name)} (${esc(r.email)})${note}`;
                container.appendChild(label);
            });
        } catch (e) {
            container.innerHTML = '<p style="color:#ef4444;font-size:13px">Failed to load approved trainees.</p>';
        }
    }

    async function populateTrainerSelect() {
        const select = document.getElementById('classTrainer');
        select.innerHTML = '<option value="">Select a trainer</option>';
        try {
            const data = await apiGet('/trainers');
            (data.trainers || []).forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.name;
                opt.textContent = t.name;
                select.appendChild(opt);
            });
        } catch (e) {
            /* trainers endpoint not available yet */
        }
    }

    // ---------- TRAINERS ----------
    let editingTrainerName = null;

    function initTrainers() {
        document.getElementById('createTrainerBtn').addEventListener('click', () => {
            editingTrainerName = null;
            document.getElementById('createTrainerForm').reset();
            document.getElementById('trainerModalTitle').textContent = 'Add Trainer';
            showModal(document.getElementById('createTrainerModal'));
        });

        document.getElementById('createTrainerForm').addEventListener('submit', async e => {
            e.preventDefault();
            const name = document.getElementById('trainerName').value.trim();
            const email = document.getElementById('trainerEmail').value.trim();
            if (!name) { showToast('Trainer name required', 'error'); return; }
            try {
                if (editingTrainerName) {
                    await apiPost('/trainers', { action: 'update', oldName: editingTrainerName, name, email, username: currentUser.username });
                    showToast('Trainer updated', 'success');
                } else {
                    await apiPost('/trainers', { action: 'create', name, email, username: currentUser.username });
                    showToast('Trainer added', 'success');
                }
                hideModal(document.getElementById('createTrainerModal'));
                editingTrainerName = null;
                loadTrainers();
                populateTrainerSelect();
            } catch (err) {
                showToast(err.message || 'Failed to save trainer', 'error');
            }
        });
    }

    function editTrainer(name, email) {
        editingTrainerName = name;
        document.getElementById('trainerModalTitle').textContent = 'Edit Trainer';
        document.getElementById('trainerName').value = name;
        document.getElementById('trainerEmail').value = email || '';
        showModal(document.getElementById('createTrainerModal'));
    }

    function deleteTrainer(name) {
        showConfirmModal('Delete Trainer', `Type <strong>delete</strong> to remove trainer <strong>${esc(name)}</strong>. Classes assigned to this trainer will be unassigned:`, async () => {
            try {
                await apiPost('/trainers', { action: 'delete', name, username: currentUser.username });
                showToast('Trainer deleted', 'success');
                loadTrainers();
                populateTrainerSelect();
            } catch (err) {
                showToast(err.message || 'Failed to delete trainer', 'error');
            }
        });
    }

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
                const initials = (t.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                card.innerHTML = `
                    <div class="trainer-avatar">${esc(initials)}</div>
                    <h3>${esc(t.name)}</h3>
                    <p><i class="fas fa-envelope"></i> ${esc(t.email || 'No email')}</p>
                    <div class="trainer-card-actions">
                        <button class="btn-secondary btn-small edit-trainer"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-danger btn-small delete-trainer"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
                card.querySelector('.edit-trainer').addEventListener('click', () => editTrainer(t.name, t.email));
                card.querySelector('.delete-trainer').addEventListener('click', () => deleteTrainer(t.name));
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
        const adminCount = rows.filter(u => u.role === 'admin').length;
        rows.forEach(u => {
            const tr = document.createElement('tr');
            const isSelf = u.username === currentUser.username;
            const isLastAdmin = u.role === 'admin' && adminCount <= 1;
            const canDelete = !isSelf && !isLastAdmin;
            tr.innerHTML = `
                <td>${esc(u.username)}${isSelf ? ' <span class="status-badge status-approved" style="font-size:0.7rem;padding:3px 8px">you</span>' : ''}</td>
                <td>${esc(u.role)}</td>
                <td>${esc(u.created_by || '-')}</td>
                <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    ${canDelete
                        ? `<button class="btn-icon delete-user" data-id="${u.id}" data-username="${esc(u.username)}" title="Delete"><i class="fas fa-trash" style="color:var(--danger)"></i></button>`
                        : `<span title="${isLastAdmin ? 'Cannot delete the only admin' : 'Cannot delete yourself'}" style="color:var(--text-light);font-size:13px">-</span>`}
                </td>
            `;
            tbody.appendChild(tr);
            const delBtn = tr.querySelector('.delete-user');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    const id = delBtn.dataset.id;
                    const uname = delBtn.dataset.username;
                    showConfirmModal('Delete User', `Type <strong>delete</strong> to move user <strong>${esc(uname)}</strong> to trash:`, () => softDeleteUser(id));
                });
            }
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
                selectedTrash.clear();
                const sa = document.getElementById('selectAllTrash');
                if (sa) sa.checked = false;
                loadTrash(currentTrashType);
            });
        });
        document.getElementById('selectAllTrash').addEventListener('change', (e) => {
            document.querySelectorAll('.trash-check').forEach(cb => cb.checked = e.target.checked);
            selectedTrash.clear();
            if (e.target.checked) {
                document.querySelectorAll('.trash-check').forEach(cb => selectedTrash.add(cb.dataset.id));
            }
            updateEmptyTrashBtn();
        });
        document.getElementById('emptyTrashBtn').addEventListener('click', emptyTrash);
    }

    async function loadTrash(type) {
        const endpoint = type === 'users' ? '/users?trash=1' : '/registrations?filter=trash';
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
        const selectAll = document.getElementById('selectAllTrash');
        selectedTrash.clear();
        tbody.innerHTML = '';
        if (selectAll) { selectAll.checked = false; selectAll.disabled = !items.length; }
        if (!items.length) {
            noData.style.display = 'block';
            updateEmptyTrashBtn();
            return;
        }
        noData.style.display = 'none';

        document.getElementById('trashCol1').textContent = type === 'users' ? 'Username' : 'Name';
        document.getElementById('trashCol2').textContent = type === 'users' ? 'Role' : 'Email';
        document.getElementById('trashCol3').textContent = 'Deleted At';
        document.getElementById('trashCol4').textContent = 'Deleted By';

        items.forEach(item => {
            const tr = document.createElement('tr');
            const cb = `<td class="select-col"><input type="checkbox" class="trash-check" data-id="${esc(item.id)}"></td>`;
            if (type === 'users') {
                tr.innerHTML = `
                    ${cb}
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
                    ${cb}
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

            const cbEl = tr.querySelector('.trash-check');
            cbEl.addEventListener('change', () => {
                if (cbEl.checked) selectedTrash.add(cbEl.dataset.id);
                else selectedTrash.delete(cbEl.dataset.id);
                if (selectAll) selectAll.checked = document.querySelectorAll('.trash-check:checked').length === items.length;
                updateEmptyTrashBtn();
            });

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

    function updateEmptyTrashBtn() {
        const btn = document.getElementById('emptyTrashBtn');
        if (!btn) return;
        const count = selectedTrash.size;
        btn.disabled = count === 0;
        btn.innerHTML = count ? `<i class="fas fa-trash-alt"></i> Empty Trash (${count})` : '<i class="fas fa-trash-alt"></i> Empty Trash';
    }

    function emptyTrash() {
        if (selectedTrash.size === 0) return;
        const count = selectedTrash.size;
        showConfirmModal('Empty Trash', `Type <strong>delete</strong> to permanently remove ${count} item${count > 1 ? 's' : ''} from trash. This cannot be undone:`, async () => {
            try {
                const ids = Array.from(selectedTrash);
                for (const id of ids) {
                    await apiPost(currentTrashType === 'users' ? '/users' : '/registrations', { action: 'hard_delete', id, username: currentUser.username });
                }
                selectedTrash.clear();
                showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} permanently deleted`, 'success');
                loadTrash(currentTrashType);
            } catch (e) {
                showToast(e.message || 'Failed', 'error');
            }
        });
    }

    // ---------- UTILS ----------
    let rowActionMenu = null;

    function openRowActions(anchor, items) {
        if (!rowActionMenu) {
            rowActionMenu = document.createElement('div');
            rowActionMenu.id = 'rowActionMenu';
            rowActionMenu.className = 'action-dropdown';
            document.body.appendChild(rowActionMenu);
            document.addEventListener('click', () => closeRowActions());
            window.addEventListener('scroll', closeRowActions, { passive: true });
            window.addEventListener('resize', closeRowActions, { passive: true });
        }
        rowActionMenu.innerHTML = '';
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dropdown-item' + (item.color === 'var(--danger)' ? ' danger' : '');
            btn.innerHTML = `<i class="fas ${item.icon}" style="color:${item.color || 'var(--text-light)'}"></i><span>${item.label}</span>`;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeRowActions();
                item.action();
            });
            rowActionMenu.appendChild(btn);
        });

        const rect = anchor.getBoundingClientRect();
        rowActionMenu.style.display = 'block';
        rowActionMenu.style.left = Math.max(8, rect.left + rect.width - 190) + 'px';
        rowActionMenu.style.top = (rect.bottom + 6) + 'px';

        const menuRect = rowActionMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth - 8) {
            rowActionMenu.style.left = Math.max(8, window.innerWidth - menuRect.width - 8) + 'px';
        }
        if (menuRect.bottom > window.innerHeight - 8) {
            rowActionMenu.style.top = Math.max(8, rect.top - menuRect.height - 6) + 'px';
        }
    }

    function closeRowActions() {
        if (rowActionMenu) rowActionMenu.style.display = 'none';
    }

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    window.showModal = showModal;
    window.hideModal = hideModal;
})();
