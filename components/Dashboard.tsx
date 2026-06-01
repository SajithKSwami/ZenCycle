import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { HistoricalRecord } from '../types';

interface Props {
  history: HistoricalRecord[];
}

const Dashboard: React.FC<Props> = ({ history }) => {
  const data = history.map(r => ({
    date: r.date.slice(5), // MM-DD
    sessions: r.sessions,
    water: r.water,
    mood: r.mood ?? 'N/A',
  }));

  const totalSessions = history.reduce((s, r) => s + r.sessions, 0);
  const avgWater = history.length
    ? (history.reduce((s, r) => s + r.water, 0) / history.length).toFixed(1)
    : '0';
  const streak = history.length;

  return (
    <div className="space-y-6 pb-24">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Progress</h1>
        <p className="text-slate-400 text-sm">Last {history.length} days</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions', value: totalSessions },
          { label: 'Avg Water', value: avgWater },
          { label: 'Days Tracked', value: streak },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">No data yet.</p>
          <p className="text-sm mt-1">Complete your first work session to see progress.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Work Sessions</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data} barSize={12}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="sessions" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Hydration</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="water" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
