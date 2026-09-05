import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'daily-tips.json');

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

const getLocalData = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[daily-tips] Error reading local data:', err);
  }
  return null;
};

const saveLocalData = (data) => {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[daily-tips] Error saving local data:', err);
    return false;
  }
};

const sanitizeNoEmDash = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/:\s*[—–]/g, ': ')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*--\s*/g, ', ')
    .replace(/[—–]/g, ', ')
    .replace(/,\s*,/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanTipObj = (t) => {
  if (!t) return t;
  return {
    ...t,
    title: sanitizeNoEmDash(t.title),
    explanation: sanitizeNoEmDash(t.explanation),
    formula: sanitizeNoEmDash(t.formula)
  };
};

export async function GET(request) {
  try {
    let config = null;

    // Try Supabase first if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'daily_tips_config')
          .single();
        if (!error && data?.value) {
          config = data.value;
        }
      } catch (err) {
        // Fallback to local
      }
    }

    if (!config) {
      config = getLocalData();
    }

    if (!config || !Array.isArray(config.tips) || config.tips.length === 0) {
      return Response.json({ error: 'No daily tips found' }, { status: 404 });
    }

    const now = new Date();
    const launch = config.launchDate ? new Date(config.launchDate) : new Date(now.getFullYear(), 0, 1);
    
    // Calculate 24-hour day number starting from 1
    const diffMs = now.getTime() - launch.getTime();
    const daysPassed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const dayNumber = daysPassed + 1;

    // Calculate time until next midnight
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilNext = Math.max(0, nextMidnight.getTime() - now.getTime());
    const hoursLeft = Math.floor(msUntilNext / (1000 * 60 * 60));
    const minutesLeft = Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60));

    // Active tip for today
    const sanitizedTips = config.tips.map(cleanTipObj);
    const tipIndex = daysPassed % sanitizedTips.length;
    const currentTip = sanitizedTips[tipIndex];

    return Response.json({
      success: true,
      launchDate: config.launchDate,
      dayNumber,
      hoursLeft,
      minutesLeft,
      currentTip,
      tips: sanitizedTips,
      totalTips: sanitizedTips.length
    });
  } catch (error) {
    console.error('[daily-tips] GET error:', error);
    return Response.json({ error: 'Failed to load daily tips' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    let config = getLocalData();
    if (!config) {
      return Response.json({ error: 'Config file not found' }, { status: 500 });
    }

    if (action === 'reset_launch') {
      // Set launch date to right now (Day #1)
      config.launchDate = new Date().toISOString();
    } else if (action === 'add_tip') {
      const { category, title, explanation, formula } = body;
      if (!title || !explanation || !formula) {
        return Response.json({ error: 'Missing required tip fields' }, { status: 400 });
      }
      const newId = config.tips.length > 0 ? Math.max(...config.tips.map(t => t.id || 0)) + 1 : 1;
      const newTip = {
        id: newId,
        category: category || 'General Wisdom',
        title: sanitizeNoEmDash(title),
        explanation: sanitizeNoEmDash(explanation),
        formula: sanitizeNoEmDash(formula)
      };
      config.tips.push(newTip);
    } else if (action === 'update_tip') {
      const { id, category, title, explanation, formula } = body;
      const index = config.tips.findIndex(t => t.id === Number(id));
      if (index === -1) {
        return Response.json({ error: 'Tip not found' }, { status: 404 });
      }
      config.tips[index] = {
        ...config.tips[index],
        category: category || config.tips[index].category,
        title: title !== undefined ? sanitizeNoEmDash(title) : config.tips[index].title,
        explanation: explanation !== undefined ? sanitizeNoEmDash(explanation) : config.tips[index].explanation,
        formula: formula !== undefined ? sanitizeNoEmDash(formula) : config.tips[index].formula
      };
    } else if (action === 'delete_tip') {
      const { id } = body;
      config.tips = config.tips.filter(t => t.id !== Number(id));
      if (config.tips.length === 0) {
        return Response.json({ error: 'Cannot delete the only remaining tip' }, { status: 400 });
      }
    } else if (action === 'reorder_tips') {
      const { tips } = body;
      if (!Array.isArray(tips) || tips.length === 0) {
        return Response.json({ error: 'Invalid tips array' }, { status: 400 });
      }
      config.tips = tips.map(cleanTipObj);
    } else if (action === 'save_all') {
      if (body.launchDate) config.launchDate = body.launchDate;
      if (Array.isArray(body.tips)) config.tips = body.tips.map(cleanTipObj);
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Always sanitize all tips in config before saving
    config.tips = config.tips.map(cleanTipObj);

    // Save locally
    saveLocalData(config);

    // Sync to Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('app_settings')
          .upsert({ key: 'daily_tips_config', value: config }, { onConflict: 'key' });
      } catch (err) {
        console.error('[daily-tips] Supabase sync error:', err);
      }
    }

    const now = new Date();
    const launch = config.launchDate ? new Date(config.launchDate) : new Date();
    const diffMs = now.getTime() - launch.getTime();
    const daysPassed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const dayNumber = daysPassed + 1;
    const currentTip = config.tips[daysPassed % config.tips.length];

    return Response.json({
      success: true,
      launchDate: config.launchDate,
      dayNumber,
      currentTip,
      tips: config.tips,
      message: 'Daily tips successfully updated'
    });
  } catch (error) {
    console.error('[daily-tips] POST error:', error);
    return Response.json({ error: 'Failed to update daily tips' }, { status: 500 });
  }
}
