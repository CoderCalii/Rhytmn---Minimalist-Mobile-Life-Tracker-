import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[supabase] CRITICAL: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'The app will crash when trying to use Supabase features. ' +
    'Please set these environment variables in your .env file or EAS build configuration.'
  );
}

// CRITICAL FIX: Wrap client creation in try-catch to prevent synchronous throws
// This prevents crashes if createClient() throws during module initialization
let supabase: SupabaseClient;

try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    }
  );
} catch (error) {
  console.error('[supabase] Failed to create client, using fallback:', error);
  // Create minimal client that will fail gracefully on use
  // This prevents crash but will fail on actual API calls
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    { 
      auth: { 
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false
      } 
    }
  ) as SupabaseClient;
}

export { supabase };
