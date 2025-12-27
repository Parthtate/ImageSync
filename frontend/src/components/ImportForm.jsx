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
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-linear-to-r from-primary-600 to-primary-400 rounded-2xl blur opacity-25 transition duration-1000"></div>
      <div className="relative bg-dark-900 rounded-2xl border border-dark-800 p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-primary-500 text-xl">↓</span> Import Source
          </h2>
          <p className="text-dark-400 text-sm">
            Enter a public Google Drive folder URL to begin the import process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="https://drive.google.com/drive/folders/..."
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              required
              disabled={loading}
              className="w-full px-5 py-4 bg-dark-950 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-dark-800 rounded-md border border-dark-700">
                <span className="text-xs text-dark-400 font-mono">URL</span>
             </div>
          </div>
          
          <button
              type="submit"
              disabled={loading || !folderUrl}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-0.5 transition-all duration-200 disabled:bg-dark-800 disabled:text-dark-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Initializing Import...</span>
                </>
              ) : (
                <>
                  <span>Start Import Job</span>
                  <span className="text-primary-200">→</span>
                </>
              )}
            </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <span className="text-red-400 mt-0.5 font-bold">!</span>
            <p className="text-red-200 text-sm flex-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-start gap-3">
            <span className="text-primary-400 mt-0.5 font-bold">✓</span>
            <p className="text-primary-100 text-sm flex-1">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportForm;
