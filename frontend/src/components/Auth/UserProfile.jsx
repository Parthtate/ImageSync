import { supabase } from '../../lib/supabase';

function UserProfile({ user }) {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 px-1 py-1 pr-4 bg-dark-900/50 rounded-full border border-dark-700 backdrop-blur-sm">
        <img 
          src={user.user_metadata.avatar_url} 
          alt={user.user_metadata.full_name}
          className="w-10 h-10 rounded-full border-2 border-primary-500"
        />
        <div className="hidden sm:block">
          <p className="font-semibold text-white text-sm">
            {user.user_metadata.full_name}
          </p>
          
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-dark-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 text-dark-300 font-medium rounded-lg border border-dark-700 transition-all duration-200 text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}

export default UserProfile;
