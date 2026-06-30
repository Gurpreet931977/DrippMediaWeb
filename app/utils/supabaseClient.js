import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irgplkartyhasfucpffn.supabase.co'
const supabaseAnonKey = 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
