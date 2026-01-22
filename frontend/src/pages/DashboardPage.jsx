import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Timer } from '../components/Timer';
import { WaterTracker } from '../components/WaterTracker';
import { DailyStats } from '../components/DailyStats';
import { MoodCheckinModal } from '../components/MoodCheckinModal';
import { EndOfDayModal } from '../components/EndOfDayModal';
import { SettingsModal } from '../components/SettingsModal';
import { useTimer } from '../hooks/useTimer';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { moodApi, affirmationApi, waterApi, sessionApi, reflectionApi } from '../lib/api';
import { isPastOfficeHours } from '../lib/utils';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { notifyBreakTime, notifyWaterReminder, notifyWorkComplete } = useNotification();
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [affirmation, setAffirmation] = useState(null);
    const [isAffirmationLoading, setIsAffirmationLoading] = useState(false);
    const [waterCount, setWaterCount] = useState(0);
    const [isWaterLoading, setIsWaterLoading] = useState(false);
    const [todaySessions, setTodaySessions] = useState([]);
    const [hasCheckedMood, setHasCheckedMood] = useState(false);
    const [hasShownEndOfDay, setHasShownEndOfDay] = useState(false);

    // Timer callbacks
    const handleBreakStart = useCallback(() => {
        // Send browser/mobile notification
        notifyWorkComplete();
        notifyBreakTime();
        
        toast('Time for a break!', {
            description: 'Step away for 5 minutes. Your body will thank you.',
            icon: '🌿',
        });
    }, [notifyBreakTime, notifyWorkComplete]);

    const handleWaterReminder = useCallback(() => {
        // Send browser/mobile notification
        notifyWaterReminder();
        
        toast('Hydration fuels focus', {
            description: 'Time to drink some water!',
            icon: '💧',
        });
    }, [notifyWaterReminder]);

    const handleSessionComplete = useCallback(() => {
        toast.success('Session complete!', {
            description: 'Great work! Ready for another cycle?',
        });
        loadTodaySessions();
    }, []);

    const timer = useTimer(handleBreakStart, handleWaterReminder, handleSessionComplete);

    // Load initial data
    const loadTodayMood = useCallback(async () => {
        try {
            const mood = await moodApi.getToday();
            if (mood) {
                setHasCheckedMood(true);
                const aff = await affirmationApi.getToday();
                if (aff) {
                    setAffirmation(aff.text);
                }
            } else {
                setShowMoodModal(true);
            }
        } catch (error) {
            console.error('Error loading mood:', error);
            setShowMoodModal(true);
        }
    }, []);

    const loadWaterCount = useCallback(async () => {
        try {
            const data = await waterApi.getTodayCount();
            setWaterCount(data.count);
        } catch (error) {
            console.error('Error loading water count:', error);
        }
    }, []);

    const loadTodaySessions = useCallback(async () => {
        try {
            const sessions = await sessionApi.getToday();
            setTodaySessions(sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }, []);

    useEffect(() => {
        loadTodayMood();
        loadWaterCount();
        loadTodaySessions();
    }, [loadTodayMood, loadWaterCount, loadTodaySessions]);

    // Check for end of day
    useEffect(() => {
        const checkEndOfDay = () => {
            if (!hasShownEndOfDay && user?.office_end_time && isPastOfficeHours(user.office_end_time)) {
                setShowEndOfDayModal(true);
                setHasShownEndOfDay(true);
            }
        };

        checkEndOfDay();
        const interval = setInterval(checkEndOfDay, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [user?.office_end_time, hasShownEndOfDay]);

    // Handlers
    const handleMoodSelect = async (mood) => {
        try {
            await moodApi.create(mood);
            setHasCheckedMood(true);
            
            setIsAffirmationLoading(true);
            const affirmationResponse = await affirmationApi.generate(mood, user?.career_goal);
            setAffirmation(affirmationResponse.text);
        } catch (error) {
            console.error('Error saving mood:', error);
            toast.error('Failed to save mood');
        } finally {
            setIsAffirmationLoading(false);
        }
    };

    const handleLogWater = async () => {
        setIsWaterLoading(true);
        try {
            await waterApi.log();
            setWaterCount(prev => prev + 1);
            toast.success('Water logged!', { icon: '💧' });
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to log water';
            toast.error(message);
        } finally {
            setIsWaterLoading(false);
        }
    };

    const handleSaveReflection = async (reflectionText) => {
        try {
            await reflectionApi.create({
                reflection_text: reflectionText,
                hydration_count: waterCount,
                break_count: todaySessions.filter(s => s.session_type === 'break' && s.completed).length,
            });
            toast.success('Reflection saved!');
        } catch (error) {
            // If reflection exists, try to update
            if (error.response?.status === 400) {
                try {
                    await reflectionApi.update({ reflection_text: reflectionText });
                    toast.success('Reflection updated!');
                } catch (updateError) {
                    toast.error('Failed to save reflection');
                }
            } else {
                toast.error('Failed to save reflection');
            }
        }
    };

    // Calculate stats
    const completedSessions = todaySessions.filter(s => s.session_type === 'work' && s.completed).length;
    const completedBreaks = todaySessions.filter(s => s.session_type === 'break' && s.completed).length;
    const totalSessions = todaySessions.filter(s => s.session_type === 'work').length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return (
        <div className="min-h-screen bg-background" data-testid="dashboard-page">
            <Header onSettingsClick={() => setShowSettingsModal(true)} />
            
            <main className="container px-4 md:px-6 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Affirmation Banner */}
                    {affirmation && (
                        <div 
                            className="p-6 rounded-2xl bg-accent/50 border border-accent fade-in"
                            data-testid="affirmation-banner"
                        >
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                        Today's Affirmation
                                    </p>
                                    <p className="font-accent text-lg italic">
                                        "{affirmation}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Timer Section - Takes 2 columns */}
                        <div className="md:col-span-2 p-8 rounded-2xl bg-card border border-border">
                            <Timer
                                timeLeft={timer.timeLeft}
                                totalDuration={timer.totalDuration}
                                progress={timer.progress}
                                isRunning={timer.isRunning}
                                isPaused={timer.isPaused}
                                mode={timer.mode}
                                timeUntilWaterReminder={timer.timeUntilWaterReminder}
                                onStart={timer.start}
                                onPause={timer.pause}
                                onResume={timer.resume}
                                onReset={timer.reset}
                                onSkipToBreak={timer.skipToBreak}
                                onSkipBreak={timer.skipBreak}
                            />
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <WaterTracker
                                count={waterCount}
                                onLogWater={handleLogWater}
                                isLoading={isWaterLoading}
                            />
                        </div>
                    </div>

                    {/* Daily Stats */}
                    <DailyStats
                        sessionsCompleted={completedSessions}
                        breaksCompleted={completedBreaks}
                        completionRate={completionRate}
                    />
                </div>
            </main>

            {/* Modals */}
            <MoodCheckinModal
                isOpen={showMoodModal}
                onClose={() => setShowMoodModal(false)}
                onMoodSelect={handleMoodSelect}
                affirmation={affirmation}
                isLoading={isAffirmationLoading}
                userName={user?.first_name || user?.email}
            />

            <EndOfDayModal
                isOpen={showEndOfDayModal}
                onClose={() => setShowEndOfDayModal(false)}
                onSave={handleSaveReflection}
                stats={{
                    sessionsCompleted: completedSessions,
                    breaksCompleted: completedBreaks,
                    waterIntakes: waterCount,
                }}
                affirmation={affirmation}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </div>
    );
}
