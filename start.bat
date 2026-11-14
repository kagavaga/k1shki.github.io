@echo off
chcp 65001 >nul
title Тетрис
cd /d "%~dp0"

:: Ищем установленный Chrome или Edge
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if "%BROWSER%"=="" (
    if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if "%BROWSER%"=="" (
    echo Браузер Chrome или Edge не найден!
    echo Откройте index.html вручную.
    pause
    exit /b
)

:: Запускаем игру в режиме приложения (без вкладок и адресной строки)
start "" "%BROWSER%" --app="file:///%~dp0index.html" --window-size=1100,750

exit