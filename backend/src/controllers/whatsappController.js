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


const sendUrlButtonMessage = async (to, bodyText, buttonText, url) => {
  const message = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: bodyText },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: buttonText,
          url: url
        }
      }
    }
  };
  await sendWhatsAppMessage(to, message);
};

const sendCompletionMessages = async (to, dbMobileNo) => {
  try {
    await sendTextMessage(to, 'நன்றி! உங்கள் தகவல் வெற்றிகரமாக சேமிக்கப்பட்டது. 🎉');

    const link1 = 'https://www.instagram.com/magalirmattum.official?igsh=Mzl6cjlvYmRrd2g4';
    const link2 = 'https://www.instagram.com/rathnavilas?igsh=MWMwNGFkdmwxdW9lNg==';

    // await sendTextMessage(to, 'எங்களை தொடர்ந்து அறிய 👇');
    // await sendUrlButtonMessage(to, 'Magalir Mattum:', 'Follow', link1);
    // await sendUrlButtonMessage(to, 'Rathna Vilas:', 'Follow', link2);

    await sendButtonMessage(to, {
      text: 'எங்களை தொடர்ந்து அறிய, Instagram-ல் பின்தொடரவும் 👇',
      buttons: [
        { text: 'Magalir Mattum', url: link1 },
        { text: 'Rathna Vilas', url: link2 }
      ]
    });

    conversationState.delete(dbMobileNo);
  } catch (error) {
    console.error('Error in sendCompletionMessages:', error);
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

    // Check if customer already has all information
    if (!state && customer.Name && customer.DOB && customer.DOA) {
      conversationState.set(dbMobileNo, { step: 'awaiting_name_update_confirmation' });
      await sendTextMessage(from, `Welcome back ${customer.Name}! Want to update name? Already you have name "${customer.Name}". If you want to change type "Yes" otherwise type "No"`);
      return res.sendStatus(200);
    }

    // Determine what information is missing
    if (!state) {
      if (!customer.Name) {
        conversationState.set(dbMobileNo, { step: 'awaiting_name' });
        await sendTextMessage(from, 'Welcome! Please enter your name:');
      } else if (!customer.DOB) {
        conversationState.set(dbMobileNo, { step: 'awaiting_dob' });
        await sendTextMessage(from, 'Please enter your Date of Birth (DD-MM-YYYY):');
      } else if (!customer.DOA) {
        conversationState.set(dbMobileNo, { step: 'awaiting_doa' });
        await sendTextMessage(from, 'Please enter your Date of Anniversary (DD-MM-YYYY):');
      }
    } else if (state.step === 'awaiting_name_update_confirmation') {
      if (userInput.toLowerCase() === 'yes') {
        conversationState.set(dbMobileNo, { step: 'awaiting_name_update' });
        await sendTextMessage(from, 'Please enter your new name:');
      } else {
        conversationState.set(dbMobileNo, { step: 'awaiting_dob_update_confirmation' });
        const dobDisplay = customer.DOB ? new Date(customer.DOB).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Not set';
        await sendTextMessage(from, `Want to update Date of Birth? Already you have DOB "${dobDisplay}". If you want to change type "Yes" otherwise type "No"`);
      }
    } else if (state.step === 'awaiting_name_update') {
      await db.execute('UPDATE customer SET Name = ? WHERE MobileNo = ?', [userInput, dbMobileNo]);
      conversationState.set(dbMobileNo, { step: 'awaiting_dob_update_confirmation' });
      const [updatedRows] = await db.execute('SELECT DOB FROM customer WHERE MobileNo = ?', [dbMobileNo]);
      const dobDisplay = updatedRows[0].DOB ? new Date(updatedRows[0].DOB).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Not set';
      await sendTextMessage(from, `Want to update Date of Birth? Already you have DOB "${dobDisplay}". If you want to change type "Yes" otherwise type "No"`);
    } else if (state.step === 'awaiting_dob_update_confirmation') {
      if (userInput.toLowerCase() === 'yes') {
        conversationState.set(dbMobileNo, { step: 'awaiting_dob_update' });
        await sendTextMessage(from, 'Please enter your new Date of Birth (DD-MM-YYYY):');
      } else {
        conversationState.set(dbMobileNo, { step: 'awaiting_doa_update_confirmation' });
        const doaDisplay = customer.DOA ? new Date(customer.DOA).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Not set';
        await sendTextMessage(from, `Want to update Date of Anniversary? Already you have DOA "${doaDisplay}". If you want to change type "Yes" otherwise type "No"`);
      }
    } else if (state.step === 'awaiting_dob_update') {
      const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (dobRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOB = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
      }
      conversationState.set(dbMobileNo, { step: 'awaiting_doa_update_confirmation' });
      const [updatedRows] = await db.execute('SELECT DOA FROM customer WHERE MobileNo = ?', [dbMobileNo]);
      const doaDisplay = updatedRows[0].DOA ? new Date(updatedRows[0].DOA).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Not set';
      await sendTextMessage(from, `Want to update Date of Anniversary? Already you have DOA "${doaDisplay}". If you want to change type "Yes" otherwise type "No"`);
    } else if (state.step === 'awaiting_doa_update_confirmation') {
      if (userInput.toLowerCase() === 'yes') {
        conversationState.set(dbMobileNo, { step: 'awaiting_doa_update' });
        await sendTextMessage(from, 'Please enter your new Date of Anniversary (DD-MM-YYYY):');
      } else {
        await sendCompletionMessages(from, dbMobileNo);
      }
    } else if (state.step === 'awaiting_doa_update') {
      const doaRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (doaRegex.test(userInput)) {
        const [day, month, year] = userInput.split('-');
        const dbFormat = `${year}-${month}-${day}`;
        await db.execute('UPDATE customer SET DOA = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
      }
      await sendCompletionMessages(from, dbMobileNo);
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
      await sendCompletionMessages(from, dbMobileNo);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

module.exports = { webhookVerify, webhookPost };
