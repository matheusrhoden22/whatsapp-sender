@echo off
echo Matando processos antigos...
npx kill-port 3000 2>nul
timeout /t 2 /nobreak >nul
echo Iniciando WhatsApp Sender...
cd /d C:\Users\User\faznota-ia
node server.js
pause
