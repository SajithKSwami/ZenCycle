import React, { useState } from 'react';
import { Sparkles, Sun, Meh, Frown, Smile } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { cn, getGreeting } from '../lib/utils';

const moods = [
    { id: 'energized', label: 'Energized', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
    { id: 'optimistic', label: 'Optimistic', icon: Sun, color: 'text-emerald-500', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
    { id: 'stressed', label: 'Stressed', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20' },
];

export const MoodCheckinModal = ({ 
    isOpen, 
    onClose, 
    onMoodSelect,
    affirmation,
    isLoading,
    userName,
}) => {
    const [selectedMood, setSelectedMood] = useState(null);
    const [step, setStep] = useState('mood'); // 'mood' or 'affirmation'

    const handleMoodClick = async (moodId) => {
        setSelectedMood(moodId);
        await onMoodSelect(moodId);
        setStep('affirmation');
    };

    const handleStartDay = () => {
        onClose();
        setStep('mood');
        setSelectedMood(null);
    };

    const greeting = getGreeting();
    const firstName = userName?.split(' ')[0] || 'there';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-lg glass-modal"
                data-testid="mood-checkin-modal"
            >
                {step === 'mood' ? (
                    <>
                        <DialogHeader className="text-center pb-4">
                            <DialogTitle className="text-2xl font-heading">
                                {greeting}, {firstName}! <Smile className="inline w-6 h-6 text-primary" />
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                How are you feeling today?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 py-4">
                            {moods.map((mood) => {
                                const Icon = mood.icon;
                                return (
                                    <button
                                        key={mood.id}
                                        onClick={() => handleMoodClick(mood.id)}
                                        className={cn(
                                            "mood-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                                            mood.bg,
                                            selectedMood === mood.id && "ring-2 ring-primary scale-105"
                                        )}
                                        data-testid={`mood-btn-${mood.id}`}
                                    >
                                        <Icon className={cn("w-10 h-10", mood.color)} />
                                        <span className="font-medium text-foreground">
                                            {mood.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center pb-4">
                            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-heading">
                                Your Daily Affirmation
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-muted-foreground">Creating your affirmation...</p>
                                </div>
                            ) : (
                                <blockquote 
                                    className="font-accent text-xl text-center leading-relaxed px-4 affirmation-text"
                                    data-testid="affirmation-text"
                                >
                                    "{affirmation}"
                                </blockquote>
                            )}
                        </div>

                        <Button
                            onClick={handleStartDay}
                            className="w-full rounded-full h-12 text-lg font-semibold btn-scale"
                            disabled={isLoading}
                            data-testid="start-day-btn"
                        >
                            Start My Day
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MoodCheckinModal;
