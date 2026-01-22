import { useState, useEffect, useCallback, useRef } from 'react';
import { timerStorage } from '../lib/utils';
import { sessionApi } from '../lib/api';

const WORK_DURATION = 90 * 60; // 90 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const WATER_REMINDER_INTERVAL = 30 * 60; // 30 minutes in seconds

export const useTimer = (onBreakStart, onWaterReminder, onSessionComplete) => {
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' or 'break'
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [lastWaterReminder, setLastWaterReminder] = useState(0);
    
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    // Load saved state on mount
    useEffect(() => {
        const savedState = timerStorage.load();
        if (savedState) {
            setTimeLeft(savedState.timeLeft);
            setIsRunning(savedState.isRunning);
            setIsPaused(savedState.isPaused || false);
            setMode(savedState.mode || 'work');
            setCurrentSessionId(savedState.currentSessionId);
            setLastWaterReminder(savedState.lastWaterReminder || 0);
        }
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        timerStorage.save({
            timeLeft,
            isRunning,
            isPaused,
            mode,
            currentSessionId,
            lastWaterReminder,
        });
    }, [timeLeft, isRunning, isPaused, mode, currentSessionId, lastWaterReminder]);

    // Timer tick logic
    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = prev - 1;
                    
                    // Water reminder check (only during work mode)
                    if (mode === 'work') {
                        const elapsed = (mode === 'work' ? WORK_DURATION : BREAK_DURATION) - newTime;
                        const shouldRemind = elapsed - lastWaterReminder >= WATER_REMINDER_INTERVAL;
                        if (shouldRemind && onWaterReminder) {
                            onWaterReminder();
                            setLastWaterReminder(elapsed);
                        }
                    }
                    
                    // Timer complete
                    if (newTime <= 0) {
                        handleTimerComplete();
                        return 0;
                    }
                    
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, isPaused, mode, lastWaterReminder, onWaterReminder]);

    const handleTimerComplete = useCallback(async () => {
        setIsRunning(false);
        
        // Update session as completed
        if (currentSessionId) {
            try {
                await sessionApi.update(currentSessionId, {
                    completed: true,
                    end_time: new Date().toISOString(),
                    duration_minutes: mode === 'work' ? 90 : 5,
                });
            } catch (error) {
                console.error('Failed to update session:', error);
            }
        }
        
        if (mode === 'work') {
            // Switch to break mode
            setMode('break');
            setTimeLeft(BREAK_DURATION);
            setLastWaterReminder(0);
            if (onBreakStart) onBreakStart();
        } else {
            // Break complete, ready for new work session
            setMode('work');
            setTimeLeft(WORK_DURATION);
            setLastWaterReminder(0);
            setCurrentSessionId(null);
            if (onSessionComplete) onSessionComplete();
        }
    }, [currentSessionId, mode, onBreakStart, onSessionComplete]);

    const start = useCallback(async () => {
        if (!currentSessionId) {
            try {
                const session = await sessionApi.create(mode);
                setCurrentSessionId(session.id);
            } catch (error) {
                console.error('Failed to create session:', error);
            }
        }
        
        startTimeRef.current = Date.now();
        setIsRunning(true);
        setIsPaused(false);
    }, [currentSessionId, mode]);

    const pause = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        setMode('work');
        setTimeLeft(WORK_DURATION);
        setLastWaterReminder(0);
        setCurrentSessionId(null);
        timerStorage.clear();
    }, []);

    const skipToBreak = useCallback(() => {
        if (mode === 'work') {
            setMode('break');
            setTimeLeft(BREAK_DURATION);
            setLastWaterReminder(0);
            setIsRunning(false);
            setIsPaused(false);
        }
    }, [mode]);

    const skipBreak = useCallback(() => {
        if (mode === 'break') {
            setMode('work');
            setTimeLeft(WORK_DURATION);
            setLastWaterReminder(0);
            setIsRunning(false);
            setIsPaused(false);
            setCurrentSessionId(null);
        }
    }, [mode]);

    return {
        timeLeft,
        isRunning,
        isPaused,
        mode,
        totalDuration: mode === 'work' ? WORK_DURATION : BREAK_DURATION,
        progress: ((mode === 'work' ? WORK_DURATION : BREAK_DURATION) - timeLeft) / (mode === 'work' ? WORK_DURATION : BREAK_DURATION) * 100,
        start,
        pause,
        resume,
        reset,
        skipToBreak,
        skipBreak,
    };
};

export default useTimer;
