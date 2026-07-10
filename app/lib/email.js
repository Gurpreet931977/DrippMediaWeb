import { Resend } from 'resend';

// Initialize Resend safely (returns null if key is missing during build)
const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] RESEND_API_KEY is not set');
    return null;
  }
  return new Resend(key);
};

const SENDER = 'DrippMedia Arcade <hello@drippmedia.com>';

// Base layout for emails
const getHtmlLayout = (content) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
    <div style="background-color: #09090b; padding: 32px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Dripp Drop</h1>
    </div>
    <div style="padding: 40px;">
      ${content}
    </div>
    <div style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eaeaea;">
      <p style="margin: 0; color: #a1a1aa; font-size: 14px;">© ${new Date().getFullYear()} DrippMedia. All rights reserved.</p>
    </div>
  </div>
</div>
`;

export async function sendWelcomeEmail(email, name) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  try {
    const html = getHtmlLayout(`
      <h2 style="color: #09090b; font-size: 24px; margin-top: 0; margin-bottom: 20px;">Welcome to the Arcade, ${name || 'Player'}! 🎮</h2>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        We're thrilled to have you join Dripp Drop. Get ready to test your reflexes and climb the global leaderboard.
      </p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
        Think you have what it takes to hit the top 10? There's only one way to find out.
      </p>
      <div style="text-align: center;">
        <a href="https://drippmedia.com/arcade" style="display: inline-block; background-color: #09090b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Play Now
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: 'Welcome to Dripp Drop! 🎮',
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
      <h2 style="color: #09090b; font-size: 24px; margin-top: 0; margin-bottom: 20px;">New High Score! 🏆</h2>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Incredible performance! You just set a new personal best of <strong>${score} points</strong>.
      </p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
        The competition is fierce. Hop back in to defend your position and aim even higher!
      </p>
      <div style="text-align: center;">
        <a href="https://drippmedia.com/arcade" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Defend Your Score
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: \`New High Score: \${score}! 🏆\`,
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
      <h2 style="color: #09090b; font-size: 24px; margin-top: 0; margin-bottom: 20px;">Hey ${name || 'Player'}, it's been a while! 👋</h2>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        The leaderboard has been shifting since you last played Dripp Drop. Others might be coming for your spot!
      </p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
        We thought you might want to jump back in and show them how it's done.
      </p>
      <div style="text-align: center;">
        <a href="https://drippmedia.com/arcade" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Return to Arcade
        </a>
      </div>
    `);

    const data = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: 'Ready to beat your high score? 🏆',
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[email] Reminder email failed:', error);
    return { success: false, error };
  }
}

// ── Admin Custom Email ────────────────────────────────────────────────────────
export async function sendCustomAdminEmail(to, subject, title, body, templateType = 'announcement') {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Misconfigured' };

  // Convert newlines to <br> for the body text
  const formattedBody = body.replace(/\n/g, '<br/>');

  let accentColor = '#09090b'; // default dark (announcement)
  if (templateType === 'promo') accentColor = '#22c55e'; // green
  if (templateType === 'newsletter') accentColor = '#3b82f6'; // blue

  try {
    const html = getHtmlLayout(`
      <div style="border-left: 4px solid ${accentColor}; padding-left: 16px; margin-bottom: 24px;">
        <h2 style="color: #09090b; font-size: 24px; margin: 0;">${title}</h2>
      </div>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        ${formattedBody}
      </p>
      ${
        templateType === 'promo' 
        ? `<div style="text-align: center; margin-top: 32px;"><a href="https://drippmedia.com" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Claim Offer</a></div>`
        : ''
      }
      ${
        templateType === 'announcement'
        ? `<div style="text-align: center; margin-top: 32px;"><a href="https://drippmedia.com" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Details</a></div>`
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
