import { createClient } from '@supabase/supabase-js';
import { sendCustomAdminEmail } from '@/app/lib/email';

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

    // 2. Fetch pending campaigns that are due
    const now = new Date().toISOString();
    const { data: campaigns, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (campaignError) {
      console.error('[cron/campaigns] Error fetching campaigns:', campaignError);
      return Response.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return Response.json({ message: 'No pending campaigns due.' }, { status: 200 });
    }

    let totalSent = 0;
    let totalFailed = 0;

    // 3. Process each campaign
    for (const campaign of campaigns) {
      let recipients = [];
      
      if (campaign.is_broadcast) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('email, name')
          .not('email', 'is', null);
          
        if (!userError && users) {
          recipients = users.filter(u => u.email.includes('@'));
        }
      } else if (campaign.specific_email) {
        const manualEmails = campaign.specific_email.split(',').map(e => e.trim()).filter(e => e.includes('@'));
        const { data: users } = await supabase
          .from('users')
          .select('email, name')
          .in('email', manualEmails);
          
        const dbUserMap = {};
        if (users) {
          users.forEach(u => dbUserMap[u.email.toLowerCase()] = u.name);
        }
        
        recipients = manualEmails.map(email => ({
          email,
          name: dbUserMap[email.toLowerCase()] || null
        }));
      }

      if (recipients.length === 0) {
        // Update to failed if no recipients
        await supabase
          .from('email_campaigns')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', campaign.id);
        continue;
      }

      // Send emails in batches of 20
      let successCount = 0;
      const BATCH_SIZE = 20;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (recipient) => {
          const firstName = recipient.name ? recipient.name.split(' ')[0] : 'friend';
          const capFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          
          const pSubject = campaign.subject.replace(/{{name}}/gi, capFirstName).replace(/—/g, '-');
          const pTitle = campaign.title.replace(/{{name}}/gi, capFirstName).replace(/—/g, '-');
          const pBody = campaign.body.replace(/{{name}}/gi, capFirstName).replace(/—/g, '-');

          const result = await sendCustomAdminEmail(
            recipient.email, 
            pSubject, 
            pTitle, 
            pBody, 
            campaign.template_type
          );
          
          if (result.success) {
            successCount++;
          }
        }));
      }

      // Update campaign status
      if (successCount > 0) {
        const updateData = { updated_at: new Date().toISOString() };
        
        if (campaign.is_recurring && campaign.recurrence_interval_days) {
          const nextRun = new Date();
          nextRun.setDate(nextRun.getDate() + campaign.recurrence_interval_days);
          
          if (campaign.recurrence_end_date && nextRun > new Date(campaign.recurrence_end_date)) {
            updateData.status = 'sent';
          } else {
            updateData.scheduled_at = nextRun.toISOString();
            // Status stays 'pending'
          }
        } else {
          updateData.status = 'sent';
        }

        await supabase
          .from('email_campaigns')
          .update(updateData)
          .eq('id', campaign.id);
        totalSent += successCount;
      } else {
         await supabase
          .from('email_campaigns')
          .update({ 
            status: 'failed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', campaign.id);
         totalFailed++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Processed ${campaigns.length} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}` 
    }, { status: 200 });

  } catch (error) {
    console.error('[cron/campaigns] Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
