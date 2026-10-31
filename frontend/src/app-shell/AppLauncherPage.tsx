import React from 'react';
import { Link } from 'react-router-dom';

export const AppLauncherPage: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('loopdesk_user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('loopdesk_tenant') || '{}');

  const appTiles = [
    {
      title: 'Privilege Passport',
      desc: 'Live tier status, slots left, wallet balance, and locked features with upgrade nudges.',
      to: '/passport',
      icon: '🛡️',
      color: 'bg-purple-50 text-[#6C4BFF]',
      tag: 'Unique #1'
    },
    {
      title: 'Revenue Dashboard',
      desc: 'MRR, ARR, cash collected, outstanding, churn rate & 3-month forecast.',
      to: '/dashboard',
      icon: '📊',
      color: 'bg-teal-50 text-[#00C2A8]',
      tag: 'Unique #6'
    },
    {
      title: 'Subscriptions',
      desc: 'Manage customer contracts, lines, and draft to active lifecycle with audit timeline.',
      to: '/subscriptions',
      icon: '🔄',
      color: 'bg-blue-50 text-blue-600',
      tag: 'Unique #8'
    },
    {
      title: 'Billing Day Control Room',
      desc: 'One-screen automated billing runs with live progress, created/skipped counters, and idempotency.',
      to: '/billing/control-room',
      icon: '⚡',
      color: 'bg-amber-50 text-[#FF7A59]',
      tag: 'Unique #3'
    },
    {
      title: 'Invoices & Payments',
      desc: 'Invoice lifecycle, A4 print generation, partial payments & auto-flip to Paid.',
      to: '/invoices',
      icon: '📑',
      color: 'bg-emerald-50 text-emerald-600',
      tag: 'Core'
    },
    {
      title: 'Overdue & Dunning',
      desc: 'Autopilot dunning reminders on day 1, 3, 7, 14 and Revenue at Risk tracking.',
      to: '/billing/overdue',
      icon: '🔔',
      color: 'bg-rose-50 text-rose-600',
      tag: 'Unique #5'
    },
    {
      title: 'Customization Studio',
      desc: 'Customize templates, fields & modules with live price meter, wallet balance & slot meter.',
      to: '/studio',
      icon: '🎨',
      color: 'bg-violet-50 text-violet-600',
      tag: 'Unique #2'
    },
    {
      title: 'Catalog & Plans',
      desc: 'Products with variant pricing (Brand Odoo +₹560), recurring plans & quote templates.',
      to: '/catalog',
      icon: '📦',
      color: 'bg-indigo-50 text-indigo-600',
      tag: 'Core'
    },
    {
      title: 'Team & Staff Access',
      desc: 'ADMIN-only staff provisioning, roles management, and permission matrix.',
      to: '/staff',
      icon: '👥',
      color: 'bg-sky-50 text-sky-600',
      tag: 'Identity'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-white to-purple-50/40 p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C4BFF] bg-purple-100/60 px-3 py-1 rounded-full">
              {tenant?.tier || 'STANDARD'} Workspace Active
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-3">
              Welcome back, {user?.fullName || 'Business Owner'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Select an application tile below to manage subscriptions, billing runs, and platform revenue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/billing/control-room"
              className="px-5 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-sm transition-all"
            >
              ⚡ Run Billing Day
            </Link>
            <Link
              to="/passport"
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm shadow-sm transition-all"
            >
              Privilege Passport
            </Link>
          </div>
        </div>

        {/* Tiles Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">LoopDesk Platform Apps</h2>
            <span className="text-xs text-gray-400 font-medium">{appTiles.length} Modules Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appTiles.map((tile, idx) => (
              <Link
                key={idx}
                to={tile.to}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${tile.color}`}>
                      {tile.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {tile.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#1B1F3B] group-hover:text-[#6C4BFF] transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{tile.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-[#6C4BFF]">
                  <span>Open App</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

