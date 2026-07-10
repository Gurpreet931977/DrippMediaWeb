import { sendCustomAdminEmail } from './app/lib/email.js';

const TO = 'gs335860@gmail.com';

async function run() {
  console.log('Dispatching simple challenge reminder email to', TO);

  const subject = "The game is ending soon!";
  const title = "Time is Running Out.";
  const body = "You have seen the leaderboard, and you know what the prize is.\n\nThe Dripp Drop Challenge is ending very soon. This is your last chance to get the top score and win the free prize.\n\nAre you really going to let someone else win? The game is still open, but time is almost up. Play now, get the high score, and claim your prize before it is too late.";
  
  await sendCustomAdminEmail(TO, subject, title, body, 'alert');

  console.log('Test dispatched!');
}

run();
