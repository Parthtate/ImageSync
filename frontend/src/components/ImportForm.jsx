import { useState } from "react";
import { importFromGoogleDrive } from "../services/api";

function ImportForm({ onImportStart }) {
  const [folderUrl, setFolderUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await importFromGoogleDrive(folderUrl);

      if (result.success) {
        setSuccess(`Import started! Job ID: ${result.data.jobId}`);
        setFolderUrl("");
        onImportStart(result.data);
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to start import"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-900/40 rounded-xl border border-dark-800/60 p-6 sm:p-8">
      <div className="mb-6">
          <label htmlFor="folder-url" className="text-sm font-semibold text-white block mb-2">
              Import from Google Drive
          </label>
           <p className="text-dark-400 text-sm">
            Enter a public Google Drive folder URL to begin the sync process.
          </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <input
            id="folder-url"
            type="text"
            placeholder="https://drive.google.com/drive/folders/..."
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-4 pr-16 py-3 bg-dark-950 border border-dark-700/60 rounded-lg text-white placeholder-dark-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
           <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-[10px] uppercase font-bold text-dark-500 bg-dark-900 border border-dark-800 px-1.5 py-0.5 rounded">URL</span>
           </div>
        </div>
        
        <div className="flex justify-end">
            <button
                type="submit"
                disabled={loading || !folderUrl}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Starting...</span>
                </>
                ) : (
                <>
                    <span>Start Import</span>
                    <span className="opacity-70">→</span>
                </>
                )}
            </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3">
          <div className="text-red-500 mt-0.5">⚠️</div>
          <p className="text-red-400 text-sm flex-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-primary-500/5 border border-primary-500/10 rounded-lg flex items-start gap-3">
          <div className="text-primary-500 mt-0.5">✓</div>
          <p className="text-primary-400 text-sm flex-1">{success}</p>
        </div>
      )}
    </div>
  );
}

export default ImportForm;
