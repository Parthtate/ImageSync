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
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      icon: "Images",
      value: stats.totalImages,
      sub: "Total Imported",
      color: "text-white",
      border: "border-dark-700",
    },
    {
      icon: "Storage",
      value: formatSize(stats.totalSize),
      sub: "Space Used",
      color: "text-primary-400",
      border: "border-primary-900/50",
    },
    {
      icon: "Activity",
      value: "+" + stats.recentImports24h || 0,
      sub: "Last 24h",
      color: "text-blue-400",
      border: "border-blue-900/50",
    },
    {
      icon: "Sources",
      value: Object.keys(stats.bySource).length,
      sub: "Active Channels",
      color: "text-purple-400",
      border: "border-purple-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`p-5 rounded-2xl bg-dark-900/50 border ${stat.border} hover:bg-dark-900 transition-colors backdrop-blur-sm group`}
        >
          <div className="text-xs font-medium text-dark-500 uppercase tracking-widest mb-3">
            {stat.icon}
          </div>
          <div className={`text-2xl font-bold ${stat.color} mb-1 group-hover:scale-105 transition-transform origin-left`}>
            {stat.value}
          </div>
          <div className="text-xs text-dark-400">
            {stat.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Stats;
