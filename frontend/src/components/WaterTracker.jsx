import React from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export const WaterTracker = ({ count, onLogWater, isLoading }) => {
    const glasses = Array(8).fill(0).map((_, i) => i < count);

    return (
        <div 
            className="p-6 rounded-2xl bg-card border border-border stat-card"
            data-testid="water-tracker"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-hydration" />
                    <h3 className="font-heading font-semibold">Hydration</h3>
                </div>
                <span className="text-2xl font-bold tabular-nums">{count}</span>
            </div>

            {/* Water glasses visualization */}
            <div className="flex gap-1 mb-4">
                {glasses.map((filled, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex-1 h-3 rounded-full transition-colors duration-300",
                            filled ? "bg-hydration" : "bg-muted"
                        )}
                    />
                ))}
            </div>

            <Button
                onClick={onLogWater}
                disabled={isLoading}
                variant="outline"
                className="w-full rounded-full border-hydration/30 hover:bg-hydration/10 hover:border-hydration"
                data-testid="log-water-btn"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-hydration border-t-transparent rounded-full animate-spin" />
                        Logging...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Log Water
                    </span>
                )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
                Goal: 8 glasses per day
            </p>
        </div>
    );
};

export default WaterTracker;
