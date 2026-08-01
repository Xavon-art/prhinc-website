import { tursoQuery, tursoSelect } from '../_turso.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { request } = context;

  try {
    if (request.method === 'GET') {
      const trainers = await tursoSelect("SELECT name, email FROM trainers ORDER BY name ASC");
      return json({ success: true, trainers });
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, email } = body;
      if (!name) return json({ error: 'Trainer name required' }, 400);
      const existing = await tursoSelect("SELECT name FROM trainers WHERE name = ?", [name]);
      if (existing.length > 0) return json({ error: 'Trainer already exists' }, 409);
      await tursoQuery('INSERT INTO trainers (name, email) VALUES (?, ?)', [name, email || null]);
      return json({ success: true });
    }

    if (action === 'delete') {
      const { name } = body;
      if (!name) return json({ error: 'Trainer name required' }, 400);
      await tursoQuery("UPDATE classes SET trainer = NULL WHERE trainer = ?", [name]);
      await tursoQuery('DELETE FROM trainers WHERE name = ?', [name]);
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
