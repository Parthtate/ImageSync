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

  const getStateColor = (state) => {
    switch (state) {
      case "completed": return "text-primary-500";
      case "failed": return "text-red-500";
      case "active": return "text-blue-500";
      default: return "text-dark-400";
    }
  };

  const getProgressBarColor = (state) => {
     switch(state) {
         case "failed": return "bg-red-500";
         case "completed": return "bg-primary-500";
         default: return "bg-primary-600";
     }
  }

  return (
    <div className="bg-dark-900/40 rounded-xl border border-dark-800/60 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
             <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${status.state === 'active' ? 'bg-primary-500 animate-pulse' : 'bg-dark-600'}`}></div>
                {status.state === 'active' && <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>}
             </div>
             <h3 className="text-white font-medium text-sm">
                Job Progress
             </h3>
        </div>
        <span className={`text-xs font-mono font-medium uppercase tracking-wider ${getStateColor(status.state)}`}>
            {status.state}
        </span>
      </div>

      <div className="relative w-full h-1.5 bg-dark-800 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full ${getProgressBarColor(status.state)} transition-all duration-500 ease-out`}
          style={{ width: `${status.progress || 0}%` }}
        ></div>
        {status.state === 'active' && (
             <div className="absolute inset-0 bg-white/10 w-full h-full animate-[shimmer_2s_infinite]"></div>
        )}
      </div>

      {status.result && (
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-dark-800/50">
           <div className="text-center">
              <div className="text-lg font-bold text-white mb-0.5">{status.result.total || 0}</div>
              <div className="text-[10px] uppercase text-dark-500 font-medium tracking-wider">Total</div>
           </div>
           <div className="text-center">
              <div className="text-lg font-bold text-primary-400 mb-0.5">{status.result.processed || 0}</div>
              <div className="text-[10px] uppercase text-dark-500 font-medium tracking-wider">Done</div>
           </div>
           <div className="text-center">
              <div className="text-lg font-bold text-red-400 mb-0.5">{status.result.failed || 0}</div>
              <div className="text-[10px] uppercase text-dark-500 font-medium tracking-wider">Failed</div>
           </div>
           <div className="text-center">
              <div className="text-lg font-bold text-yellow-400 mb-0.5">{status.result.skipped || 0}</div>
              <div className="text-[10px] uppercase text-dark-500 font-medium tracking-wider">Skip</div>
           </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-between items-center text-xs text-dark-600 font-mono">
        <span>ID: {jobId}</span>
        {status.result?.message && <span>{status.result.message}</span>}
      </div>
    </div>
  );
}

export default JobStatus;
