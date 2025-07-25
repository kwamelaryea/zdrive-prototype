# ZDrive Development Server Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "localhost refused to connect" / ERR_CONNECTION_REFUSED

**Symptoms:**
- Browser shows "This site can't be reached"
- Port 3000 is not responding
- Development server process is not running

**Root Causes:**
1. Development server crashed or stopped
2. Port 3000 is occupied by another process
3. Build cache corruption
4. Dependency conflicts (React 19 vs React 18)
5. Missing compiled files (_document.js error)

**Quick Fix (Automated):**
```bash
cd project
./troubleshoot-dev-server.sh
```

**Manual Fix Steps:**

1. **Kill all Node processes:**
   ```bash
   pkill -f "node" || true
   pkill -f "next" || true
   ```

2. **Clean build cache:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   rm -rf .turbo
   ```

3. **Reinstall dependencies (fixes React version conflicts):**
   ```bash
   rm -rf node_modules
   rm -f package-lock.json
   npm install --legacy-peer-deps
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Issue 2: "studioProvider is not a function" Error

**Symptoms:**
- TypeError: (0 , _livepeer_react__WEBPACK_IMPORTED_MODULE_2__.studioProvider) is not a function
- Livepeer integration errors

**Solution:**
The LivepeerProvider has been simplified to avoid this error. The current implementation in `src/components/LivepeerProvider.tsx` is a pass-through component.

### Issue 3: "_document.js not found" Error

**Symptoms:**
- Error: ENOENT: no such file or directory, open '.next/server/pages/_document.js'
- Build compilation failures

**Solution:**
This is typically caused by corrupted build cache. Use the automated troubleshooting script or manually clean the cache.

### Issue 4: Dependency Conflicts

**Symptoms:**
- npm install fails with ERESOLVE errors
- React version conflicts
- Peer dependency warnings

**Solution:**
Always use `--legacy-peer-deps` flag for this project due to React 19 compatibility:
```bash
npm install --legacy-peer-deps
```

## Prevention Strategies

### 1. Use the Troubleshooting Script
Always run `./troubleshoot-dev-server.sh` when encountering server issues.

### 2. Monitor Process Health
Check if the server is running:
```bash
ps aux | grep "next dev" | grep -v grep
```

### 3. Check Port Availability
Verify port 3000 is free:
```bash
lsof -Pi :3000 -sTCP:LISTEN -t
```

### 4. Regular Cache Cleaning
Clean cache periodically:
```bash
rm -rf .next && npm run dev
```

## Environment Setup

### Required Environment Variables
```bash
# AO Process IDs (already configured in next.config.js)
NEXT_PUBLIC_CREATOR_NFT_PROCESS=Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc
NEXT_PUBLIC_BASIC_ACCESS_PROCESS=VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs
NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS=IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE
NEXT_PUBLIC_ACCESS_CONTROL_PROCESS=X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI
NEXT_PUBLIC_TOKEN_PROCESS=xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10

# Optional: Livepeer API Key
NEXT_PUBLIC_LIVEPEER_API_KEY=your_livepeer_api_key_here
```

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Clean and restart
rm -rf .next && npm run dev

# Full reset (use when having persistent issues)
./troubleshoot-dev-server.sh

# Check server status
curl -s http://localhost:3000 > /dev/null && echo "✅ Running" || echo "❌ Not running"

# Kill all Node processes
pkill -f "node" || true

# Check port usage
lsof -Pi :3000
```

## Troubleshooting Checklist

When the server won't start:

- [ ] Kill all Node.js processes
- [ ] Clean .next cache directory
- [ ] Clean node_modules/.cache
- [ ] Reinstall dependencies with --legacy-peer-deps
- [ ] Check port 3000 availability
- [ ] Verify package.json scripts
- [ ] Check for environment variable issues
- [ ] Run the automated troubleshooting script

## Success Indicators

✅ Server starts without errors
✅ "Ready in XXXXms" message appears
✅ "Local: http://localhost:3000" is displayed
✅ Homepage loads with "Home component rendering, videos: 6"
✅ AO Connect configuration logs appear
✅ All AO Process IDs validate successfully

## Emergency Recovery

If all else fails:
1. Delete the entire project directory
2. Clone the repository fresh
3. Run `npm install --legacy-peer-deps`
4. Run `npm run dev`

This guide should resolve 99% of development server issues. 