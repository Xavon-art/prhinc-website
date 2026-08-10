export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { name, email, type, reason, batch, start_date, end_date } = await request.json();

    if (!name || !email || !type) {
      return new Response(JSON.stringify({ error: 'name, email, and type are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    let subject, message;
    if (type === 'approved') {
      subject = 'Application Approved - Palayan Recruitment Hub Inc.';
      message = `Greetings from Palayan Recruitment Hub Inc.!\n\nWe are pleased to inform you that your application for our Free Call Center Training Program has been carefully reviewed and evaluated. After thorough consideration, we are delighted to inform you that your application has been APPROVED.\n\nCongratulations! You have been selected to participate in this prestigious training program. Please wait for about 2 to 3 business days as our team will be coordinating with you to provide your schedule and batch assignment. Rest assured that we will do our best to accommodate you in the most suitable batch.\n\nTo ensure that you will receive all important updates and announcements, please make sure that your contact number is open and accessible during business hours (Monday to Friday, 8:00 AM to 5:00 PM). Our team will be reaching out to you through the contact information you have provided.\n\nOnce again, congratulations and welcome to Palayan Recruitment Hub Inc.! We are excited to have you on board and we look forward to seeing you succeed in your call center career journey.\n\nShould you have any questions or concerns, please do not hesitate to reach out to us. We are here to support you every step of the way.\n\nBest regards,\nPalayan Recruitment Hub Inc.\nManagement Team`;
    } else if (type === 'rejected') {
      subject = 'Application Status Update - Palayan Recruitment Hub Inc.';
      message = `Greetings from Palayan Recruitment Hub Inc.!\n\nWe sincerely thank you for taking the time to apply for our Free Call Center Training Program. We truly appreciate the interest you have shown in this opportunity and the effort you put into your application.\n\nAfter a careful and thorough review of your application, we regret to inform you that your application has not been approved at this time.\n\n`;
      if (reason) {
        message += `Below is the reason for this decision:\n\n${reason}\n\n`;
      }
      message += `Please know that this decision does not diminish the value of your interest and effort. We encourage you to continue pursuing your goals and to consider applying again in the future when new opportunities become available.\n\nWe are looking forward to seeing you again in our future programs and initiatives. Your determination and willingness to grow are qualities that we truly admire.\n\nThank you once again for choosing Palayan Recruitment Hub Inc. We wish you all the best in your future endeavors.\n\nWith warm regards,\nPalayan Recruitment Hub Inc.\nManagement Team`;
    } else if (type === 'added_to_class') {
      const fmt = (d) => {
        if (!d) return 'To be announced';
        const date = new Date(d);
        if (isNaN(date)) return d;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };
      subject = 'You Are Now Enrolled in a Class - Palayan Recruitment Hub Inc.';
      message = `Dear ${name},\n\nWe are pleased to inform you that you have been added to the ${batch || 'class'} for our Free Call Center Training Program.\n\nClass Schedule:\n  Start Date: ${fmt(start_date)}\n  End Date: ${fmt(end_date)}\n\nPlease take note of these dates and make sure that you are available for the entire duration of the training. Our team will reach out to you for further instructions.\n\nShould you have any questions or concerns, please do not hesitate to reach out to us.\n\nBest regards,\nPalayan Recruitment Hub Inc.\nManagement Team`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
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
