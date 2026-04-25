
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;

if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("Supabase URL or Key is missing. Using mock client to prevent crash.");
    // Mock client that returns empty data/errors without crashing the app
    client = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: { message: "Supabase keys missing" } }),
                    order: () => ({
                        limit: () => Promise.resolve({ data: [], error: { message: "Supabase keys missing" } })
                    })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: { message: "Supabase keys missing" } })
                })
            }),
            insert: () => ({
                select: () => Promise.resolve({ data: null, error: { message: "Supabase keys missing" } })
            })
        })
    };
}

export const supabase = client;
