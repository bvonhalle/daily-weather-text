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
    suggestions.push('☔️ Indoor activities today!');
  }
  
  if (temp >= 75 && condition === 'Clear') {
    suggestions.push('🏖️ Beach weather!');
  }
  
  return suggestions.length > 0 ? suggestions.join(' ') : '🏠 Cozy indoor day!';
};

// Enhanced daily quotes with authors
const getDailyQuote = () => {
  const quotes = [
    // Historic
    { quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
    { quote: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { quote: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
    
    // Motivational
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    
    // Movie/TV
    { quote: "May the Force be with you.", author: "Yoda" },
    { quote: "I'll be back.", author: "The Terminator" },
    { quote: "Life is like a box of chocolates. You never know what you're gonna get.", author: "Forrest Gump" },
    
    // Comedy/Conan
    { quote: "Work hard, be kind, and amazing things will happen.", author: "Conan O'Brien" },
    { quote: "The depressing thing about tennis is that no matter how good I get, I'll never be as good as a wall.", author: "Mitch Hedberg" },
    
    // Wisdom
    { quote: "The unexamined life is not worth living.", author: "Socrates" },
    { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },

    // Compliments
    { quote: "You're beautiful. Have a great day, Love you!", author: "Your spouse" },
    { quote: "Take a risk today, failure = growth.", author: "unknown" }
  ];
  
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const quoteIndex = dayOfYear % quotes.length;
  
  const selectedQuote = quotes[quoteIndex];
  return `"${selectedQuote.quote}" — ${selectedQuote.author}`;
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
  let message = `Morning 🌞  \n\nHere's your ${process.env.CITY_NAME} Weather Update\n\n`;
  message += `Now: ${currentTemp}°F - ${currentCondition}\n`;
  message += `Today: ${minTemp}° - ${maxTemp}°F\n\n`;
  
  // Hourly breakdown
  message += `Today:\n`;
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
    
    message += `${hour}: ${temp}° ${condition} ${emoji} \n`;
  }
  
  // Rain alert
  if (rainHours.length > 0) {
    message += `\nRain today ☔️ Don't forget your jacket or umbrella!\n`;
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

// Send SMS (updated for multiple recipients)
const sendSMS = async (message) => {
  try {
    // Check if PHONE_NUMBERS exists
    if (!process.env.PHONE_NUMBERS) {
      throw new Error('PHONE_NUMBERS environment variable not set!');
    }
    
    const phoneNumbers = process.env.PHONE_NUMBERS.split(',').map(num => num.trim());
    
    if (phoneNumbers.length === 0) {
      throw new Error('No phone numbers found in PHONE_NUMBERS!');
    }
    
    console.log(`Sending SMS to ${phoneNumbers.length} recipients...`);
    
    const sendPromises = phoneNumbers.map(number => 
      twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number
      }).catch(error => {
        console.error(`Failed to send to ${number}:`, error.message);
        return null; // Don't fail the entire batch
      })
    );
    
    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r !== null).length;
    
    console.log(`Weather SMS sent to ${successful}/${phoneNumbers.length} recipients!`);
    
    if (successful === 0) {
      throw new Error('Failed to send to any recipients!');
    }
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

// PAUSED: cron job disabled
// cron.schedule('0 8 * * *', () => {
//   console.log('Running daily weather job...');
//   sendDailyWeather();
// }, {
//   timezone: process.env.TIMEZONE
// });

console.log('Weather SMS app started (PAUSED - cron job disabled)');
// console.log('Scheduled to run daily at 8:00 AM', process.env.TIMEZONE);

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down weather app...');
  process.exit();
});

// Export for testing
export { sendDailyWeather };

// PAUSED: manual trigger disabled
// if (process.env.SEND_NOW === 'true') {
//   console.log('SEND_NOW detected - sending weather immediately...');
//   sendDailyWeather()
//     .then(() => {
//       console.log('Manual weather send complete!');
//     })
//     .catch(error => {
//       console.error('Manual send failed:', error);
//     });
// }
