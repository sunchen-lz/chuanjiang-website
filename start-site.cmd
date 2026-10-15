@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 if exist "%LOCALAPPDATA%\Programs\Codex-Offline-CN\browser-runtime\node.exe" set "PATH=%LOCALAPPDATA%\Programs\Codex-Offline-CN\browser-runtime;%PATH%"
where pnpm >nul 2>nul
if errorlevel 1 if exist "%~dp0.tools\pnpm10\package\bin\pnpm.cjs" set "PATH=%~dp0.tools;%PATH%"
where pnpm >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 and pnpm 10.20.0 are required. See README.md.
  pause
  exit /b 1
)
if not exist "node_modules" call pnpm install --frozen-lockfile
call pnpm dev
