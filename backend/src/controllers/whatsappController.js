const axios = require('axios');
const db = require('../config/database');

const conversationState = new Map();
const processedCustomers = new Set();

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

const sendTemplateMessage = async (to, billNo, amount) => {
  const message = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: process.env.TEMPLATE_ID,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: billNo },
            { type: 'text', text: amount }
          ]
        }
      ]
    }
  };
  console.log('Sending template to:', to, 'Message:', JSON.stringify(message));
  await sendWhatsAppMessage(to, message);
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

const checkAndSendTemplate = async () => {
  try {
    const [rows] = await db.execute(
      'SELECT id, Name, MobileNo FROM customer WHERE Name IS NOT NULL AND MobileNo IS NOT NULL AND DOB IS NULL AND DOA IS NULL AND IsActive = ?',
      ['Y']
    );

    for (const customer of rows) {
      const key = `${customer.MobileNo}_${customer.id}`;
      if (!processedCustomers.has(key)) {
        await sendTemplateMessage(customer.MobileNo, '234', '123');
        processedCustomers.add(key);
        conversationState.set(customer.MobileNo, { step: 'template_sent' });
        console.log(`Template sent to ${customer.MobileNo}`);
      }
    }
  } catch (error) {
    console.error('Template check error:', error);
  }
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

    const from = message.from;
    const mobileNoWithout91 = from.startsWith('91') ? from.substring(2) : from;
    const userInput = message.text.body.trim();
    console.log('From:', from, 'Input:', userInput);

    const [rows] = await db.execute(
      'SELECT id, Name, MobileNo, DOB, DOA FROM customer WHERE (MobileNo = ? OR MobileNo = ?) AND IsActive = ?',
      [from, mobileNoWithout91, 'Y']
    );

    console.log('Customer found:', rows.length > 0);
    
    if (rows.length === 0) {
      console.log('No customer found for:', from, 'or', mobileNoWithout91);
      return res.sendStatus(200);
    }

    const customer = rows[0];
    const dbMobileNo = customer.MobileNo;
    const state = conversationState.get(dbMobileNo) || { step: 'template_sent' };
    console.log('Current state:', state.step);

    if (state.step === 'template_sent') {
      conversationState.set(dbMobileNo, { step: 'awaiting_dob' });
      await sendTextMessage(from, 'Please enter your Date of Birth (DD-MM-YYYY):');
    } else if (state.step === 'awaiting_dob') {
      const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (dobRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOB = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
        conversationState.set(dbMobileNo, { step: 'awaiting_doa' });
        await sendTextMessage(from, 'Please enter your Date of Anniversary (DD-MM-YYYY):');
      } else {
        await sendTextMessage(from, 'Invalid format. Please enter Date of Birth in DD-MM-YYYY format:');
      }
    } else if (state.step === 'awaiting_doa') {
      const doaRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (doaRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOA = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
        conversationState.set(dbMobileNo, { step: 'awaiting_name_confirmation' });
        await sendTextMessage(from, `Want to update name? Already you have name "${customer.Name}". Is this valid name or if you want to change type "Yes"`);
      } else {
        await sendTextMessage(from, 'Invalid format. Please enter Date of Anniversary in DD-MM-YYYY format:');
      }
    } else if (state.step === 'awaiting_name_confirmation') {
      if (userInput.toLowerCase() === 'yes') {
        conversationState.set(dbMobileNo, { step: 'awaiting_new_name' });
        await sendTextMessage(from, 'Please enter your name:');
      } else {
        await sendTextMessage(from, 'Thank you! Your information has been saved successfully. 🎉');
        conversationState.delete(dbMobileNo);
      }
    } else if (state.step === 'awaiting_new_name') {
      await db.execute('UPDATE customer SET Name = ? WHERE MobileNo = ?', [userInput, dbMobileNo]);
      await sendTextMessage(from, 'Thank you! Your information has been saved successfully. 🎉');
      conversationState.delete(dbMobileNo);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

setInterval(checkAndSendTemplate, 10000);

module.exports = { webhookVerify, webhookPost };
