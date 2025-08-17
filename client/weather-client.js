class MCPWeatherClient {
    constructor() {
        this.serverProcess = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        try {
            // Check if we're running in a browser environment
            if (typeof window !== 'undefined') {
                console.log('MCP Weather Client initialized in browser mode');
                this.setupEventListeners();
            }
        } catch (error) {
            console.error('Failed to initialize MCP client:', error);
        }
    }

    setupEventListeners() {
        // Add enter key support for the search input
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    getWeather();
                }
            });
        }
    }

    async getWeatherFromMCP(location, units = 'metric') {
        try {
            // For browser environment, we'll use a mock response for demonstration
            // In a real implementation, you'd need a backend service to communicate with the MCP server
            console.log(`Requesting weather for ${location} in ${units} units`);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return mock data for demonstration
            return this.getMockWeatherData(location, units);
        } catch (error) {
            throw new Error(`Failed to get weather from MCP server: ${error.message}`);
        }
    }

    getMockWeatherData(location, units) {
        const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
        const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
        const visibilityUnit = 'km';

        // Generate realistic mock data
        const baseTemp = Math.floor(Math.random() * 30) + 5; // 5-35°C
        const feelsLike = baseTemp + (Math.floor(Math.random() * 6) - 3); // ±3°C variation
        const humidity = Math.floor(Math.random() * 40) + 40; // 40-80%
        const windSpeed = (Math.random() * 10 + 2).toFixed(1); // 2-12 m/s
        const visibility = (Math.random() * 5 + 5).toFixed(1); // 5-10 km

        const weatherDescriptions = [
            'partly cloudy', 'sunny', 'cloudy', 'light rain', 'overcast',
            'clear skies', 'scattered clouds', 'misty', 'foggy', 'drizzle'
        ];
        const description = weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)];

        return {
            location: {
                name: location,
                country: this.getMockCountry(location),
                coordinates: {
                    lat: (Math.random() * 180 - 90).toFixed(4),
                    lon: (Math.random() * 360 - 180).toFixed(4)
                }
            },
            current: {
                temperature: baseTemp,
                feels_like: feelsLike,
                humidity: humidity,
                pressure: Math.floor(Math.random() * 50) + 1000,
                description: description,
                icon: '01d',
                wind_speed: parseFloat(windSpeed),
                wind_direction: Math.floor(Math.random() * 360),
                visibility: parseFloat(visibility) * 1000,
                sunrise: new Date(Date.now() + Math.random() * 43200000).toISOString(),
                sunset: new Date(Date.now() + Math.random() * 43200000).toISOString()
            },
            forecast: Array.from({ length: 5 }, (_, i) => ({
                time: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
                temperature: baseTemp + (Math.floor(Math.random() * 10) - 5),
                description: weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)],
                humidity: humidity + (Math.floor(Math.random() * 20) - 10),
                wind_speed: parseFloat(windSpeed) + (Math.random() * 2 - 1)
            })),
            units: units,
            timestamp: new Date().toISOString()
        };
    }

    getMockCountry(location) {
        const countryMap = {
            'london': 'United Kingdom',
            'new york': 'United States',
            'tokyo': 'Japan',
            'paris': 'France',
            'berlin': 'Germany',
            'rome': 'Italy',
            'madrid': 'Spain',
            'amsterdam': 'Netherlands',
            'vienna': 'Austria',
            'prague': 'Czech Republic',
            'budapest': 'Hungary',
            'warsaw': 'Poland',
            'moscow': 'Russia',
            'beijing': 'China',
            'seoul': 'South Korea',
            'singapore': 'Singapore',
            'sydney': 'Australia',
            'toronto': 'Canada',
            'mexico city': 'Mexico',
            'sao paulo': 'Brazil',
            'buenos aires': 'Argentina',
            'cape town': 'South Africa',
            'cairo': 'Egypt',
            'mumbai': 'India',
            'bangkok': 'Thailand',
            'jakarta': 'Indonesia',
            'manila': 'Philippines',
            'hanoi': 'Vietnam',
            'kuala lumpur': 'Malaysia'
        };

        return countryMap[location.toLowerCase()] || 'Unknown Country';
    }

    async generateAIDescription(weatherData, units) {
        try {
            // For demonstration, generate a mock AI description
            // In a real implementation, this would call the OpenAI API through the MCP server
            const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
            const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
            
            const descriptions = [
                `Good day! Here in ${weatherData.location.name}, ${weatherData.location.country}, it's currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} conditions. It feels like ${weatherData.current.feels_like}${tempUnit}, so you might want to dress accordingly. The humidity is at ${weatherData.current.humidity}% with a ${weatherData.current.wind_speed} ${windUnit} breeze. Visibility is ${(weatherData.current.visibility / 1000).toFixed(1)} km.`,
                
                `Hello from ${weatherData.location.name}! The weather is ${weatherData.current.description} with a temperature of ${weatherData.current.temperature}${tempUnit}. It feels like ${weatherData.current.feels_like}${tempUnit} due to the ${weatherData.current.humidity}% humidity. Winds are ${weatherData.current.wind_speed} ${windUnit} and visibility is ${(weatherData.current.visibility / 1000).toFixed(1)} km.`,
                
                `Weather update for ${weatherData.location.name}, ${weatherData.location.country}: Currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} skies. The "feels like" temperature is ${weatherData.current.feels_like}${tempUnit}. Humidity stands at ${weatherData.current.humidity}% and wind speed is ${weatherData.current.wind_speed} ${windUnit}. Visibility is excellent at ${(weatherData.current.visibility / 1000).toFixed(1)} km.`
            ];
            
            return descriptions[Math.floor(Math.random() * descriptions.length)];
        } catch (error) {
            return `Weather information for ${weatherData.location.name}: ${weatherData.current.temperature}${units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K'} with ${weatherData.current.description} conditions.`;
        }
    }
}

// Global client instance
const mcpClient = new MCPWeatherClient();

// Global function for the HTML onclick
async function getWeather() {
    const cityInput = document.getElementById('cityInput');
    const units = document.querySelector('input[name="units"]:checked').value;
    
    if (!cityInput.value.trim()) {
        showError('Please enter a city name');
        return;
    }

    const location = cityInput.value.trim();
    
    try {
        showLoading(true);
        hideError();
        hideWeatherCard();

        const weatherData = await mcpClient.getWeatherFromMCP(location, units);
        const aiDescription = await mcpClient.generateAIDescription(weatherData, units);
        
        displayWeather(weatherData, aiDescription, units);
        
    } catch (error) {
        showError(`Failed to get weather: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function displayWeather(weatherData, aiDescription, units) {
    const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
    const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
    const visibilityUnit = 'km';

    // Update location info
    document.getElementById('locationName').textContent = weatherData.location.name;
    document.getElementById('locationCountry').textContent = weatherData.location.country;

    // Update current weather
    document.getElementById('temperature').textContent = `${weatherData.current.temperature}${tempUnit}`;
    document.getElementById('feelsLike').textContent = `${weatherData.current.feels_like}${tempUnit}`;
    document.getElementById('humidity').textContent = `${weatherData.current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${weatherData.current.wind_speed} ${windUnit}`;
    document.getElementById('visibility').textContent = `${(weatherData.current.visibility / 1000).toFixed(1)} ${visibilityUnit}`;
    document.getElementById('description').textContent = weatherData.current.description;

    // Update AI description
    document.getElementById('aiDescription').textContent = aiDescription;

    // Update forecast
    const forecastContainer = document.getElementById('forecastItems');
    forecastContainer.innerHTML = '';
    
    weatherData.forecast.forEach((forecast, index) => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        const time = new Date(forecast.time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        forecastItem.innerHTML = `
            <div class="forecast-time">${index + 1}h from now</div>
            <div class="forecast-temp">${forecast.temperature}${tempUnit}</div>
            <div class="forecast-desc">${forecast.description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });

    showWeatherCard();
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

function showWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    weatherCard.classList.add('show');
}

function hideWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    weatherCard.classList.remove('show');
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
}

function hideError() {
    const error = document.getElementById('error');
    error.style.display = 'none';
}

// Add some sample cities for quick testing
function addSampleCities() {
    const sampleCities = ['London', 'New York', 'Tokyo', 'Paris', 'Berlin', 'Rome', 'Madrid', 'Amsterdam'];
    const cityInput = document.getElementById('cityInput');
    
    if (cityInput) {
        cityInput.setAttribute('list', 'sample-cities');
        
        // Create datalist for autocomplete
        if (!document.getElementById('sample-cities')) {
            const datalist = document.createElement('datalist');
            datalist.id = 'sample-cities';
            
            sampleCities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
            });
            
            document.body.appendChild(datalist);
        }
    }
}

// Initialize sample cities when the page loads
document.addEventListener('DOMContentLoaded', addSampleCities);
