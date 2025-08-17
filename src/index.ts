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

// Define location parsing tool parameters schema
const LocationParseParams = z.object({
  userQuery: z.string().describe("Natural language query from user about weather or location"),
});

// Register the location parsing tool
server.addTool({
  name: "parse_location",
  description: "Use GPT-5 to intelligently parse natural language queries and extract location information, with special handling for Singapore locations",
  parameters: LocationParseParams,
  execute: async (args) => {
    try {
      const { userQuery } = args as { userQuery: string };

      // Use OpenAI to parse the location from natural language
      const prompt = `You are a location parsing expert. Analyze this user query and extract the location information.

User Query: "${userQuery}"

Please respond with a JSON object containing:
{
  "location": "extracted location name",
  "isInSingapore": true/false,
  "coordinates": {"lat": number, "lon": number} or null,
  "area": "Singapore area/region if applicable",
  "confidence": "high/medium/low",
  "explanation": "brief explanation of how you parsed this"
}

Special instructions for Singapore:
- If the query mentions Singapore, SG, or any Singapore-specific locations (Marina Bay, Orchard Road, Sentosa, Changi, Jurong, Woodlands, Tampines, Bedok, Ang Mo Kio, Bishan, Clementi, Dover, Eunos, Geylang, Hougang, Kallang, Katong, MacPherson, Novena, Outram, Pasir Ris, Paya Lebar, Punggol, Queenstown, River Valley, Rochor, Serangoon, Siglap, Sims, Somerset, Tai Seng, Tanjong Pagar, Telok Blangah, Thomson, Toa Payoh, Whampoa, Yishun, Yio Chu Kang), set isInSingapore to true
- For Singapore locations, provide the specific area/region if you can identify it
- For non-Singapore locations, set isInSingapore to false and coordinates to null

Examples:
- "How's the weather in Marina Bay?" → {"location": "Marina Bay", "isInSingapore": true, "area": "Downtown Core", "coordinates": null, "confidence": "high"}
- "Weather at Sentosa beach" → {"location": "Sentosa", "isInSingapore": true, "area": "Southern Islands", "coordinates": null, "confidence": "high"}
- "What's the weather like in London?" → {"location": "London", "isInSingapore": false, "area": null, "coordinates": null, "confidence": "high"}

Respond only with valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4", // Using GPT-4 as GPT-5 is not yet available
        messages: [
          {
            role: "system",
            content: "You are a location parsing expert. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.1, // Low temperature for consistent parsing
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      
      try {
        const parsedLocation = JSON.parse(responseText);
        return parsedLocation;
      } catch (parseError) {
        // Fallback parsing if GPT response is not valid JSON
        console.warn("GPT response was not valid JSON, using fallback parsing:", responseText);
        
        // Simple fallback parsing
        const query = userQuery.toLowerCase();
        if (query.includes('singapore') || query.includes('sg') || 
            query.includes('marina bay') || query.includes('orchard') || 
            query.includes('sentosa') || query.includes('changi') ||
            query.includes('jurong') || query.includes('woodlands')) {
          return {
            location: userQuery.trim(),
            isInSingapore: true,
            area: "Singapore",
            coordinates: null,
            confidence: "medium",
            explanation: "Fallback parsing detected Singapore-related terms"
          };
        }
        
        return {
          location: userQuery.trim(),
          isInSingapore: false,
          area: null,
          coordinates: null,
          confidence: "low",
          explanation: "Fallback parsing used"
        };
      }
    } catch (error) {
      throw new Error(`Error parsing location: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Register the weather tool
server.addTool({
  name: "get_weather",
  description: "Get real-time weather information for a specific location, with special handling for Singapore hyperlocal data",
  parameters: WeatherParams,
  execute: async (args) => {
    try {
      const { location, units = "metric" } = args as {
        location: string;
        units?: string;
      };

      // Check if this is a Singapore location for hyperlocal data
      const isSingaporeLocation = location.toLowerCase().includes('singapore') || 
        ['marina bay', 'orchard road', 'sentosa', 'changi', 'jurong', 'woodlands', 
         'tampines', 'bedok', 'ang mo kio', 'bishan', 'clementi', 'dover', 
         'eunos', 'geylang', 'hougang', 'kallang', 'katong', 'macpherson', 
         'novena', 'outram', 'pasir ris', 'paya lebar', 'punggol', 'queenstown', 
         'river valley', 'rochor', 'serangoon', 'siglap', 'sims', 'somerset', 
         'tai seng', 'tanjong pagar', 'telok blangah', 'thomson', 'toa payoh', 
         'whampoa', 'yishun', 'yio chu kang'].some(area => 
           location.toLowerCase().includes(area.toLowerCase())
         );

      // Get weather data from OpenWeatherMap
      const weatherData = await weatherService.getCurrentWeather(location, units);

      // Use OpenAI to generate human-readable response
      let prompt = `Please provide a friendly, conversational weather report based on this data:

Location: ${weatherData.location.name}, ${weatherData.location.country}
Current Temperature: ${weatherData.current.temperature}°${units === "metric" ? "C" : "F"}
Feels Like: ${weatherData.current.feels_like}°${units === "metric" ? "C" : "F"}
Weather Description: ${weatherData.current.description}
Humidity: ${weatherData.current.humidity}%
Wind Speed: ${weatherData.current.wind_speed} ${units === "metric" ? "m/s" : "mph"}
Visibility: ${weatherData.current.visibility / 1000} km`;

      if (isSingaporeLocation) {
        prompt += `

This is a Singapore location, so please make the report feel local and mention any Singapore-specific context like:
- Tropical climate considerations
- Local area characteristics (if it's a specific area like Marina Bay, Orchard Road, etc.)
- Typical Singapore weather patterns
- Suggestions for activities in this area given the weather`;
      }

      prompt += `

Please make it sound natural and conversational, like a friendly weather person would describe it. Include any notable conditions and maybe a brief forecast for the next few hours.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a friendly weather reporter who provides clear, conversational weather updates. ${isSingaporeLocation ? 'You have special knowledge of Singapore and its various districts and weather patterns.' : ''}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const humanReadableWeather = completion.choices[0]?.message?.content || "Weather information unavailable";

      return humanReadableWeather;
    } catch (error) {
      throw new Error(`Error getting weather information: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Register a comprehensive weather tool that combines location parsing and weather data
server.addTool({
  name: "get_comprehensive_weather",
  description: "Parse natural language query, extract location, and get comprehensive weather data with special Singapore handling",
  parameters: z.object({
    userQuery: z.string().describe("Natural language query about weather"),
    units: z.enum(["metric", "imperial", "kelvin"]).default("metric").describe("Units for temperature and measurements"),
  }),
  execute: async (args) => {
    try {
      const { userQuery, units = "metric" } = args as {
        userQuery: string;
        units?: string;
      };

      // Parse the location using GPT directly
      const prompt = `You are a location parsing expert. Analyze this user query and extract the location information.

User Query: "${userQuery}"

Please respond with a JSON object containing:
{
  "location": "extracted location name",
  "isInSingapore": true/false,
  "area": "Singapore area/region if applicable",
  "confidence": "high/medium/low",
  "explanation": "brief explanation of how you parsed this"
}

Special instructions for Singapore:
- If the query mentions Singapore, SG, or any Singapore-specific locations (Marina Bay, Orchard Road, Sentosa, Changi, Jurong, Woodlands, Tampines, Bedok, Ang Mo Kio, Bishan, Clementi, Dover, Eunos, Geylang, Hougang, Kallang, Katong, MacPherson, Novena, Outram, Pasir Ris, Paya Lebar, Punggol, Queenstown, River Valley, Rochor, Serangoon, Siglap, Sims, Somerset, Tai Seng, Tanjong Pagar, Telok Blangah, Thomson, Toa Payoh, Whampoa, Yishun, Yio Chu Kang), set isInSingapore to true
- For Singapore locations, provide the specific area/region if you can identify it
- For non-Singapore locations, set isInSingapore to false

Examples:
- "How's the weather in Marina Bay?" → {"location": "Marina Bay", "isInSingapore": true, "area": "Downtown Core", "confidence": "high"}
- "Weather at Sentosa beach" → {"location": "Sentosa", "isInSingapore": true, "area": "Southern Islands", "confidence": "high"}
- "What's the weather like in London?" → {"location": "London", "isInSingapore": false, "area": null, "confidence": "high"}

Respond only with valid JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a location parsing expert. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      
      let parsedLocation;
      try {
        parsedLocation = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback parsing
        const query = userQuery.toLowerCase();
        if (query.includes('singapore') || query.includes('sg') || 
            query.includes('marina bay') || query.includes('orchard') || 
            query.includes('sentosa') || query.includes('changi') ||
            query.includes('jurong') || query.includes('woodlands')) {
          parsedLocation = {
            location: userQuery.trim(),
            isInSingapore: true,
            area: "Singapore",
            confidence: "medium",
            explanation: "Fallback parsing detected Singapore-related terms"
          };
        } else {
          parsedLocation = {
            location: userQuery.trim(),
            isInSingapore: false,
            area: null,
            confidence: "low",
            explanation: "Fallback parsing used"
          };
        }
      }

      if (!parsedLocation || !parsedLocation.location) {
        throw new Error("Could not parse location from user query");
      }

      // Get weather data
      const weatherData = await weatherService.getCurrentWeather(parsedLocation.location, units);

      // Generate AI description
      let weatherPrompt = `Please provide a friendly, conversational weather report based on this data:

Location: ${weatherData.location.name}, ${weatherData.location.country}
Current Temperature: ${weatherData.current.temperature}°${units === "metric" ? "C" : "F"}
Feels Like: ${weatherData.current.feels_like}°${units === "metric" ? "C" : "F"}
Weather Description: ${weatherData.current.description}
Humidity: ${weatherData.current.humidity}%
Wind Speed: ${weatherData.current.wind_speed} ${units === "metric" ? "m/s" : "mph"}
Visibility: ${weatherData.current.visibility / 1000} km`;

      if (parsedLocation.isInSingapore) {
        weatherPrompt += `

This is a Singapore location (${parsedLocation.area || 'Singapore'}), so please make the report feel local and mention any Singapore-specific context like:
- Tropical climate considerations
- Local area characteristics (if it's a specific area like Marina Bay, Orchard Road, etc.)
- Typical Singapore weather patterns
- Suggestions for activities in this area given the weather`;
      }

      weatherPrompt += `

Please make it sound natural and conversational, like a friendly weather person would describe it. Include any notable conditions and maybe a brief forecast for the next few hours.`;

      const weatherCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a friendly weather reporter who provides clear, conversational weather updates. ${parsedLocation.isInSingapore ? 'You have special knowledge of Singapore and its various districts and weather patterns.' : ''}`,
          },
          {
            role: "user",
            content: weatherPrompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const aiDescription = weatherCompletion.choices[0]?.message?.content || "Weather information unavailable";

      // Return comprehensive data
      return {
        type: "text",
        text: JSON.stringify({
          parsedLocation,
          weatherData,
          aiDescription,
          isSingaporeLocation: parsedLocation.isInSingapore,
          units
        })
      };
    } catch (error) {
      throw new Error(`Error getting comprehensive weather: ${error instanceof Error ? error.message : "Unknown error"}`);
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
