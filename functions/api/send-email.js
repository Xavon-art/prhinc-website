export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { name, email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'email, subject, and message are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const publicKey = env.EMAILJS_PUBLIC_KEY || '5iXC21YCopm6SoX41';
    const privateKey = env.EMAILJS_PRIVATE_KEY || '8ZTAAG2_IH4M0758Ofi88';
    const serviceId = env.EMAILJS_SERVICE_ID || 'service_ytxgc1i';
    const templateId = env.EMAILJS_NOTIFICATION_TEMPLATE_ID || 'template_ffjdjan';

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: publicKey,
        accessToken: privateKey,
        service_id: serviceId,
        template_id: templateId,
        template_params: { name: name || 'Valued Applicant', email, subject, message }
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: text || resp.statusText }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
