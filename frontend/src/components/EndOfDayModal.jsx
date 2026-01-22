import React, { useState } from 'react';
import { Moon, CheckCircle, Droplets, Coffee } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

export const EndOfDayModal = ({ 
    isOpen, 
    onClose, 
    onSave,
    stats,
    affirmation,
    isLoading,
}) => {
    const [reflectionText, setReflectionText] = useState('');

    const handleSave = async () => {
        await onSave(reflectionText);
        setReflectionText('');
        onClose();
    };

    const handleSkip = () => {
        onClose();
        setReflectionText('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-lg glass-modal"
                data-testid="end-of-day-modal"
            >
                <DialogHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Moon className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-heading">
                        End of Day Reflection
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Take a moment to reflect on your day
                    </DialogDescription>
                </DialogHeader>

                {/* Today's Stats */}
                <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                        <CheckCircle className="w-6 h-6 text-focus-timer mb-2" />
                        <span className="text-2xl font-bold">{stats?.sessionsCompleted || 0}</span>
                        <span className="text-xs text-muted-foreground">Sessions</span>
                    </div>
                    <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                        <Coffee className="w-6 h-6 text-break-timer mb-2" />
                        <span className="text-2xl font-bold">{stats?.breaksCompleted || 0}</span>
                        <span className="text-xs text-muted-foreground">Breaks</span>
                    </div>
                    <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                        <Droplets className="w-6 h-6 text-hydration mb-2" />
                        <span className="text-2xl font-bold">{stats?.waterIntakes || 0}</span>
                        <span className="text-xs text-muted-foreground">Water</span>
                    </div>
                </div>

                {/* Today's Affirmation */}
                {affirmation && (
                    <div className="py-4 px-4 rounded-xl bg-accent/50 border border-accent">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            Today's Affirmation
                        </p>
                        <p className="font-accent text-sm italic">"{affirmation}"</p>
                    </div>
                )}

                {/* Reflection Input */}
                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">
                        What went well today? (Optional)
                    </label>
                    <Textarea
                        placeholder="Write your thoughts..."
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        className="min-h-[100px] resize-none"
                        data-testid="reflection-textarea"
                    />
                </div>

                <DialogFooter className="flex gap-3 sm:gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="flex-1"
                        data-testid="skip-reflection-btn"
                    >
                        Skip
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 rounded-full"
                        data-testid="save-reflection-btn"
                    >
                        {isLoading ? 'Saving...' : 'Save Reflection'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EndOfDayModal;
