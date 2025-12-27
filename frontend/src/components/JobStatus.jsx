import { useState, useEffect } from "react";
import { getJobStatus } from "../services/api";

function JobStatus({ jobId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      try {
        const result = await getJobStatus(jobId);
        setStatus(result.data);

        if (
          result.data.state === "completed" ||
          result.data.state === "failed"
        ) {
          setLoading(false);
          if (result.data.state === "completed" && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error("Failed to fetch job status:", error);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  if (!jobId || !status) return null;

  const getStateConfig = (state) => {
    switch (state) {
      case "completed":
        return {
          icon: "✓",
          color: "bg-primary-500",
          itemColor: "text-primary-400",
          text: "text-primary-400",
        };
      case "failed":
        return { icon: "!", color: "bg-red-500",  itemColor: "text-red-400", text: "text-red-400" };
      case "active":
        return { icon: "⟳", color: "bg-blue-500", itemColor: "text-blue-400", text: "text-blue-400" };
      case "waiting":
        return { icon: "...", color: "bg-yellow-500", itemColor: "text-yellow-400", text: "text-yellow-400" };
      default:
        return { icon: "?", color: "bg-dark-500", itemColor: "text-dark-400", text: "text-dark-400" };
    }
  };

  const stateConfig = getStateConfig(status.state);

  return (
    <div className="mb-8 bg-dark-900 rounded-2xl border border-dark-800 p-6 shadow-xl relative overflow-hidden">
      {/* Glow effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${stateConfig.color} opacity-5 blur-[80px] rounded-full pointing-events-none`}></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full bg-dark-800 border border-dark-700 ${stateConfig.text} font-mono`}>
            {stateConfig.icon}
          </span>
          <span>Job Status</span>
          <span className={`text-sm px-3 py-1 rounded-full bg-dark-800 border border-dark-700 ${stateConfig.text} uppercase tracking-wider font-semibold`}>
            {status.state}
          </span>
        </h3>
        <span className="text-xs text-dark-500 font-mono bg-dark-950 px-3 py-1 rounded-md border border-dark-800">
          ID: {jobId.slice(0, 8)}...
        </span>
      </div>

      <div className="relative w-full h-3 bg-dark-950 rounded-full overflow-hidden mb-6 border border-dark-800">
        <div
          className={`h-full ${stateConfig.color} shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300 relative`}
          style={{ width: `${status.progress || 0}%` }}
        >
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>

      {status.result && (
        <div className="p-5 bg-dark-950/50 rounded-xl border border-dark-800 backdrop-blur-sm">
          <p className="text-dark-300 font-medium mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-500 rounded-full"></span>
            {status.result.message}
          </p>
          {status.result.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 text-center group hover:border-dark-700 transition-colors">
                <div className="text-2xl font-bold text-white mb-1">
                  {status.result.total}
                </div>
                <div className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Total</div>
              </div>
              <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 text-center group hover:border-primary-900 transition-colors">
                <div className="text-2xl font-bold text-primary-400 mb-1">
                  {status.result.processed}
                </div>
                <div className="text-xs text-primary-900/60 group-hover:text-primary-900 transition-colors uppercase tracking-wider font-semibold">Processed</div>
              </div>
              <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 text-center group hover:border-red-900 transition-colors">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {status.result.failed}
                </div>
                <div className="text-xs text-red-900/60 group-hover:text-red-900 transition-colors uppercase tracking-wider font-semibold">Failed</div>
              </div>
              <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 text-center group hover:border-yellow-900 transition-colors">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {status.result.skipped}
                </div>
                <div className="text-xs text-yellow-900/60 group-hover:text-yellow-900 transition-colors uppercase tracking-wider font-semibold">Skipped</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JobStatus;
