import React from 'react';
import { CalendarSession } from '../types';
import { Bell, Zap, BookOpen } from 'lucide-react';

interface Props {
  sessions: CalendarSession[];
}

const icons: Record<string, React.ReactNode> = {
  affirmation: <Zap size={16} />,
  reflection: <BookOpen size={16} />,
};

const CalendarView: React.FC<Props> = ({ sessions }) => {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
        <p className="text-slate-400 text-sm">Your affirmations & reflections</p>
      </header>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Nothing here yet.</p>
          <p className="text-sm mt-1">Log your mood to create your first entry.</p>
        </div>
      ) : (
        sorted.map(session => (
          <div key={session.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                {icons[session.type] ?? <Bell size={16} />}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{session.type}</span>
              <span className="ml-auto text-[10px] text-slate-400">
                {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{session.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
              {session.description.replace(/\n\n√ Sent$/, '')}
            </p>
            {session.reminderTime && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <Bell size={11} />
                Reminder: {new Date(session.reminderTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default CalendarView;
