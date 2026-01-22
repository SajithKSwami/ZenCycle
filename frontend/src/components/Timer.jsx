import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Droplets } from 'lucide-react';
import { Button } from './ui/button';
import { cn, formatTime } from '../lib/utils';

export const Timer = ({ 
    timeLeft, 
    totalDuration, 
    progress, 
    isRunning, 
    isPaused, 
    mode,
    timeUntilWaterReminder,
    onStart,
    onPause,
    onResume,
    onReset,
    onSkipToBreak,
    onSkipBreak,
}) => {
    const radius = 140;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    const isWork = mode === 'work';
    const strokeColor = isWork ? 'hsl(var(--focus-timer))' : 'hsl(var(--break-timer))';
    const bgStrokeColor = 'hsl(var(--muted))';

    // Format water reminder time
    const waterMinutes = Math.floor(timeUntilWaterReminder / 60);
    const waterSeconds = timeUntilWaterReminder % 60;
    const waterTimeDisplay = `${waterMinutes}:${waterSeconds.toString().padStart(2, '0')}`;

    return (
        <div className="flex flex-col items-center gap-8" data-testid="timer-component">
            {/* Timer Circle */}
            <div className="relative">
                {/* Breathing animation ring */}
                <div 
                    className={cn(
                        "absolute inset-0 rounded-full",
                        isRunning && !isPaused && "breathing-animation"
                    )}
                    style={{
                        background: `radial-gradient(circle, transparent 60%, ${isWork ? 'hsl(var(--focus-timer) / 0.1)' : 'hsl(var(--break-timer) / 0.1)'} 100%)`
                    }}
                />
                
                <svg 
                    width="320" 
                    height="320" 
                    className="timer-svg"
                    data-testid="timer-svg"
                >
                    {/* Background circle */}
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        fill="none"
                        stroke={bgStrokeColor}
                        strokeWidth="8"
                        className="opacity-30"
                    />
                    
                    {/* Progress circle */}
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="timer-progress"
                    />
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Mode indicator */}
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4",
                        isWork 
                            ? "bg-focus-timer/10 text-focus-timer" 
                            : "bg-break-timer/10 text-break-timer"
                    )}>
                        {isWork ? (
                            <>
                                <Zap className="w-4 h-4" />
                                <span>Focus Time</span>
                            </>
                        ) : (
                            <>
                                <Coffee className="w-4 h-4" />
                                <span>Break Time</span>
                            </>
                        )}
                    </div>
                    
                    {/* Time display */}
                    <div 
                        className="font-heading text-6xl font-bold tabular-nums tracking-tight"
                        data-testid="timer-display"
                    >
                        {formatTime(timeLeft)}
                    </div>
                    
                    {/* Status text */}
                    <p className="text-muted-foreground text-sm mt-2">
                        {isRunning 
                            ? (isPaused ? 'Paused' : (isWork ? 'Stay focused' : 'Take a break'))
                            : 'Ready to start'
                        }
                    </p>
                </div>
            </div>

            {/* Water reminder countdown - only show during work mode when running */}
            {isRunning && !isPaused && isWork && (
                <div 
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-hydration/10 text-hydration text-sm font-medium animate-fade-in"
                    data-testid="water-reminder-countdown"
                >
                    <Droplets className="w-4 h-4" />
                    <span>Next water reminder in {waterTimeDisplay}</span>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
                {!isRunning ? (
                    <Button
                        onClick={onStart}
                        size="lg"
                        className={cn(
                            "rounded-full px-8 h-14 text-lg font-semibold btn-scale",
                            isWork 
                                ? "bg-focus-timer hover:bg-focus-timer/90" 
                                : "bg-break-timer hover:bg-break-timer/90"
                        )}
                        data-testid="start-timer-btn"
                    >
                        <Play className="w-5 h-5 mr-2" />
                        Start {isWork ? 'Focus' : 'Break'}
                    </Button>
                ) : (
                    <>
                        {isPaused ? (
                            <Button
                                onClick={onResume}
                                size="lg"
                                className="rounded-full px-8 h-14 text-lg font-semibold btn-scale bg-primary"
                                data-testid="resume-timer-btn"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Resume
                            </Button>
                        ) : (
                            <Button
                                onClick={onPause}
                                size="lg"
                                variant="outline"
                                className="rounded-full px-8 h-14 text-lg font-semibold btn-scale"
                                data-testid="pause-timer-btn"
                            >
                                <Pause className="w-5 h-5 mr-2" />
                                Pause
                            </Button>
                        )}
                    </>
                )}
                
                <Button
                    onClick={onReset}
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-14 h-14"
                    data-testid="reset-timer-btn"
                >
                    <RotateCcw className="w-5 h-5" />
                </Button>
            </div>

            {/* Skip buttons */}
            {isRunning && (
                <div className="flex gap-2">
                    {isWork && (
                        <Button
                            onClick={onSkipToBreak}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            data-testid="skip-to-break-btn"
                        >
                            Skip to break
                        </Button>
                    )}
                    {!isWork && (
                        <Button
                            onClick={onSkipBreak}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            data-testid="skip-break-btn"
                        >
                            Skip break
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Timer;
