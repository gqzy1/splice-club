@echo off
setlocal
cd /d "%~dp0"
title SPLICE LOCAL OPERATOR - 127.0.0.1:4179
where node >nul 2>nul
if errorlevel 1 goto :missingnode
node -e "const v=process.versions.node.split('.').map(Number); process.exit(v[0]>22||(v[0]===22&&v[1]>=12)?0:1)"
if errorlevel 1 goto :missingnode
node scripts\verify-source.mjs
if errorlevel 1 goto :failed
if exist node_modules\.package-lock.json goto :ready
echo Installing locked dependencies. No remote startup script is executed.
call npm ci --ignore-scripts --no-audit --no-fund
if errorlevel 1 goto :failed
:ready
if exist dist\index.html goto :launch
call npm run build
if errorlevel 1 goto :failed
:launch
node scripts\launch.mjs
if errorlevel 1 goto :failed
goto :end
:missingnode
echo Node.js 22.12 or newer is required.
echo Install current LTS from https://nodejs.org/ using the official Windows installer.
echo Reopen this file after installation. Do not enter any wallet secret.
goto :end
:failed
echo STOP. Startup failed. Keep the error above. No transaction was submitted by this script.
echo Do not clear browser storage or switch ports to repeat an earlier transaction.
:end
pause
endlocal
