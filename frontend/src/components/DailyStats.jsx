import React from 'react';
import { CheckCircle, Coffee, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

export const DailyStats = ({ sessionsCompleted, breaksCompleted, completionRate }) => {
    return (
        <div className="grid grid-cols-3 gap-4" data-testid="daily-stats">
            <div className="p-4 rounded-2xl bg-card border border-border stat-card">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-focus-timer" />
                    <span className="text-xs text-muted-foreground">Sessions</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{sessionsCompleted}</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border stat-card">
                <div className="flex items-center gap-2 mb-2">
                    <Coffee className="w-4 h-4 text-break-timer" />
                    <span className="text-xs text-muted-foreground">Breaks</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{breaksCompleted}</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border stat-card">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Rate</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{completionRate}%</p>
            </div>
        </div>
    );
};

export default DailyStats;
