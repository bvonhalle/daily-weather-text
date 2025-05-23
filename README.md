// README.md
# Daily Weather Texter 🌤️

A whimsical Node.js app that sends you a daily weather SMS at 8 AM with activity suggestions and daily inspiration!

## Features

- 📱 Daily SMS at 8 AM with weather forecast
- 🌡️ Hourly breakdown for the day
- 🚴 Activity suggestions based on conditions
- 💬 Daily quotes or word of the day
- 🌧️ Rain alerts
- 🎨 Weather emojis for visual appeal

## Setup Instructions

### 1. Get API Keys

1. **Twilio** (for SMS):
   - Sign up at [twilio.com](https://www.twilio.com)
   - Get your Account SID, Auth Token, and phone number
   - Verify your personal phone number

2. **OpenWeatherMap** (for weather data):
   - Sign up at [openweathermap.org](https://openweathermap.org/api)
   - Get your free API key

### 2. Local Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd daily-weather-texter

# Install dependencies
npm install

# Copy .env.example to .env
cp .env.example .env

# Edit .env with your credentials
```

### 3. Configure Environment Variables

Edit `.env` with:
- Your Twilio credentials
- OpenWeatherMap API key
- Your location (latitude/longitude)
- Your timezone

### 4. Test Locally

```bash
# Test Twilio connection
npm run test-message

# Run the app
npm start
```

### 5. Deploy to Railway

1. Push your code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Add environment variables in Railway dashboard
6. Deploy!

## Customization

- Edit weather emojis in `getWeatherEmoji()`
- Add more quotes in `getDailyQuote()`
- Customize activity suggestions in `getActivitySuggestion()`
- Change schedule time in the cron expression

## Cost Estimates

- **Twilio**: ~$0.0079 per SMS (about $2.40/month for daily texts)
- **OpenWeatherMap**: Free tier (1000 calls/day)
- **Railway**: Free tier includes 500 hours/month

Total: ~$2.40/month

## Troubleshooting

- Check timezone settings if messages arrive at wrong time
- Verify phone numbers include country code (+1 for US)
- Ensure all environment variables are set in Railway

Enjoy your daily weather updates! 🌈