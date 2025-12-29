import { useState, useEffect } from "react";
import { getImages, deleteImage, syncImages } from "../services/api";

function ImageGallery({ refresh }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("");
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [filter, refresh]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const result = await getImages(filter);
      if (result.success) {
        setImages(result.data.images);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncImages();
      // Refresh to get updated list
      await fetchImages();
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to sync gallery.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id, e) => {
    // Prevent clicking the parent div (if applicable) or link
    e.preventDefault(); 
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    
    setDeletingId(id);
    try {
      await deleteImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
      if (pagination) {
        setPagination(prev => ({...prev, total: prev.total - 1}));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading && !syncing) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-dark-500">
        <div className="w-8 h-8 border-2 border-dark-700 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm">Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">
             Gallery
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-dark-800 text-dark-400 text-xs font-mono border border-dark-700/50">
                {pagination?.total || 0}
            </span>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-sm text-dark-300 focus:outline-none focus:border-primary-500/50 hover:border-dark-700 transition-colors cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="google_drive">Google Drive</option>
            <option value="dropbox">Dropbox</option>
          </select>
          


          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className={`px-3 py-1.5 bg-dark-900 hover:bg-dark-800 text-dark-300 hover:text-white rounded-lg border border-dark-800 transition-colors ${syncing || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Sync & Refresh Gallery"
          >
            <span className={`block text-lg leading-none ${syncing ? 'animate-spin' : ''}`}>⟳</span>
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-20 rounded-xl border-2 border-dashed border-dark-800/50 bg-dark-900/20">
          <div className="text-4xl mb-4 opacity-20 grayscale">📷</div>
          <p className="text-dark-400 text-sm font-medium">
            No images found. Start a new import job.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square bg-dark-900 rounded-lg overflow-hidden border border-dark-800/50 hover:border-primary-500/50 transition-colors"
            >
                <img
                  src={image.storage_path}
                  alt={image.name}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${deletingId === image.id ? 'opacity-50 grayscale' : ''}`}
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 300 200'%3E%3Crect fill='%23111827' width='300' height='200'/%3E%3Ctext fill='%23374151' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EError%3C/text%3E%3C/svg%3E";
                  }}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-dark-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                    <p className="text-white text-xs font-semibold truncate mb-1" title={image.name}>{image.name}</p>
                     
                     <div className="flex justify-between items-end">
                        <div className="text-[10px] text-dark-400 space-y-0.5 font-mono">
                            <div>{formatSize(image.size)}</div>
                            <div>{image.mime_type.split('/')[1].toUpperCase()}</div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                              onClick={(e) => handleDelete(image.id, e)}
                              disabled={deletingId === image.id}
                              className="p-1.5 bg-red-900/50 text-red-200 border border-red-900/50 rounded hover:bg-red-600 hover:text-white transition-colors"
                              title="Delete Image"
                          >
                             {deletingId === image.id ? (
                               <div className="w-3 h-3 border border-red-200 border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                             )}
                          </button>
                          
                          <a
                              href={image.storage_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white text-dark-950 rounded hover:bg-primary-400 transition-colors"
                              title="View Full Size"
                          >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        </div>
                     </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
