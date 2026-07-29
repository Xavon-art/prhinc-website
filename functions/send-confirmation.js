export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { name, email, phone, address, education } = await request.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const publicKey = env.EMAILJS_PUBLIC_KEY || 'cccXg_g73Uva0VhHy';
    const serviceId = env.EMAILJS_SERVICE_ID || 'service_9x384tl';
    const templateId = env.EMAILJS_TEMPLATE_ID || 'template_prhinc';

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: publicKey,
        service_id: serviceId,
        template_id: templateId,
        template_params: { name, email, phone, address, education }
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: text || resp.statusText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
