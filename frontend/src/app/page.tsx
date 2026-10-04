'use client';
import { useState } from 'react';

export default function GGRPlatformApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pauseStart, setPauseStart] = useState('');
  const [pauseEnd, setPauseEnd] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handlePauseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/subscriptions/GGR00001/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: pauseStart, endDate: pauseEnd }),
    });
    const data = await res.json();
    if (res.ok) setStatusMsg('Pause registered successfully. Ledger updated.');
    else setStatusMsg(data.error || 'Failed to pause.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow">
        <h1 className="text-lg font-bold">GGR Brindavanam Farms — Management Platform</h1>
        <span className="text-xs bg-emerald-700 px-3 py-1 rounded-full">A2 Gir Cow Milk</span>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r p-4 hidden md:block space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50'}`}>Admin Dashboard</button>
          <button onClick={() => setActiveTab('customer')} className={`w-full text-left px-4 py-2 rounded ${activeTab === 'customer' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50'}`}>Customer Portal & Pauses</button>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === 'dashboard' ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Farm Operational Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow border-l-4 border-emerald-600">
                  <p className="text-sm text-slate-500">Tomorrow's Milk Required</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">84 Liters</p>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-600">
                  <p className="text-sm text-slate-500">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">68 Accounts</p>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-amber-600">
                  <p className="text-sm text-slate-500">Pending Invoices</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">₹6,400</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded shadow max-w-xl">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Manage Subscription Pauses</h2>
              <form onSubmit={handlePauseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Start Date</label>
                  <input type="date" value={pauseStart} onChange={(e) => setPauseStart(e.target.value)} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">End Date</label>
                  <input type="date" value={pauseEnd} onChange={(e) => setPauseEnd(e.target.value)} className="w-full border p-2 rounded mt-1" required />
                </div>
                <button type="submit" className="w-full bg-emerald-800 text-white font-semibold py-2 rounded hover:bg-emerald-900 transition">Submit Pause Request</button>
              </form>
              {statusMsg && <p className="mt-4 text-sm font-medium text-emerald-800">{statusMsg}</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
