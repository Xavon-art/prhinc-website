import { tursoQuery, tursoSelect, hashPassword } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const trash = url.searchParams.get('trash') === '1';

      let sql;
      if (trash) {
        sql = "SELECT id, username, role, deleted_at, deleted_by FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
      } else {
        sql = "SELECT id, username, role, created_by, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC";
      }

      const users = await tursoSelect(sql);
      return json({ success: true, users });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { action, id } = body;
    const requester = body.created_by || body.deleted_by || body.username;

    // Verify requester exists and is admin
    const admins = await tursoSelect(
      "SELECT role FROM users WHERE username = ? AND deleted_at IS NULL", [requester]
    );
    const isAdmin = admins.length > 0 && admins[0].role === 'admin';

    if (action === 'create') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      const hash = await hashPassword(body.password);
      const newId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await tursoQuery(
        'INSERT INTO users (id, username, password, role, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newId, body.username, hash, body.role || 'clerk', requester, new Date().toISOString()]
      );
      return json({ success: true });
    }

    if (action === 'delete') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      const rows = await tursoSelect("SELECT username FROM users WHERE id = ? AND deleted_at IS NULL", [id]);
      if (rows.length === 0) return json({ error: 'User not found' }, 404);
      if (rows[0].username === requester) return json({ error: 'Cannot delete yourself' }, 400);
      await tursoQuery(
        "UPDATE users SET deleted_at = ?, deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
        [new Date().toISOString(), requester, id]
      );
      return json({ success: true });
    }

    if (action === 'restore') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      await tursoQuery(
        "UPDATE users SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL", [id]
      );
      return json({ success: true });
    }

    if (action === 'hard_delete') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 403);
      await tursoQuery("DELETE FROM users WHERE id = ? AND deleted_at IS NOT NULL", [id]);
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
