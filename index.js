import cron from 'node-cron';
import twilio from 'twilio';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Weather emoji mapping
const getWeatherEmoji = (condition) => {
  const emojiMap = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️'
  };
  return emojiMap[condition] || '🌈';
};

// Activity suggestions based on weather
const getActivitySuggestion = (temp, condition, windSpeed) => {
  const suggestions = [];
  
  if (condition === 'Clear' || condition === 'Clouds') {
    if (temp >= 60 && temp <= 85 && windSpeed < 15) {
      suggestions.push('⚽ Perfect for soccer!');
      suggestions.push('🚴 Great biking weather!');
      if (temp >= 70) {
        suggestions.push('🏄 Paddleboard/kayak day!');
      }
    } else if (temp >= 50 && temp < 60) {
      suggestions.push('🚴 Crisp biking weather (bring a jacket!)');
      suggestions.push('🚶 Nice for a brisk walk!');
    }
  }
  
  if (condition === 'Rain' || condition === 'Drizzle') {
    suggestions.push('☔ Indoor activities today!');
  }
  
  if (temp >= 75 && condition === 'Clear') {
    suggestions.push('🏖️ Beach weather!');
  }
  
  return suggestions.length > 0 ? suggestions.join(' ') : '🏠 Cozy indoor day!';
};

// Fun daily quotes
const getDailyQuote = () => {
  const quotes = [
    "🌟 'The best time to plant a tree was 20 years ago. The second best time is now.'",
    "💫 'Every morning is a fresh beginning.'",
    "🌈 'After the rain comes the rainbow.'",
    "⭐ 'Adventure awaits those who seek it.'",
    "🌻 'Bloom where you are planted.'",
    "🎯 'Small steps daily lead to big changes yearly.'",
    "🚀 'Your only limit is your mind.'",
    "🌊 'Go with the flow, but paddle your own canoe.'",
    "🏔️ 'Mountains are climbed one step at a time.'",
    "🌅 'Every sunrise is an invitation to brighten someone's day.'"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// Word of the day
const getWordOfDay = () => {
  const words = [
    { word: 'Petrichor', def: 'the pleasant smell of earth after rain' },
    { word: 'Ephemeral', def: 'lasting for a very short time' },
    { word: 'Serendipity', def: 'finding something good without looking for it' },
    { word: 'Wanderlust', def: 'a strong desire to travel' },
    { word: 'Euphoria', def: 'a feeling of intense happiness' },
    { word: 'Resilient', def: 'able to recover quickly from difficulties' },
    { word: 'Luminous', def: 'bright or shining, especially in the dark' },
    { word: 'Jubilant', def: 'feeling or expressing great happiness' },
    { word: 'Halcyon', def: 'denoting a period of time that was idyllically happy' },
    { word: 'Effervescent', def: 'vivacious and enthusiastic' }
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  return `📚 Word: ${word.word} - ${word.def}`;
};

// Fetch weather data
const getWeatherData = async () => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${process.env.LATITUDE}&lon=${process.env.LONGITUDE}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

// Format weather message
const formatWeatherMessage = (weatherData) => {
  const now = new Date();
  const todayForecasts = weatherData.list.slice(0, 8); // Next 24 hours (3-hour intervals)
  
  // Current weather
  const current = todayForecasts[0];
  const currentTemp = Math.round(current.main.temp);
  const currentCondition = current.weather[0].main;
  const currentEmoji = getWeatherEmoji(currentCondition);
  
  // Get min/max for the day
  const temps = todayForecasts.map(f => f.main.temp);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));
  
  // Check for precipitation
  const rainHours = todayForecasts.filter(f => 
    f.weather[0].main === 'Rain' || f.weather[0].main === 'Drizzle'
  );
  
  // Build message
  let message = `🌞 Good morning! ${process.env.CITY_NAME} Weather Update\n\n`;
  message += `${currentEmoji} Now: ${currentTemp}°F - ${currentCondition}\n`;
  message += `🌡️ Today: ${minTemp}° - ${maxTemp}°F\n\n`;
  
  // Hourly breakdown
  message += `📅 Today's Timeline:\n`;
  for (let i = 0; i < Math.min(todayForecasts.length, 4); i++) {
    const forecast = todayForecasts[i];
    const time = new Date(forecast.dt * 1000);
    const hour = time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true,
      timeZone: process.env.TIMEZONE 
    });
    const temp = Math.round(forecast.main.temp);
    const condition = forecast.weather[0].main;
    const emoji = getWeatherEmoji(condition);
    
    message += `${hour}: ${emoji} ${temp}° ${condition}\n`;
  }
  
  // Rain alert
  if (rainHours.length > 0) {
    message += `\n☔ Rain expected today! Don't forget your umbrella!\n`;
  }
  
  // Activity suggestions
  const windSpeed = current.wind.speed;
  message += `\n${getActivitySuggestion(currentTemp, currentCondition, windSpeed)}\n`;
  
  // Add quote or word of the day (alternate daily)
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  if (dayOfYear % 2 === 0) {
    message += `\n${getDailyQuote()}`;
  } else {
    message += `\n${getWordOfDay()}`;
  }
  
  return message;
};

// Send SMS
const sendSMS = async (message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.YOUR_PHONE_NUMBER
    });
    console.log('Weather SMS sent successfully!');
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Main function to fetch weather and send SMS
const sendDailyWeather = async () => {
  try {
    console.log('Fetching weather data...');
    const weatherData = await getWeatherData();
    
    console.log('Formatting message...');
    const message = formatWeatherMessage(weatherData);
    
    console.log('Sending SMS...');
    await sendSMS(message);
    
    console.log('Daily weather SMS sent at', new Date().toLocaleString());
  } catch (error) {
    console.error('Error in daily weather job:', error);
  }
};

// Schedule the job for 8:00 AM every day
cron.schedule('0 8 * * *', () => {
  console.log('Running daily weather job...');
  sendDailyWeather();
}, {
  timezone: process.env.TIMEZONE
});

// Send initial message on startup (for testing)
console.log('Weather SMS app started! 🌤️');
console.log('Scheduled to run daily at 8:00 AM', process.env.TIMEZONE);

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down weather app...');
  process.exit();
});
