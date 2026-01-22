import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff, Linkedin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { toast } from 'sonner';

export default function AuthPage() {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    // Register form
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginEmail || !loginPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await login(loginEmail, loginPassword);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!registerEmail || !registerPassword) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            await register(registerEmail, registerPassword, firstName, lastName);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || 'Registration failed';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" data-testid="auth-page">
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
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-heading">
                                Welcome to ZenCycle
                            </CardTitle>
                            <CardDescription>
                                Wellness in Motion
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="login" data-testid="login-tab">
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger value="register" data-testid="register-tab">
                                        Sign Up
                                    </TabsTrigger>
                                </TabsList>

                                {/* Login Form */}
                                <TabsContent value="login">
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    className="pl-10"
                                                    data-testid="login-email"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="login-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    className="pl-10 pr-10"
                                                    data-testid="login-password"
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
                                        <Button
                                            type="submit"
                                            className="w-full rounded-full h-11"
                                            disabled={isLoading}
                                            data-testid="login-submit"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                    Signing in...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Sign In
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* Register Form */}
                                <TabsContent value="register">
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="first-name">First Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        id="first-name"
                                                        placeholder="John"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="pl-10"
                                                        data-testid="register-first-name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="last-name">Last Name</Label>
                                                <Input
                                                    id="last-name"
                                                    placeholder="Doe"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    data-testid="register-last-name"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="register-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={registerEmail}
                                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                                    className="pl-10"
                                                    data-testid="register-email"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-password">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="register-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    value={registerPassword}
                                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                                    className="pl-10 pr-10"
                                                    data-testid="register-password"
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
                                        <Button
                                            type="submit"
                                            className="w-full rounded-full h-11"
                                            disabled={isLoading}
                                            data-testid="register-submit"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                    Creating account...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Create Account
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div className="p-4">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-focus-timer/10 flex items-center justify-center">
                                <span className="text-lg">⏱️</span>
                            </div>
                            <p className="text-xs text-muted-foreground">90/5 Timer</p>
                        </div>
                        <div className="p-4">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-hydration/10 flex items-center justify-center">
                                <span className="text-lg">💧</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Hydration</p>
                        </div>
                        <div className="p-4">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg">✨</span>
                            </div>
                            <p className="text-xs text-muted-foreground">AI Affirmations</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
