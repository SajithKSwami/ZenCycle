import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { SettingsModal } from '../components/SettingsModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { progressApi } from '../lib/api';
import { CheckCircle, Droplets, Coffee, TrendingUp, Calendar, Target } from 'lucide-react';

const MOOD_COLORS = {
    energized: '#F59E0B',
    optimistic: '#10B981',
    neutral: '#3B82F6',
    stressed: '#EF4444',
};

const MOOD_LABELS = {
    energized: 'Energized',
    optimistic: 'Optimistic',
    neutral: 'Neutral',
    stressed: 'Stressed',
};

export default function ProgressPage() {
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [period, setPeriod] = useState('weekly');
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            try {
                const data = await progressApi.get(period);
                setStats(data);
            } catch (error) {
                console.error('Error loading progress:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, [period]);

    // Prepare mood chart data
    const moodChartData = stats?.mood_counts 
        ? Object.entries(stats.mood_counts).map(([mood, count]) => ({
            name: MOOD_LABELS[mood] || mood,
            value: count,
            color: MOOD_COLORS[mood] || '#888',
        }))
        : [];

    // Prepare stats chart data
    const statsChartData = [
        { name: 'Sessions', value: stats?.completed_sessions || 0, fill: 'hsl(var(--focus-timer))' },
        { name: 'Breaks', value: stats?.total_breaks || 0, fill: 'hsl(var(--break-timer))' },
        { name: 'Water', value: stats?.total_water_intakes || 0, fill: 'hsl(var(--hydration))' },
    ];

    const periodLabel = {
        weekly: 'This Week',
        monthly: 'This Month',
        quarterly: 'This Quarter',
    };

    return (
        <div className="min-h-screen bg-background" data-testid="progress-page">
            <Header onSettingsClick={() => setShowSettingsModal(true)} />

            <main className="container px-4 md:px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-heading font-bold">Progress</h1>
                        <p className="text-muted-foreground mt-1">
                            Track your wellness journey over time
                        </p>
                    </div>

                    {/* Period Tabs */}
                    <Tabs value={period} onValueChange={setPeriod} className="mb-8">
                        <TabsList>
                            <TabsTrigger value="weekly" data-testid="tab-weekly">
                                <Calendar className="w-4 h-4 mr-2" />
                                Weekly
                            </TabsTrigger>
                            <TabsTrigger value="monthly" data-testid="tab-monthly">
                                Monthly
                            </TabsTrigger>
                            <TabsTrigger value="quarterly" data-testid="tab-quarterly">
                                Quarterly
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <Card className="stat-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-focus-timer/10 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-focus-timer" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stats?.completed_sessions || 0}</p>
                                                <p className="text-xs text-muted-foreground">Sessions Completed</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="stat-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-break-timer/10 flex items-center justify-center">
                                                <Coffee className="w-5 h-5 text-break-timer" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stats?.total_breaks || 0}</p>
                                                <p className="text-xs text-muted-foreground">Breaks Taken</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="stat-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-hydration/10 flex items-center justify-center">
                                                <Droplets className="w-5 h-5 text-hydration" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stats?.total_water_intakes || 0}</p>
                                                <p className="text-xs text-muted-foreground">Water Intakes</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="stat-card">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold">{stats?.completion_rate || 0}%</p>
                                                <p className="text-xs text-muted-foreground">Completion Rate</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Activity Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Activity Overview</CardTitle>
                                        <CardDescription>{periodLabel[period]}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={statsChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                                    />
                                                    <YAxis 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '8px',
                                                        }}
                                                    />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Mood Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Mood Distribution</CardTitle>
                                        <CardDescription>{stats?.days_tracked || 0} days tracked</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px]">
                                            {moodChartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={moodChartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                        >
                                                            {moodChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{
                                                                backgroundColor: 'hsl(var(--card))',
                                                                border: '1px solid hsl(var(--border))',
                                                                borderRadius: '8px',
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    No mood data yet
                                                </div>
                                            )}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                                            {moodChartData.map((entry) => (
                                                <div key={entry.name} className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        {entry.name} ({entry.value})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Summary */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Focus Time</p>
                                            <p className="text-2xl font-bold">
                                                {Math.round((stats?.completed_sessions || 0) * 90 / 60)}h
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Average Water/Day</p>
                                            <p className="text-2xl font-bold">
                                                {stats?.days_tracked > 0 
                                                    ? Math.round((stats?.total_water_intakes || 0) / stats.days_tracked)
                                                    : 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Days Tracked</p>
                                            <p className="text-2xl font-bold">{stats?.days_tracked || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </main>

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </div>
    );
}
