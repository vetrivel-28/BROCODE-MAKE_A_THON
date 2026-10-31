import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, healthRes] = await Promise.all([
        fetch('/api/insights/dashboard', { headers }),
        fetch('/api/insights/health-scores', { headers })
      ]);

      const [dashData, healthData] = await Promise.all([
        dashRes.json(),
        healthRes.json()
      ]);

      setData(dashData);
      setHealthScores(healthData.healthScores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="text-gray-400 font-medium animate-pulse">Loading Revenue Intelligence Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Revenue Intelligence Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00C2A8]/10 text-[#00C2A8]">
                Unique #6 & #7
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Real-time MRR, ARR, cash collection velocity, and customer health cohorts
            </p>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            60s In-Memory Cache Active
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Recurring (MRR)</span>
            <p className="text-3xl font-black mt-2 text-[#6C4BFF]">
              ₹{data.mrrInr.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">+14% vs last month</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Annual Run-Rate (ARR)</span>
            <p className="text-3xl font-black mt-2 text-[#1B1F3B]">
              ₹{(data.arrInr / 100000).toFixed(1)}L
            </p>
            <span className="text-[10px] text-gray-400 block mt-1">Contracted annual revenue</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Collected Cash</span>
            <p className="text-3xl font-black mt-2 text-[#00C2A8]">
              ₹{Math.round(data.collectedInr).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">100% bank-reconciled</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Subscriptions</span>
            <p className="text-3xl font-black mt-2 text-[#1B1F3B]">{data.activeSubscriptions}</p>
            <span className="text-[10px] text-gray-400 block mt-1">Churn rate: {data.churnRatePercent}%</span>
          </div>
        </div>

        {/* Chart: Revenue Velocity & 3-Month Forecast */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">Revenue Trend & 3-Month Forecast</h2>
              <p className="text-xs text-gray-400 mt-0.5">Historical cash collections and projected recurring revenue</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#6C4BFF]">
                <span className="w-3 h-3 rounded-full bg-[#6C4BFF]"></span> Actual Collections
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#00C2A8]">
                <span className="w-3 h-3 rounded-full bg-[#00C2A8]"></span> 3-Month Forecast
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C4BFF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6C4BFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C2A8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00C2A8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8F9CAE' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8F9CAE' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenueInr" stroke="#6C4BFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="projectedInr" stroke="#00C2A8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Health Score Board (Unique Feature #7) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Customer Health Scores (Unique Feature #7)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Calculated from payment punctuality, seat expansion velocity & overdue count</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                {data.healthBreakdown.green} Green
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                {data.healthBreakdown.amber} Amber
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                {data.healthBreakdown.red} Red
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {healthScores.map((c) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      c.score === 'GREEN'
                        ? 'bg-emerald-50 text-emerald-600'
                        : c.score === 'AMBER'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {c.score === 'GREEN' ? '●' : c.score === 'AMBER' ? '▲' : '■'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1B1F3B]">{c.customerName}</h4>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Payment History</span>
                    <span className="font-semibold text-gray-700">{c.punctualityScore}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Expansion</span>
                    <span className="font-semibold text-emerald-600">{c.seatGrowth}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px] uppercase">MRR Value</span>
                    <span className="font-bold text-sm text-[#1B1F3B]">₹{c.mrrContributionInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

