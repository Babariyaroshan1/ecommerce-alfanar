import { sendContactEmails } from '../../../lib/email';

export async function POST(req) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({ message: 'All fields are required' }),
                { status: 400 }
            );
        }

        await sendContactEmails({ name, email, subject, message });

        return new Response(
            JSON.stringify({ message: 'Message sent successfully' }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        return new Response(
            JSON.stringify({ message: 'Failed to send message' }),
            { status: 500 }
        );
    }
}
