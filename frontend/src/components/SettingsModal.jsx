import React, { useState, useEffect } from 'react';
import { Settings, User, Clock, Target, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { userApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const SettingsModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        office_start_time: '09:00',
        office_end_time: '17:00',
        linkedin_headline: '',
        linkedin_role: '',
        career_goal: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                office_start_time: user.office_start_time || '09:00',
                office_end_time: user.office_end_time || '17:00',
                linkedin_headline: user.linkedin_headline || '',
                linkedin_role: user.linkedin_role || '',
                career_goal: user.career_goal || '',
            });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await userApi.updateProfile(formData);
            updateUser(updatedUser);
            toast.success('Settings saved successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to save settings');
            console.error('Settings error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-lg glass-modal"
                data-testid="settings-modal"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-heading">
                        <Settings className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Customize your ZenCycle experience
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile" data-testid="settings-profile-tab">
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="office" data-testid="settings-office-tab">
                            <Clock className="w-4 h-4 mr-2" />
                            Office
                        </TabsTrigger>
                        <TabsTrigger value="career" data-testid="settings-career-tab">
                            <Target className="w-4 h-4 mr-2" />
                            Career
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                    placeholder="John"
                                    data-testid="settings-first-name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    placeholder="Doe"
                                    data-testid="settings-last-name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="office" className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                            Set your working hours to receive end-of-day reflection prompts
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="office_start">Start Time</Label>
                                <Input
                                    id="office_start"
                                    type="time"
                                    value={formData.office_start_time}
                                    onChange={(e) => handleChange('office_start_time', e.target.value)}
                                    data-testid="settings-office-start"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="office_end">End Time</Label>
                                <Input
                                    id="office_end"
                                    type="time"
                                    value={formData.office_end_time}
                                    onChange={(e) => handleChange('office_end_time', e.target.value)}
                                    data-testid="settings-office-end"
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 mt-4">
                            <p className="text-sm">
                                <strong>Timer Configuration:</strong>
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li>• Work session: 60 minutes</li>
                                <li>• Break: 5 minutes</li>
                                <li>• Water reminders: Every 30 minutes</li>
                            </ul>
                        </div>
                    </TabsContent>

                    <TabsContent value="career" className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                            Your career profile helps personalize your daily affirmations
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="headline">Professional Headline</Label>
                            <Input
                                id="headline"
                                value={formData.linkedin_headline}
                                onChange={(e) => handleChange('linkedin_headline', e.target.value)}
                                placeholder="Senior Software Engineer"
                                data-testid="settings-headline"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Current Role</Label>
                            <Input
                                id="role"
                                value={formData.linkedin_role}
                                onChange={(e) => handleChange('linkedin_role', e.target.value)}
                                placeholder="Full-stack Developer at Tech Corp"
                                data-testid="settings-role"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="career_goal">Career Goal</Label>
                            <Input
                                id="career_goal"
                                value={formData.career_goal}
                                onChange={(e) => handleChange('career_goal', e.target.value)}
                                placeholder="Become a Tech Lead"
                                data-testid="settings-career-goal"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        data-testid="settings-cancel-btn"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="rounded-full px-6"
                        data-testid="settings-save-btn"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
