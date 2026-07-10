import { sendCustomAdminEmail } from './app/lib/email.js';

const TO = 'gs335860@gmail.com';

async function run() {
  console.log('Dispatching 5 DISTINCT GOLD TEMPLATES to', TO);

  await sendCustomAdminEmail(TO, 'Announcement: The rules of the game just changed.', 'Welcome to the Next Era.', "For the last six months, we've been quietly building something that will fundamentally alter how you interact with your audience.\n\nThis isn't just an update. It's a complete paradigm shift. We've stripped away the noise and engineered a platform designed purely for undeniable growth. It's time to step into the future. Are you ready?", 'announcement');
  await sendCustomAdminEmail(TO, 'Promo: An unfair advantage, exclusively for you.', 'Scale Without Limits.', "In this industry, momentum is everything. Right now, you have an opportunity to seize an unfair advantage that most of your competitors will never see coming.\n\nWe are unlocking our most powerful suite of tools for you at half the standard investment. This isn't just a discount; it's a strategic alliance. Claim your access before the window closes.", 'promo');
  await sendCustomAdminEmail(TO, 'Newsletter: The strategy behind the fastest growing brands.', 'The Weekly Edge', "Most brands fail because they follow the crowd. The ones that dominate are the ones that dictate the narrative.\n\nThis week, we are pulling back the curtain on the exact digital strategies the top 1% of creators are using to monopolize attention and convert audiences into loyal advocates. Dive into the breakdown below and start executing.", 'newsletter');
  await sendCustomAdminEmail(TO, 'Invitation: Your exclusive access is ready.', 'VIP Inner Circle.', "You don't get this email by accident. You've been selected to join a highly curated network of elite creators and brands.\n\nThis is your private invitation to bypass the waitlist and immediately access our premium suite of tools. The inner circle is waiting. Will you step up?", 'invitation');
  await sendCustomAdminEmail(TO, 'Alert: Action Required: Time sensitive opportunity.', 'The Window is Closing.', "Success is defined by the ability to act when the window is open. Right now, your window is closing fast.\n\nYou have less than 24 hours to secure your position before this offer is permanently removed from the table. Do not let hesitation cost you your edge. Act immediately.", 'alert');

  console.log('All 5 templates dispatched!');
}

run();
