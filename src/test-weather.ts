import { WeatherService } from "./weather-service.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testWeatherService() {
  try {
    console.log("Testing Weather Service...");
    
    const weatherService = new WeatherService();
    
    // Test with a known city
    const location = "London";
    const units = "metric";
    
    console.log(`\nFetching weather for ${location}...`);
    const weatherData = await weatherService.getCurrentWeather(location, units);
    
    console.log("\nWeather Data Retrieved:");
    console.log("========================");
    console.log(`Location: ${weatherData.location.name}, ${weatherData.location.country}`);
    console.log(`Coordinates: ${weatherData.location.coordinates.lat}, ${weatherData.location.coordinates.lon}`);
    console.log(`Current Temperature: ${weatherData.current.temperature}°C`);
    console.log(`Feels Like: ${weatherData.current.feels_like}°C`);
    console.log(`Weather: ${weatherData.current.description}`);
    console.log(`Humidity: ${weatherData.current.humidity}%`);
    console.log(`Wind Speed: ${weatherData.current.wind_speed} m/s`);
    console.log(`Visibility: ${weatherData.current.visibility / 1000} km`);
    console.log(`Sunrise: ${new Date(weatherData.current.sunrise).toLocaleTimeString()}`);
    console.log(`Sunset: ${new Date(weatherData.current.sunset).toLocaleTimeString()}`);
    
    console.log("\n5-Hour Forecast:");
    console.log("=================");
    weatherData.forecast.forEach((forecast, index) => {
      const time = new Date(forecast.time).toLocaleTimeString();
      console.log(`${index + 1}h: ${forecast.temperature}°C, ${forecast.description}`);
    });
    
    console.log(`\nUnits: ${weatherData.units}`);
    console.log(`Timestamp: ${weatherData.timestamp}`);
    
    console.log("\n✅ Weather service test completed successfully!");
    
  } catch (error) {
    console.error("❌ Weather service test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

// Run the test
testWeatherService();
