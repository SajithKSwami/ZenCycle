import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Timer, BarChart3, Settings, LogOut, Leaf } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const Header = ({ onSettingsClick }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', label: 'Timer', icon: Timer },
        { path: '/progress', label: 'Progress', icon: BarChart3 },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 font-heading font-bold text-xl"
                    data-testid="logo-link"
                >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-primary" />
                    </div>
                    <span className="hidden sm:inline">ZenCycle</span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <Link key={path} to={path}>
                            <Button
                                variant={location.pathname === path ? 'secondary' : 'ghost'}
                                size="sm"
                                className={cn(
                                    "rounded-full",
                                    location.pathname === path && "bg-secondary"
                                )}
                                data-testid={`nav-${label.toLowerCase()}`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsClick}
                        className="rounded-full"
                        data-testid="settings-btn"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="rounded-full"
                        data-testid="logout-btn"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
