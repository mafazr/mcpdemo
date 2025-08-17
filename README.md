# MCP Weather Server

A Model Context Protocol (MCP) server built with FastMCP 2.0 that provides real-time weather information using OpenWeatherMap API and OpenAI GPT-4 for human-readable responses.

## Features

- 🌤️ Real-time weather data from OpenWeatherMap API
- 🤖 AI-powered human-readable weather reports using OpenAI GPT-4
- 🚀 Built with FastMCP 2.0 for high performance
- 📍 Support for city names, coordinates, and location identifiers
- 🌡️ Multiple unit systems (metric, imperial, kelvin)
- 📊 Current conditions and 5-hour forecast
- 🔒 Secure API key management

## Prerequisites

- Node.js 18+ 
- OpenWeatherMap API key
- OpenAI API key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Copy `env.template` to `.env` and fill in your API keys:
   ```bash
   cp env.template .env
   ```
   
   Then edit `.env` and add your actual API keys:
   ```env
   OpenAIAPI_KEY=your_openai_api_key_here
   OpenWeatherMapAPI_KEY=your_openweathermap_api_key_here
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

The server will start on port 3000 and provide a `get_weather` tool that can be called by MCP clients.

### Client Applications

We've also created client applications to make it easy to interact with the weather server:

- **🌐 Web Client** (`client/` directory): Beautiful web interface running on port 3001
- **💻 CLI Client** (`client/` directory): Command-line interface for developers

See the `client/README.md` for detailed instructions on using these clients.

### Tool Parameters

- `location` (required): City name, coordinates, or location identifier
- `units` (optional): "metric", "imperial", or "kelvin" (defaults to "metric")

### Example MCP Client Configuration

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

## API Endpoints

The server implements the MCP protocol and provides:

- **Tool Registration**: `get_weather` tool for weather information
- **Real-time Data**: Current weather conditions and forecasts
- **AI Enhancement**: Human-readable weather reports using GPT-4

## Weather Data

The server fetches comprehensive weather information including:

- Current temperature and "feels like" temperature
- Humidity, pressure, and wind conditions
- Weather description and visibility
- Sunrise and sunset times
- 5-hour forecast with hourly updates

## Error Handling

The server includes robust error handling for:
- Invalid API keys
- Location not found
- API rate limiting
- Network connectivity issues

## Development

- **TypeScript**: Full type safety and IntelliSense support
- **ES Modules**: Modern JavaScript module system
- **Hot Reload**: Development mode with automatic restarts
- **Environment Variables**: Secure configuration management

## License

MIT License