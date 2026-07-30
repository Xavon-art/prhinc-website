export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { name, email, type, reason } = await request.json();

    if (!name || !email || !type) {
      return new Response(JSON.stringify({ error: 'name, email, and type are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    let subject, message;
    if (type === 'approved') {
      subject = 'Application Approved - Palayan Recruitment Hub Inc.';
      message = `Congratulations ${name}! Your application for free call center training is approved! Just wait for about 2 to 3 business days so that the team will give you a schedule for your batch. Please make sure you will open your line during business hours.`;
    } else if (type === 'rejected') {
      subject = 'Application Status Update - Palayan Recruitment Hub Inc.';
      message = `Dear ${name},\n\nWe sincerely appreciate your interest in our free call center training program. After careful review, we regret to inform you that your application has not been approved at this time.\n\n`;
      if (reason) {
        message += `Reason: ${reason}\n\n`;
      }
      message += `We are looking forward to see you again in our future programs. Thank you for your understanding.\n\nBest regards,\nPalayan Recruitment Hub Inc.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const publicKey = env.EMAILJS_PUBLIC_KEY || '5iXC21YCopm6SoX41';
    const privateKey = env.EMAILJS_PRIVATE_KEY || '8ZTAAG2_IH4M0758Ofi88';
    const serviceId = env.EMAILJS_SERVICE_ID || 'service_ytxgc1i';
    const templateId = env.EMAILJS_NOTIFICATION_TEMPLATE_ID || 'template_5mjdcrn';

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: publicKey,
        accessToken: privateKey,
        service_id: serviceId,
        template_id: templateId,
        template_params: { name, email, subject, message }
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: text || resp.statusText }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, type }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
