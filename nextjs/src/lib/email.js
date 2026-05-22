const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_c4fhnln';
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
const USER_ID = process.env.EMAILJS_USER_ID || '';

async function emailjsSend(payload) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`EmailJS send failed: ${res.status} ${text}`);
    }

    return res.json();
}

export async function sendContactEmails({ name, email, subject, message }) {
    if (!USER_ID) {
        console.warn('EMAILJS_USER_ID not set; EmailJS requests may fail. Set EMAILJS_USER_ID in .env.local');
    }

    if (!TEMPLATE_ID) {
        console.warn('EMAILJS_TEMPLATE_ID not set; template is empty. Fill EMAILJS_TEMPLATE_ID later in .env.local');
    }

    const template_params = {
        from_name: name,
        from_email: email,
        subject,
        message,
    };

    const payload = {
        service_id: 'service_c4fhnln',
        template_id: 'template_wgpenlh',
        user_id: 'jqNiA2DaDPWarti_7',
        template_params,
    };

    return emailjsSend(payload);
}
