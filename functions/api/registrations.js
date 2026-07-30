import { tursoQuery, tursoSelect } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const filter = url.searchParams.get('filter') || 'active';
      const statusFilter = url.searchParams.get('status') || '';

      let sql, args;
      if (filter === 'trash') {
        sql = "SELECT * FROM registrations WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC";
        args = [];
      } else {
        sql = "SELECT * FROM registrations WHERE deleted_at IS NULL";
        args = [];
        if (statusFilter && statusFilter !== 'all') {
          sql += " AND status = ?";
          args.push(statusFilter);
        }
        sql += " ORDER BY registration_date DESC";
      }

      const rows = await tursoSelect(sql, args);
      return json({ success: true, registrations: rows });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { action, id } = body;
    const username = body.username || body.updated_by || body.deleted_by;

    if (!username) return json({ error: 'Username required' }, 400);

    // Verify user exists
    const users = await tursoSelect(
      "SELECT role FROM users WHERE username = ? AND deleted_at IS NULL", [username]
    );
    if (users.length === 0) return json({ error: 'Unauthorized' }, 403);
    const isAdmin = users[0].role === 'admin';

    if (action === 'update_status') {
      const { status } = body;
      if (!['approved', 'rejected'].includes(status)) return json({ error: 'Invalid status' }, 400);
      await tursoQuery("UPDATE registrations SET status = ? WHERE id = ?", [status, id]);
      return json({ success: true });
    }

    if (action === 'batch') {
      const { batch } = body;
      await tursoQuery("UPDATE registrations SET batch = ? WHERE id = ?", [batch, id]);
      return json({ success: true });
    }

    if (action === 'delete') {
      await tursoQuery(
        "UPDATE registrations SET deleted_at = ?, deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
        [new Date().toISOString(), username, id]
      );
      return json({ success: true });
    }

    if (action === 'hard_delete') {
      if (!isAdmin) return json({ error: 'Only admin can permanently delete' }, 403);
      await tursoQuery("DELETE FROM registrations WHERE id = ? AND deleted_at IS NOT NULL", [id]);
      return json({ success: true });
    }

    if (action === 'restore') {
      await tursoQuery("UPDATE registrations SET deleted_at = NULL, deleted_by = NULL WHERE id = ?", [id]);
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
