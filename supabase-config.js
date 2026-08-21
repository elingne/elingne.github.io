const SUPABASE_URL = "https://fkkgidjqoxtybfzioqyx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xTreOotC1z4kBvVASYMfmQ_Dd5nsQsv";

window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
