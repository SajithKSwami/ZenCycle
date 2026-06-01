
import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Bell, Droplets, CheckCircle2, X, Zap, Smile, LogOut } from 'lucide-react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './src/firebase';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import TimerDisplay from './components/TimerDisplay';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import { 
  Mood, 
  SessionType, 
  UserProfile, 
  DailyState, 
  TimerState, 
  HistoricalRecord,
  CalendarSession
} from './types';
import { 
  WORK_SESSION_SECONDS, 
  BREAK_SESSION_SECONDS, 
  HYDRATION_REMINDER_SECONDS, 
  DEFAULT_OFFICE_START, 
  DEFAULT_OFFICE_END,
  MOOD_COLORS
} from './constants';
import { generateAffirmation, generateJournalEntry, JournalInputs } from './services/gemini';
import { useTock } from './hooks/useTock';
import { LocationData, BreakLocationRecord } from './types';
import Markdown from 'react-markdown';
import * as Analytics from './services/analytics';

const App: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const uid = authUser?.uid ?? '';
  // Derive first name from Firebase displayName
  const firstName = authUser?.displayName?.split(' ')[0] ?? '';

  const [activeTab, setActiveTab] = useState('home');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [isLoadingAffirmation, setIsLoadingAffirmation] = useState(false);
  const [reflectionStep, setReflectionStep] = useState(1);
  const [journalData, setJournalData] = useState({
    achievement: '', learnings: '', goodMoments: '', okMoments: '', sadMoments: ''
  });
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Profile state
  const [user, setUser] = useState<UserProfile>({
    firstName: '', lastName: '', headline: '', role: '', careerGoal: '',
    officeStartTime: DEFAULT_OFFICE_START, officeEndTime: DEFAULT_OFFICE_END,
    hydrationGoal: 8
  });

  const today = new Date().toISOString().split('T')[0];

  const [daily, setDaily] = useState<DailyState>({
    date: today, waterIntake: 0, completedWorkSessions: 0,
    completedBreaks: 0, reflectionCompleted: false, breakLocations: []
  });

  // Timer stays in localStorage (per-device, ephemeral)
  const [timer, setTimer] = useState<TimerState>(() => {
    try {
      const saved = localStorage.getItem('zencycle_timer');
      if (saved) {
        const parsed = JSON.parse(saved) as TimerState;
        if (parsed.startTime && !parsed.isPaused) {
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          return { ...parsed, remainingSeconds: Math.max(0, parsed.remainingSeconds - elapsed), startTime: Date.now() };
        }
        return parsed;
      }
    } catch { /* ignore */ }
    return { type: SessionType.Work, startTime: null, isPaused: true, remainingSeconds: WORK_SESSION_SECONDS };
  });

  const [history, setHistory] = useState<HistoricalRecord[]>([]);
  const [calendar, setCalendar] = useState<CalendarSession[]>([]);

  // ── Load data from Firestore on mount ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        // Profile
        const profileSnap = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
        if (profileSnap.exists()) setUser(profileSnap.data() as UserProfile);

        // Today's daily state
        const dailySnap = await getDoc(doc(db, 'users', uid, 'daily', today));
        if (dailySnap.exists()) setDaily(dailySnap.data() as DailyState);

        // History (last 14 days)
        const histSnap = await getDocs(
          query(collection(db, 'users', uid, 'history'), orderBy('date', 'desc'), limit(14))
        );
        setHistory(histSnap.docs.map(d => d.data() as HistoricalRecord));

        // Calendar
        const calSnap = await getDocs(
          query(collection(db, 'users', uid, 'calendar'), orderBy('startTime', 'desc'), limit(50))
        );
        setCalendar(calSnap.docs.map(d => ({ ...d.data(), id: d.id }) as CalendarSession));
      } catch (e) {
        console.error('Failed to load from Firestore:', e);
      } finally {
        setDataReady(true);
      }
    };
    load();
  }, [uid, today]);

  // ── Persist profile to Firestore ───────────────────────────────────────────
  useEffect(() => {
    if (!uid || !dataReady) return;
    setDoc(doc(db, 'users', uid, 'data', 'profile'), user, { merge: true }).catch(console.error);
  }, [user, uid, dataReady]);

  // ── Persist daily state to Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!uid || !dataReady) return;
    setDoc(doc(db, 'users', uid, 'daily', today), daily, { merge: true }).catch(console.error);
  }, [daily, uid, today, dataReady]);

  // ── Timer stays in localStorage ───────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('zencycle_timer', JSON.stringify(timer)); } catch { /* ignore */ }
  }, [timer]);

  // Tock Precision Timer Integration
  const tock = useTock({
    countdown: true,
    interval: 1000,
  });

  // Track Page Views & Feature Navigation
  useEffect(() => {
    Analytics.trackPageView(activeTab);
    
    if (activeTab === 'progress') {
      Analytics.logDailySummaryViewed();
      Analytics.logStreakViewed();
    }
  }, [activeTab]);

  // Callbacks must be defined before effects that use them
  const getPosition = useCallback((): Promise<LocationData | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, []);

  const handleTimerComplete = useCallback(async () => {
    tock.stop();
    
    if (timer.type === SessionType.Work) {
      // Starting a Break
      const startLoc = await getPosition();
      Analytics.logBreakStarted('Work Session Complete');
      
      setDaily(prev => ({ ...prev, completedWorkSessions: prev.completedWorkSessions + 1 }));
      const breakRemaining = BREAK_SESSION_SECONDS;
      setTimer({
        type: SessionType.Break,
        isPaused: false,
        startTime: Date.now(),
        remainingSeconds: breakRemaining,
        currentBreakStartLocation: startLoc
      });
      tock.start(breakRemaining * 1000);
      new Notification("Work Session Complete!", { body: "Work session done! Automatically starting your 5-minute break 🌿", icon: "https://picsum.photos/128" });
    } else {
      // Ending a Break
      const endLoc = await getPosition();
      Analytics.logBreakCompleted(BREAK_SESSION_SECONDS);

      const newBreakRecord: BreakLocationRecord = {
        startTime: new Date(timer.startTime || Date.now()).toISOString(),
        startLocation: timer.currentBreakStartLocation,
        endLocation: endLoc
      };

      setDaily(prev => ({ 
        ...prev, 
        completedBreaks: prev.completedBreaks + 1,
        breakLocations: [...prev.breakLocations, newBreakRecord]
      }));

      const workRemaining = WORK_SESSION_SECONDS;
      setTimer({
        type: SessionType.Work,
        isPaused: false,
        startTime: Date.now(),
        remainingSeconds: workRemaining,
        currentBreakStartLocation: undefined
      });
      tock.start(workRemaining * 1000);
      new Notification("Break Over!", { body: "Break over! Your focus session is starting now. Let's get into flow ⚡️", icon: "https://picsum.photos/128" });
    }
  }, [timer.type, timer.startTime, timer.currentBreakStartLocation, tock, getPosition]);

  const toggleTimer = useCallback(() => {
    if (timer.isPaused) {
      // Start
      if (Notification.permission === 'default') Notification.requestPermission();
      tock.start(timer.remainingSeconds * 1000);
      setTimer(prev => ({ ...prev, isPaused: false, startTime: Date.now() }));
    } else {
      // Pause
      tock.pause();
      setTimer(prev => ({ ...prev, isPaused: true, startTime: null }));
    }
  }, [timer.isPaused, timer.remainingSeconds, tock]);

  const resetTimer = useCallback(() => {
    tock.stop();
    const initialSeconds = timer.type === SessionType.Work ? WORK_SESSION_SECONDS : BREAK_SESSION_SECONDS;
    tock.setTime(initialSeconds * 1000);
    setTimer({
      type: timer.type,
      isPaused: true,
      startTime: null,
      remainingSeconds: initialSeconds,
      currentBreakStartLocation: undefined
    });
  }, [timer.type, tock]);

  // Handle initial resume if timer was active
  useEffect(() => {
    if (!timer.isPaused && timer.remainingSeconds > 0) {
      tock.start(timer.remainingSeconds * 1000);
    }
  }, []); // Only on mount

  // Sync Tock time back to persistent timer state for UI and storage
  useEffect(() => {
    setTimer(prev => ({
      ...prev,
      remainingSeconds: Math.ceil(tock.time / 1000),
      isPaused: !tock.isRunning
    }));
  }, [tock.time, tock.isRunning]);

  // Handle scheduled calendar reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      calendar.forEach(session => {
        if (session.reminderTime && !session.description.includes('√ Sent')) {
          const remTime = new Date(session.reminderTime);
          if (now >= remTime) {
            new Notification(`ZenCycle: Time to Revisit! 🧘`, {
              body: `Remember your daily boost: "${session.title}"`,
              icon: "https://picsum.photos/seed/wellness/128"
            });
            
            // Mark as sent in state to avoid duplicates (could also use a 'reminderSent' flag in type)
            setCalendar(prev => prev.map(s => 
              s.id === session.id ? { ...s, description: s.description + '\n\n√ Sent' } : s
            ));
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [calendar]);

  // Handle completion from Tock
  useEffect(() => {
    if (timer.remainingSeconds === 0 && !timer.isPaused) {
      handleTimerComplete();
    }

    // Hydration Reminder logic
    if (
      !timer.isPaused && 
      timer.type === SessionType.Work && 
      timer.remainingSeconds > 0 &&
      timer.remainingSeconds % HYDRATION_REMINDER_SECONDS === 0 &&
      timer.remainingSeconds !== WORK_SESSION_SECONDS // Don't remind at the very start
    ) {
      new Notification("Hydration Break! 💧", { 
        body: "Time to take a sip of water. Stay hydrated to stay focused!",
        icon: "https://picsum.photos/128" 
      });
    }
  }, [timer.remainingSeconds, timer.isPaused, timer.type, handleTimerComplete]);

  // (persistence handled by Firestore effects above)

  // Check for mood prompt or reflection prompt
  useEffect(() => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Morning check
    if (!daily.mood) setShowMoodModal(true);

    // End of day check
    if (timeStr >= user.officeEndTime && !daily.reflectionCompleted) {
      setShowReflectionModal(true);
    }
  }, [daily.mood, daily.reflectionCompleted, user.officeEndTime]);

  const handleMoodSelect = async (m: Mood) => {
    setIsLoadingAffirmation(true);
    const aff = await generateAffirmation(m, user.careerGoal);
    setDaily(prev => ({ ...prev, mood: m, affirmation: aff }));
    
    // Create Calendar Event for Affirmation
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Remind in 2 hours
    
    const event: CalendarSession = {
      id: `aff-${Date.now()}`,
      title: "Self-Affirmation Moment",
      description: `Affirmation: ${aff}\n\nRevisit this to maintain your ${m} perspective.`,
      startTime: now.toISOString(),
      endTime: new Date(now.getTime() + 15 * 60000).toISOString(),
      type: 'affirmation',
      reminderTime: reminderTime.toISOString()
    };
    
    setCalendar(prev => [...prev, event]);

    // Save calendar event to Firestore
    if (uid) {
      addDoc(collection(db, 'users', uid, 'calendar'), event).catch(console.error);
    }

    setIsLoadingAffirmation(false);
    setShowMoodModal(false);
  };

  const logWater = () => {
    setDaily(prev => ({ ...prev, waterIntake: prev.waterIntake + 1 }));
  };

  const completeReflection = async () => {
    setIsGeneratingJournal(true);
    
    // Auto-log current date and time
    const now = new Date();
    const dateTimeStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const inputs: JournalInputs = {
      achievement: journalData.achievement,
      learnings: journalData.learnings.split(',').map(s => s.trim()).filter(Boolean),
      goodMoments: journalData.goodMoments.split(',').map(s => s.trim()).filter(Boolean),
      okMoments: journalData.okMoments.split(',').map(s => s.trim()).filter(Boolean),
      sadMoments: journalData.sadMoments.split(',').map(s => s.trim()).filter(Boolean),
      dateTime: dateTimeStr
    };

    const entry = await generateJournalEntry(inputs);
    Analytics.logJournalEntry(inputs.achievement);

    const newRecord: HistoricalRecord = {
      date: today,
      water: daily.waterIntake,
      sessions: daily.completedWorkSessions,
      mood: daily.mood
    };

    setHistory(prev => {
      const filtered = prev.filter(r => r.date !== today);
      return [...filtered, newRecord].slice(-14);
    });

    // Save history record to Firestore
    if (uid) {
      setDoc(doc(db, 'users', uid, 'history', today), newRecord).catch(console.error);
    }

    setDaily(prev => ({ ...prev, reflectionText: entry, reflectionCompleted: true }));
    setIsGeneratingJournal(false);
    setShowReflectionModal(false);
    setReflectionStep(1); // Reset for next time
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100">
            Z
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ZenCycle</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              {firstName ? `Hey, ${firstName}` : 'In Motion'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('settings')} className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400">
            <SettingsIcon size={20} />
          </button>
          <button onClick={logout} title="Sign out" className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 max-w-lg mx-auto w-full">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Daily Affirmation Card */}
            {daily.affirmation && (
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap size={120} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Today's Affirmation</p>
                <p className="text-lg font-medium leading-relaxed italic">"{daily.affirmation}"</p>
                {daily.mood && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                    <Smile size={14} /> Feeling {daily.mood}
                  </div>
                )}
              </div>
            )}

            {/* Timer Section */}
            <TimerDisplay 
              secondsRemaining={timer.remainingSeconds} 
              totalSeconds={timer.type === SessionType.Work ? WORK_SESSION_SECONDS : BREAK_SESSION_SECONDS}
              type={timer.type}
              isRunning={!timer.isPaused}
              onToggle={toggleTimer}
              onReset={resetTimer}
            />

            {/* Water Stats Card */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                    <Droplets size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{daily.waterIntake}/{user.hydrationGoal}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Hydration</h3>
                <button 
                  onClick={logWater}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Log Water
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{daily.completedWorkSessions}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-600 uppercase mb-3">Work Cycles</h3>
                <div className="text-lg font-bold text-slate-800">Done Today</div>
              </div>
            </div>

            {/* Daily Journal Entry Card */}
            {daily.reflectionCompleted && daily.reflectionText && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Your Daily Journal</h3>
                    <p className="text-xs text-slate-400">Mindful summary generated by AI</p>
                  </div>
                </div>
                
                <div className="prose prose-sm prose-slate max-w-none">
                  <div className="text-slate-600 text-sm leading-relaxed space-y-4">
                    <Markdown>{daily.reflectionText}</Markdown>
                  </div>
                </div>
              </div>
            )}

            <div className="h-24"></div> {/* Spacer for bottom nav */}
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView sessions={calendar} />
        )}

        {activeTab === 'progress' && <Dashboard history={history} />}

        {activeTab === 'settings' && (
          <div className="space-y-6 pb-24">
            <header className="pt-2">
              <h1 className="text-2xl font-bold text-slate-800">Your Profile</h1>
              <p className="text-slate-400">Personalize your ZenCycle experience</p>
            </header>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Goal</label>
                <input 
                  type="text" 
                  value={user.careerGoal}
                  onChange={(e) => setUser({...user, careerGoal: e.target.value})}
                  className="w-full mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 ring-emerald-500 transition-all"
                  placeholder="e.g. Lead Developer at Google"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={user.firstName}
                    onChange={(e) => setUser({...user, firstName: e.target.value})}
                    className="flex-1 mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm"
                    placeholder="First"
                  />
                  <input 
                    type="text" 
                    value={user.lastName}
                    onChange={(e) => setUser({...user, lastName: e.target.value})}
                    className="flex-1 mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm"
                    placeholder="Last"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Daily Hydration Goal (Glasses)</label>
                <input 
                  type="number" 
                  min="1"
                  max="24"
                  value={user.hydrationGoal}
                  onChange={(e) => setUser({...user, hydrationGoal: parseInt(e.target.value) || 1})}
                  className="w-full mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 ring-emerald-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Office Start</label>
                  <input 
                    type="time" 
                    value={user.officeStartTime}
                    onChange={(e) => setUser({...user, officeStartTime: e.target.value})}
                    className="w-full mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Office End</label>
                  <input 
                    type="time" 
                    value={user.officeEndTime}
                    onChange={(e) => setUser({...user, officeEndTime: e.target.value})}
                    className="w-full mt-1 p-4 rounded-2xl bg-slate-50 border-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-medium leading-relaxed flex gap-3">
              <Bell size={18} className="shrink-0" />
              Your career goals are used by our AI to craft affirmations that help you grow while you work.
            </div>
          </div>
        )}
      </main>

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Good Morning{firstName ? `, ${firstName}` : ''}! 👋
              </h2>
              <p className="text-slate-400 mt-2">How are you starting your day today?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.values(Mood).map((m) => (
                <button
                  key={m}
                  onClick={() => handleMoodSelect(m)}
                  disabled={isLoadingAffirmation}
                  className={`flex flex-col items-center justify-center p-6 rounded-[32px] border border-slate-100 transition-all hover:border-emerald-200 hover:bg-emerald-50 group ${isLoadingAffirmation ? 'opacity-50' : ''}`}
                >
                  <div className={`p-3 rounded-2xl mb-3 text-2xl group-hover:scale-110 transition-transform`}>
                    {m === Mood.Energized && '⚡️'}
                    {m === Mood.Neutral && '🧘'}
                    {m === Mood.Stressed && '🌋'}
                    {m === Mood.Optimistic && '🌈'}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{m}</span>
                </button>
              ))}
            </div>

            {isLoadingAffirmation && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold animate-pulse text-sm">
                <Zap size={16} /> Crafting your daily boost...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Step {reflectionStep}/6</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Zen Reflection</h2>
              </div>
              <button 
                onClick={() => {
                  setShowReflectionModal(false);
                  setReflectionStep(1);
                }} 
                className="p-2 text-slate-400"
              >
                <X />
              </button>
            </div>

            {reflectionStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 block mb-2">Achievement of the Day 🏆</span>
                  <p className="text-xs text-slate-400 mb-3">What is one meaningful achievement you had today?</p>
                  <textarea 
                    value={journalData.achievement}
                    onChange={(e) => setJournalData({...journalData, achievement: e.target.value})}
                    className="w-full h-32 p-4 rounded-3xl bg-slate-50 border-none text-sm placeholder:text-slate-300 focus:ring-2 ring-emerald-500"
                    placeholder="Summarize it in 1-3 sentences..."
                  />
                </label>
              </div>
            )}

            {reflectionStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 block mb-2">Key Learnings 💡</span>
                  <p className="text-xs text-slate-400 mb-3">What did you learn today? (Comma separated)</p>
                  <textarea 
                    value={journalData.learnings}
                    onChange={(e) => setJournalData({...journalData, learnings: e.target.value})}
                    className="w-full h-32 p-4 rounded-3xl bg-slate-50 border-none text-sm placeholder:text-slate-300 focus:ring-2 ring-emerald-500"
                    placeholder="Capture 2-3 insights or lessons..."
                  />
                </label>
              </div>
            )}

            {reflectionStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 block mb-2">Good Moments ✨</span>
                  <p className="text-xs text-slate-400 mb-3">What were the positive moments today? (Comma separated)</p>
                  <textarea 
                    value={journalData.goodMoments}
                    onChange={(e) => setJournalData({...journalData, goodMoments: e.target.value})}
                    className="w-full h-32 p-4 rounded-3xl bg-slate-50 border-none text-sm placeholder:text-slate-300 focus:ring-2 ring-emerald-500"
                    placeholder="List 1-3 items..."
                  />
                </label>
              </div>
            )}

            {reflectionStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 block mb-2">OK Moments 🧘</span>
                  <p className="text-xs text-slate-400 mb-3">What were neutral or average moments? (Comma separated)</p>
                  <textarea 
                    value={journalData.okMoments}
                    onChange={(e) => setJournalData({...journalData, okMoments: e.target.value})}
                    className="w-full h-32 p-4 rounded-3xl bg-slate-50 border-none text-sm placeholder:text-slate-300 focus:ring-2 ring-emerald-500"
                    placeholder="List 1-3 items..."
                  />
                </label>
              </div>
            )}

            {reflectionStep === 5 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 block mb-2">Sad/Difficult Moments 🌋</span>
                  <p className="text-xs text-slate-400 mb-3">What were the challenging moments today? (Comma separated)</p>
                  <textarea 
                    value={journalData.sadMoments}
                    onChange={(e) => setJournalData({...journalData, sadMoments: e.target.value})}
                    className="w-full h-32 p-4 rounded-3xl bg-slate-50 border-none text-sm placeholder:text-slate-300 focus:ring-2 ring-emerald-500"
                    placeholder="Stressful or challenging items..."
                  />
                </label>
              </div>
            )}

            {reflectionStep === 6 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-slate-700 mb-2 leading-relaxed text-center">Ready to generate your entry?</h3>
                <p className="text-xs text-slate-400 text-center px-6">Our AI will now weave your experiences into a mindful journal entry for your growth.</p>
              </div>
            )}

            <div className="flex gap-3">
              {reflectionStep > 1 && (
                <button 
                  onClick={() => setReflectionStep(prev => prev - 1)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95 transition-transform"
                >
                  Back
                </button>
              )}
              {reflectionStep < 6 ? (
                <button 
                  onClick={() => setReflectionStep(prev => prev + 1)}
                  className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={completeReflection}
                  disabled={isGeneratingJournal}
                  className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-100 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingJournal ? <Zap size={16} className="animate-pulse" /> : null}
                  {isGeneratingJournal ? "Crafting Entry..." : "Generate Daily Entry"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
