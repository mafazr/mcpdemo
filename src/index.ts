import { FastMCP } from "fastmcp";
import { OpenAI } from "openai";
import { WeatherService } from "./weather-service.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OpenAIAPI_KEY,
});



// Initialize weather service
const weatherService = new WeatherService();

// Create MCP server
const server = new FastMCP({
  name: "weather-mcp-server",
  version: "1.0.0",
});

// Define weather tool parameters schema
const WeatherParams = z.object({
  location: z.string().describe("City name, coordinates, or location identifier"),
  units: z.enum(["metric", "imperial", "kelvin"]).default("metric").describe("Units for temperature and measurements"),
});

// Register the weather tool
server.addTool({
  name: "get_weather",
  description: "Get real-time weather information for a specific location",
  parameters: WeatherParams,
  execute: async (args) => {
    try {
      const { location, units = "metric" } = args as {
        location: string;
        units?: string;
      };

      // Get weather data from OpenWeatherMap
      const weatherData = await weatherService.getCurrentWeather(location, units);

      // Use OpenAI to generate human-readable response
      const prompt = `Please provide a friendly, conversational weather report based on this data:

Location: ${weatherData.location.name}, ${weatherData.location.country}
Current Temperature: ${weatherData.current.temperature}°${units === "metric" ? "C" : "F"}
Feels Like: ${weatherData.current.feels_like}°${units === "metric" ? "C" : "F"}
Weather Description: ${weatherData.current.description}
Humidity: ${weatherData.current.humidity}%
Wind Speed: ${weatherData.current.wind_speed} ${units === "metric" ? "m/s" : "mph"}
Visibility: ${weatherData.current.visibility / 1000} km

Please make it sound natural and conversational, like a friendly weather person would describe it. Include any notable conditions and maybe a brief forecast for the next few hours.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a friendly weather reporter who provides clear, conversational weather updates.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const humanReadableWeather = completion.choices[0]?.message?.content || "Weather information unavailable";

      return humanReadableWeather;
    } catch (error) {
      throw new Error(`Error getting weather information: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Start the server
async function main() {
  try {
    server.start({
      transportType: "stdio",
    });
    console.log("Weather MCP Server is running with stdio transport");
    console.log("You can now connect to this server from your MCP client");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
