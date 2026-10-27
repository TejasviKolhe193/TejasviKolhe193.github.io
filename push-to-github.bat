@echo off
title Push Tejasvi Kolhe Portfolio to GitHub
echo ========================================================
echo   Pushing Portfolio to GitHub (TejasviKolhe193)
echo ========================================================
echo.
cd /d "%~dp0"

echo Please enter your GitHub repository name:
echo (Press Enter for default: portfolio)
set /p REPO_NAME="Repository name [default: portfolio]: "
if "%REPO_NAME%"=="" set REPO_NAME=portfolio

echo.
echo Setting up remote origin: https://github.com/TejasviKolhe193/%REPO_NAME%.git ...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/TejasviKolhe193/%REPO_NAME%.git
git branch -M main

echo.
echo Pushing code to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Pushed to https://github.com/TejasviKolhe193/%REPO_NAME%
    echo.
    echo   To enable GitHub Pages:
    echo   1. Go to https://github.com/TejasviKolhe193/%REPO_NAME%/settings/pages
    echo   2. Under Branch, select 'main' and click 'Save'.
    echo   3. Your site will be LIVE in ~30 seconds!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Make sure you created the repository on https://github.com/new first!
)

echo.
pause
