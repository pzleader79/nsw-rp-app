// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const API_KEY = 'pzzRuPEceC-vTeOToDclQMbhtDIaSQuNVSULdgzMnfANGAzmLua';

class ERLCServerManager {
    constructor(serverKey) {
        this.baseUrl = 'https://api.policeroleplay.community/v1';
        this.headers = { 'Server-Key': serverKey };
    }

    async getServerStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/server`, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error fetching server status:', error.response?.data || error.message);
            return null;
        }
    }

    async getPlayers() {
        try {
            const response = await axios.get(`${this.baseUrl}/server/players`, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error fetching players:', error.response?.data || error.message);
            return [];
        }
    }

    async getVehicles() {
        try {
            const response = await axios.get(`${this.baseUrl}/server/vehicles`, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error fetching vehicles:', error.response?.data || error.message);
            return [];
        }
    }

    async getPlayersWithVehicles() {
        try {
            const [players, vehicles] = await Promise.all([
                this.getPlayers(),
                this.getVehicles()
            ]);

            // Map vehicles to their owners
            const vehiclesByOwner = vehicles.reduce((acc, vehicle) => {
                acc[vehicle.Owner] = vehicle;
                return acc;
            }, {});

            // Combine player data with their vehicle info
            return players.map(player => {
                const playerName = player.Player.split(':')[0];
                const vehicle = vehiclesByOwner[playerName];
                return {
                    ...player,
                    vehicle: vehicle ? {
                        name: vehicle.Name,
                        texture: vehicle.Texture
                    } : null
                };
            });
        } catch (error) {
            console.error('Error fetching combined data:', error);
            return [];
        }
    }

    async getJoinLogs() {
        try {
            const response = await axios.get(`${this.baseUrl}/server/joinlogs`, { headers: this.headers });
            return response.data;
        } catch (error) {
            console.error('Error fetching join logs:', error.response?.data || error.message);
            return [];
        }
    }

    async sendCommand(command) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/server/command`, 
                { command }, 
                { headers: this.headers }
            );
            return response.status === 200;
        } catch (error) {
            console.error('Error sending command:', error.response?.data || error.message);
            return false;
        }
    }
}

const manager = new ERLCServerManager(API_KEY);

app.get('/api/status', async (req, res) => {
    const status = await manager.getServerStatus();
    res.json(status);
});

app.get('/api/players', async (req, res) => {
    const players = await manager.getPlayersWithVehicles();
    res.json(players);
});

app.get('/api/joinlogs', async (req, res) => {
    const logs = await manager.getJoinLogs();
    res.json(logs);
});

app.post('/api/command', async (req, res) => {
    const { command } = req.body;
    const success = await manager.sendCommand(command);
    res.json({ success });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the dashboard at http://localhost:${PORT}`);
});