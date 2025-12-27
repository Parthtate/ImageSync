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
        <div className="min-h-screen bg-dark-950 text-white selection:bg-primary-500 selection:text-white">
          {/* Background Gradient Orbs */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-900/10 rounded-full blur-[120px]"></div>
          </div>

          {/* Header */}
          <header className="sticky z-50 border-b border-dark-800 bg-blue-950/80 backdrop-blur-md top-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/Logo.png" alt="ImageSync Logo" className="w-10 h-10 object-contain" />
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Image<span className="text-primary-500">Sync</span>
                  </h1>
                </div>
                
                <UserProfile user={user} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-dark-400">
                    Seamless Image Import
                </h2>
                <p className="text-lg text-dark-400">
                    Synchronize your Google Drive assets with our high-performance import engine. Fast, secure, and reliable.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <ImportForm onImportStart={handleImportStart} />
                    {currentJob && (
                    <JobStatus jobId={currentJob} onComplete={handleJobComplete} />
                    )}
                    <ImageGallery refresh={refreshGallery} />
                </div>
                <div className="lg:col-span-4 space-y-8">
                    <Stats />
                    <div className="p-6 rounded-2xl bg-dark-900/50 border border-dark-800 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Quick Tips</h3>
                        <ul className="space-y-3 text-sm text-dark-400">
                            <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-1">✓</span>
                            Ensure Google Drive folders are public.
                            </li>
                            <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-1">✓</span>
                            Imports are processed in background queues.
                            </li>
                            <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-1">✓</span>
                            Supported formats: JPG, PNG, WEBP.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 border-t border-dark-800 bg-dark-950 text-dark-500 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-sm">
              <p>
                &copy; 2025 ImageSync System. Built for performance.
              </p>
            </div>
          </footer>
        </div>
      )}
    </AuthGuard>
  );
}

export default App;
