import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoginButton from './LoginButton';

function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-dark-900 to-primary-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 selection:bg-primary-500 selection:text-white">
        <div className="w-full max-w-sm px-6">
            <div className="bg-dark-800 rounded-xl border border-dark-900 p-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                        Image<span className="text-primary-500">Sync</span>
                    </h1>
                    <p className="text-dark-400 text-sm">
                        Sign in to continue
                    </p>
                </div>

                <div className="space-y-4">
                    <LoginButton />
                </div>

                <div className="mt-8 pt-6 border-t border-dark-600 text-center">
                    <p className="text-dark-200 text-xs">
                        Secure authentication via Google
                    </p>
                </div>
            </div>
            
            <p className="text-center text-dark-600 text-xs mt-8">
                &copy; 2025 ImageSync System
            </p>
        </div>
      </div>
    );
  }

  return children(user);
}

export default AuthGuard;
