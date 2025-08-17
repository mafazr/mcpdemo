# MCP Weather Server Demo

## What This Server Does

This MCP (Model Context Protocol) server provides real-time weather information with AI-enhanced human-readable responses. It combines:

1. **OpenWeatherMap API** - For real-time weather data
2. **OpenAI GPT-4** - For natural language weather reports
3. **FastMCP 2.0** - For high-performance MCP server implementation

## Features

- 🌤️ **Real-time Weather Data**: Current conditions, temperature, humidity, wind, visibility
- 📍 **Location Support**: City names, coordinates, or location identifiers
- 🌡️ **Multiple Units**: Metric, Imperial, and Kelvin temperature scales
- 🤖 **AI Enhancement**: GPT-4 generates friendly, conversational weather reports
- 📊 **Forecast Data**: 5-hour weather forecast
- 🚀 **FastMCP 2.0**: High-performance MCP server implementation

## How to Use

### 1. Setup Environment

Create a `.env` file with your API keys:
```env
OpenAIAPI_KEY=your_openai_api_key_here
OpenWeatherMapAPI_KEY=your_openweathermap_api_key_here
```

### 2. Start the Server

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the MCP server
npm start
```

### 3. Connect from MCP Client

The server provides a `get_weather` tool that can be called with:

```json
{
  "location": "London",
  "units": "metric"
}
```

### 4. Example Response

The server will return a human-readable weather report like:

> "Good morning! Here in London, UK, it's currently 18°C with partly cloudy skies. It feels like 16°C, so you might want to bring a light jacket. The humidity is at 65% with a gentle breeze of 3.2 m/s. Visibility is excellent at 10 km. Looking ahead, expect similar conditions for the next few hours with temperatures staying around 18-19°C."

## Technical Details

- **Transport**: stdio (standard input/output)
- **Protocol**: MCP (Model Context Protocol)
- **Weather API**: OpenWeatherMap v2.5
- **AI Model**: OpenAI GPT-4
- **Framework**: FastMCP 2.0
- **Language**: TypeScript

## Testing

You can test the weather service independently:

```bash
npm run build
node dist/test-weather.js
```

This will test the OpenWeatherMap integration without the MCP server.

## MCP Client Configuration

Example configuration for MCP clients:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "OpenAIAPI_KEY": "your_openai_key",
        "OpenWeatherMapAPI_KEY": "your_weather_key"
      }
    }
  }
}
```

## Error Handling

The server includes robust error handling for:
- Invalid API keys
- Location not found
- API rate limiting
- Network connectivity issues
- OpenAI API errors

## Performance

- FastMCP 2.0 provides high-performance MCP server implementation
- Efficient weather data caching and processing
- Optimized OpenAI API calls with appropriate token limits
- Minimal latency for real-time weather updates
