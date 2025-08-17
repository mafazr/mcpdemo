@echo off
echo MCP Weather Server - Complete Demo
echo ==================================

echo.
echo This demo will show you how to use the MCP Weather Server with clients
echo.

echo Step 1: Setting up the environment...
if not exist .env (
    echo Creating .env file from template...
    copy env.template .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your actual API keys!
    echo    OpenAIAPI_KEY=your_openai_key_here
    echo    OpenWeatherMapAPI_KEY=your_weather_key_here
    echo.
    pause
) else (
    echo ✅ .env file already exists
)

echo.
echo Step 2: Installing dependencies...
npm install

echo.
echo Step 3: Building the project...
npm run build

echo.
echo Step 4: Installing client dependencies...
cd client
npm install
cd ..

echo.
echo 🎉 Setup complete! Now you can:
echo.
echo 🌐 Web Client:
echo    1. Open a new terminal
echo    2. Run: cd client && npm start
echo    3. Open browser to: http://localhost:3001
echo.
echo 💻 CLI Client:
echo    1. Open a new terminal  
echo    2. Run: cd client && node cli-client.js
echo.
echo 🚀 MCP Server:
echo    1. Open a new terminal
echo    2. Run: npm start
echo.
echo.
echo Press any key to start the MCP server now...
pause

echo.
echo Starting MCP Weather Server...
npm start
