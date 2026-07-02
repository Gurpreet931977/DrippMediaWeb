import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co'
const supabaseAnonKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const email = 'testuser_' + Date.now() + '@example.com';
  
  // 1. Sign up
  console.log("Signing up...");
  const { data: signupData, error: signupError } = await supabase.from('users').insert([
    { 
        name: 'TestUser_' + Date.now(), 
        email: email, 
        phone: '+1234567890', 
        nature: 'general', 
        password: 'Password123', 
        security_phrase: 'May the force be with you' 
    }
  ]).select('*');
  
  if (signupError) {
      console.error("Signup failed:", signupError);
      return;
  }
  console.log("Signup success:", signupData[0].email, signupData[0].security_phrase);
  
  // 2. Forget password
  console.log("Resetting password...");
  const { data: resetQuery, error: resetError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('security_phrase', 'May the force be with you');
    
  if (resetError || !resetQuery || resetQuery.length === 0) {
      console.error("Reset check failed:", resetError);
      return;
  }
  
  const user = resetQuery[0];
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: 'NewPassword123' })
    .eq('id', user.id);
    
  if (updateError) {
      console.error("Password update failed:", updateError);
  } else {
      console.log("Password successfully updated!");
  }
}
run();
