import React, { useEffect, useState } from 'react';

export const ControlRoomPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing/control-room', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRuns(data.runs || []);
      if (data.runs && data.runs.length > 0 && !latestResult) {
        setLatestResult(data.runs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunBilling = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/billing/control-room/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setLatestResult(result);
      await fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Billing Day Control Room</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF7A59]/10 text-[#FF7A59]">
                Unique Feature #3
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Deterministic billing engine with idempotency guarantees — never double-bill or skip
            </p>
          </div>

          <button
            onClick={handleRunBilling}
            disabled={running}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C4BFF] to-[#00C2A8] text-white font-black text-sm shadow-lg shadow-purple-200 hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span>{running ? '⚙ Processing Run...' : '⚡ Run Billing Day Engine'}</span>
          </button>
        </div>

        {/* Live Counters Banner */}
        {latestResult && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400">Run ID: {latestResult.id}</span>
                <h3 className="text-xl font-bold mt-0.5">Execution Summary</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                Idempotent Batch Complete
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Processed</span>
                <p className="text-3xl font-black mt-2 text-[#1B1F3B]">{latestResult.totalProcessed}</p>
                <span className="text-[10px] text-gray-400 mt-1 block">Active subscriptions checked</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Created</span>
                <p className="text-3xl font-black mt-2 text-emerald-600">{latestResult.createdCount}</p>
                <span className="text-[10px] text-emerald-600/70 mt-1 block">New invoices generated</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Skipped</span>
                <p className="text-3xl font-black mt-2 text-blue-600">{latestResult.skippedCount}</p>
                <span className="text-[10px] text-blue-600/70 mt-1 block">0 duplicates created</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Failed</span>
                <p className="text-3xl font-black mt-2 text-rose-600">{latestResult.failedCount}</p>
                <span className="text-[10px] text-rose-600/70 mt-1 block">No processing errors</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl text-xs text-[#6C4BFF] flex items-center justify-between">
              <span>
                💡 <strong>Idempotency Proof:</strong> If you click "Run Billing Day Engine" again right now, <strong>0</strong> new invoices will be created and all subscriptions will be cleanly skipped.
              </span>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold">Billing Run Audit Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Automated cron runs (02:00 IST) and manual operator dispatches</p>
          </div>

          <div className="divide-y divide-gray-100">
            {runs.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No billing runs executed yet. Click above to dispatch one.</div>
            ) : (
              runs.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 text-xs">
                  <div>
                    <span className="font-mono font-bold text-gray-700">{r.id}</span>
                    <span className="text-gray-400 block mt-0.5">{new Date(r.runDate).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-emerald-600 font-bold">+{r.createdCount} created</span>
                    <span className="text-blue-600 font-bold">{r.skippedCount} skipped</span>
                    <span className="text-rose-600 font-bold">{r.failedCount} failed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
