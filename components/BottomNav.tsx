import React from 'react';
import { Home, BarChart2, CalendarDays } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'progress', label: 'Progress', icon: BarChart2 },
];

const BottomNav: React.FC<Props> = ({ activeTab, setActiveTab }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 py-3 flex justify-around max-w-lg mx-auto">
    {tabs.map(({ id, label, icon: Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
