import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = 'gs335860@gmail.com';
const SENDER = 'Dripp Media <hello@drippmedia.com>';

const getHtmlLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #09090b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);">
          <!-- Glowing Top Border (Dripp Gold) -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #ebd73f, #fff, #c7b320);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 20px 40px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-transform: uppercase; font-family: 'Panchang', sans-serif;">
                <span style="color: #ebd73f;">DRIPP</span><span style="color: #ffffff;">MEDIA</span>
              </h1>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 20px 40px 48px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #050505; padding: 32px; border-top: 1px solid #18181b;">
              <p style="margin: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; font-family: 'Panchang', sans-serif;">
                © ${new Date().getFullYear()} Dripp Media
              </p>
              <p style="margin: 12px 0 0 0; color: #52525b; font-size: 13px;">
                Designed for the future of digital experiences.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

async function sendCustomAdminEmail(subject, title, body, templateType) {
  const formattedBody = body.replace(/\n/g, '<br/>');

  let accentColor = '#ebd73f'; 
  let btnBg = '#ebd73f';
  let btnBorderBottom = '5px solid #a69420';
  let btnColor = '#000000';
  let shadowColor = 'rgba(235, 215, 63, 0.3)';

  if (templateType === 'promo') {
    accentColor = '#ebd73f'; // Force gold for promo as requested
  } else if (templateType === 'newsletter') {
    accentColor = '#ffffff'; 
    btnBg = '#ffffff';
    btnBorderBottom = '5px solid #a1a1aa';
    btnColor = '#000000';
    shadowColor = 'rgba(255, 255, 255, 0.15)';
  }

  try {
    const html = getHtmlLayout(`
      <div style="border-left: 4px solid ${accentColor}; padding-left: 20px; margin-bottom: 32px;">
        <h2 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">${title}</h2>
      </div>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
        ${formattedBody}
      </p>
      ${
        templateType === 'promo' 
        ? `<div style="text-align: center; margin-top: 48px;"><a href="https://drippmedia.com" style="display: inline-block; background: ${btnBg}; border-bottom: ${btnBorderBottom}; color: ${btnColor}; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 20px ${shadowColor}; font-family: 'Panchang', sans-serif;">Claim Offer</a></div>`
        : ''
      }
      ${
        templateType === 'announcement'
        ? `<div style="text-align: center; margin-top: 48px;"><a href="https://drippmedia.com" style="display: inline-block; background: ${btnBg}; border-bottom: ${btnBorderBottom}; color: ${btnColor}; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 20px ${shadowColor}; font-family: 'Panchang', sans-serif;">View Details</a></div>`
        : ''
      }
    `);

    await resend.emails.send({
      from: SENDER,
      to: TO,
      subject,
      html,
    });
    console.log('Sent:', subject);
  } catch (error) {
    console.error('Failed:', error);
  }
}

async function run() {
  console.log('Dispatching ELITE test emails with 3D buttons to', TO);

  await sendCustomAdminEmail(
    'The rules of the game just changed.',
    'Welcome to the Next Era.',
    "For the last six months, we've been quietly building something that will fundamentally alter how you interact with your audience.\n\nThis isn't just an update. It's a complete paradigm shift. We've stripped away the noise and engineered a platform designed purely for undeniable growth. It's time to step into the future. Are you ready?",
    'announcement'
  );

  await sendCustomAdminEmail(
    'An unfair advantage, exclusively for you.',
    'Scale Without Limits.',
    "In this industry, momentum is everything. Right now, you have an opportunity to seize an unfair advantage that most of your competitors will never see coming.\n\nWe are unlocking our most powerful suite of tools for you at half the standard investment. This isn't just a discount; it's a strategic alliance. Claim your access before the window closes.",
    'promo'
  );

  console.log('Tests dispatched!');
}

run();
