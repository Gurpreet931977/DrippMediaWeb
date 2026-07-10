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
      margin-left: 8px;
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
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:56px;v-text-anchor:middle;width:260px;" arcsize="22%" strokecolor="#8a7b18" strokeweight="4pt" fillcolor="#ebd73f">
              <w:anchorlock/>
              <center style="color:#000000;font-family:'Panchang', sans-serif, Arial;font-size:15px;font-weight:800;text-transform:uppercase;">${text}</center>
            </v:roundrect>
            <![endif]-->
            <a href="${link}" class="cta-btn animate-pulse-gold" style="background-color:#ebd73f; border-bottom: 6px solid #8a7b18; border-right: 2px solid #bba81c; border-top: 1px solid #fce844; border-left: 1px solid #fce844; border-radius:12px; color:#000000; display:inline-block; font-family:'Panchang', sans-serif, Arial; font-size:15px; font-weight:800; line-height:56px; text-align:center; text-decoration:none; width:260px; -webkit-text-size-adjust:none; mso-hide:all; box-shadow: 0 10px 25px rgba(235, 215, 63, 0.5); text-transform:uppercase; letter-spacing: 0.5px;">
              ${text} <span class="arrow-move">→</span>
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
  
  let title = 'The status quo just became obsolete.';
  let p1 = `Welcome to the inside, ${name || 'friend'}. Most people settle for consuming content. You just took the first step toward controlling it.`;
  let p2 = "Dripp Media is not just an agency or a platform. It is an ecosystem built for those who refuse to be ignored. From this moment on, the tools, the network, and the strategies used by the top tier are at your disposal. The only question left is what you will do with them.";
  let btnText = 'Enter The Ecosystem';
  
  if (nature?.toLowerCase() === 'creator') {
    title = 'Stop competing. Start dominating.';
    p1 = `You are here because your ambition outgrew your current platform. Welcome to the creator hub, ${name || 'creator'}.`;
    p2 = "The market is flooded with noise, but true attention is a highly guarded currency. We have engineered the exact frameworks required to break the algorithm, scale your audience unconditionally, and turn attention into equity. It is time to elevate your brand from a channel to an empire.";
    btnText = 'Claim Your Advantage';
  } else if (nature?.toLowerCase() === 'business') {
    title = 'Growth is not a metric. It is a mandate.';
    p1 = `Welcome to your unfair advantage, ${name || 'partner'}.`;
    p2 = "In a landscape where traditional marketing yields diminishing returns, standard playbooks lead to stagnation. Dripp Media is designed specifically to engineer velocity for your brand. We bypass the noise to deliver precision, authority, and relentless scale. Let us show you what happens when elite strategy meets flawless execution.";
    btnText = 'Scale Your Revenue';
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
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 20px; text-align: center; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">A new benchmark has been set.</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px; text-align: center;">Average players plateau. Elite players redefine the ceiling. You just set a new personal record of <strong style="color: #ebd73f; font-size: 18px;">${score} points</strong>.</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px; text-align: center;">But in this arena, a record is just a target painted on your back. The competition is already analyzing your strategy and coming for your spot. You proved you can reach the top. Now, prove you can defend it.</p>
      ${render3DButton('Defend Your Title', 'https://drippmedia.com')}
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
      <h2 style="color: #ffffff; font-size: 28px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Panchang', sans-serif;">Your position is vulnerable.</h2>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">The leaderboard waits for no one. While you have been away, the hierarchy has shifted.</p>
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">Momentum is unforgiving. If you are not actively defending your rank, you are already losing it. Others are closing the gap and targeting your position. Do not let your previous victories become old news.</p>
      ${render3DButton('Reclaim Your Rank', 'https://drippmedia.com')}
    `);
    const data = await resend.emails.send({ from: SENDER, to: email, subject: 'Ready to beat your high score?', html });
    return { success: true, data };
  } catch (error) { return { success: false, error }; }
}

// ── 5 DISTINCT PREMIUM GOLD LAYOUTS ───────────────────────────────────────────
export async function sendCustomAdminEmail(to, subject, title, body, templateType = 'announcement') {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

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
        <h2 style="color: #ebd73f; font-size: 24px; margin-top: 0; margin-bottom: 12px; font-weight: 700; font-family: 'Panchang', sans-serif; text-transform: uppercase; display: flex; alignItems: center; gap: 8px;"> ${title}</h2>
        <div style="color: #ffffff; font-weight: 500; font-size: 15px;">
          ${pBody}
        </div>
      </div>
      ${render3DButton('Act Immediately', btnLink)}
    `;
  }

  try {
    const html = getHtmlLayout(innerContent);
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
