import axios from "axios";

export interface WeatherLocation {
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecast {
  time: string;
  temperature: number;
  description: string;
  humidity: number;
  wind_speed: number;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  units: string;
  timestamp: string;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor() {
    const apiKey = process.env.OpenWeatherMapAPI_KEY;
    if (!apiKey) {
      throw new Error("OpenWeatherMap API key not found in environment variables");
    }
    this.apiKey = apiKey;
  }

  async getCurrentWeather(location: string, units: string = "metric"): Promise<WeatherData> {
    try {
      // First, get coordinates for the location
      const geoResponse = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          location
        )}&limit=1&appid=${this.apiKey}`
      );

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error(`Location not found: ${location}`);
      }

      const { lat, lon, name, country } = geoResponse.data[0];

      // Get current weather data
      const weatherResponse = await axios.get(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`
      );

      const weatherData = weatherResponse.data;

      // Get additional details
      const detailsResponse = await axios.get(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`
      );

      return {
        location: {
          name,
          country,
          coordinates: { lat, lon },
        },
        current: {
          temperature: weatherData.main.temp,
          feels_like: weatherData.main.feels_like,
          humidity: weatherData.main.humidity,
          pressure: weatherData.main.pressure,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          wind_speed: weatherData.wind.speed,
          wind_direction: weatherData.wind.deg,
          visibility: weatherData.visibility,
          sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
          sunset: new Date(weatherData.sys.sunset * 1000).toISOString(),
        },
        forecast: detailsResponse.data.list.slice(0, 5).map((item: any) => ({
          time: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
        })),
        units,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Weather API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}
