import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nljmtsljfjoykrrxvcph.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sam10c2xqZmpveWtycnh2Y3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Njg4MzUsImV4cCI6MjA4NDE0NDgzNX0.placeholder';

let client = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.warn("Failed to initialize Supabase client", e);
    }
}

export const supabase = client;
