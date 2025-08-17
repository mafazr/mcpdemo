# MCP Weather Client Applications

This directory contains client applications that can interact with your MCP Weather Server. You have two options:

## 🌐 Web Client (Recommended for most users)

A beautiful, responsive web interface that runs in your browser.

### Features
- **Modern UI**: Clean, responsive design with gradient backgrounds
- **Real-time Search**: Enter any city name to get weather information
- **Multiple Units**: Support for Celsius, Fahrenheit, and Kelvin
- **Visual Weather Cards**: Easy-to-read weather information display
- **Forecast Data**: 5-hour weather forecast with hourly updates
- **Mobile Friendly**: Responsive design that works on all devices

### Quick Start

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start the web server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3001`

4. **Get weather:**
   - Enter a city name (e.g., "London", "New York", "Tokyo")
   - Select your preferred units (Celsius, Fahrenheit, or Kelvin)
   - Click "Get Weather" or press Enter

### Usage Examples

- **London** - Get weather for London, UK
- **New York imperial** - Get weather for New York in Fahrenheit
- **Tokyo kelvin** - Get weather for Tokyo in Kelvin
- **Paris** - Get weather for Paris, France (defaults to Celsius)

## 💻 Command Line Client

A powerful CLI application for developers and power users.

### Features
- **Interactive Mode**: Command-line interface with help system
- **Direct MCP Communication**: Connects directly to your MCP server
- **Real Weather Data**: Gets actual weather from OpenWeatherMap + OpenAI
- **Multiple Units**: Support for all temperature scales
- **Command History**: Easy command repetition and editing

### Quick Start

1. **Make sure your MCP server is running:**
   ```bash
   # In the main project directory
   npm start
   ```

2. **In a new terminal, start the CLI client:**
   ```bash
   cd client
   node cli-client.js
   ```

3. **Use the interactive commands:**
   ```
   weather London          # Get weather for London
   weather New York imperial  # Get weather in Fahrenheit
   units kelvin           # Set default units to Kelvin
   help                   # Show available commands
   quit                   # Exit the client
   ```

### CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `weather <city> [units]` | Get weather for a city | `weather London imperial` |
| `units <metric\|imperial\|kelvin>` | Set default units | `units kelvin` |
| `help` | Show help information | `help` |
| `quit` or `exit` | Exit the client | `quit` |

## 🔧 Configuration

### Environment Variables

Both clients require the same environment variables as your MCP server:

```env
OpenAIAPI_KEY=your_openai_api_key_here
OpenWeatherMapAPI_KEY=your_openweathermap_api_key_here
```

### Port Configuration

- **Web Client**: Runs on port 3001 by default
- **MCP Server**: Runs on stdio transport (no port needed)

## 🚀 Running the Clients

### Option 1: Use the batch files (Windows)

```bash
# Web client
start-web.bat

# CLI client  
run-client.bat
```

### Option 2: Use npm scripts

```bash
# Web client
npm run web

# CLI client
npm run cli

# Development mode (auto-restart)
npm run dev
```

### Option 3: Direct node commands

```bash
# Web client
node server.js

# CLI client
node cli-client.js
```

## 📱 Web Client Screenshots

The web client provides:
- **Search Interface**: Clean input field with unit selection
- **Weather Display**: Current conditions in easy-to-read cards
- **AI Description**: Human-readable weather summary
- **Forecast Section**: 5-hour weather predictions
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🎯 Use Cases

### Web Client
- **Daily Weather Checks**: Quick weather lookups
- **Travel Planning**: Check weather at destinations
- **Mobile Use**: Access from any device with a browser
- **Sharing**: Easy to share weather information

### CLI Client
- **Development**: Test your MCP server directly
- **Automation**: Script weather lookups
- **Server Integration**: Embed in other applications
- **Power Users**: Fast, keyboard-driven interface

## 🔍 Troubleshooting

### Web Client Issues

1. **Port already in use**: Change the port in `server.js`
2. **Dependencies missing**: Run `npm install` in the client directory
3. **Server not responding**: Check that the web server is running

### CLI Client Issues

1. **MCP server not running**: Start the MCP server first
2. **Environment variables missing**: Set your API keys
3. **Connection failed**: Check that the MCP server path is correct

### Common Solutions

- **Clear npm cache**: `npm cache clean --force`
- **Reinstall dependencies**: Delete `node_modules` and run `npm install`
- **Check ports**: Ensure no other services are using the required ports

## 🚀 Next Steps

1. **Customize the UI**: Modify colors, fonts, and layout in `index.html`
2. **Add more features**: Implement weather maps, alerts, or historical data
3. **Integrate with MCP**: Connect the web client directly to your MCP server
4. **Deploy online**: Host the web client on a cloud platform

## 📚 API Reference

### Web Client API

- `POST /api/weather` - Get weather data
  - Body: `{ "location": "city", "units": "metric" }`
  - Response: Weather data object

### CLI Client API

- `weather <city> [units]` - Get weather information
- `units <scale>` - Set temperature scale
- `help` - Show command help
- `quit` - Exit application

## 🤝 Contributing

Feel free to enhance the clients with:
- Additional weather data visualization
- More unit conversions
- Weather alerts and notifications
- Historical weather data
- Weather maps integration
- Multi-language support

## 📄 License

MIT License - see the main project README for details.
