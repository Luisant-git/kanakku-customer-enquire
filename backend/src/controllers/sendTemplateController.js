const axios = require('axios');
const prisma = require('../config/prisma');

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
      message.template.components = [
        {
          type: 'header',
          parameters: [
            {
              type: mediaType,
              [mediaType]: {
                link: config.headerMedia
              }
            }
          ]
        }
      ];
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
