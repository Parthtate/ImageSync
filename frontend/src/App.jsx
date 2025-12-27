import { useState } from 'react';
import AuthGuard from './components/Auth/AuthGuard';
import UserProfile from './components/Auth/UserProfile';
import ImportForm from './components/ImportForm';
import JobStatus from './components/JobStatus';
import ImageGallery from './components/ImageGallery';
import Stats from './components/Stats';

function App() {
  const [currentJob, setCurrentJob] = useState(null);
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleImportStart = (jobData) => {
    setCurrentJob(jobData.jobId);
  };

  const handleJobComplete = () => {
    setRefreshGallery(prev => prev + 1);
    setTimeout(() => setCurrentJob(null), 3000);
  };

  return (
    <AuthGuard>
      {(user) => (
        <div className="min-h-screen bg-dark-950 text-white selection:bg-primary-500 selection:text-white font-sans antialiased">
          {/* Header */}
          <header className="sticky z-50 border-b border-dark-800 bg-dark-900 top-0">
            <div className="max-w-7xl mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Image<span className="text-primary-500">Sync</span>
                  </h1>
                </div>
                
                <UserProfile user={user} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-dark-800/60">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                        Dashboard
                    </h2>
                    <p className="text-dark-400 text-base">
                        Manage your Google Drive imports and gallery assets.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                   {/* Actions or Stats summary could go here later */}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Import & Status */}
                <div className="lg:col-span-8 space-y-8">
                    <ImportForm onImportStart={handleImportStart} />
                    
                    {currentJob && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <JobStatus jobId={currentJob} onComplete={handleJobComplete} />
                        </div>
                    )}
                    
                    <ImageGallery refresh={refreshGallery} />
                </div>

                {/* Right Column: Stats & Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Stats />
                    
                    <div className="p-6 rounded-xl bg-dark-900/40 border border-dark-800/60">
                        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-widest mb-4">Quick Guide</h3>
                        <ul className="space-y-4 text-sm text-dark-400">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-xs text-dark-300 font-mono">1</span>
                                <span>Paste a public Google Drive folder URL.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-xs text-dark-300 font-mono">2</span>
                                <span>Wait for the background worker to process images.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-xs text-dark-300 font-mono">3</span>
                                <span>View and filter your imported assets below.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-dark-800 mt-20 bg-dark-900">
            <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center text-sm text-dark-500">
              <p>&copy; 2025 ImageSync.</p>
              <div className="flex gap-4">
                  <a href="#" className="hover:text-dark-300 transition-colors">Privacy</a>
                  <a href="#" className="hover:text-dark-300 transition-colors">Terms</a>
              </div>
            </div>
          </footer>
        </div>
      )}
    </AuthGuard>
  );
}

export default App;
