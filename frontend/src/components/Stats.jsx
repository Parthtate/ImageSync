import { useState, useEffect } from "react";
import { getStats } from "../services/api";

function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Images",
      value: stats.totalImages,
      sub: "Across all sources",
      valueColor: "text-white"
    },
    {
      label: "Storage Used",
      value: formatSize(stats.totalSize),
      sub: "Optimized",
      valueColor: "text-primary-400"
    },
    {
      label: "Recent Activity",
      value: "+" + (stats.recentImports24h || 0),
      sub: "Images in 24h",
      valueColor: "text-white"
    },
    {
      label: "Sources",
      value: Object.keys(stats.bySource).length,
      sub: "Connected",
      valueColor: "text-white"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="p-5 rounded-xl bg-dark-900/40 border border-dark-800/60 hover:bg-dark-900/60 transition-colors"
        >
          <div className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-2">
            {stat.label}
          </div>
          <div className={`text-2xl font-bold ${stat.valueColor} mb-1 font-mono tracking-tight`}>
            {stat.value}
          </div>
          <div className="text-xs text-dark-500 font-medium">
            {stat.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Stats;
