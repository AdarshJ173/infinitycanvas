# Start both Convex and Vite dev servers
Write-Host "Starting Neuron Canvas Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Start Convex in a new window
Write-Host "Starting Convex backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'CONVEX BACKEND' -ForegroundColor Blue; npx convex dev"

# Wait a bit for Convex to initialize
Start-Sleep -Seconds 3

# Start Vite in current window
Write-Host "Starting Vite frontend..." -ForegroundColor Green
Write-Host ""
npm run dev
