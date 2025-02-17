@echo off
cd /d "%~dp0"
start "" /B nodemon index.js
timeout /t 2 > nul
start chrome http://localhost:3000/
