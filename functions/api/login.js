import { tursoSelect, hashPassword } from '../_turso.js';

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const users = await tursoSelect(
      'SELECT username, role FROM users WHERE username = ? AND password = ? AND deleted_at IS NULL',
      [username, await hashPassword(password)]
    );

    if (users.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, user: users[0] }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
