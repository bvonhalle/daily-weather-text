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

// Enhanced daily quotes with authors
const getDailyQuote = () => {
  const quotes = [
    // Historic
    { quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", emoji: "🦅" },
    { quote: "I have a dream.", author: "Martin Luther King Jr.", emoji: "✊" },
    { quote: "Be the change you wish to see in the world.", author: "Mahatma Gandhi", emoji: "🌍" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", emoji: "🌳" },
    { quote: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr.", emoji: "🤝" },
    { quote: "Give me liberty, or give me death!", author: "Patrick Henry", emoji: "⚡" },
    { quote: "That's one small step for man, one giant leap for mankind.", author: "Neil Armstrong", emoji: "🚀" },
    
    // Motivational
    { quote: "Your only limit is your mind.", author: "Unknown", emoji: "🧠" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", emoji: "💪" },
    { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", emoji: "🎯" },
    { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", emoji: "⭐" },
    { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", emoji: "💡" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "🌟" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", emoji: "✨" },
    { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", emoji: "🔥" },
    
    // Movie/TV
    { quote: "May the Force be with you.", author: "Star Wars", emoji: "⚔️" },
    { quote: "I'll be back.", author: "The Terminator", emoji: "🤖" },
    { quote: "Life is like a box of chocolates. You never know what you're gonna get.", author: "Forrest Gump", emoji: "🍫" },
    { quote: "Nobody puts Baby in a corner.", author: "Dirty Dancing", emoji: "💃" },
    { quote: "Winter is coming.", author: "Game of Thrones", emoji: "❄️" },
    { quote: "I am inevitable.", author: "Thanos, Avengers", emoji: "💎" },
    { quote: "That's what she said.", author: "The Office", emoji: "😏" },
    { quote: "Clear eyes, full hearts, can't lose.", author: "Friday Night Lights", emoji: "🏈" },
    { quote: "How you doin'?", author: "Joey, Friends", emoji: "😎" },
    { quote: "I'm gonna make him an offer he can't refuse.", author: "The Godfather", emoji: "🎭" },
    { quote: "Suit up!", author: "Barney, How I Met Your Mother", emoji: "👔" },
    { quote: "We were on a break!", author: "Ross, Friends", emoji: "💔" },
    
    // Comedy/Conan
    { quote: "I'm ridiculous, and I know it, and I use it.", author: "Conan O'Brien", emoji: "🤡" },
    { quote: "Work hard, be kind, and amazing things will happen.", author: "Conan O'Brien", emoji: "🎪" },
    { quote: "If you work really hard, and you're kind, amazing things will happen.", author: "Conan O'Brien", emoji: "🌈" },
    { quote: "Nobody in life gets exactly what they thought they were going to get. But if you work really hard and you're kind, amazing things will happen.", author: "Conan O'Brien", emoji: "🎭" },
    { quote: "It's not easy to juggle a pregnant wife and a troubled child, but somehow I managed to fit in eight hours of TV a day.", author: "Homer Simpson", emoji: "📺" },
    { quote: "I told my wife the truth. I told her I was seeing a psychiatrist. Then she told me the truth: that she was seeing a psychiatrist, two plumbers, and a bartender.", author: "Rodney Dangerfield", emoji: "🍸" },
    { quote: "I haven't slept for ten days, because that would be too long.", author: "Mitch Hedberg", emoji: "😴" },
    { quote: "My fake plants died because I did not pretend to water them.", author: "Mitch Hedberg", emoji: "🪴" },
    { quote: "I'm against picketing, but I don't know how to show it.", author: "Mitch Hedberg", emoji: "🪧" },
    { quote: "The depressing thing about tennis is that no matter how good I get, I'll never be as good as a wall.", author: "Mitch Hedberg", emoji: "🎾" },
    
    // Wisdom
    { quote: "The unexamined life is not worth living.", author: "Socrates", emoji: "🤔" },
    { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", emoji: "✨" },
    { quote: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein", emoji: "🌌" },
    { quote: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero", emoji: "📚" },
    { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", emoji: "🏒" },
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", emoji: "💻" },
    { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon", emoji: "🎵" }
  ];
  
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const quoteIndex = dayOfYear % quotes.length;
  
  const selectedQuote = quotes[quoteIndex];
  return `${selectedQuote.emoji} "${selectedQuote.quote}" — ${selectedQuote.author}`;
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
