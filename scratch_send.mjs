import { sendCustomAdminEmail } from './app/lib/email.js';

const TO = 'gs335860@gmail.com';

async function run() {
  console.log('Dispatching fixed challenge reminder email to', TO);

  const subject = "The Dripp Drop Challenge is closing.";
  const title = "The Window is Closing.";
  const body = "Success is defined by the ability to act when the window is open. Right now, your window is closing fast.\n\nYou have less than 24 hours to secure your position before this offer is permanently removed from the table. Do not let hesitation cost you your edge. Act immediately.";
  
  await sendCustomAdminEmail(TO, subject, title, body, 'alert');

  console.log('Test dispatched!');
}

run();
