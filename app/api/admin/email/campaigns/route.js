import { verifyCookie } from '@/app/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// GET all campaigns (pending ones)
export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const COOKIE_NAME = 'dripp_admin_session';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const adminEmail = verifyCookie(cookieValue);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: 'Database misconfigured' }, { status: 500 });

  const { data: campaigns, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return Response.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  return Response.json({ campaigns });
}

// POST to create a new scheduled campaign
export async function POST(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const COOKIE_NAME = 'dripp_admin_session';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const adminEmail = verifyCookie(cookieValue);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, subject, body, templateType, isBroadcast, specificEmail, scheduledAt, isRecurring, recurrenceIntervalDays } = payload;

  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: 'Database misconfigured' }, { status: 500 });

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert([
      {
        title,
        subject,
        body,
        template_type: templateType,
        is_broadcast: isBroadcast,
        specific_email: specificEmail,
        scheduled_at: scheduledAt,
        is_recurring: isRecurring || false,
        recurrence_interval_days: recurrenceIntervalDays || null,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    return Response.json({ error: 'Failed to schedule campaign' }, { status: 500 });
  }

  return Response.json({ success: true, campaign: data });
}

// PUT to update an existing campaign
export async function PUT(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const COOKIE_NAME = 'dripp_admin_session';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const adminEmail = verifyCookie(cookieValue);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, title, subject, body, templateType, isBroadcast, specificEmail, scheduledAt, isRecurring, recurrenceIntervalDays } = payload;

  if (!id) return Response.json({ error: 'Missing campaign ID' }, { status: 400 });

  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: 'Database misconfigured' }, { status: 500 });

  const { data, error } = await supabase
    .from('email_campaigns')
    .update({
      title,
      subject,
      body,
      template_type: templateType,
      is_broadcast: isBroadcast,
      specific_email: specificEmail,
      scheduled_at: scheduledAt,
      is_recurring: isRecurring !== undefined ? isRecurring : false,
      recurrence_interval_days: recurrenceIntervalDays || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    return Response.json({ error: 'Failed to update campaign' }, { status: 500 });
  }

  return Response.json({ success: true, campaign: data });
}

// DELETE to cancel/remove a campaign
export async function DELETE(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const COOKIE_NAME = 'dripp_admin_session';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const adminEmail = verifyCookie(cookieValue);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return Response.json({ error: 'Missing campaign ID' }, { status: 400 });

  const supabase = getSupabase();
  if (!supabase) return Response.json({ error: 'Database misconfigured' }, { status: 500 });

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting campaign:', error);
    return Response.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }

  return Response.json({ success: true });
}
