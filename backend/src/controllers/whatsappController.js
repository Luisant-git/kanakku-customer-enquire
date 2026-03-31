const axios = require('axios');
const db = require('../config/database');

const conversationState = new Map();
const processedMessageIds = new Set();

const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('WhatsApp API Response:', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', JSON.stringify(error.response?.data || error.message));
    throw error;
  }
};


const sendTextMessage = async (to, text) => {
  const message = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: text }
  };
  await sendWhatsAppMessage(to, message);
};



const webhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verify called:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.sendStatus(403);
  }
};

const webhookPost = async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body));
    
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      console.log('No message found');
      return res.sendStatus(200);
    }

    console.log('Message type:', message.type);
    
    if (message.type !== 'text') {
      console.log('Not a text message, ignoring');
      return res.sendStatus(200);
    }

    // Check if message already processed
    if (processedMessageIds.has(message.id)) {
      console.log('Message already processed:', message.id);
      return res.sendStatus(200);
    }
    processedMessageIds.add(message.id);

    const from = message.from;
    const mobileNoWithout91 = from.startsWith('91') ? from.substring(2) : from;
    const userInput = message.text.body.trim();
    console.log('From:', from, 'Input:', userInput);

    let [rows] = await db.execute(
      'SELECT id, Name, MobileNo, DOB, DOA FROM customer WHERE (MobileNo = ? OR MobileNo = ?) AND IsActive = ?',
      [from, mobileNoWithout91, 'Y']
    );

    console.log('Customer found:', rows.length > 0);
    
    // If customer not found, create new customer
    if (rows.length === 0) {
      console.log('Creating new customer for:', mobileNoWithout91);
      await db.execute(
        'INSERT INTO customer (MobileNo, IsActive) VALUES (?, ?)',
        [mobileNoWithout91, 'Y']
      );
      // Fetch the newly created customer
      [rows] = await db.execute(
        'SELECT id, Name, MobileNo, DOB, DOA FROM customer WHERE MobileNo = ?',
        [mobileNoWithout91]
      );
    }

    const customer = rows[0];
    const dbMobileNo = customer.MobileNo;
    const state = conversationState.get(dbMobileNo);
    console.log('Current state:', state?.step);

    if (!state) {
      conversationState.set(dbMobileNo, { step: 'awaiting_name' });
      await sendTextMessage(from, 'Welcome! Please enter your name:');
    } else if (state.step === 'awaiting_name') {
      await db.execute('UPDATE customer SET Name = ? WHERE MobileNo = ?', [userInput, dbMobileNo]);
      conversationState.set(dbMobileNo, { step: 'awaiting_dob' });
      await sendTextMessage(from, 'Please enter your Date of Birth (DD-MM-YYYY):');
    } else if (state.step === 'awaiting_dob') {
      const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (dobRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOB = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
      }
      conversationState.set(dbMobileNo, { step: 'awaiting_doa' });
      await sendTextMessage(from, 'Please enter your Date of Anniversary (DD-MM-YYYY):');
    } else if (state.step === 'awaiting_doa') {
      const doaRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (doaRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOA = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
      }
      await sendTextMessage(from, 'நன்றி! உங்கள் தகவல் வெற்றிகரமாக சேமிக்கப்பட்டது. 🎉');
      conversationState.delete(dbMobileNo);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

module.exports = { webhookVerify, webhookPost };
