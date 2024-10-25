// models/DailyWeatherSummary.js
const mongoose = require('mongoose');

const DailyWeatherSummarySchema = new mongoose.Schema({
    city: String,
    date: Date,
    temperature: {
        average: Number,
        max: Number,
        min: Number,
    },
    dominantWeather: String,
    humidity: Number,
}, { timestamps: true });

module.exports = mongoose.model('DailyWeatherSummary', DailyWeatherSummarySchema);
