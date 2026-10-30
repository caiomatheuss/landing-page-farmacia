import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Cole os valores do projeto em supabase.com → Project Settings → API.
// A anon key é pública e fica no site. A service role fica só nas
// variáveis de ambiente da Netlify, nunca neste arquivo.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
