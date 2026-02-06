const axios = require('axios');
const db = require('../config/database');

const conversationState = new Map();

const sendWhatsAppMessage = async (to, message) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
  }
};

const sendInteractiveMessage = async (to, bodyText) => {
  const message = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'yes', title: 'Yes' } },
          { type: 'reply', reply: { id: 'no', title: 'No' } }
        ]
      }
    }
  };
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

const webhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const webhookPost = async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const messageType = message.type;
    let userInput = '';

    if (messageType === 'text') {
      userInput = message.text.body.trim();
    } else if (messageType === 'interactive') {
      userInput = message.interactive.button_reply.id;
    }

    const state = conversationState.get(from) || { step: 'initial' };

    if (state.step === 'initial') {
      await sendInteractiveMessage(from, 'Are you willing to use our service?');
      conversationState.set(from, { step: 'awaiting_consent' });
    } else if (state.step === 'awaiting_consent') {
      if (userInput === 'yes') {
        await sendTextMessage(from, 'Please enter your Date of Birth (YYYY-MM-DD):');
        conversationState.set(from, { step: 'awaiting_dob', name: change.value.contacts?.[0]?.profile?.name || '' });
      } else {
        await sendTextMessage(from, 'Thank you for your time!');
        conversationState.delete(from);
      }
    } else if (state.step === 'awaiting_dob') {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dobRegex.test(userInput)) {
        state.dob = userInput;
        state.step = 'awaiting_doa';
        conversationState.set(from, state);
        await sendTextMessage(from, 'Please enter your Date of Anniversary (YYYY-MM-DD):');
      } else {
        await sendTextMessage(from, 'Invalid format. Please enter Date of Birth in YYYY-MM-DD format:');
      }
    } else if (state.step === 'awaiting_doa') {
      const doaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (doaRegex.test(userInput)) {
        state.doa = userInput;
        
        const [result] = await db.execute(
          'INSERT INTO customers (Name, MobileNo, DOB, DOA) VALUES (?, ?, ?, ?)',
          [state.name, from, state.dob, state.doa]
        );

        await sendTextMessage(from, 'Thank you! Your information has been saved successfully. 🎉');
        conversationState.delete(from);
      } else {
        await sendTextMessage(from, 'Invalid format. Please enter Date of Anniversary in YYYY-MM-DD format:');
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

module.exports = { webhookVerify, webhookPost };
