import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('developer123!', 10);
  const security_phrase = await bcrypt.hash('devsecret', 10);

  const sql = `
INSERT INTO public.users (name, email, password, security_phrase, highscore)
VALUES 
  ('Dev One', 'dev1@dripp.com', '${password}', '${security_phrase}', 0),
  ('Dev Two', 'dev2@dripp.com', '${password}', '${security_phrase}', 0);
  `;

  console.log(sql.trim());
}
main();
