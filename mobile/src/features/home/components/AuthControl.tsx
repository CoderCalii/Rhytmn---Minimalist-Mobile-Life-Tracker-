import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface AuthControlProps {
  onOpenSettings?: () => void;
}

const AuthControl = ({ onOpenSettings }: AuthControlProps) => {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Log configuration status for debugging
      console.log('[AuthControl] Attempting', mode, 'for:', email);
      console.log('[AuthControl] Supabase configured:', isSupabaseConfigured);

      const { error: authError, data } = mode === 'sign_in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      setIsSubmitting(false);

      if (authError) {
        console.error('[AuthControl] Supabase auth error:', authError);
        setError(authError.message);
        return;
      }

      console.log('[AuthControl] Auth success:', mode, data?.user?.email);
      setOpen(false);
      setPassword('');
    } catch (err) {
      setIsSubmitting(false);
      // Handle network errors and other exceptions
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Network request failed. Please check your internet connection and try again.';
      
      console.error('[AuthControl] Auth exception:', err);
      console.error('[AuthControl] Error details:', {
        message: errorMessage,
        isSupabaseConfigured,
        hasUrl: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
        hasKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
      });
      
      // Check for common network error patterns
      if (errorMessage.includes('Network request failed') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('network')) {
        setError('Network request failed. Please check:\n1. Your internet connection\n2. Supabase URL is correct\n3. Environment variables are set');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <View className="h-8 w-16 rounded-full bg-gray-100" />;
  }

  if (user) {
    const userInitial = (user.email?.trim()?.[0] || '?').toUpperCase();
    return (
      <View>
        <Pressable
          onPress={() => setOpen((prev) => !prev)}
          className="h-8 w-8 rounded-full bg-black items-center justify-center"
        >
          <Text className="text-[11px] font-bold text-white">{userInitial}</Text>
        </Pressable>

        <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View className="w-56 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
              <Text className="text-[10px] font-bold text-gray-500 mb-3" numberOfLines={1}>
                {user.email}
              </Text>
              {onOpenSettings ? (
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    onOpenSettings();
                  }}
                  className="mb-2 w-full rounded-xl border border-gray-100 py-2"
                >
                  <Text className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Settings
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleSignOut}
                className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-black py-2"
              >
                <Text className="text-[10px] font-bold uppercase tracking-widest text-white">Logout</Text>
                <LogOut size={12} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <Pressable onPress={() => setOpen((prev) => !prev)}>
        <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Login</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View className="w-56 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="mb-3 flex-row items-center gap-2 rounded-full bg-gray-50 p-1">
              <Pressable
                onPress={() => setMode('sign_in')}
                className={`flex-1 rounded-full py-1 ${mode === 'sign_in' ? 'bg-white' : ''}`}
              >
                <Text
                  className={`text-center text-[10px] font-bold uppercase tracking-widest ${
                    mode === 'sign_in' ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  Login
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('sign_up')}
                className={`flex-1 rounded-full py-1 ${mode === 'sign_up' ? 'bg-white' : ''}`}
              >
                <Text
                  className={`text-center text-[10px] font-bold uppercase tracking-widest ${
                    mode === 'sign_up' ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  Register
                </Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="w-full rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium"
            />
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="mt-3 w-full rounded-xl bg-black py-2"
            >
              <Text className="text-center text-[10px] font-bold uppercase tracking-widest text-white">
                {isSubmitting ? 'Submitting...' : mode === 'sign_in' ? 'Sign in' : 'Sign up'}
              </Text>
            </Pressable>
            {error ? (
              <Text className="mt-2 text-[10px] font-semibold text-rose-500">{error}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 24
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  }
});

export default AuthControl;
