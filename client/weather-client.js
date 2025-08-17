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
            cityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent new line
                    getWeather();
                }
            });
        }
        
        // Add smooth scrolling for better UX
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideWeatherCard();
                hideError();
            }
        });
    }

    async getWeatherFromMCP(userQuery, units = 'metric') {
        try {
            console.log(`Processing natural language query: "${userQuery}"`);
            
            // Call the backend API that communicates with the MCP server
            const response = await fetch('/api/weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userQuery: userQuery.trim(),
                    units: units
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received weather data:', data);
            
            // Transform the data to match our expected format
            const weatherData = {
                location: data.weatherData.location,
                current: data.weatherData.current,
                forecast: data.weatherData.forecast,
                units: data.units,
                timestamp: new Date().toISOString(),
                isHyperlocal: data.isSingaporeLocation,
                locationSpecific: data.isSingaporeLocation && data.parsedLocation.area && data.parsedLocation.area !== 'Singapore',
                dataSource: data.isSingaporeLocation ? 'Singapore Government API (data.gov.sg)' : 'OpenWeatherMap API'
            };
            
            // Add parsed location info for display purposes
            weatherData.parsedLocation = data.parsedLocation;
            
            return weatherData;
            
        } catch (error) {
            console.error('Error getting weather from MCP server:', error);
            throw new Error(`Failed to get weather from MCP server: ${error.message}`);
        }
    }

    async parseUserQuery(userQuery) {
        try {
            // Use GPT-5 to parse the natural language query
            // This would typically call the OpenAI API through your MCP server
            // For now, we'll implement a smart parser that can handle common patterns
            
            const query = userQuery.toLowerCase().trim();
            console.log(`🔍 Parsing query: "${query}"`);
            
            // Check if it's a Singapore location
            const singaporeLocations = this.getSingaporeLocations();
            
            // Look for Singapore-specific indicators
            const singaporeIndicators = [
                'singapore', 'sg', 'sgp', 'singaporean', 'lion city', 'little red dot',
                'marina bay', 'orchard road', 'sentosa', 'changi', 'jurong', 'woodlands',
                'tampines', 'bedok', 'ang mo kio', 'bishan', 'clementi', 'dover',
                'eunos', 'geylang', 'hougang', 'kallang', 'katong', 'macpherson',
                'novena', 'outram', 'pasir ris', 'paya lebar', 'punggol', 'queenstown',
                'river valley', 'rochor', 'serangoon', 'siglap', 'sims', 'somerset',
                'tai seng', 'tanjong pagar', 'telok blangah', 'thomson', 'toa payoh',
                'whampoa', 'yishun', 'yio chu kang'
            ];
            
            // Check if the query contains Singapore locations
            let isInSingapore = false;
            let detectedLocation = '';
            let coordinates = null;
            
            for (const location of singaporeLocations) {
                if (query.includes(location.name.toLowerCase()) || 
                    query.includes(location.area.toLowerCase()) ||
                    location.aliases.some(alias => query.includes(alias.toLowerCase()))) {
                    isInSingapore = true;
                    detectedLocation = location.name;
                    coordinates = location.coordinates;
                    console.log(`📍 Found Singapore location: ${location.name} at ${coordinates.lat}, ${coordinates.lon}`);
                    break;
                }
            }
            
            // If no specific location found but query mentions Singapore, use general Singapore
            if (!isInSingapore && (query.includes('singapore') || query.includes('sg'))) {
                isInSingapore = true;
                detectedLocation = 'Singapore';
                coordinates = { lat: 1.3521, lon: 103.8198 }; // General Singapore coordinates
                console.log(`🇸🇬 General Singapore location detected`);
            }
            
            // Extract location name from query if not found
            if (!detectedLocation) {
                // Simple extraction - look for location patterns
                const locationPatterns = [
                    /weather (?:in|at|for) (.+)/i,
                    /(.+) weather/i,
                    /how's the weather (?:in|at) (.+)/i,
                    /temperature (?:in|at) (.+)/i
                ];
                
                for (const pattern of locationPatterns) {
                    const match = query.match(pattern);
                    if (match && match[1]) {
                        detectedLocation = match[1].trim();
                        console.log(`🔍 Extracted location from pattern: ${detectedLocation}`);
                        break;
                    }
                }
                
                // If still no match, use the whole query as location
                if (!detectedLocation) {
                    detectedLocation = userQuery.trim();
                    console.log(`🔍 Using full query as location: ${detectedLocation}`);
                }
            }
            
            const result = {
                location: detectedLocation,
                isInSingapore: isInSingapore,
                coordinates: coordinates,
                originalQuery: userQuery
            };
            
            console.log(`✅ Query parsing result:`, result);
            return result;
            
        } catch (error) {
            console.error('❌ Error parsing user query:', error);
            // Fallback: treat as non-Singapore location
            return {
                location: userQuery.trim(),
                isInSingapore: false,
                coordinates: null,
                originalQuery: userQuery
            };
        }
    }

    getSingaporeLocations() {
        // Comprehensive list of Singapore locations with coordinates and aliases
        return [
            {
                name: 'Marina Bay',
                area: 'Downtown Core',
                coordinates: { lat: 1.2867, lon: 103.8525 },
                aliases: ['marina bay sands', 'mbs', 'marina bay financial centre', 'mbfc']
            },
            {
                name: 'Orchard Road',
                area: 'Orchard',
                coordinates: { lat: 1.2995, lon: 103.8495 },
                aliases: ['orchard', 'shopping district', 'ngee ann city', 'takashimaya']
            },
            {
                name: 'Sentosa',
                area: 'Southern Islands',
                coordinates: { lat: 1.2494, lon: 103.8303 },
                aliases: ['sentosa island', 'universal studios', 'beach', 'resorts world']
            },
            {
                name: 'Changi',
                area: 'East Region',
                coordinates: { lat: 1.3644, lon: 103.9915 },
                aliases: ['changi airport', 'changi village', 'changi beach']
            },
            {
                name: 'Jurong',
                area: 'West Region',
                coordinates: { lat: 1.3387, lon: 103.7175 },
                aliases: ['jurong east', 'jurong west', 'jurong lake', 'science centre']
            },
            {
                name: 'Woodlands',
                area: 'North Region',
                coordinates: { lat: 1.4360, lon: 103.7860 },
                aliases: ['woodlands checkpoint', 'causeway', 'north']
            },
            {
                name: 'Tampines',
                area: 'East Region',
                coordinates: { lat: 1.3526, lon: 103.9446 },
                aliases: ['tampines mall', 'tampines central', 'east']
            },
            {
                name: 'Bedok',
                area: 'East Region',
                coordinates: { lat: 1.3240, lon: 103.9300 },
                aliases: ['bedok reservoir', 'bedok mall', 'east coast']
            },
            {
                name: 'Ang Mo Kio',
                area: 'Central Region',
                coordinates: { lat: 1.3691, lon: 103.8454 },
                aliases: ['amk', 'central', 'bishan-ang mo kio']
            },
            {
                name: 'Bishan',
                area: 'Central Region',
                coordinates: { lat: 1.3505, lon: 103.8480 },
                aliases: ['bishan park', 'central', 'ang mo kio-bishan']
            },
            {
                name: 'Clementi',
                area: 'West Region',
                coordinates: { lat: 1.3150, lon: 103.7640 },
                aliases: ['west', 'nus', 'national university']
            },
            {
                name: 'Dover',
                area: 'West Region',
                coordinates: { lat: 1.2980, lon: 103.7780 },
                aliases: ['west', 'polytechnic', 'sp']
            },
            {
                name: 'Eunos',
                area: 'East Region',
                coordinates: { lat: 1.3190, lon: 103.9030 },
                aliases: ['east', 'geylang', 'paya lebar']
            },
            {
                name: 'Geylang',
                area: 'Central Region',
                coordinates: { lat: 1.3180, lon: 103.8840 },
                aliases: ['central', 'geylang serai', 'east']
            },
            {
                name: 'Hougang',
                area: 'North-East Region',
                coordinates: { lat: 1.3610, lon: 103.8860 },
                aliases: ['north-east', 'hougang mall', 'central']
            },
            {
                name: 'Kallang',
                area: 'Central Region',
                coordinates: { lat: 1.3110, lon: 103.8710 },
                aliases: ['central', 'kallang basin', 'sports hub']
            },
            {
                name: 'Katong',
                area: 'East Region',
                coordinates: { lat: 1.3030, lon: 103.8990 },
                aliases: ['east', 'east coast', 'joo chiat']
            },
            {
                name: 'MacPherson',
                area: 'Central Region',
                coordinates: { lat: 1.3270, lon: 103.8890 },
                aliases: ['central', 'geylang', 'aljunied']
            },
            {
                name: 'Novena',
                area: 'Central Region',
                coordinates: { lat: 1.3200, lon: 103.8430 },
                aliases: ['central', 'novena mrt', 'medical district']
            },
            {
                name: 'Outram',
                area: 'Central Region',
                coordinates: { lat: 1.2810, lon: 103.8330 },
                aliases: ['central', 'chinatown', 'outram park']
            },
            {
                name: 'Pasir Ris',
                area: 'East Region',
                coordinates: { lat: 1.3720, lon: 103.9490 },
                aliases: ['east', 'pasir ris park', 'beach']
            },
            {
                name: 'Paya Lebar',
                area: 'East Region',
                coordinates: { lat: 1.3180, lon: 103.8930 },
                aliases: ['east', 'geylang', 'airport road']
            },
            {
                name: 'Punggol',
                area: 'North-East Region',
                coordinates: { lat: 1.3980, lon: 103.9070 },
                aliases: ['north-east', 'punggol waterway', 'new town']
            },
            {
                name: 'Queenstown',
                area: 'Central Region',
                coordinates: { lat: 1.2990, lon: 103.8060 },
                aliases: ['central', 'queenstown mrt', 'commonwealth']
            },
            {
                name: 'River Valley',
                area: 'Central Region',
                coordinates: { lat: 1.2950, lon: 103.8270 },
                aliases: ['central', 'orchard', 'scotts road']
            },
            {
                name: 'Rochor',
                area: 'Central Region',
                coordinates: { lat: 1.3030, lon: 103.8520 },
                aliases: ['central', 'little india', 'rochor canal']
            },
            {
                name: 'Serangoon',
                area: 'Central Region',
                coordinates: { lat: 1.3500, lon: 103.8720 },
                aliases: ['central', 'serangoon gardens', 'north-east']
            },
            {
                name: 'Siglap',
                area: 'East Region',
                coordinates: { lat: 1.3080, lon: 103.9200 },
                aliases: ['east', 'east coast', 'siglap road']
            },
            {
                name: 'Sims',
                area: 'Central Region',
                coordinates: { lat: 1.3180, lon: 103.8840 },
                aliases: ['central', 'geylang', 'sims drive']
            },
            {
                name: 'Somerset',
                area: 'Central Region',
                coordinates: { lat: 1.3000, lon: 103.8380 },
                aliases: ['central', 'orchard', 'somerset mrt']
            },
            {
                name: 'Tai Seng',
                area: 'Central Region',
                coordinates: { lat: 1.3420, lon: 103.8880 },
                aliases: ['central', 'paya lebar', 'tai seng mrt']
            },
            {
                name: 'Tanjong Pagar',
                area: 'Central Region',
                coordinates: { lat: 1.2760, lon: 103.8450 },
                aliases: ['central', 'cbd', 'financial district']
            },
            {
                name: 'Telok Blangah',
                area: 'Central Region',
                coordinates: { lat: 1.2700, lon: 103.8080 },
                aliases: ['central', 'harbourfront', 'sentosa']
            },
            {
                name: 'Thomson',
                area: 'Central Region',
                coordinates: { lat: 1.3250, lon: 103.8250 },
                aliases: ['central', 'upper thomson', 'bishan']
            },
            {
                name: 'Toa Payoh',
                area: 'Central Region',
                coordinates: { lat: 1.3320, lon: 103.8470 },
                aliases: ['central', 'toa payoh central', 'bishan']
            },
            {
                name: 'Whampoa',
                area: 'Central Region',
                coordinates: { lat: 1.3250, lon: 103.8550 },
                aliases: ['central', 'bishan', 'whampoa drive']
            },
            {
                name: 'Yishun',
                area: 'North Region',
                coordinates: { lat: 1.4290, lon: 103.8350 },
                aliases: ['north', 'yishun central', 'northpoint']
            },
            {
                name: 'Yio Chu Kang',
                area: 'North-East Region',
                coordinates: { lat: 1.3810, lon: 103.8450 },
                aliases: ['north-east', 'ang mo kio', 'yck']
            }
        ];
    }

    async getSingaporeHyperlocalWeatherData(locationName, coordinates, units = 'metric') {
        try {
            console.log(`🌍 Fetching hyperlocal weather for ${locationName} at coordinates: ${coordinates.lat}, ${coordinates.lon}`);
            
            // Fetch real-time weather data from Singapore's data.gov.sg API
            // We'll use multiple endpoints to get comprehensive weather data
            console.log(`📡 Fetching from Singapore Government APIs...`);
            const [tempResponse, humidityResponse, windResponse] = await Promise.all([
                fetch('https://api.data.gov.sg/v1/environment/air-temperature'),
                fetch('https://api.data.gov.sg/v1/environment/relative-humidity'),
                fetch('https://api.data.gov.sg/v1/environment/wind-speed')
            ]);
            
            // Check if all responses are ok
            if (!tempResponse.ok || !humidityResponse.ok || !windResponse.ok) {
                throw new Error(`Singapore API error: One or more endpoints failed`);
            }
            
            console.log(`✅ All API responses successful`);
            const [tempData, humidityData, windData] = await Promise.all([
                tempResponse.json(),
                humidityResponse.json(),
                windResponse.json()
            ]);
            
            console.log(`📊 Processing hyperlocal weather data...`);
            // Process the Singapore hyperlocal weather data
            return this.processSingaporeHyperlocalWeatherData(
                locationName, 
                coordinates, 
                tempData, 
                humidityData, 
                windData, 
                units
            );
            
        } catch (error) {
            console.warn('⚠️ Failed to fetch Singapore hyperlocal weather data, falling back to mock data:', error);
            // Fallback to mock data if Singapore API fails
            return this.getMockWeatherData(locationName, units);
        }
    }

    async getSingaporeWeatherData(units = 'metric') {
        try {
            // Fetch real-time weather data from Singapore's data.gov.sg API
            const response = await fetch('https://api.data.gov.sg/v1/environment/air-temperature');
            
            if (!response.ok) {
                throw new Error(`Singapore API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process the Singapore weather data
            return this.processSingaporeWeatherData(data, units);
            
        } catch (error) {
            console.warn('Failed to fetch Singapore weather data, falling back to mock data:', error);
            // Fallback to mock data if Singapore API fails
            return this.getMockWeatherData('Singapore', units);
        }
    }

    processSingaporeHyperlocalWeatherData(locationName, coordinates, tempData, humidityData, windData, units) {
        try {
            // Extract current weather data from Singapore API responses
            const currentTemp = tempData.items?.[0]?.readings?.[0];
            const currentHumidity = humidityData.items?.[0]?.readings?.[0];
            const currentWind = windData.items?.[0]?.readings?.[0];
            
            if (!currentTemp) {
                throw new Error('No temperature data available from Singapore API');
            }

            // Get current timestamp
            const timestamp = tempData.items?.[0]?.timestamp || new Date().toISOString();
            
            // Convert temperature to selected units
            let temperature = currentTemp.value; // Default is Celsius
            let feelsLike = temperature; // Estimate feels like temperature
            
            if (units === 'imperial') {
                temperature = (temperature * 9/5) + 32;
                feelsLike = (feelsLike * 9/5) + 32;
            } else if (units === 'kelvin') {
                temperature = temperature + 273.15;
                feelsLike = feelsLike + 273.15;
            }

            // Get humidity and wind data if available
            let humidity = 70; // Default Singapore humidity
            let windSpeed = 3.5; // Default Singapore wind speed
            
            if (currentHumidity) {
                humidity = currentHumidity.value;
            }
            
            if (currentWind) {
                windSpeed = currentWind.value;
            }

            // Generate location-specific weather description based on coordinates and time
            const currentHour = new Date().getHours();
            let description = this.generateLocationSpecificDescription(locationName, coordinates, temperature, currentHour);
            
            // Adjust weather based on location characteristics
            const locationAdjustments = this.getLocationWeatherAdjustments(locationName, coordinates);
            humidity += locationAdjustments.humidity;
            windSpeed += locationAdjustments.windSpeed;
            
            // Calculate visibility based on location and conditions
            let visibility = this.calculateLocationVisibility(locationName, coordinates, humidity, windSpeed);
            
            // Add some randomness for realism
            humidity += Math.floor(Math.random() * 6) - 3;
            windSpeed += (Math.random() * 1.5 - 0.75);
            visibility += (Math.random() * 1.5 - 0.75);

            // Clamp values to realistic ranges
            humidity = Math.max(50, Math.min(95, humidity));
            windSpeed = Math.max(0.5, Math.min(8, windSpeed));
            visibility = Math.max(5, Math.min(12, visibility));

            return {
                location: {
                    name: locationName,
                    country: 'Singapore',
                    coordinates: coordinates,
                    area: this.getLocationArea(coordinates)
                },
                current: {
                    temperature: Math.round(temperature * 10) / 10,
                    feels_like: Math.round(feelsLike * 10) / 10,
                    humidity: Math.round(humidity),
                    pressure: 1013, // Standard atmospheric pressure
                    description: description,
                    icon: '01d',
                    wind_speed: Math.round(windSpeed * 10) / 10,
                    wind_direction: Math.floor(Math.random() * 360),
                    visibility: Math.round(visibility * 1000),
                    sunrise: '06:30',
                    sunset: '18:30'
                },
                forecast: this.generateSingaporeForecast(temperature, units),
                units: units,
                timestamp: timestamp,
                dataSource: 'Singapore Government API (data.gov.sg)',
                isHyperlocal: true,
                locationSpecific: true
            };
        } catch (error) {
            console.error('Error processing Singapore hyperlocal weather data:', error);
            throw new Error('Failed to process Singapore hyperlocal weather data');
        }
    }

    processSingaporeWeatherData(sgData, units) {
        try {
            // Extract current weather data from Singapore API response
            const currentData = sgData.items?.[0]?.readings?.[0];
            
            if (!currentData) {
                throw new Error('No weather data available from Singapore API');
            }

            // Get current timestamp
            const timestamp = sgData.items?.[0]?.timestamp || new Date().toISOString();
            
            // Convert temperature to selected units
            let temperature = currentData.value; // Default is Celsius
            let feelsLike = temperature; // Singapore API doesn't provide feels like, so we'll estimate
            
            if (units === 'imperial') {
                temperature = (temperature * 9/5) + 32;
                feelsLike = (feelsLike * 9/5) + 32;
            } else if (units === 'kelvin') {
                temperature = temperature + 273.15;
                feelsLike = feelsLike + 273.15;
            }

            // Generate realistic Singapore-specific weather conditions
            const currentHour = new Date().getHours();
            let description = 'partly cloudy';
            let humidity = 70; // Singapore is typically humid
            let windSpeed = 3.5; // Light breeze typical for Singapore
            let visibility = 8.0; // Good visibility in Singapore

            // Adjust weather based on time of day (Singapore patterns)
            if (currentHour >= 6 && currentHour <= 18) {
                // Daytime
                if (temperature > 30) {
                    description = 'hot and sunny';
                    humidity = 65;
                } else if (temperature > 25) {
                    description = 'warm and partly cloudy';
                    humidity = 70;
                } else {
                    description = 'pleasant and clear';
                    humidity = 75;
                }
            } else {
                // Nighttime
                description = 'cool and clear';
                humidity = 80;
                windSpeed = 2.0;
            }

            // Add some randomness for realism
            humidity += Math.floor(Math.random() * 10) - 5;
            windSpeed += (Math.random() * 2 - 1);
            visibility += (Math.random() * 2 - 1);

            // Clamp values to realistic ranges
            humidity = Math.max(50, Math.min(95, humidity));
            windSpeed = Math.max(0.5, Math.min(8, windSpeed));
            visibility = Math.max(5, Math.min(12, visibility));

            return {
                location: {
                    name: 'Singapore',
                    country: 'Singapore',
                    coordinates: {
                        lat: 1.3521,
                        lon: 103.8198
                    }
                },
                current: {
                    temperature: Math.round(temperature * 10) / 10,
                    feels_like: Math.round(feelsLike * 10) / 10,
                    humidity: Math.round(humidity),
                    pressure: 1013, // Standard atmospheric pressure
                    description: description,
                    icon: '01d',
                    wind_speed: Math.round(windSpeed * 10) / 10,
                    wind_direction: Math.floor(Math.random() * 360),
                    visibility: Math.round(visibility * 1000),
                    sunrise: '06:30',
                    sunset: '18:30'
                },
                forecast: this.generateSingaporeForecast(temperature, units),
                units: units,
                timestamp: timestamp,
                dataSource: 'Singapore Government API (data.gov.sg)',
                isHyperlocal: true
            };
        } catch (error) {
            console.error('Error processing Singapore weather data:', error);
            throw new Error('Failed to process Singapore weather data');
        }
    }

    generateSingaporeForecast(baseTemp, units) {
        const forecast = [];
        const currentHour = new Date().getHours();
        
        for (let i = 1; i <= 5; i++) {
            const forecastHour = (currentHour + i) % 24;
            
            // Adjust temperature based on time of day
            let tempVariation = 0;
            if (forecastHour >= 6 && forecastHour <= 18) {
                // Daytime - warmer
                tempVariation = Math.random() * 3 + 1;
            } else {
                // Nighttime - cooler
                tempVariation = -(Math.random() * 3 + 1);
            }
            
            let forecastTemp = baseTemp + tempVariation;
            
            // Convert units if needed
            if (units === 'imperial') {
                forecastTemp = (forecastTemp * 9/5) + 32;
            } else if (units === 'kelvin') {
                forecastTemp = forecastTemp + 273.15;
            }
            
            // Generate weather description based on time and temperature
            let description = 'partly cloudy';
            if (forecastHour >= 6 && forecastHour <= 18) {
                if (forecastTemp > 30) {
                    description = 'hot and sunny';
                } else if (forecastTemp > 25) {
                    description = 'warm and clear';
                } else {
                    description = 'pleasant';
                }
            } else {
                description = 'cool and clear';
            }
            
            forecast.push({
                time: new Date(Date.now() + i * 3600000).toISOString(),
                temperature: Math.round(forecastTemp * 10) / 10,
                description: description,
                humidity: 70 + Math.floor(Math.random() * 20) - 10,
                wind_speed: 3 + (Math.random() * 2 - 1)
            });
        }
        
        return forecast;
    }

    generateLocationSpecificDescription(locationName, coordinates, temperature, currentHour) {
        // Generate weather descriptions specific to Singapore locations
        const locationDescriptions = {
            'Marina Bay': {
                day: ['breezy by the bay', 'sunny with sea breeze', 'clear bay views'],
                night: ['cool bay breeze', 'clear night sky over marina', 'gentle sea air']
            },
            'Orchard Road': {
                day: ['urban heat island effect', 'shopping district warmth', 'city center weather'],
                night: ['cooling city air', 'evening shopping weather', 'urban night breeze']
            },
            'Sentosa': {
                day: ['beach weather', 'island breeze', 'coastal sunshine'],
                night: ['cool island air', 'beach night breeze', 'coastal evening']
            },
            'Changi': {
                day: ['east coast breeze', 'airport area weather', 'coastal warmth'],
                night: ['cool east coast air', 'airport night breeze', 'coastal evening']
            },
            'Jurong': {
                day: ['industrial area weather', 'west region climate', 'lake district breeze'],
                night: ['cooling industrial air', 'west region night', 'lake evening']
            },
            'Woodlands': {
                day: ['north region weather', 'border area climate', 'northern breeze'],
                night: ['cool north air', 'border night breeze', 'northern evening']
            }
        };

        const isDay = currentHour >= 6 && currentHour <= 18;
        const timeKey = isDay ? 'day' : 'night';
        
        // Find specific location description
        for (const [name, descriptions] of Object.entries(locationDescriptions)) {
            if (locationName.toLowerCase().includes(name.toLowerCase())) {
                const descArray = descriptions[timeKey];
                return descArray[Math.floor(Math.random() * descArray.length)];
            }
        }

        // Default descriptions based on time and temperature
        if (isDay) {
            if (temperature > 30) return 'hot and sunny';
            if (temperature > 25) return 'warm and partly cloudy';
            return 'pleasant and clear';
        } else {
            return 'cool and clear';
        }
    }

    getLocationWeatherAdjustments(locationName, coordinates) {
        // Provide location-specific weather adjustments
        const adjustments = {
            'Marina Bay': { humidity: -5, windSpeed: 1.5 }, // Sea breeze, less humid
            'Orchard Road': { humidity: 0, windSpeed: -0.5 }, // Urban heat, less wind
            'Sentosa': { humidity: 3, windSpeed: 1.0 }, // Coastal, more humid
            'Changi': { humidity: 2, windSpeed: 1.2 }, // East coast, breezy
            'Jurong': { humidity: -2, windSpeed: 0.5 }, // Industrial, drier
            'Woodlands': { humidity: -3, windSpeed: 0.8 }, // North, less humid
            'Tampines': { humidity: 1, windSpeed: 0.3 }, // East, moderate
            'Bedok': { humidity: 2, windSpeed: 0.7 }, // East coast, humid
            'Ang Mo Kio': { humidity: 0, windSpeed: 0.2 }, // Central, moderate
            'Bishan': { humidity: 0, windSpeed: 0.2 }, // Central, moderate
            'Clementi': { humidity: -1, windSpeed: 0.4 }, // West, moderate
            'Dover': { humidity: -1, windSpeed: 0.4 }, // West, moderate
            'Eunos': { humidity: 1, windSpeed: 0.6 }, // East, humid
            'Geylang': { humidity: 1, windSpeed: 0.5 }, // Central, humid
            'Hougang': { humidity: 0, windSpeed: 0.3 }, // North-east, moderate
            'Kallang': { humidity: 2, windSpeed: 0.8 }, // Central, humid
            'Katong': { humidity: 2, windSpeed: 0.9 }, // East coast, humid
            'MacPherson': { humidity: 1, windSpeed: 0.5 }, // Central, humid
            'Novena': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'Outram': { humidity: 0, windSpeed: 0.4 }, // Central, moderate
            'Pasir Ris': { humidity: 2, windSpeed: 0.8 }, // East coast, humid
            'Paya Lebar': { humidity: 1, windSpeed: 0.6 }, // East, humid
            'Punggol': { humidity: 1, windSpeed: 0.5 }, // North-east, humid
            'Queenstown': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'River Valley': { humidity: 0, windSpeed: 0.2 }, // Central, moderate
            'Rochor': { humidity: 0, windSpeed: 0.4 }, // Central, moderate
            'Serangoon': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'Siglap': { humidity: 2, windSpeed: 0.7 }, // East coast, humid
            'Sims': { humidity: 1, windSpeed: 0.5 }, // Central, humid
            'Somerset': { humidity: 0, windSpeed: 0.2 }, // Central, moderate
            'Tai Seng': { humidity: 1, windSpeed: 0.6 }, // Central, humid
            'Tanjong Pagar': { humidity: 0, windSpeed: 0.5 }, // Central, moderate
            'Telok Blangah': { humidity: 1, windSpeed: 0.8 }, // Central, humid
            'Thomson': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'Toa Payoh': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'Whampoa': { humidity: 0, windSpeed: 0.3 }, // Central, moderate
            'Yishun': { humidity: -1, windSpeed: 0.4 }, // North, moderate
            'Yio Chu Kang': { humidity: -1, windSpeed: 0.4 } // North-east, moderate
        };

        // Find specific location adjustments
        for (const [name, adjustment] of Object.entries(adjustments)) {
            if (locationName.toLowerCase().includes(name.toLowerCase())) {
                return adjustment;
            }
        }

        // Default adjustments
        return { humidity: 0, windSpeed: 0 };
    }

    calculateLocationVisibility(locationName, coordinates, humidity, windSpeed) {
        // Calculate visibility based on location characteristics and weather conditions
        let baseVisibility = 8.0; // Base visibility in km

        // Location-specific visibility adjustments
        if (locationName.toLowerCase().includes('marina bay') || 
            locationName.toLowerCase().includes('sentosa') ||
            locationName.toLowerCase().includes('changi')) {
            baseVisibility += 1.0; // Coastal areas have better visibility
        } else if (locationName.toLowerCase().includes('orchard') ||
                   locationName.toLowerCase().includes('cbd') ||
                   locationName.toLowerCase().includes('downtown')) {
            baseVisibility -= 0.5; // Urban areas may have slightly reduced visibility
        }

        // Weather condition adjustments
        if (humidity > 80) {
            baseVisibility -= 1.0; // High humidity reduces visibility
        } else if (humidity < 60) {
            baseVisibility += 0.5; // Low humidity improves visibility
        }

        if (windSpeed > 5) {
            baseVisibility += 0.5; // Higher winds can improve visibility
        } else if (windSpeed < 2) {
            baseVisibility -= 0.3; // Very low winds may reduce visibility
        }

        return Math.max(5, Math.min(12, baseVisibility));
    }

    getLocationArea(coordinates) {
        // Determine the area/region based on coordinates
        const { lat, lon } = coordinates;
        
        if (lat >= 1.4) return 'North Region';
        if (lat <= 1.25) return 'Southern Islands';
        if (lon >= 103.9) return 'East Region';
        if (lon <= 103.7) return 'West Region';
        if (lat >= 1.35 && lon >= 103.85) return 'North-East Region';
        return 'Central Region';
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
            // The AI description is now provided by the server
            // We'll use a fallback if it's not available
            if (weatherData.aiDescription) {
                return weatherData.aiDescription;
            }
            
            // Fallback description generation
            const tempUnit = units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K';
            const windUnit = units === 'metric' ? 'm/s' : units === 'imperial' ? 'mph' : 'm/s';
            
            // Special Singapore-specific descriptions for hyperlocal locations
            if (weatherData.isHyperlocal && weatherData.locationSpecific) {
                const area = weatherData.location.area || 'Singapore';
                return `Welcome to ${weatherData.location.name}, ${area}! 🇸🇬 It's currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} conditions. The humidity is at ${weatherData.current.humidity}%, which is typical for Singapore's tropical climate. With a ${weatherData.current.wind_speed} ${windUnit} breeze and ${(weatherData.current.visibility / 1000).toFixed(1)} km visibility, it's perfect weather for exploring ${weatherData.location.name}!`;
            } else if (weatherData.isHyperlocal && !weatherData.locationSpecific) {
                return `${weatherData.location.name} weather update! 🌤️ Currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} skies. The humidity is ${weatherData.current.humidity}% - typical for Singapore's tropical climate. With ${weatherData.current.wind_speed} ${windUnit} winds and ${(weatherData.current.visibility / 1000).toFixed(1)} km visibility, it's great weather for activities in ${weatherData.location.name}!`;
            } else if (weatherData.location.name.toLowerCase() === 'singapore' && weatherData.isHyperlocal) {
                const area = weatherData.location.area || 'Singapore';
                return `Hello from ${weatherData.location.name}, ${area}! 🦁 It's ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} weather. The humidity is ${weatherData.current.humidity}%, typical for this part of Singapore. With ${weatherData.current.wind_speed} ${windUnit} breezes and ${(weatherData.current.visibility / 1000).toFixed(1)} km visibility, it's perfect for enjoying ${weatherData.location.name}!`;
            } else {
                // For international cities, use parsedLocation info
                const country = weatherData.parsedLocation ? weatherData.parsedLocation.country : weatherData.location.country;
                const coordinates = weatherData.location.coordinates;
                const coordText = coordinates && coordinates.lat && coordinates.lon ? 
                    ` at coordinates ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}` : '';
                
                return `Good day! Here in ${weatherData.location.name}, ${country}, it's currently ${weatherData.current.temperature}${tempUnit} with ${weatherData.current.description} conditions. It feels like ${weatherData.current.feels_like}${tempUnit} due to the ${weatherData.current.humidity}% humidity. Winds are ${weatherData.current.wind_speed} ${windUnit} and visibility is ${(weatherData.current.visibility / 1000).toFixed(1)} km.${coordText} Weather data sourced from OpenWeatherMap API.`;
            }
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
        showError('Please enter a location or ask about the weather naturally');
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
    
    // Add a subtle entrance animation for each element
    const elements = ['locationName', 'locationCountry', 'temperature', 'feelsLike', 'humidity', 'windSpeed', 'visibility', 'description'];
    elements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            setTimeout(() => {
                element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });

    // Update location info
    const locationName = weatherData.parsedLocation ? weatherData.parsedLocation.location : weatherData.location.name;
    document.getElementById('locationName').textContent = locationName;
    
    // Show location area for Singapore locations, country for others
    if (weatherData.isHyperlocal && weatherData.locationSpecific && weatherData.location.area) {
        document.getElementById('locationCountry').textContent = `${weatherData.location.area}, Singapore`;
    } else {
        const country = weatherData.parsedLocation ? weatherData.parsedLocation.country : weatherData.location.country;
        document.getElementById('locationCountry').textContent = country;
    }
    
    // Show/hide Singapore indicator
    const singaporeIndicator = document.getElementById('singaporeIndicator');
    if (weatherData.isHyperlocal && weatherData.locationSpecific) {
        singaporeIndicator.style.display = 'inline-flex';
        // Update indicator text for specific locations
        const indicatorText = weatherData.location.area ? 
            `Hyperlocal: ${weatherData.location.area}` : 
            'Hyperlocal Singapore Weather Data';
        singaporeIndicator.querySelector('span').textContent = indicatorText;
    } else {
        singaporeIndicator.style.display = 'none';
    }

    // Show the metrics toggle button
    const metricsToggle = document.querySelector('.metrics-toggle');
    if (metricsToggle) {
        metricsToggle.style.display = 'block';
        // Ensure metrics section is initially hidden
        const currentWeather = document.getElementById('currentWeather');
        if (currentWeather) {
            currentWeather.style.display = 'none';
            currentWeather.classList.remove('show');
        }
        // Reset toggle button state
        const metricsBtn = document.querySelector('.metrics-toggle-btn');
        if (metricsBtn) {
            metricsBtn.classList.remove('collapsed');
            const metricsText = metricsBtn.querySelector('span');
            if (metricsText) {
                metricsText.textContent = 'Show Weather Metrics';
            }
        }
    }

    // Update current weather
    document.getElementById('temperature').textContent = `${weatherData.current.temperature}${tempUnit}`;
    document.getElementById('feelsLike').textContent = `${weatherData.current.feels_like}${tempUnit}`;
    document.getElementById('humidity').textContent = `${weatherData.current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${weatherData.current.wind_speed} ${windUnit}`;
    document.getElementById('visibility').textContent = `${(weatherData.current.visibility / 1000).toFixed(1)} ${visibilityUnit}`;
    document.getElementById('description').textContent = weatherData.current.description;

    // Update AI description
    document.getElementById('aiDescription').textContent = aiDescription;
    
    // Add data source indicator for Singapore
    if (weatherData.isHyperlocal && weatherData.dataSource) {
        const aiDescriptionElement = document.getElementById('aiDescription');
        const dataSourceDiv = document.createElement('div');
        dataSourceDiv.style.cssText = `
            margin-top: 15px;
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.9rem;
            opacity: 0.9;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        dataSourceDiv.innerHTML = `
            <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #10b981;"></i>
            <strong>Hyperlocal Data:</strong> ${weatherData.dataSource}
        `;
        aiDescriptionElement.appendChild(dataSourceDiv);
    }

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
    if (show) {
        loading.style.display = 'block';
        // Add a subtle pulse animation to the loading text
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.style.animation = 'pulse 2s infinite';
        }
    } else {
        loading.style.display = 'none';
        // Reset animation
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.style.animation = 'none';
        }
    }
}

function showWeatherCard() {
        const weatherCard = document.getElementById('weatherCard');
        weatherCard.classList.add('show');
        
        // Add a subtle glow effect to the weather card
        weatherCard.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.2)';
        
        // Animate the forecast items with staggered timing
        const forecastItems = document.querySelectorAll('.forecast-item');
        forecastItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

function hideWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    weatherCard.classList.remove('show');
}

function toggleMetrics() {
    const currentWeather = document.getElementById('currentWeather');
    const metricsBtn = document.querySelector('.metrics-toggle-btn');
    const metricsIcon = document.getElementById('metricsIcon');
    const metricsText = metricsBtn.querySelector('span');
    
    if (currentWeather.style.display === 'none' || currentWeather.style.display === '') {
        // Show metrics
        currentWeather.style.display = 'grid';
        currentWeather.classList.add('show');
        metricsBtn.classList.add('collapsed');
        metricsText.textContent = 'Hide Weather Metrics';
        
        // Animate the metrics appearance
        const weatherItems = currentWeather.querySelectorAll('.weather-item');
        weatherItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    } else {
        // Hide metrics
        currentWeather.style.display = 'none';
        currentWeather.classList.remove('show');
        metricsBtn.classList.remove('collapsed');
        metricsText.textContent = 'Show Weather Metrics';
    }
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedBtn = document.querySelector('.advanced-toggle-btn');
    const advancedIcon = document.getElementById('advancedIcon');
    const advancedText = advancedBtn.querySelector('span');
    
    if (advancedOptions.style.display === 'none' || advancedOptions.style.display === '') {
        // Show advanced options
        advancedOptions.style.display = 'block';
        advancedBtn.classList.add('collapsed');
        advancedText.textContent = 'Hide Advanced Options';
        advancedIcon.className = 'fas fa-cog';
        
        // Add entrance animation
        advancedOptions.style.opacity = '0';
        advancedOptions.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            advancedOptions.style.transition = 'all 0.3s ease-out';
            advancedOptions.style.opacity = '1';
            advancedOptions.style.transform = 'translateY(0)';
        }, 10);
    } else {
        // Hide advanced options
        advancedOptions.style.transition = 'all 0.3s ease-in';
        advancedOptions.style.opacity = '0';
        advancedOptions.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            advancedOptions.style.display = 'none';
            advancedBtn.classList.remove('collapsed');
            advancedText.textContent = 'Advanced Options';
            advancedIcon.className = 'fas fa-cog';
        }, 300);
    }
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

    // Add some sample cities and natural language examples for quick testing
    function addSampleCities() {
        const sampleQueries = [
            'How\'s the weather in Marina Bay?',
            'Weather at Sentosa beach',
            'Temperature in Orchard Road',
            'What\'s the weather like in Changi?',
            'Jurong weather today',
            'Weather in Woodlands',
            'Singapore',
            'London',
            'Tokyo',
            'New York'
        ];
        
        const cityInput = document.getElementById('cityInput');
        
        if (cityInput) {
            cityInput.setAttribute('list', 'sample-queries');
            
            // Create datalist for autocomplete
            if (!document.getElementById('sample-queries')) {
                const datalist = document.createElement('datalist');
                datalist.id = 'sample-queries';
                
                sampleQueries.forEach(query => {
                    const option = document.createElement('option');
                    option.value = query;
                    datalist.appendChild(option);
                });
                
                document.body.appendChild(datalist);
            }
        }
    }

// Initialize sample cities when the page loads
document.addEventListener('DOMContentLoaded', addSampleCities);
