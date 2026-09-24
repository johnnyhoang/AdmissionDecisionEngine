import { createClient } from '@supabase/supabase-js';

// Public URL + anon key of Supabase "Data 02" (same project the backend verifies JWTs against).
// Kept as one pair on purpose: mixing env URL with a fallback key from another project breaks login.
const SUPABASE_URL = 'https://czngbleeeiljsrpbaksg.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmdibGVlZWlsanNycGJha3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDQ5NjAsImV4cCI6MjA4ODI4MDk2MH0.31agxcZHEkcymaL_Ox5wOfB4zwivv961QHrn6E4tErM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
