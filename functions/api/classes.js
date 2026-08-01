import { tursoQuery, tursoSelect } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function parseTrainees(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
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
        const traineeIds = parseTrainees(c.trainees);
        let trainees = [];
        if (traineeIds.length > 0) {
          const placeholders = traineeIds.map(() => '?').join(',');
          trainees = await tursoSelect(
            `SELECT id, name, email, phone FROM registrations WHERE id IN (${placeholders})`, traineeIds
          );
        }
        return json({ success: true, class: { ...c, trainees } });
      }

      const rows = await tursoSelect("SELECT * FROM classes ORDER BY created_at DESC");
      const list = rows.map(c => ({ ...c, trainee_count: parseTrainees(c.trainees).length }));
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
        'INSERT INTO classes (id, name, start_date, end_date, trainer, trainees, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, start_date || null, end_date || null, trainer || null, JSON.stringify(trainees || []), new Date().toISOString()]
      );
      return json({ success: true, id });
    }

    if (action === 'delete') {
      const { id } = body;
      await tursoQuery('DELETE FROM classes WHERE id = ?', [id]);
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
