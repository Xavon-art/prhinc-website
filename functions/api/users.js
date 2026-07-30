import { tursoQuery, tursoSelect, hashPassword } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const users = await tursoSelect(
        "SELECT id, username, role, created_by, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC"
      );
      return json({ success: true, users });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { action, username, password, role } = body;
    const adminUser = body.adminUser;

    // Verify admin
    const admins = await tursoSelect(
      "SELECT username FROM users WHERE username = ? AND role = 'admin' AND deleted_at IS NULL",
      [adminUser]
    );
    const isAdmin = admins.length > 0;

    if (action === 'create') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      const hash = await hashPassword(password);
      const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await tursoQuery(
        'INSERT INTO users (id, username, password, role, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, username, hash, role || 'clerk', adminUser, new Date().toISOString()]
      );
      return json({ success: true });
    }

    if (action === 'delete') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      if (username === adminUser) return json({ error: 'Cannot delete yourself' }, 400);
      await tursoQuery(
        "UPDATE users SET deleted_at = ?, deleted_by = ? WHERE username = ? AND deleted_at IS NULL",
        [new Date().toISOString(), adminUser, username]
      );
      return json({ success: true });
    }

    if (action === 'hard-delete') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      await tursoQuery("DELETE FROM users WHERE username = ? AND deleted_at IS NOT NULL", [username]);
      return json({ success: true });
    }

    if (action === 'list-trash') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      const items = await tursoSelect(
        "SELECT username, role, deleted_at, deleted_by FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
      );
      return json({ success: true, users: items });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
