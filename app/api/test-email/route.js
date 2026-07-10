import { Resend } from 'resend';

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request) {
  try {
    const data = await resend.emails.send({
      from: 'hello@drippmedia.com', // Using your newly verified domain
      to: 'gs335860@gmail.com',
      subject: 'Hello World from DrippMedia!',
      html: '<p>Congrats on sending your <strong>first email</strong> with your verified domain!</p>'
    });

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Email sending failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
