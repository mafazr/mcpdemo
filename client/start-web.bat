@echo off
echo MCP Weather Web Client
echo =====================

echo.
echo Installing client dependencies...
npm install

echo.
echo Starting web client server...
echo The web client will be available at: http://localhost:3001
echo.
npm start

pause
