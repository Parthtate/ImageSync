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
      <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-zinc-200 rounded-3xl p-10 shadow-2xl border border-zinc-200">
                <div className="text-center mb-10">
                    <h4 className="text-5xl font-extrabold tracking-tight text-dark-900 mb-2">
                        Image<span className="text-primary-600">Sync</span>
                    </h4>
                    <p className="text-dark-500 mt-4">
                        Sign in to manage your image synchronization
                    </p>
                </div>

                <div className="space-y-6">
                    <LoginButton />
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-200 text-center text-xs text-dark-500">
                    <p className="mb-2">By continuing, you verify that you are an authorized user.</p>
                    <p className="text-dark-400 font-medium">&copy; 2025 ImageSync System</p>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return children(user);
}

export default AuthGuard;
