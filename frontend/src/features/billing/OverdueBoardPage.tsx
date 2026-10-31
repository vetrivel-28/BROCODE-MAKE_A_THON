import React, { useEffect, useState } from 'react';

export const OverdueBoardPage: React.FC = () => {
  const [board, setBoard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchOverdueBoard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing/overdue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBoard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueBoard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="text-gray-400 font-medium animate-pulse">Loading Autopilot Dunning Board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">Autopilot Dunning & Overdue Board</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
              Unique Feature #5
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated reminder cadence (Day 1, 3, 7, 14) and real-time Revenue at Risk exposure
          </p>
        </div>

        {/* Revenue at Risk KPI Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/50 p-6 rounded-3xl border border-rose-100 shadow-sm md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                Revenue at Risk
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-rose-600">
                  ₹{(board?.revenueAtRiskInr || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-rose-700 font-semibold">total overdue cash</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 max-w-lg">
                Autopilot Dunning sends multi-channel reminders at day 1, 3, 7, and 14 with idempotency logs so no dunning reminder is ever double-sent.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-rose-100 flex items-center gap-4 text-xs font-bold text-rose-700">
              <span>Cadence: Day 1 (Gentle)</span>
              <span>•</span>
              <span>Day 3 (Follow-up)</span>
              <span>•</span>
              <span>Day 7 (Urgent)</span>
              <span>•</span>
              <span>Day 14 (Final Notice)</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Overdue Invoices</span>
              <p className="text-4xl font-black mt-2 text-[#1B1F3B]">{board?.overdueCount || 0}</p>
              <span className="text-xs text-gray-400 mt-1 block">Requiring clearance</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
              All overdue accounts automatically tracked in Customer Health Scores
            </div>
          </div>
        </div>

        {/* Dunning Audit Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold">Autopilot Dunning Logs (Day 1, 3, 7, 14 Dispatches)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Automated recovery attempts executed by LoopDesk background scheduler</p>
          </div>

          <div className="divide-y divide-gray-100">
            {(board?.dunningLogs || []).map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-xs">
                    D{log.step}
                  </div>
                  <div>
                    <span className="font-bold text-[#1B1F3B]">{log.customerName}</span>
                    <p className="text-gray-400 font-mono mt-0.5">
                      {log.invoiceNumber} • Step: Day {log.step} Overdue Reminder
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-rose-600 block">
                    ₹{log.amountDuePaise / 100}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Dispatched {new Date(log.sentAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
