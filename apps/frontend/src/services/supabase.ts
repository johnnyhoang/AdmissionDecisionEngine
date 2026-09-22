import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://czngbleeeiljsrpbaksg.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được thiết lập trong biến môi trường!');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

