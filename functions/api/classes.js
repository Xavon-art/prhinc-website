import { tursoQuery, tursoSelect } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (id) {
        const classes = await tursoSelect("SELECT * FROM classes WHERE id = ?", [id]);
        if (classes.length === 0) return json({ error: 'Class not found' }, 404);
        const c = classes[0];
        const trainees = await tursoSelect(
          `SELECT r.id, r.name, r.email, r.phone FROM class_trainees ct
           JOIN registrations r ON r.id = ct.registration_id
           WHERE ct.class_id = ?`, [id]
        );
        return json({ success: true, class: { ...c, trainees } });
      }

      const rows = await tursoSelect("SELECT * FROM classes ORDER BY created_at DESC");
      const list = [];
      for (const c of rows) {
        const count = await tursoSelect(
          "SELECT COUNT(*) AS n FROM class_trainees WHERE class_id = ?", [c.id]
        );
        list.push({ ...c, trainee_count: Number(count[0].n || 0) });
      }
      return json({ success: true, classes: list });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, start_date, end_date, trainer, trainees } = body;
      if (!name) return json({ error: 'Class name required' }, 400);
      const id = 'cls_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await tursoQuery(
        'INSERT INTO classes (id, name, start_date, end_date, trainer, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, start_date || null, end_date || null, trainer || null, new Date().toISOString()]
      );
      if (Array.isArray(trainees) && trainees.length > 0) {
        for (const regId of trainees) {
          await tursoQuery(
            'INSERT OR IGNORE INTO class_trainees (class_id, registration_id) VALUES (?, ?)', [id, regId]
          );
        }
      }
      return json({ success: true, id });
    }

    if (action === 'delete') {
      const { id } = body;
      await tursoQuery('DELETE FROM class_trainees WHERE class_id = ?', [id]);
      await tursoQuery('DELETE FROM classes WHERE id = ?', [id]);
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
