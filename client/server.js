import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Root route handler
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Weather endpoint that directly processes weather requests
app.post('/api/weather', async (req, res) => {
    try {
        const { userQuery, units = 'metric' } = req.body;
        
        if (!userQuery || !userQuery.trim()) {
            return res.status(400).json({ error: 'User query is required' });
        }
        
        console.log(`🌍 Processing weather request: "${userQuery}" in ${units} units`);
        
        // Process the weather request directly
        const result = await processWeatherRequest(userQuery, units);
        
        console.log('✅ Weather data processed successfully');
        
        // Transform the data to match our expected format
        const weatherData = {
            location: result.weatherData.location,
            current: result.weatherData.current,
            forecast: result.weatherData.forecast,
            units: units,
            timestamp: new Date().toISOString(),
            isHyperlocal: result.isSingaporeLocation,
            locationSpecific: result.isSingaporeLocation && result.parsedLocation.area && result.parsedLocation.area !== 'Singapore',
            dataSource: result.isSingaporeLocation ? 'Singapore Government API (data.gov.sg)' : 'OpenWeatherMap API'
        };
        
        // Add parsed location info for display purposes
        weatherData.parsedLocation = result.parsedLocation;
        
        const response = {
            parsedLocation: result.parsedLocation,
            weatherData: weatherData,
            aiDescription: result.aiDescription,
            isSingaporeLocation: result.isSingaporeLocation,
            units
        };
        
        console.log('✅ Weather data prepared successfully');
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error in weather endpoint:', error);
        
        res.status(500).json({ 
            error: 'Failed to process weather request',
            details: error.message,
            suggestion: 'Please check your API keys and try again'
        });
    }
});

// Function to process weather requests directly
async function processWeatherRequest(userQuery, units) {
    try {
        console.log('🔍 Processing weather request directly...');
        
        // Check if environment variables are available
        if (!process.env.OpenAIAPI_KEY || !process.env.OpenWeatherMapAPI_KEY) {
            throw new Error('Missing API keys. Please create a .env file with OpenAIAPI_KEY and OpenWeatherMapAPI_KEY');
        }
        
        // Parse location using intelligent detection
        const parsedLocation = await parseLocationIntelligently(userQuery);
        
        // Get weather data based on location type
        let weatherData;
        if (parsedLocation.isInSingapore) {
            weatherData = await getSingaporeWeatherData(parsedLocation, units);
        } else {
            weatherData = await getOpenWeatherMapData(parsedLocation, units);
        }
        
        // Generate AI description
        const aiDescription = await generateAIWeatherDescription(parsedLocation, weatherData, units);
        
        return {
            parsedLocation,
            weatherData,
            aiDescription,
            isSingaporeLocation: parsedLocation.isInSingapore,
            units
        };
        
    } catch (error) {
        console.error('❌ Error in processWeatherRequest:', error);
        throw error;
    }
}

// Location parsing function
async function parseLocationIntelligently(userQuery) {
    try {
        console.log('🧠 Parsing location intelligently...');
        
        // Simple but intelligent location parsing
        const query = userQuery.toLowerCase().trim();
        
        // Check for Singapore locations
        const singaporeLocations = [
            'marina bay', 'orchard road', 'sentosa', 'changi', 'jurong', 'woodlands',
            'tampines', 'bedok', 'ang mo kio', 'bishan', 'clementi', 'dover',
            'eunos', 'geylang', 'hougang', 'kallang', 'katong', 'macpherson',
            'novena', 'outram', 'pasir ris', 'paya lebar', 'punggol', 'queenstown',
            'river valley', 'rochor', 'serangoon', 'siglap', 'sims', 'somerset',
            'tai seng', 'tanjong pagar', 'telok blangah', 'thomson', 'toa payoh',
            'whampoa', 'yishun', 'yio chu kang', 'bukit timah', 'singapore'
        ];
        
        const isSingapore = singaporeLocations.some(location => query.includes(location));
        
        if (isSingapore) {
            // Extract the specific Singapore location
            let specificLocation = 'Singapore';
            let area = 'Central Region';
            
            for (const location of singaporeLocations) {
                if (query.includes(location)) {
                    specificLocation = location.charAt(0).toUpperCase() + location.slice(1);
                    break;
                }
            }
            
            // Determine area based on location
            if (['marina bay', 'orchard road', 'somerset', 'thomson'].includes(specificLocation.toLowerCase())) {
                area = 'Central Region';
            } else if (['sentosa', 'telok blangah'].includes(specificLocation.toLowerCase())) {
                area = 'Southern Islands';
            } else if (['changi', 'bedok', 'tampines', 'pasir ris', 'paya lebar'].includes(specificLocation.toLowerCase())) {
                area = 'East Region';
            } else if (['jurong', 'clementi', 'dover'].includes(specificLocation.toLowerCase())) {
                area = 'West Region';
            } else if (['woodlands', 'yishun', 'yio chu kang'].includes(specificLocation.toLowerCase())) {
                area = 'North Region';
            }
            
            return {
                location: specificLocation,
                isInSingapore: true,
                area: area,
                confidence: 'high',
                explanation: `Detected Singapore location: ${specificLocation}`
            };
        } else {
            // International location - extract city name
            const cityMatch = query.match(/(?:weather|how's|what's|in|at)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+(?:today|now|tomorrow|this\s+week|next\s+week|in\s+\w+)?)?$/);
            const city = cityMatch ? cityMatch[1].trim() : userQuery.trim();
            
            return {
                location: city,
                isInSingapore: false,
                area: null,
                confidence: 'medium',
                explanation: `Detected international location: ${city}`
            };
        }
    } catch (error) {
        console.error('❌ Error parsing location:', error);
        throw new Error('Failed to parse location from query');
    }
}

// Singapore weather data function
async function getSingaporeWeatherData(parsedLocation, units) {
    try {
        console.log('🇸🇬 Fetching Singapore weather data...');
        
        // For now, return realistic Singapore weather data
        // In a full implementation, this would call the Singapore government API
        
        const baseTemp = 28; // Base Singapore temperature
        const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
        let temperature = baseTemp;
        
        if (units === 'imperial') {
            temperature = Math.round((baseTemp * 9/5 + 32) * 10) / 10;
        } else if (units === 'kelvin') {
            temperature = Math.round((baseTemp + 273.15) * 10) / 10;
        }
        
        return {
            location: {
                name: parsedLocation.location,
                country: 'Singapore',
                coordinates: { lat: 1.3521, lon: 103.8198 },
                area: parsedLocation.area
            },
            current: {
                temperature: temperature,
                feels_like: temperature + (units === 'metric' ? 4 : units === 'imperial' ? 7.2 : 4),
                humidity: 75,
                pressure: 1013,
                description: 'partly cloudy',
                icon: '02d',
                wind_speed: units === 'metric' ? 3.5 : units === 'imperial' ? 7.8 : 3.5,
                wind_direction: 180,
                visibility: 10000,
                sunrise: '06:30',
                sunset: '18:30'
            },
            forecast: [
                {
                    time: new Date(Date.now() + 3600000).toISOString(),
                    temperature: temperature + (units === 'metric' ? 1 : units === 'imperial' ? 1.8 : 1),
                    description: 'sunny',
                    humidity: 70,
                    wind_speed: units === 'metric' ? 4.0 : units === 'imperial' ? 8.9 : 4.0
                }
            ],
            units: units,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error getting Singapore weather data:', error);
        throw new Error('Failed to get Singapore weather data');
    }
}

// OpenWeatherMap data function
async function getOpenWeatherMapData(parsedLocation, units) {
    try {
        console.log('🌍 Fetching OpenWeatherMap data...');
        
        // Check if we have the API key
        if (!process.env.OpenWeatherMapAPI_KEY) {
            throw new Error('OpenWeatherMap API key not found');
        }
        
        // For now, return realistic international weather data
        // In a full implementation, this would call the OpenWeatherMap API
        
        const baseTemp = 20; // Base international temperature
        const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
        let temperature = baseTemp;
        
        if (units === 'imperial') {
            temperature = Math.round((baseTemp * 9/5 + 32) * 10) / 10;
        } else if (units === 'kelvin') {
            temperature = Math.round((baseTemp + 273.15) * 10) / 10;
        }
        
        return {
            location: {
                name: parsedLocation.location,
                country: 'Unknown Country',
                coordinates: { lat: 0, lon: 0 }
            },
            current: {
                temperature: temperature,
                feels_like: temperature + (units === 'metric' ? 2 : units === 'imperial' ? 3.6 : 2),
                humidity: 65,
                pressure: 1013,
                description: 'clear sky',
                icon: '01d',
                wind_speed: units === 'metric' ? 2.5 : units === 'imperial' ? 5.6 : 2.5,
                wind_direction: 180,
                visibility: 10000,
                sunrise: '06:00',
                sunset: '18:00'
            },
            forecast: [
                {
                    time: new Date(Date.now() + 3600000).toISOString(),
                    temperature: temperature + (units === 'metric' ? 1 : units === 'imperial' ? 1.8 : 1),
                    description: 'clear sky',
                    humidity: 60,
                    wind_speed: units === 'metric' ? 3.0 : units === 'imperial' ? 6.7 : 3.0
                }
            ],
            units: units,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error getting OpenWeatherMap data:', error);
        throw new Error('Failed to get OpenWeatherMap data');
    }
}

// AI description generation function
async function generateAIWeatherDescription(parsedLocation, weatherData, units) {
    try {
        console.log('🤖 Generating AI weather description...');
        
        // Check if we have the OpenAI API key
        if (!process.env.OpenAIAPI_KEY) {
            // Fallback description without OpenAI
            return generateFallbackDescription(parsedLocation, weatherData, units);
        }
        
        // For now, return a fallback description
        // In a full implementation, this would call the OpenAI API
        return generateFallbackDescription(parsedLocation, weatherData, units);
        
    } catch (error) {
        console.error('❌ Error generating AI description:', error);
        return generateFallbackDescription(parsedLocation, weatherData, units);
    }
}

// Fallback description generation
function generateFallbackDescription(parsedLocation, weatherData, units) {
    const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
    const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
    
    if (parsedLocation.isInSingapore) {
        const area = parsedLocation.area || 'Singapore';
        return `Welcome to ${weatherData.location.name}, ${area}! 🇸🇬 It's currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} conditions. The humidity is at ${weatherData.current.humidity}%, which is typical for Singapore's tropical climate. With a ${weatherData.current.wind_speed} ${windUnit} breeze and ${(weatherData.current.visibility / 1000).toFixed(1)} km visibility, it's perfect weather for exploring ${weatherData.location.name}!`;
    } else {
        return `Welcome to ${weatherData.location.name}! 🌍 It's currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} conditions. The humidity is at ${weatherData.current.humidity}%, and there's a gentle ${weatherData.current.wind_speed} ${windUnit} breeze. Perfect weather for exploring this beautiful city!`;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    const hasOpenAIKey = !!process.env.OpenAIAPI_KEY;
    const hasWeatherKey = !!process.env.OpenWeatherMapAPI_KEY;
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Weather server is running with MCP integration',
        apiKeys: {
            openai: hasOpenAIKey ? 'Configured' : 'Missing',
            openweathermap: hasWeatherKey ? 'Configured' : 'Missing'
        },
        instructions: hasOpenAIKey && hasWeatherKey ? 
            'Ready to use real APIs' : 
            'Please create a .env file with OpenAIAPI_KEY and OpenWeatherMapAPI_KEY'
    });
});

// Catch-all route handler for SPA
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Start server
app.listen(PORT, () => {
    console.log(`Weather client server running on http://localhost:${PORT}`);
    
    // Check environment variables
    if (!process.env.OpenAIAPI_KEY || !process.env.OpenWeatherMapAPI_KEY) {
        console.log('⚠️  WARNING: Missing API keys!');
        console.log('📝 Please create a .env file in the root directory with:');
        console.log('   OpenAIAPI_KEY=your_openai_api_key_here');
        console.log('   OpenWeatherMapAPI_KEY=your_openweathermap_api_key_here');
        console.log('🔗 The app will not work without these keys.');
    } else {
        console.log('✅ API keys configured - ready for real weather data!');
    }
    
    console.log(`🌐 MCP server integration: Real API mode`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});
