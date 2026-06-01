import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { SessionType } from '../types';

interface Props {
  secondsRemaining: number;
  totalSeconds: number;
  type: SessionType;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const TimerDisplay: React.FC<Props> = ({ secondsRemaining, totalSeconds, type, isRunning, onToggle, onReset }) => {
  const progress = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;
  const isWork = type === SessionType.Work;
  const accent = isWork ? 'emerald' : 'sky';
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={isWork ? '#059669' : '#0ea5e9'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-slate-800">{formatTime(secondsRemaining)}</span>
          <span className={`text-xs font-bold uppercase tracking-widest text-${accent}-600 mt-1`}>
            {isWork ? 'Focus' : 'Break'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onReset}
          className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={onToggle}
          className={`px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${isWork ? 'bg-emerald-600 shadow-emerald-100' : 'bg-sky-500 shadow-sky-100'}`}
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} />}
        </button>
      </div>
    </div>
  );
};

export default TimerDisplay;
