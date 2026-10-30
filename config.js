import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Cole os valores do projeto em supabase.com → Project Settings → API.
// A anon key é pública e fica no site. A service role fica só nas
// variáveis de ambiente da Netlify, nunca neste arquivo.
export const SUPABASE_URL = 'sb_publishable_nk9LXivIzROLqXjzLRephw_HtE4LP43';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cmt3bmRhaHR4dmR0aGJ5dnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjUwMDUsImV4cCI6MjEwODkwMTAwNX0.VaoZgn9pTP0WS-I7HFxQYMeePPwIKdkM71voDYJBcM4';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
