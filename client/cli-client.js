#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPCLIClient {
    constructor() {
        this.serverProcess = null;
        this.isConnected = false;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async connect() {
        try {
            console.log('🌤️  Connecting to MCP Weather Server...');
            
            // Start the MCP server process
            const serverPath = join(__dirname, '..', 'dist', 'index.js');
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    // Make sure these environment variables are set
                    OpenAIAPI_KEY: process.env.OpenAIAPI_KEY,
                    OpenWeatherMapAPI_KEY: process.env.OpenWeatherMapAPI_KEY
                }
            });

            // Handle server output
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.log(`[Server] ${output}`);
                }
            });

            // Handle server errors
            this.serverProcess.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error) {
                    console.error(`[Server Error] ${error}`);
                }
            });

            // Handle server process exit
            this.serverProcess.on('exit', (code) => {
                console.log(`[Server] Process exited with code ${code}`);
                this.isConnected = false;
            });

            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (this.serverProcess.exitCode === null) {
                this.isConnected = true;
                console.log('✅ Connected to MCP Weather Server!');
                return true;
            } else {
                throw new Error('Server failed to start');
            }
        } catch (error) {
            console.error('❌ Failed to connect to MCP server:', error.message);
            return false;
        }
    }

    async sendRequest(method, params = {}) {
        if (!this.isConnected || !this.serverProcess) {
            throw new Error('Not connected to MCP server');
        }

        const requestId = ++this.requestId;
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method: method,
            params: params
        };

        return new Promise((resolve, reject) => {
            // Store the pending request
            this.pendingRequests.set(requestId, { resolve, reject });

            // Send the request to the server
            this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

            // Set a timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 30000); // 30 second timeout
        });
    }

    async getWeather(location, units = 'metric') {
        try {
            console.log(`🌍 Fetching weather for ${location}...`);
            
            const response = await this.sendRequest('tools/call', {
                name: 'get_weather',
                arguments: {
                    location: location,
                    units: units
                }
            });

            if (response.result && response.result.content) {
                return response.result.content;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            throw new Error(`Failed to get weather: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
        }
        this.isConnected = false;
        console.log('👋 Disconnected from MCP server');
    }

    async startInteractive() {
        console.log('\n🌤️  MCP Weather Client - Interactive Mode');
        console.log('==========================================');
        console.log('Commands:');
        console.log('  weather <city> [units] - Get weather for a city');
        console.log('  units <metric|imperial|kelvin> - Set default units');
        console.log('  help - Show this help');
        console.log('  quit - Exit the client');
        console.log('');

        let defaultUnits = 'metric';

        const askQuestion = () => {
            this.rl.question(`🌤️  Enter command (or 'help' for options): `, async (input) => {
                const parts = input.trim().split(' ');
                const command = parts[0].toLowerCase();

                try {
                    switch (command) {
                        case 'weather':
                            if (parts.length < 2) {
                                console.log('❌ Please specify a city name');
                                break;
                            }
                            const city = parts[1];
                            const units = parts[2] || defaultUnits;
                            
                            if (!['metric', 'imperial', 'kelvin'].includes(units)) {
                                console.log('❌ Invalid units. Use metric, imperial, or kelvin');
                                break;
                            }

                            try {
                                const weatherData = await this.getWeather(city, units);
                                console.log('\n📊 Weather Report:');
                                console.log('==================');
                                console.log(weatherData);
                                console.log('');
                            } catch (error) {
                                console.error(`❌ ${error.message}`);
                            }
                            break;

                        case 'units':
                            if (parts.length < 2) {
                                console.log(`Current default units: ${defaultUnits}`);
                                break;
                            }
                            const newUnits = parts[1].toLowerCase();
                            if (['metric', 'imperial', 'kelvin'].includes(newUnits)) {
                                defaultUnits = newUnits;
                                console.log(`✅ Default units set to: ${defaultUnits}`);
                            } else {
                                console.log('❌ Invalid units. Use metric, imperial, or kelvin');
                            }
                            break;

                        case 'help':
                            console.log('\n🌤️  MCP Weather Client - Help');
                            console.log('==============================');
                            console.log('weather <city> [units] - Get weather for a city');
                            console.log('  Example: weather London');
                            console.log('  Example: weather New York imperial');
                            console.log('');
                            console.log('units <metric|imperial|kelvin> - Set default units');
                            console.log('  Example: units imperial');
                            console.log('');
                            console.log('help - Show this help');
                            console.log('quit - Exit the client');
                            console.log('');
                            break;

                        case 'quit':
                        case 'exit':
                            console.log('👋 Goodbye!');
                            await this.disconnect();
                            this.rl.close();
                            process.exit(0);
                            break;

                        default:
                            if (command) {
                                console.log(`❌ Unknown command: ${command}`);
                                console.log('Type "help" for available commands');
                            }
                            break;
                    }
                } catch (error) {
                    console.error(`❌ Error: ${error.message}`);
                }

                // Continue asking for commands
                askQuestion();
            });
        };

        askQuestion();
    }
}

// Main function
async function main() {
    const client = new MCPCLIClient();

    // Check if environment variables are set
    if (!process.env.OpenAIAPI_KEY || !process.env.OpenWeatherMapAPI_KEY) {
        console.error('❌ Environment variables not set!');
        console.error('Please set OpenAIAPI_KEY and OpenWeatherMapAPI_KEY');
        console.error('');
        console.error('You can create a .env file with:');
        console.error('OpenAIAPI_KEY=your_openai_key_here');
        console.error('OpenWeatherMapAPI_KEY=your_weather_key_here');
        process.exit(1);
    }

    try {
        // Connect to the MCP server
        const connected = await client.connect();
        if (!connected) {
            console.error('❌ Failed to connect to MCP server');
            process.exit(1);
        }

        // Start interactive mode
        await client.startInteractive();

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        await client.disconnect();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n👋 Shutting down...');
    process.exit(0);
});

// Start the client
main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
