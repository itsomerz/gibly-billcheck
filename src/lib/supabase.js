import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// null until both env vars are set in .env.local — callers must check before
// using it, so the app keeps working even before Supabase is configured.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
