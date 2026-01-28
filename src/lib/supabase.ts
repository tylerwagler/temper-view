import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase instance for the AI stack proxied through Nginx
const supabaseUrl = window.location.origin;
const supabaseAnonKey = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24iLCAiaXNzIjogInN1cGFiYXNlIiwgImlhdCI6IDE3Njk1MjYyNTgsICJleHAiOiAyMDg0ODg2MjU4fQ.UYjtcXHj4l-9rEHMzNk2rqc-djmaPTtumgylFpG5NfA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
