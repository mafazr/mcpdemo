@echo off
echo MCP Weather Server Setup and Start Script
echo =========================================

echo.
echo Installing dependencies...
npm install

echo.
echo Building the project...
npm run build

echo.
echo Starting the MCP Weather Server...
echo Make sure you have created a .env file with your API keys!
echo.
npm start

pause
