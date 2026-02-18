import { createClient } from '@supabase/supabase-js';

// Estes valores devem ser configurados no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Key não encontrados. Verifique o arquivo .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
