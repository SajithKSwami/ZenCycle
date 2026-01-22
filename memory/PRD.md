# ZenCycle - Product Requirements Document

**Last Updated:** January 22, 2026  
**Status:** MVP Complete

---

## Executive Summary

ZenCycle is a wellness and productivity tracking application for knowledge workers. It features 90-minute focused work sessions, 5-minute breaks, hydration reminders, AI-powered affirmations, and progress analytics.

---

## User Personas

### Primary User: Knowledge Worker
- Age: 25-55
- Role: Developer, designer, analyst, writer, consultant
- Work: 8+ hours/day at computer
- Goals: Improve productivity, maintain wellness, career growth

---

## Core Requirements (Implemented)

### Authentication
- [x] JWT-based user registration
- [x] JWT-based user login
- [x] Protected routes
- [x] Persistent sessions

### Timer System
- [x] 90-minute work session timer
- [x] 5-minute break timer
- [x] MM:SS countdown format
- [x] Start/Pause/Resume/Reset controls
- [x] Auto-transition work → break
- [x] Timer state persistence (localStorage)

### Wellness Features
- [x] Morning mood check-in (Energized/Optimistic/Neutral/Stressed)
- [x] AI-powered 15-word affirmations (OpenAI GPT-4o-mini)
- [x] Hydration tracking with water intake logging
- [x] End-of-day reflection prompts
- [x] Office hours configuration

### Career Profile
- [x] Professional headline
- [x] Current role
- [x] Career goal (used for affirmation personalization)

### Progress Dashboard
- [x] Weekly/Monthly/Quarterly statistics
- [x] Session completion tracking
- [x] Water intake totals
- [x] Mood distribution chart
- [x] Activity overview chart

### UI/UX
- [x] Dark/Light theme toggle
- [x] "Zen Focus" design theme (Organic & Earthy)
- [x] Manrope + IBM Plex Sans + Newsreader fonts
- [x] Responsive design
- [x] Toast notifications

---

## What's Been Implemented (MVP)

### Backend (FastAPI + MongoDB)
- User authentication with JWT tokens
- Mood tracking with daily entries
- AI affirmation generation via Emergent integrations
- Session tracking (work/break)
- Water intake logging with duplicate prevention
- Reflection storage
- Progress statistics calculation

### Frontend (React + Tailwind)
- Auth page with Sign In/Sign Up tabs
- Dashboard with circular timer
- Mood check-in modal
- Affirmation display
- Water tracker with visual progress
- Daily stats cards
- Settings modal with 3 tabs
- Progress page with charts (Recharts)
- Theme toggle

---

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Authentication flow
- [x] Timer functionality
- [x] Mood check-in
- [x] AI affirmations
- [x] Water tracking

### P1 - Important (Partially Done)
- [x] Progress analytics
- [x] Theme toggle
- [ ] Browser notifications for reminders
- [ ] End-of-day modal trigger based on office hours

### P2 - Nice to Have
- [ ] PWA support with offline mode
- [ ] Export data feature
- [ ] Weekly email summaries
- [ ] Social sharing of streaks
- [ ] Timer sounds/alerts

---

## Next Tasks

1. Implement browser notification permissions
2. Add notification triggers for water reminders
3. Add notification triggers for break reminders
4. Test end-of-day reflection auto-popup
5. Add streak tracking feature
6. Implement data export (CSV/JSON)

---

## Tech Stack

- **Frontend:** React 19, Tailwind CSS, Shadcn/UI, Recharts
- **Backend:** FastAPI, MongoDB (Motor async driver)
- **AI:** OpenAI GPT-4o-mini via Emergent integrations
- **Auth:** JWT (bcrypt password hashing)
