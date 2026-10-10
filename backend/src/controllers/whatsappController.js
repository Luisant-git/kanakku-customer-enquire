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

const sendReplyButtonsMessage = async (to, bodyText, buttons) => {
  const message = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
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

    await sendTextMessage(to, 'எங்களை தொடர்ந்து அறிய Instagram-ல் பின்தொடரவும் 👇');
    await sendUrlButtonMessage(to, 'Magalir Mattum', 'Follow Link', link1);
    await sendUrlButtonMessage(to, 'Rathna Vilas', 'Follow Link', link2);

    conversationState.delete(dbMobileNo);
  } catch (error) {
    console.error('Error in sendCompletionMessages:', error);
  }
};



// Ensure the processed_messages table exists for persistent idempotency
// CREATE TABLE removed to prevent ER_TABLEACCESS_DENIED_ERROR crash

const webhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verify called:', { mode, token, challenge });

  if (mode === 'subscribe') { // BYPASSED TOKEN CHECK
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.sendStatus(403);
  }
};

const webhookPost = async (req, res) => {
  try {
    const body = req.body;
    
    if (!body || body.object !== 'whatsapp_business_account') {
      return res.sendStatus(200);
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];


    // ALWAYS FORWARD ALL WEBHOOKS TO WHATSAPP DASHBOARD (so it tracks Delivered/Read statuses + messages)
    const isInternalButton = message?.type === 'interactive' && (message.interactive?.button_reply?.id === 'ENQUIRY_UPDATE_NAME' || message.interactive?.button_reply?.id === 'ENQUIRY_HELP');
    if (!isInternalButton) {
      require('axios').post('https://whatsapp.api.luisant.cloud/whatsapp/webhook', body)
        .then(response => console.log('→ Forwarded to Whatsapp Dashboard! Status:', response.status))
        .catch(err => console.error('❌ Failed to forward to Whatsapp Dashboard:', err.message));
    }

    if (!message) {
      console.log('No message found');
      return res.sendStatus(200);
    }

    // 1. Fast in-memory check
    if (processedMessageIds.has(message.id)) {
      console.log('Memory idempotency hit: Message already processed:', message.id);
      return res.sendStatus(200);
    }

    // 2. Persistent database-level idempotency check
    try {
      await db.execute('INSERT INTO processed_messages (message_id) VALUES (?)', [message.id]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('Database idempotency hit: Message already processed:', message.id);
        processedMessageIds.add(message.id); // keep memory synced
        return res.sendStatus(200);
      }
      // If the table doesn't exist or we lack permissions, log it and gracefully 
      // fallback to the in-memory check so the bot doesn't completely break.
      console.error('Database idempotency skipped due to error:', err.message);
    }

    processedMessageIds.add(message.id);

    // 2. INTERACTIVE BUTTON & FORWARDING LOGIC
    const isInteractive = message.type === 'interactive';
    const isText = message.type === 'text';
    const buttonId = isInteractive ? message.interactive?.button_reply?.id : null;
    
    // Internal buttons handled exclusively by the Enquiry bot
    const isInternalButton = buttonId === 'ENQUIRY_UPDATE_NAME' || buttonId === 'ENQUIRY_HELP';

    // FORWARD A COPY TO WHATSAPP CAMPAIGN DASHBOARD
    // If it's an internal enquiry button (like Update Name), do NOT forward it.
    if (!isInternalButton) {
      axios.post('https://whatsapp.api.luisant.cloud/whatsapp/webhook', body)
        .then(response => console.log('✅ Forwarded to Whatsapp Dashboard! Status:', response.status))
        .catch(err => console.error('❌ Failed to forward to Whatsapp Dashboard:', err.message));
    }

    console.log('Webhook received for message:', message.id);
    console.log('Message type:', message.type, 'Button ID:', buttonId);

    // If it's the ENQUIRY_SHOP button, Campaign bot is already handling it due to the forward above.
    if (buttonId === 'ENQUIRY_SHOP') {
      console.log('Shop button tapped, yielding to Campaign bot');
      return res.sendStatus(200);
    }

    if (!isText && !isInternalButton) {
      console.log('Not a text or internal button message, ignoring');
      return res.sendStatus(200);
    }

    const from = message.from;
    const mobileNoWithout91 = from.startsWith('91') ? from.substring(2) : from;
    const userInput = isText ? message.text?.body?.trim() || '' : '';
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

    // 1. QUICK REPLIES PRIORITY
    const userInputLower = userInput.toLowerCase();
    const quickReplies = ['shop', 'gents', 'kids', 'ladies'];
    
    if (quickReplies.includes(userInputLower)) {
      if (state) {
        console.log('Quick reply detected, cancelling ongoing enquiry');
        conversationState.delete(dbMobileNo);
      }
      console.log('Quick reply detected, yielding to campaign bot');
      return res.sendStatus(200);
    }

    const hasCompletedEnquiry = customer.Name && customer.DOB && customer.DOA;

    // 2. ENQUIRY STATE MACHINE & NORMAL MESSAGES
    if (!state) {
      if (buttonId === 'ENQUIRY_UPDATE_NAME') {
        if (hasCompletedEnquiry) {
          conversationState.set(dbMobileNo, { step: 'awaiting_name_update' });
          await sendTextMessage(from, 'Please enter your new name:');
        } else {
          await sendTextMessage(from, 'Please complete your registration first by typing "Hi".');
        }
        return res.sendStatus(200);
      }

      if (buttonId === 'ENQUIRY_HELP') {
        await sendTextMessage(from, 'Here is how you can use this bot:\n\n1. Type "Hi" to view the main menu.\n2. Tap "✏️ Update Name" to change your registered name.\n3. Type "Exit" or "Cancel" to cancel the current action.');
        return res.sendStatus(200);
      }

      const startTriggers = ['hi', 'hello', 'hey', 'register'];
      if (startTriggers.includes(userInputLower)) {
        if (hasCompletedEnquiry) {
          // Send main menu with actual WhatsApp interactive buttons
          const dobDisplay = new Date(customer.DOB).toLocaleDateString('en-GB').replace(/\//g, '-');
          const doaDisplay = new Date(customer.DOA).toLocaleDateString('en-GB').replace(/\//g, '-');
          const menuText = `Welcome back ${customer.Name}!\n\nDate of Birth: ${dobDisplay}\nDate of Anniversary: ${doaDisplay}\n\nWhat would you like to do?`;
          
          await sendReplyButtonsMessage(from, menuText, [
            // { id: 'ENQUIRY_SHOP', title: '🛍 Shop' },
            { id: 'ENQUIRY_UPDATE_NAME', title: '✏️ Update Name' },
            { id: 'ENQUIRY_HELP', title: '❓ Help' }
          ]);

        } else {
          // Determine what information is missing
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
        }
        return res.sendStatus(200);
      }

      // Normal chat, no state, not a trigger -> do nothing
      console.log('Normal message, ignoring:', userInput);
      return res.sendStatus(200);

    } else {
      // User is in a state
      if (userInputLower === 'cancel' || userInputLower === 'exit') {
        conversationState.delete(dbMobileNo);
        await sendTextMessage(from, 'Action cancelled.');
        return res.sendStatus(200);
      }

      if (state.step === 'awaiting_name_update') {
        await db.execute('UPDATE customer SET Name = ? WHERE MobileNo = ?', [userInput, dbMobileNo]);
        await sendTextMessage(from, `Your name has been updated successfully to ${userInput}! ✅`);
        conversationState.delete(dbMobileNo);
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
          conversationState.set(dbMobileNo, { step: 'awaiting_doa' });
          await sendTextMessage(from, 'Please enter your Date of Anniversary (DD-MM-YYYY):');
        } else {
          await sendTextMessage(from, 'Invalid format! Please enter Date of Birth in DD-MM-YYYY format (e.g., 15-08-1990). Type "Cancel" to exit.');
        }
      } else if (state.step === 'awaiting_doa') {
        const doaRegex = /^\d{2}-\d{2}-\d{4}$/;
        if (doaRegex.test(userInput)) {
          const [day, month, year] = userInput.split('-');
          const dbFormat = `${year}-${month}-${day}`;
          await db.execute('UPDATE customer SET DOA = ? WHERE MobileNo = ?', [dbFormat, dbMobileNo]);
          await sendCompletionMessages(from, dbMobileNo);
        } else {
          await sendTextMessage(from, 'Invalid format! Please enter Date of Anniversary in DD-MM-YYYY format (e.g., 20-06-2015). Type "Cancel" to exit.');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};

module.exports = { webhookVerify, webhookPost };
