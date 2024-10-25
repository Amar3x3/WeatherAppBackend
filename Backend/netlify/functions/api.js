
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const HourlyWeather = require('../../models/HourlyWeather');
const DailyWeatherSummary = require('../../models/DailyWeatherSummary');
import ServerlessHttp from 'serverless-http';
import { Router } from 'express';
const router = Router();

const app = express();
const port = 3000;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('MongoDB connection error:', error));

const cities = [
    { name: 'Delhi' },
    { name: 'Mumbai' },
    {name: 'Chennai'},
    {name:'Bangalore'},
    {name:'Kolkata'},
    {name:'Hyderabad'}
];

const fetchWeatherData = async () => {
    for (const city of cities) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${process.env.API_KEY}`);
            const data = response.data;
            console.log(data);

            const tempCelsius = data.main.temp - 273.15;
            const feelsLikeCelsius = data.main.feels_like - 273.15;

            const hourlyRecord = new HourlyWeather({
                city: data.name,
                coordinates: { lon: data.coord.lon, lat: data.coord.lat },
                weather: {
                    main: data.weather[0].main,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                },
                temperature: {
                    current: parseFloat(tempCelsius.toFixed(2)),
                    feels_like: parseFloat(feelsLikeCelsius.toFixed(2)),
                    temp_min: parseFloat((data.main.temp_min - 273.15).toFixed(2)),
                    temp_max: parseFloat((data.main.temp_max - 273.15).toFixed(2)),
                },
                pressure: data.main.pressure,
                humidity: data.main.humidity,
                visibility: data.visibility,
                wind: {
                    speed: data.wind.speed,
                    deg: data.wind.deg,
                    gust: data.wind.gust,
                },
                rain: { "1h": data.rain ? data.rain["1h"] : 0 },
                clouds: { all: data.clouds.all },
                dt: new Date(data.dt * 1000),
                timezone: data.timezone,
            });

            await hourlyRecord.save();
            console.log(`Weather data for ${city.name} saved.`);

        } catch (error) {
            console.error(`Error fetching weather data for ${city.name}:`, error.message);
        }
    }
};

// Run the fetch function every hour
setInterval(fetchWeatherData, 3600000); // 1 hour in milliseconds

const computeDailySummary = async () => {
    for (const city of cities) {
        const today = new Date().setHours(0, 0, 0, 0);
        const hourlyData = await HourlyWeather.find({ city: city.name, dt: { $gte: today } });

        const temperatures = hourlyData.map(record => record.temperature.current);
        const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
        const maxTemp = Math.max(...temperatures);
        const minTemp = Math.min(...temperatures);

        const weatherConditions = hourlyData.map(record => record.weather.main);
        const dominantWeather = weatherConditions.sort((a, b) =>
            weatherConditions.filter(v => v === a).length - weatherConditions.filter(v => v === b).length
        ).pop();

        const dailySummary = new DailyWeatherSummary({
            city: city.name,
            date: today,
            temperature: {
                average: avgTemp,
                max: maxTemp,
                min: minTemp,
            },
            dominantWeather,
            humidity: hourlyData.reduce((a, b) => a + b.humidity, 0) / hourlyData.length,
        });

        await dailySummary.save();
        console.log(`Daily summary for ${city.name} saved.`);
    }
};

// Run the daily summary function at midnight
setInterval(computeDailySummary, 24 * 60 * 60 * 1000); // 24 hours

// Define API Endpoints
router.get('/hello', async (req, res)=>{
    return res.json({
        "msg":"hello"
    })
})
router.get('/current-weather', async (req, res) => {
    const { city } = req.query;
    const latestWeather = await HourlyWeather.findOne({ city }).sort({ dt: -1 });
    res.json(latestWeather);
});

router.get('/weather-history', async (req, res) => {
    const { city, date } = req.query;
    const dateObj = new Date(date);
    const hourlyData = await HourlyWeather.find({
        city,
        dt: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000) }
    });
    const dailySummary = await DailyWeatherSummary.findOne({ city, date: dateObj });
    res.json({ hourlyData, dailySummary });
});




// app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
app.use('/api/',router);

export const handler = ServerlessHttp(app);
