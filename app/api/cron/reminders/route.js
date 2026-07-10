import { createClient } from '@supabase/supabase-js';
import { sendReminderEmail } from '@/app/lib/email';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request) {
  try {
    // 1. Verify Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database misconfigured' }, { status: 500 });
    }

    // 2. Calculate thresholds
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cutoffDate = new Date(now - SEVEN_DAYS_MS).toISOString();

    // 3. Fetch eligible users
    // We want users who haven't been reminded recently (or ever)
    // Note: This requires adding a `last_reminded_at` (timestamptz) column to your `users` table.
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('email, name, last_reminded_at')
      .or(`last_reminded_at.is.null,last_reminded_at.lt.${cutoffDate}`)
      .limit(50); // Batch of 50 to avoid hitting email sending rate limits

    if (userError) {
      console.error('[cron/reminders] Error fetching users:', userError);
      return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return Response.json({ message: 'No eligible users to remind today.' }, { status: 200 });
    }

    const emailsSent = [];

    // 4. Send emails and update database
    for (const user of users) {
      if (!user.email || !user.email.includes('@')) continue; // Skip Player Tags without email

      try {
        // Send Email via Centralized Utility
        const result = await sendReminderEmail(user.email, user.name);
        
        if (!result.success) {
           console.error(`[cron/reminders] Resend failed for ${user.email}:`, result.error);
           continue;
        }

        // Update last_reminded_at in the database
        await supabase
          .from('users')
          .update({ last_reminded_at: new Date().toISOString() })
          .eq('email', user.email);

        emailsSent.push(user.email);
      } catch (err) {
        console.error(`[cron/reminders] Failed to send to ${user.email}:`, err);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Sent ${emailsSent.length} reminders.`, 
      emails: emailsSent 
    }, { status: 200 });

  } catch (error) {
    console.error('[cron/reminders] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
