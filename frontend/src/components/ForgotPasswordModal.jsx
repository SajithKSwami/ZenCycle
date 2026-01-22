import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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
import { authApi } from '../lib/api';
import { toast } from 'sonner';

export const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resetToken, setResetToken] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            setIsSuccess(true);
            // For demo, store the reset token to show the link
            if (response.reset_token) {
                setResetToken(response.reset_token);
            }
            toast.success('Reset link sent!');
        } catch (error) {
            toast.error('Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setIsSuccess(false);
        setResetToken(null);
        onClose();
    };

    const handleBackToLogin = () => {
        handleClose();
        onBackToLogin();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md" data-testid="forgot-password-modal">
                {!isSuccess ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-heading">
                                Forgot Password?
                            </DialogTitle>
                            <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        data-testid="forgot-password-email"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-full h-11"
                                disabled={isLoading}
                                data-testid="send-reset-link-btn"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={handleBackToLogin}
                                data-testid="back-to-login-btn"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-primary" />
                            </div>
                            <DialogTitle className="text-xl font-heading">
                                Check Your Email
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                We've sent a password reset link to <strong>{email}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {resetToken && (
                                <div className="p-4 rounded-xl bg-accent/50 border border-accent">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                                        Demo: Reset Link
                                    </p>
                                    <a 
                                        href={`/reset-password?token=${resetToken}`}
                                        className="text-sm text-primary hover:underline break-all"
                                        data-testid="reset-link"
                                    >
                                        Click here to reset your password
                                    </a>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground text-center">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>

                            <Button
                                variant="outline"
                                className="w-full rounded-full"
                                onClick={handleBackToLogin}
                            >
                                Back to Login
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ForgotPasswordModal;
