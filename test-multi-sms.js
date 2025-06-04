// test-multi-sms.js
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

// Test the multi-number SMS functionality
async function testMultiSMS() {
  console.log('🔍 Testing multi-recipient SMS...\n');
  
  // Check environment
  if (!process.env.PHONE_NUMBERS) {
    console.error('❌ PHONE_NUMBERS environment variable not found!');
    console.log('Make sure you have PHONE_NUMBERS in your .env file');
    return;
  }
  
  // Parse phone numbers
  const phoneNumbers = process.env.PHONE_NUMBERS.split(',').map(num => num.trim());
  console.log(`📱 Found ${phoneNumbers.length} phone numbers:`);
  phoneNumbers.forEach((num, i) => {
    console.log(`  ${i + 1}. ${num}`);
  });
  
  // Initialize Twilio
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  // Test message
  const testMessage = `🧪 Weather app test!\n\nThis is a test of the multi-recipient system.\nTime: ${new Date().toLocaleString('en-US', { timeZone: process.env.TIMEZONE })}`;
  
  try {
    console.log('\n📤 Sending test messages...');
    
    const sendPromises = phoneNumbers.map(async (number, index) => {
      try {
        const message = await twilioClient.messages.create({
          body: testMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: number
        });
        console.log(`✅ Sent to recipient ${index + 1} (${number}): ${message.sid}`);
        return { success: true, number };
      } catch (error) {
        console.error(`❌ Failed to send to ${number}:`, error.message);
        return { success: false, number, error: error.message };
      }
    });
    
    const results = await Promise.all(sendPromises);
    
    // Summary
    console.log('\n📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed numbers:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.number}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultiSMS().then(() => {
  console.log('\n✨ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});