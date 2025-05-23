import dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';

// Import the main function
import('./index.js').then(module => {
  // Manually trigger the weather SMS for testing
  console.log('Sending test weather SMS...');
  
  // We'll need to export sendDailyWeather from index.js
  // For now, let's create a simple test
  
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  twilioClient.messages.create({
    body: '🌤️ Weather app test message! If you see this, Twilio is working correctly!',
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.YOUR_PHONE_NUMBER
  })
  .then(message => {
    console.log('Test message sent! SID:', message.sid);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error sending test message:', error);
    process.exit(1);
  });
});