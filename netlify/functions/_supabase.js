import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('[supabase] Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis da Netlify.');
}

export const supabaseAdmin = createClient(url || 'http://localhost', key || 'missing', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
