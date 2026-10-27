@echo off
title Deploy Tejasvi Kolhe Portfolio to Vercel
echo ========================================================
echo   Deploying Tejasvi Kolhe Portfolio to Vercel
echo ========================================================
echo.
cd /d "%~dp0"

echo Step 1: Checking Vercel authentication...
call npx vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo You need to log in to Vercel first.
    echo Please log in with your email or GitHub...
    echo.
    call npx vercel login
)

echo.
echo Step 2: Deploying to Vercel Production...
echo.
call npx vercel --prod

echo.
echo ========================================================
echo   Deployment Complete! Your site is live on Vercel.
echo ========================================================
pause
