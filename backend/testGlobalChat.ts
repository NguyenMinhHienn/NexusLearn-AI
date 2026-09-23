import dotenv from 'dotenv';
dotenv.config();
import { geminiGlobalChat } from './src/services/geminiAiService';

async function test() {
  try {
    console.log('Testing geminiGlobalChat...');
    const response = await geminiGlobalChat('hi', []);
    console.log('Success:', response);
  } catch (error: any) {
    console.error('Error testing geminiGlobalChat:');
    console.error(error?.message || error);
    if (error?.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

test();
