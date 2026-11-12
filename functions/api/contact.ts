interface Env {
  WEB3FORMS_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_EMAIL?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const request = context.request;
    const contentType = request.headers.get('content-type') || '';
    
    let name = '';
    let email = '';
    let subject = '';
    let message = '';
    let honeypot = '';

    if (contentType.includes('application/json')) {
      const data = (await request.json().catch(() => ({}))) as Record<string, any>;
      name = data.name || '';
      email = data.email || '';
      subject = data.subject || '';
      message = data.message || '';
      honeypot = data._gotcha || data.botcheck || '';
    } else {
      const formData = await request.formData();
      name = String(formData.get('name') || '');
      email = String(formData.get('email') || '');
      subject = String(formData.get('subject') || '');
      message = String(formData.get('message') || '');
      honeypot = String(formData.get('_gotcha') || formData.get('botcheck') || '');
    }

    // 1. Spam protection: Honeypot check
    if (honeypot && honeypot.trim().length > 0) {
      return new Response(JSON.stringify({ success: true, message: 'Message received.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Server-side validation
    name = name.trim();
    email = email.trim().toLowerCase();
    subject = subject.trim();
    message = message.trim();

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a valid name (at least 2 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Please provide a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!subject || subject.length < 3) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a subject (at least 3 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!message || message.length < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a message (at least 10 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 5000) {
      return new Response(JSON.stringify({ success: false, error: 'Message exceeds maximum length of 5000 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Provider dispatch via server-side secrets
    const web3formsKey = context.env.WEB3FORMS_KEY;
    const resendApiKey = context.env.RESEND_API_KEY;
    const contactEmail = context.env.CONTACT_EMAIL || '';

    if (resendApiKey && contactEmail) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Signal Insight Contact Desk <contact@signal-insight.pages.dev>',
          to: [contactEmail],
          reply_to: email,
          subject: `[Signal Insight Contact] ${subject} - from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        }),
      });

      if (!resendRes.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to deliver message via email provider. Please submit your inquiry via GitHub Issues or the Contact Composer.' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Your message has been delivered to the Signal Insight editorial desk.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (web3formsKey) {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: web3formsKey,
          name,
          email,
          subject: `[Signal Insight] ${subject}`,
          message,
          from_name: 'Signal Insight Contact Desk',
        }),
      });

      const w3Json = (await w3Res.json().catch(() => ({}))) as Record<string, any>;
      if (w3Json.success) {
        return new Response(JSON.stringify({ success: true, message: 'Your message has been delivered to the Signal Insight editorial desk.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: w3Json.message || 'Delivery error via provider. Please email us directly.' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Graceful fallback when server-side secret has not yet been set in Cloudflare dashboard
    return new Response(JSON.stringify({
      success: true,
      message: 'Your message has been validated and accepted by the server. (Note: Server-side email delivery credentials are not configured; please use the Contact Composer to copy your message or submit via GitHub Issues).',
      configured: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'An unexpected server error occurred processing your request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
