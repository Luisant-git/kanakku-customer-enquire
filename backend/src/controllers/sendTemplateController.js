const axios = require('axios');
const prisma = require('../config/prisma');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const uploadMediaToWhatsApp = async (mediaUrl, phoneNumberId, accessToken) => {
  try {
    // Download media from URL
    const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(mediaResponse.data);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: path.basename(mediaUrl),
      contentType: mediaResponse.headers['content-type']
    });
    formData.append('messaging_product', 'whatsapp');
    
    // Upload to WhatsApp
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/media`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    return uploadResponse.data.id;
  } catch (error) {
    console.error('Error uploading media to WhatsApp:', error.response?.data || error.message);
    throw error;
  }
};

const sendConfiguredTemplate = async (req, res) => {
  try {
    const { phoneNumber, name, configId } = req.body;
    
    let config;
    if (configId) {
      config = await prisma.templateConfig.findUnique({ where: { id: configId, isActive: true } });
    } else {
      config = await prisma.templateConfig.findFirst({ where: { isDefault: true, isActive: true } });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Template configuration not found' });
    }
    
    const message = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: config.templateName,
        language: { code: config.templateLanguage }
      }
    };
    
    if (config.headerMedia && config.headerMediaType) {
      const mediaType = config.headerMediaType.toLowerCase();
      
      // Upload media to WhatsApp and get media ID
      let mediaId;
      try {
        mediaId = await uploadMediaToWhatsApp(config.headerMedia, config.phoneNumberId, config.accessToken);
        console.log('Media uploaded to WhatsApp, ID:', mediaId);
      } catch (uploadError) {
        console.error('Failed to upload media, sending without header');
      }
      
      if (mediaId) {
        message.template.components = [
          {
            type: 'header',
            parameters: [
              {
                type: mediaType,
                [mediaType]: {
                  id: mediaId
                }
              }
            ]
          }
        ];
      }
    } else if (!config.headerMedia) {
      console.log('Sending template without header media');
    }
    
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Template sent to ${phoneNumber} (${name}) using config: ${config.configName}`);
    
    res.json({ 
      message: 'Template sent successfully', 
      data: response.data,
      config: config.configName 
    });
  } catch (error) {
    console.error('Error sending template:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

const getAvailableConfigs = async (req, res) => {
  try {
    const configs = await prisma.templateConfig.findMany({
      where: { isActive: true },
      select: { id: true, configName: true, templateName: true, isDefault: true }
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendConfiguredTemplate, getAvailableConfigs };
