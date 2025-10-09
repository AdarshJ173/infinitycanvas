# Quick Start Guide - Session Management

## TL;DR

```bash
# Start everything (one command)
npm run dev:full
```

This will:
1. Open a new window with Convex backend
2. Start Vite frontend in current window
3. Open browser at http://localhost:5173

## Manual Start (Two Terminals)

**Terminal 1:**
```bash
npm run convex
```

**Terminal 2:**
```bash
npm run dev
```

## First Time Setup

If this is your first time:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev environment:**
   ```bash
   npm run dev:full
   ```

3. **Wait for Convex:**
   - Watch for "Convex functions ready" in the Convex window
   - Should take ~10-15 seconds

4. **Open browser:**
   - Navigate to http://localhost:5173
   - SessionDialog should appear
   - Create your first session!

## What You Should See

### Success Indicators

**Convex Window:**
```
Convex functions ready!
```

**Browser Console:**
```
Created new session: My First Session
Session auto-saved to Convex
```

**Network Tab:**
- WebSocket connection to `*.convex.cloud`
- Status: 101 Switching Protocols (WebSocket)

### Common Issues

**"Failed to create session"**
- Convex not running → Start with `npm run convex`

**"Session management will be available..."**
- Old localStorage code → Code has been fixed, just start Convex

**Build errors**
- Run: `npm install`
- Delete `node_modules` and reinstall if needed

## Features to Test

1. **Create Session**
   - Click "Create New Session"
   - Enter name and description
   - Canvas should clear

2. **Auto-Save**
   - Add some nodes
   - Wait 3 seconds
   - Check console for "Session auto-saved to Convex"

3. **Load Session**
   - Reload page
   - Click "Continue Last Session"
   - Canvas should restore your nodes

4. **Second Brain**
   - Click "My Second Brain" button (top right)
   - See force-directed graph
   - Hover over session nodes
   - Click to open session

## Architecture

**Why Convex (NOT localStorage)?**
- Real-time sync across devices
- Persistent storage
- Scalable backend
- Type-safe API
- Server-side logic
- localStorage = data loss risk

See `SESSION_ARCHITECTURE.md` for full details.

## Need Help?

1. Check `SESSION_ARCHITECTURE.md` for detailed docs
2. Look at browser console for errors
3. Check Convex dashboard: https://dashboard.convex.dev
4. Verify `.env.local` has `VITE_CONVEX_URL`

## Pro Tips

- **Multiple tabs**: Open multiple browser tabs to see real-time sync
- **Convex Dashboard**: Monitor database in real-time
- **Auto-reload**: Vite HMR works, no manual refresh needed
- **Console logs**: Enable verbose logging for debugging
