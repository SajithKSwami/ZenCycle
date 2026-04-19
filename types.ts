
export enum Mood {
  Energized = 'Energized',
  Neutral = 'Neutral',
  Stressed = 'Stressed',
  Optimistic = 'Optimistic'
}

export enum SessionType {
  Work = 'Work',
  Break = 'Break'
}

export interface CalendarSession {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string; // ISO
  type: 'affirmation' | 'reflection';
  reminderTime?: string; // ISO - time to remind user to revisit
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface BreakLocationRecord {
  startTime: string;
  startLocation?: LocationData;
  endLocation?: LocationData;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  headline: string;
  role: string;
  careerGoal: string;
  officeStartTime: string;
  officeEndTime: string;
  hydrationGoal: number;
}

export interface DailyState {
  date: string; // ISO String
  mood?: Mood;
  affirmation?: string;
  waterIntake: number;
  completedWorkSessions: number;
  completedBreaks: number;
  reflectionText?: string;
  reflectionCompleted: boolean;
  breakLocations: BreakLocationRecord[];
}

export interface TimerState {
  type: SessionType;
  startTime: number | null; // Timestamp
  isPaused: boolean;
  remainingSeconds: number;
  currentBreakStartLocation?: LocationData;
}

export interface HistoricalRecord {
  date: string;
  water: number;
  sessions: number;
  mood?: Mood;
}
