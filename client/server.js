import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Weather endpoint that communicates with MCP server
app.post('/api/weather', async (req, res) => {
    try {
        const { location, units = 'metric' } = req.body;
        
        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        console.log(`🌍 Weather request for ${location} in ${units} units`);

        // For now, return mock data
        // In a real implementation, you'd communicate with the MCP server here
        const mockWeather = generateMockWeather(location, units);
        
        res.json(mockWeather);
        
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Failed to get weather data' });
    }
});

function generateMockWeather(location, units) {
    const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
    const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
    
    const baseTemp = Math.floor(Math.random() * 30) + 5;
    const feelsLike = baseTemp + (Math.floor(Math.random() * 6) - 3);
    const humidity = Math.floor(Math.random() * 40) + 40;
    const windSpeed = (Math.random() * 10 + 2).toFixed(1);
    const visibility = (Math.random() * 5 + 5).toFixed(1);
    
    const weatherDescriptions = [
        'partly cloudy', 'sunny', 'cloudy', 'light rain', 'overcast',
        'clear skies', 'scattered clouds', 'misty', 'foggy', 'drizzle'
    ];
    const description = weatherDescriptions[Math.floor(Math.random() * weatherDescriptions.length)];
    
    return {
        location: {
            name: location,
            country: getMockCountry(location),
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

function getMockCountry(location) {
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

// Start the server
app.listen(PORT, () => {
    console.log(`🌐 Web client server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down web client server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down web client server...');
    process.exit(0);
});
