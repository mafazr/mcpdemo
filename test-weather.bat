@echo off
echo Testing Weather Service
echo ======================

echo.
echo Installing dependencies...
npm install

echo.
echo Building the project...
npm run build

echo.
echo Testing weather service...
node dist/test-weather.js

echo.
pause
