import { Resend } from 'resend';

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] RESEND_API_KEY is not set');
    return null;
  }
  return new Resend(key);
};

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

export async function sendWelcomeEmail(email, name, nature) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  let title = 'Welcome to Dripp Media.';
  let p1 = `We're thrilled to have you join us, ${name || 'friend'}.`;
  let p2 = "Step into the future of media, entertainment, and digital experiences.";
  let btnText = 'Explore Dripp Media';
  let btnLink = 'https://drippmedia.com';

  if (nature?.toLowerCase() === 'creator') {
    title = 'Ready to elevate your content?';
    p1 = `Welcome to the creator hub, ${name || 'creator'}.`;
    p2 = "We provide the tools, community, and platform you need to take your content to the absolute next level. Let's build something amazing together.";
    btnText = 'Start Creating';
  } else if (nature?.toLowerCase() === 'business') {
    title = 'Ready to scale your brand?';
    p1 = `Welcome aboard, ${name || 'partner'}.`;
    p2 = "Dripp Media is dedicated to helping businesses amplify their reach and dominate their niche with cutting-edge digital strategies.";
    btnText = 'Grow Your Brand';
  }

  try {
    const html = getHtmlLayout(`
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">${title}</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">${p1}</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 40px;">${p2}</p>
      <div style="text-align: center;">
        <a href="${btnLink}" style="display: inline-block; background: #ebd73f; border-bottom: 5px solid #a69420; color: #000000; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 20px rgba(235, 215, 63, 0.3); font-family: 'Panchang', sans-serif;">
          ${btnText}
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: 'Welcome to Dripp Media',
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[email] Welcome email failed:', error);
    return { success: false, error };
  }
}

export async function sendHighScoreEmail(email, score) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  try {
    const html = getHtmlLayout(`
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 48px;">🏆</span>
      </div>
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 20px; text-align: center; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">New High Score!</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px; text-align: center;">
        Incredible performance! You just set a new personal best of <strong style="color: #ebd73f; font-size: 18px;">${score} points</strong>.
      </p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 40px; text-align: center;">
        The competition is fierce. Hop back in to defend your position and aim even higher!
      </p>
      <div style="text-align: center;">
        <a href="https://drippmedia.com/arcade" style="display: inline-block; background: #ebd73f; border-bottom: 5px solid #a69420; color: #000000; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 20px rgba(235, 215, 63, 0.3); font-family: 'Panchang', sans-serif;">
          Defend Your Score
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: `New High Score: ${score}!`,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[email] High score email failed:', error);
    return { success: false, error };
  }
}

export async function sendReminderEmail(email, name) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  try {
    const html = getHtmlLayout(`
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">Hey ${name || 'Player'}, it's been a while! 👋</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
        The leaderboard has been shifting since you last played Dripp Drop. Others might be coming for your spot!
      </p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 40px;">
        We thought you might want to jump back in and show them how it's done.
      </p>
      <div style="text-align: center;">
        <a href="https://drippmedia.com/arcade" style="display: inline-block; background: #ebd73f; border-bottom: 5px solid #a69420; color: #000000; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 20px rgba(235, 215, 63, 0.3); font-family: 'Panchang', sans-serif;">
          Return to Arcade
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: 'Ready to beat your high score?',
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[email] Reminder email failed:', error);
    return { success: false, error };
  }
}

export async function sendCustomAdminEmail(to, subject, title, body, templateType = 'announcement') {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

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

    const data = await resend.emails.send({
      from: SENDER,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[email] Custom admin email failed:', error);
    return { success: false, error };
  }
}
