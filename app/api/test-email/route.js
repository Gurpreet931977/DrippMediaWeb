import { Resend } from 'resend';

// NOTE: Replace 're_xxxxxxxxx' with your real API key from Resend
const resend = new Resend('re_xxxxxxxxx');

export async function GET(request) {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gs335860@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Email sending failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
