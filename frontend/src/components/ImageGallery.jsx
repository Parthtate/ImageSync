import { useState, useEffect } from "react";
import { getImages } from "../services/api";

function ImageGallery({ refresh }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading) {
    return (
      <div className="bg-dark-900 rounded-2xl border border-dark-800 p-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-dark-400 font-medium">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-900/50 rounded-3xl border border-dark-800 p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-primary-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
            Imported Images
            <span className="ml-3 px-2 py-0.5 rounded-md bg-dark-800 text-primary-400 text-sm font-mono border border-dark-700">
                {pagination?.total || 0}
            </span>
            </h2>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-dark-600"
          >
            <option value="">All Sources</option>
            <option value="google_drive">Google Drive</option>
            <option value="dropbox">Dropbox</option>
          </select>
          <button
            onClick={fetchImages}
            className="px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-xl">⟳</span>
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-dark-800 rounded-2xl bg-dark-900/30">
          <div className="text-6xl mb-6 opacity-30 grayscale">📷</div>
          <h3 className="text-xl font-bold text-white mb-2">
            No images found
          </h3>
          <p className="text-dark-500 max-w-sm mx-auto">
            Your gallery is empty. Start a new import job to populate this section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-dark-950 rounded-2xl overflow-hidden border border-dark-800 hover:border-primary-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="relative aspect-video bg-dark-900 overflow-hidden">
                <img
                  src={image.storage_path}
                  alt={image.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x200/111827/374151?text=Image+Error";
                  }}
                />
                <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <a
                    href={image.storage_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-white text-dark-950 font-bold rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-primary-400"
                  >
                    View Original
                  </a>
                </div>
                
                 <div className="absolute top-3 right-3">
                   <span className="px-2 py-1 bg-dark-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10">
                    {image.mime_type.split('/')[1]}
                   </span>
                 </div>
              </div>

              <div className="p-4">
                <p
                  className="font-medium text-white mb-1 truncate text-sm"
                  title={image.name}
                >
                  {image.name}
                </p>
                <div className="flex items-center justify-between text-xs text-dark-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-700"></span>
                     {formatSize(image.size)}
                  </span>
                   <span className="text-dark-600">
                     {new Date(image.created_at).toLocaleDateString()}
                   </span>
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
