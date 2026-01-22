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
    const [waterTimerSeconds, setWaterTimerSeconds] = useState(0); // Counts up from 0 to 30 min
    
    const intervalRef = useRef(null);
    const waterIntervalRef = useRef(null);
    const onWaterReminderRef = useRef(onWaterReminder);

    // Keep callback ref updated
    useEffect(() => {
        onWaterReminderRef.current = onWaterReminder;
    }, [onWaterReminder]);

    // Load saved state on mount
    useEffect(() => {
        const savedState = timerStorage.load();
        if (savedState) {
            setTimeLeft(savedState.timeLeft);
            setIsRunning(savedState.isRunning);
            setIsPaused(savedState.isPaused || false);
            setMode(savedState.mode || 'work');
            setCurrentSessionId(savedState.currentSessionId);
            setWaterTimerSeconds(savedState.waterTimerSeconds || 0);
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
            waterTimerSeconds,
        });
    }, [timeLeft, isRunning, isPaused, mode, currentSessionId, waterTimerSeconds]);

    // Main timer tick logic
    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = prev - 1;
                    
                    // Timer complete
                    if (newTime <= 0) {
                        return 0;
                    }
                    
                    return newTime;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, isPaused]);

    // Water reminder timer - separate interval that resets every 30 min
    useEffect(() => {
        if (isRunning && !isPaused && mode === 'work') {
            waterIntervalRef.current = setInterval(() => {
                setWaterTimerSeconds((prev) => {
                    const newSeconds = prev + 1;
                    
                    // Check if 30 minutes have passed
                    if (newSeconds >= WATER_REMINDER_INTERVAL) {
                        // Trigger water reminder
                        if (onWaterReminderRef.current) {
                            onWaterReminderRef.current();
                        }
                        // Reset water timer to 0
                        return 0;
                    }
                    
                    return newSeconds;
                });
            }, 1000);
        } else {
            if (waterIntervalRef.current) {
                clearInterval(waterIntervalRef.current);
                waterIntervalRef.current = null;
            }
        }

        return () => {
            if (waterIntervalRef.current) {
                clearInterval(waterIntervalRef.current);
                waterIntervalRef.current = null;
            }
        };
    }, [isRunning, isPaused, mode]);

    // Handle timer completion
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            handleTimerComplete();
        }
    }, [timeLeft, isRunning]);

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
            setWaterTimerSeconds(0);
            if (onBreakStart) onBreakStart();
        } else {
            // Break complete, ready for new work session
            setMode('work');
            setTimeLeft(WORK_DURATION);
            setWaterTimerSeconds(0);
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
        
        // Reset water timer when starting
        setWaterTimerSeconds(0);
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
        setWaterTimerSeconds(0);
        setCurrentSessionId(null);
        timerStorage.clear();
    }, []);

    const skipToBreak = useCallback(() => {
        if (mode === 'work') {
            setMode('break');
            setTimeLeft(BREAK_DURATION);
            setWaterTimerSeconds(0);
            setIsRunning(false);
            setIsPaused(false);
        }
    }, [mode]);

    const skipBreak = useCallback(() => {
        if (mode === 'break') {
            setMode('work');
            setTimeLeft(WORK_DURATION);
            setWaterTimerSeconds(0);
            setIsRunning(false);
            setIsPaused(false);
            setCurrentSessionId(null);
        }
    }, [mode]);

    // Calculate time until next water reminder
    const timeUntilWaterReminder = WATER_REMINDER_INTERVAL - waterTimerSeconds;

    return {
        timeLeft,
        isRunning,
        isPaused,
        mode,
        totalDuration: mode === 'work' ? WORK_DURATION : BREAK_DURATION,
        progress: ((mode === 'work' ? WORK_DURATION : BREAK_DURATION) - timeLeft) / (mode === 'work' ? WORK_DURATION : BREAK_DURATION) * 100,
        waterTimerSeconds,
        timeUntilWaterReminder,
        start,
        pause,
        resume,
        reset,
        skipToBreak,
        skipBreak,
    };
};

export default useTimer;
