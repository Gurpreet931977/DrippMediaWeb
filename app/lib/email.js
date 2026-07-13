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
    
    .cta-btn {
      transition: all 0.2s ease-in-out !important;
    }
    .cta-btn:hover {
      transform: translateY(-2px) !important;
      filter: brightness(1.1) !important;
    }
    .cta-btn:active {
      transform: translateY(2px) !important;
      border-bottom-width: 2px !important;
      margin-top: 4px !important;
    }
    
    @keyframes pulseGlow {
      0% { box-shadow: 0 10px 25px rgba(235, 215, 63, 0.4); }
      50% { box-shadow: 0 15px 40px rgba(235, 215, 63, 0.7); }
      100% { box-shadow: 0 10px 25px rgba(235, 215, 63, 0.4); }
    }
    .animate-pulse-gold {
      animation: pulseGlow 2s infinite ease-in-out !important;
    }
    @keyframes arrowBounce {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(6px); }
    }
    .arrow-move {
      display: inline-block;
      animation: arrowBounce 1.5s infinite;
      margin-left: 6px;
      vertical-align: middle;
      position: relative;
      top: -2px;
    }
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

// Universal 3D Dripp Gold Button
const render3DButton = (text, link) => {
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding-top: 24px;">
          <div>
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:60px;v-text-anchor:middle;width:340px;" arcsize="20%" strokecolor="#8a7b18" strokeweight="4pt" fillcolor="#ebd73f">
              <w:anchorlock/>
              <center style="color:#000000;font-family:'Panchang', sans-serif, Arial;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">${text}</center>
            </v:roundrect>
            <![endif]-->
            <a href="${link}" class="cta-btn animate-pulse-gold" style="background-color:#ebd73f; border-bottom: 6px solid #8a7b18; border-right: 2px solid #bba81c; border-top: 1px solid #fce844; border-left: 1px solid #fce844; border-radius:12px; color:#000000; display:inline-block; font-family:'Panchang', sans-serif, Arial; font-size:14px; font-weight:800; padding: 20px 40px; text-align:center; text-decoration:none; -webkit-text-size-adjust:none; mso-hide:all; box-shadow: 0 10px 25px rgba(235, 215, 63, 0.5); text-transform:uppercase; letter-spacing: 1px;">
              ${text} <span class="arrow-move">&rarr;</span>
            </a>
          </div>
        </td>
      </tr>
    </table>
  `;
};

export async function sendWelcomeEmail(email, name, nature) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };
  
  let title = 'Welcome to Dripp Media.';
  let p1 = `Welcome to the team, ${name || 'friend'}. Most people just watch videos. You just took the first step to creating them.`;
  let p2 = "Dripp Media is the best place to grow your brand. We give you the same tools and secrets that top creators use to get millions of views. The only question is: what will you build with them?";
  let btnText = 'Get Started Now';
  
  if (nature?.toLowerCase() === 'creator') {
    title = 'Ready to grow your audience?';
    p1 = `You are here because you want more views, more fans, and more growth. Welcome to the creator hub, ${name || 'creator'}.`;
    p2 = "It is hard to get noticed online today. That is why we built a clear, proven system to help you beat the algorithm and turn your viewers into loyal fans. It is time to take your channel to the next level.";
    btnText = 'Grow Your Channel';
  } else if (nature?.toLowerCase() === 'business') {
    title = "Let's grow your business.";
    p1 = `Welcome to your new growth partner, ${name || 'partner'}.`;
    p2 = "Standard marketing does not work like it used to. At Dripp Media, we help you cut through the noise and reach the right customers. We bring you clear strategies that actually bring in sales. Let's start building your business together.";
    btnText = 'Boost Your Sales';
  }
  
  try {
    const html = getHtmlLayout(`
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">${title}</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">${p1}</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">${p2}</p>
      ${render3DButton(btnText, 'https://drippmedia.com')}
    `);
    const data = await resend.emails.send({ from: SENDER, to: email, subject: 'Welcome to Dripp Media', html });
    return { success: true, data };
  } catch (error) { return { success: false, error }; }
}

export async function sendHighScoreEmail(email, score) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };
  try {
    const html = getHtmlLayout(`
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 20px; text-align: center; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">You just set a new record.</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px; text-align: center;">Amazing job! You just set a brand new personal best of <strong style="color: #ebd73f; font-size: 18px;">${score} points</strong>.</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px; text-align: center;">But watch out-the competition is close behind you. They are playing right now to beat your score. You proved you can reach the top spot. Now, prove you can keep it.</p>
      ${render3DButton('Play Again', 'https://drippmedia.com')}
    `);
    const data = await resend.emails.send({ from: SENDER, to: email, subject: `New High Score: ${score}!`, html });
    return { success: true, data };
  } catch (error) { return { success: false, error }; }
}

export async function sendReminderEmail(email, name) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };
  try {
    const html = getHtmlLayout(`
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">Someone might beat your score.</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">It has been a while since you played! The leaderboard has changed while you were away.</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">If you do not play, someone else will take your spot. Other players are getting closer to beating your high score right now. Do not let them win so easily.</p>
      ${render3DButton('Return To Game', 'https://drippmedia.com')}
    `);
    const data = await resend.emails.send({ from: SENDER, to: email, subject: 'Ready to beat your high score?', html });
    return { success: true, data };
  } catch (error) { return { success: false, error }; }
}

// ── 5 DISTINCT PREMIUM GOLD LAYOUTS ───────────────────────────────────────────
export function getCustomAdminEmailPayload(to, subject, title, body, templateType = 'announcement', scheduledAt = null) {
  const pBody = body.split('\n\n').map(p => `<p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">${p.replace(/\n/g, '<br/>')}</p>`).join('');

  let innerContent = '';
  const btnLink = 'https://drippmedia.com';

  if (templateType === 'announcement') {
    // 1. Announcement: Minimal, centered, gold accent line
    innerContent = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 4px; background-color: #ebd73f; margin: 0 auto 24px auto; border-radius: 2px;"></div>
        <h2 style="color: #ffffff; font-size: 32px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">${title}</h2>
        <div style="text-align: left; padding: 0 10px;">
          ${pBody}
        </div>
        ${render3DButton('View Details', btnLink)}
      </div>
    `;
  } else if (templateType === 'promo') {
    // 2. Promo: Heavy Gold Block Header
    innerContent = `
      <div style="background-color: #ebd73f; padding: 32px; border-radius: 16px; margin-bottom: 32px; text-align: center; box-shadow: 0 15px 30px rgba(235, 215, 63, 0.15);">
        <h2 style="color: #000000; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif; text-transform: uppercase;">${title}</h2>
      </div>
      ${pBody}
      ${render3DButton('Claim Offer', btnLink)}
    `;
  } else if (templateType === 'newsletter') {
    // 3. Newsletter: Left aligned editorial, multiple gold dividers
    innerContent = `
      <h2 style="color: #ebd73f; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 700; font-family: 'Panchang', sans-serif; text-transform: uppercase; letter-spacing: 2px;">${title}</h2>
      <div style="height: 1px; background-color: rgba(235, 215, 63, 0.3); margin-bottom: 24px;"></div>
      ${pBody}
      <div style="height: 1px; background-color: rgba(235, 215, 63, 0.3); margin-top: 24px; margin-bottom: 24px;"></div>
      ${render3DButton('Read More', btnLink)}
    `;
  } else if (templateType === 'invitation') {
    // 4. Invitation: Exclusive bordered VIP box
    innerContent = `
      <div style="border: 2px dashed #ebd73f; border-radius: 16px; padding: 40px 24px; text-align: center;">
        <span style="display: inline-block; background-color: rgba(235, 215, 63, 0.1); color: #ebd73f; font-size: 12px; font-weight: 700; font-family: 'Panchang', sans-serif; padding: 6px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px;">VIP Access</span>
        <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">${title}</h2>
        <div style="text-align: left;">
          ${pBody}
        </div>
        ${render3DButton('Accept Invitation', btnLink)}
      </div>
    `;
  } else if (templateType === 'alert') {
    // 5. Urgent Alert: High contrast hazard/warning style
    innerContent = `
      <div style="border-left: 6px solid #ebd73f; background-color: rgba(235, 215, 63, 0.05); padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
        <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
          <tr>
            <td valign="middle" style="padding-right: 8px; font-size: 24px; line-height: 1;">⚠️</td>
            <td valign="middle">
              <h2 style="color: #ebd73f; font-size: 24px; margin: 0; font-weight: 700; font-family: 'Panchang', sans-serif; text-transform: uppercase; line-height: 1.2;">${title}</h2>
            </td>
          </tr>
        </table>
        <div style="color: #ffffff; font-weight: 500; font-size: 15px;">
          ${pBody}
        </div>
      </div>
      ${render3DButton('Act Immediately', btnLink)}
    `;
  } else if (templateType === 'primary') {
    // 6. Primary Inbox: Minimal, personal plain-text feel
    innerContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #111111; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${title ? `<h3 style="font-size: 18px; margin-bottom: 20px; font-weight: 600;">${title}</h3>` : ''}
        ${body.split('\n\n').map(p => `<p style="margin-bottom: 16px;">${p.replace(/\n/g, '<br/>')}</p>`).join('')}
      </div>
    `;
  }

  const html = templateType === 'primary' ? innerContent : getHtmlLayout(innerContent);
  const payload = {
    from: SENDER,
    to,
    subject,
    html,
  };
  
  if (scheduledAt) {
    payload.scheduled_at = scheduledAt;
  }
  return payload;
}

export async function sendCustomAdminEmail(to, subject, title, body, templateType = 'announcement', scheduledAt = null) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  try {
    const payload = getCustomAdminEmailPayload(to, subject, title, body, templateType, scheduledAt);
    const data = await resend.emails.send(payload);
    if (data.error) {
      console.error('[email] Resend API Error:', data.error);
      return { success: false, error: data.error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('[email] Custom admin email failed:', error);
    return { success: false, error };
  }
}

export async function sendCustomAdminEmailBatch(payloads) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  try {
    const data = await resend.batch.send(payloads);
    if (data.error) {
      console.error('[email] Resend Batch API Error:', data.error);
      return { success: false, error: data.error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('[email] Custom admin bulk email failed:', error);
    return { success: false, error };
  }
}
