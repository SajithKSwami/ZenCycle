import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ThemeToggle } from '../components/ThemeToggle';
import { authApi } from '../lib/api';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsVerifying(false);
                setIsValidToken(false);
                return;
            }

            try {
                const response = await authApi.verifyResetToken(token);
                setIsValidToken(true);
                setEmail(response.email);
            } catch (error) {
                setIsValidToken(false);
                toast.error('Invalid or expired reset link');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setIsSuccess(true);
            toast.success('Password reset successfully!');
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to reset password';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" data-testid="reset-password-page">
            {/* Header */}
            <header className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 font-heading font-bold text-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-primary" />
                    </div>
                    <span>ZenCycle</span>
                </div>
                <ThemeToggle />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 pt-20">
                <div className="w-full max-w-md fade-in">
                    <Card className="border-border/50 shadow-xl">
                        {!isValidToken ? (
                            // Invalid Token State
                            <CardContent className="pt-8 pb-8 text-center">
                                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-destructive" />
                                </div>
                                <CardTitle className="text-xl font-heading mb-2">
                                    Invalid Reset Link
                                </CardTitle>
                                <CardDescription className="mb-6">
                                    This password reset link is invalid or has expired. Please request a new one.
                                </CardDescription>
                                <Button
                                    onClick={() => navigate('/')}
                                    className="rounded-full"
                                >
                                    Back to Login
                                </Button>
                            </CardContent>
                        ) : isSuccess ? (
                            // Success State
                            <CardContent className="pt-8 pb-8 text-center">
                                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-heading mb-2">
                                    Password Reset Complete
                                </CardTitle>
                                <CardDescription className="mb-6">
                                    Your password has been successfully reset. You can now log in with your new password.
                                </CardDescription>
                                <Button
                                    onClick={() => navigate('/')}
                                    className="rounded-full"
                                    data-testid="go-to-login-btn"
                                >
                                    Go to Login
                                </Button>
                            </CardContent>
                        ) : (
                            // Reset Form
                            <>
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-2xl font-heading">
                                        Reset Password
                                    </CardTitle>
                                    <CardDescription>
                                        Enter your new password for <strong>{email}</strong>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="new-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="pl-10 pr-10"
                                                    data-testid="new-password-input"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="confirm-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="pl-10"
                                                    data-testid="confirm-password-input"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full rounded-full h-11"
                                            disabled={isLoading}
                                            data-testid="reset-password-submit"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                    Resetting...
                                                </span>
                                            ) : (
                                                'Reset Password'
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
