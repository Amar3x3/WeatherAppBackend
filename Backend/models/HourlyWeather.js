// models/HourlyWeather.js
const mongoose = require('mongoose');

const HourlyWeatherSchema = new mongoose.Schema({
    city: String,
    coordinates: {
        lon: Number,
        lat: Number,
    },
    weather: {
        main: String,
        description: String,
        icon: String,
    },
    temperature: {
        current: Number,
        feels_like: Number,
        temp_min: Number,
        temp_max: Number,
    },
    pressure: Number,
    humidity: Number,
    visibility: Number,
    wind: {
        speed: Number,
        deg: Number,
        gust: Number,
    },
    rain: {
        "1h": Number,
    },
    clouds: {
        all: Number,
    },
    dt: Date,
    timezone: Number,
}, { timestamps: true });

module.exports = mongoose.model('HourlyWeather', HourlyWeatherSchema);
