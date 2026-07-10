import { sendCustomAdminEmail } from './app/lib/email.js';

const TO = 'gs335860@gmail.com';

async function run() {
  console.log('Dispatching ELITE test emails with HIGHLY PRONOUNCED 3D buttons to', TO);

  await sendCustomAdminEmail(
    TO,
    'The rules of the game just changed.',
    'Welcome to the Next Era.',
    "For the last six months, we've been quietly building something that will fundamentally alter how you interact with your audience.\n\nThis isn't just an update. It's a complete paradigm shift. We've stripped away the noise and engineered a platform designed purely for undeniable growth. It's time to step into the future. Are you ready?",
    'announcement'
  );

  await sendCustomAdminEmail(
    TO,
    'An unfair advantage, exclusively for you.',
    'Scale Without Limits.',
    "In this industry, momentum is everything. Right now, you have an opportunity to seize an unfair advantage that most of your competitors will never see coming.\n\nWe are unlocking our most powerful suite of tools for you at half the standard investment. This isn't just a discount; it's a strategic alliance. Claim your access before the window closes.",
    'promo'
  );

  console.log('Tests dispatched!');
}

run();
