import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { quoteId, pdfBase64, clientName, clientEmail, type } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Missing PDF data' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // We send to both the Admin and the Client
    const adminEmail = 'mediadripp@gmail.com';
    const toEmails = [adminEmail];
    
    // Add client email if available and valid
    if (clientEmail && clientEmail.includes('@')) {
      toEmails.push(clientEmail);
    }

    const subject = `Signed ${type} - ${clientName} (Dripp Media)`;

    // Note: The 'from' address must be verified in your Resend account.
    // If you haven't verified drippmedia.com on Resend yet, this will need to be updated.
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'proposals@drippmedia.com';

    // HTML Email template
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background-color: #050505; padding: 30px; text-align: center; border-bottom: 2px solid #ebd73f;">
            <h1 style="color: #ebd73f; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">DRIPP MEDIA</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #111; margin-top: 0;">Proposal Accepted & Signed</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">Hi ${clientName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">Thank you for accepting and signing the <strong>${type.toLowerCase()}</strong>. A formalized PDF copy of your signed document has been attached to this email for your records.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">We are excited to move forward. If you have any immediate questions, please reply directly to this email.</p>
            <br/>
            <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 0;">Best regards,<br/><strong style="color: #111;">The Dripp Media Team</strong></p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Dripp Media. All rights reserved.
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: `Dripp Media <${senderEmail}>`,
      to: toEmails,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${type}_${clientName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (data.error) {
      console.error('Resend Error:', data.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
