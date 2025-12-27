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
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-3">
        <p className="text-sm font-medium text-white">
          {user.user_metadata.full_name}
        </p>
      </div>
      
      <div className="relative">
        <img 
          src={user.user_metadata.avatar_url} 
          alt={user.user_metadata.full_name}
          className="w-8 h-8 rounded-full border border-dark-700 bg-dark-800 object-cover"
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-500 border-2 border-dark-950 rounded-full"></div>
      </div>
      
      <button
        onClick={handleLogout}
        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Sign Out"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </button>
    </div>
  );
}

export default UserProfile;
