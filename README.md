# Garia OS — Academic Intelligence & Productivity Platform

Garia OS is a full-stack, offline-first Progressive Web Application (PWA) designed for students preparing for board and competitive examinations (Class 6–12, Science, Commerce, Arts/Humanities, and General streams).

## Core Modules & Capabilities

- **Command Center (Home Dashboard)**: Unified daily overview with composite productivity scoring, study streak tracking, weak-chapter insights, quick task creation, and distraction-free Focus Mode.
- **Abya AI Mentor**: Hybrid online/offline academic intelligence assistant powered by server-side Gemini models (`/api/ai/chat`) and real-time voice tutoring (`/ws/live-voice` via single-use ticket authentication), with automatic local intelligence fallback when offline.
- **Exam Intelligence Center**: Countdown tracking, syllabus mastery, VVI topic prioritization, revision queues, mock test logging, and automated study plan generation.
- **Career Center**: Stream-specific career catalog, aptitude quiz, government jobs, scholarships, study abroad guides, and interactive milestone roadmaps.
- **Study Tracker & Focus Timer**: Subject-level study timer, Pomodoro focus sessions with procedural Web Audio ambient soundscapes, and CSV session exports.
- **Task Manager, Notes, Flashcards, Goals, Habits & Calendar**: Complete student productivity suite with SM-2 spaced repetition flashcards, real-time collaborative workspaces, ICS/Google Calendar sync, and multi-student profile isolation.
- **Security & Offline Resilience**: Multi-student profile isolation, PBKDF2-SHA256 PIN lock with auto-lock and recovery codes, Firestore ownership security rules, and local offline action queue reconciliation.

## Development & Build Commands

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start full-stack development server (Port 3000)**:
   ```bash
   npm run dev
   ```
3. **Type-check & Lint**:
   ```bash
   npm run lint
   ```
4. **Run automated regression tests**:
   ```bash
   npm run test
   ```
5. **Build production client & server bundle**:
   ```bash
   npm run build
   ```
