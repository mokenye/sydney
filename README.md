# Sydney's Studio Tracker

A real-time dashboard for tracking view counts and total airtime across a YouTube playlist. Built with React, Tailwind v4, and Supabase.

## Tech Stack
- **Frontend:** React + Vite + Tailwind v4 (Glassmorphism UI)
- **Backend:** Supabase (PostgreSQL + Realtime WebSockets)
- **Worker:** Python 3.10 + YouTube Data API v3
- **Automation:** GitHub Actions (6-hour sync cycle)

## Directory Structure
- `/tracker-ui`: The React dashboard.
- `/worker`: Python script for database synchronization.
- `/.github`: Automation workflows.

## Quick Start
1. **Sync Data:** Set up your `YOUTUBE_API_KEY` and `SUPABASE_KEY` in GitHub Secrets.
2. **Run UI:**
   ```bash
   cd tracker-ui
   npm install
   npm run dev
   ```