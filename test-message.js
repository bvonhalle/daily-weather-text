// test-message.js
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send test message to all recipients
const sendTestMessage = async () => {
  try {
    const phoneNumbers = process.env.PHONE_NUMBERS.split(',').map(num => num.trim());
    
    console.log(`Sending test messages to ${phoneNumbers.length} recipients...`);
    
    const sendPromises = phoneNumbers.map(number => 
      twilioClient.messages.create({
        body: '🌤️ Hello, this is a test of your Daily Weather Text (DWT). If you see this, DWT is working!',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number
      }).then(message => {
        console.log(`✓ Test message sent to ${number}! SID: ${message.sid}`);
        return message;
      }).catch(error => {
        console.error(`✗ Failed to send to ${number}:`, error.message);
        return null;
      })
    );
    
    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r !== null).length;
    
    console.log(`\nTest complete: ${successful}/${phoneNumbers.length} messages sent successfully!`);
    process.exit(successful === phoneNumbers.length ? 0 : 1);
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
};

sendTestMessage();