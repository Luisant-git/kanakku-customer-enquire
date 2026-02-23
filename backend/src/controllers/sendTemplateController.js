const axios = require('axios');
const prisma = require('../config/prisma');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const XLSX = require('xlsx');

ffmpeg.setFfmpegPath(ffmpegPath);

const convertToMp4 = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.(h264|264|mkv|mp4)$/i, '_converted.mp4');
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        '-preset', 'medium',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
};

const uploadMediaToWhatsApp = async (mediaUrl, phoneNumberId, accessToken) => {
  try {
    // Download media from URL
    const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    let buffer = Buffer.from(mediaResponse.data);
    let contentType = mediaResponse.headers['content-type'];
    let filename = path.basename(mediaUrl);
    
    // Convert all videos to H.264 MP4 for WhatsApp compatibility
    if (contentType?.startsWith('video/') || filename.match(/\.(h264|264|mkv|mp4|mov|avi)$/i)) {
      const tempInput = path.join('/tmp', `temp_${Date.now()}_${filename}`);
      fs.writeFileSync(tempInput, buffer);
      
      const convertedPath = await convertToMp4(tempInput);
      buffer = fs.readFileSync(convertedPath);
      contentType = 'video/mp4';
      filename = path.basename(convertedPath);
      
      // Cleanup temp files
      fs.unlinkSync(tempInput);
      fs.unlinkSync(convertedPath);
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', buffer, {
      filename,
      contentType
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

const normalizePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
};

const sendConfiguredTemplate = async (req, res) => {
  try {
    const { customers, configId, campaign } = req.body;
    
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'Customers array is required' });
    }
    
    if (!campaign) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    let config;
    if (configId) {
      config = await prisma.templateConfig.findUnique({ where: { id: parseInt(configId), isActive: true } });
    } else {
      config = await prisma.templateConfig.findFirst({ where: { isDefault: true, isActive: true } });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Template configuration not found' });
    }
    
    const results = [];
    
    for (const customer of customers) {
      let { phoneNumber, name } = customer;
      phoneNumber = normalizePhoneNumber(phoneNumber);
      
      try {
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
          
          try {
            const mediaId = await uploadMediaToWhatsApp(config.headerMedia, config.phoneNumberId, config.accessToken);
            message.template.components = [
              {
                type: 'header',
                parameters: [
                  {
                    type: mediaType,
                    [mediaType]: { id: mediaId }
                  }
                ]
              }
            ];
          } catch (uploadError) {
            console.error('Failed to upload media for', phoneNumber);
          }
        }
        
        await axios.post(
          `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
          message,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        await prisma.customer.create({
          data: {
            name,
            phoneNumber,
            campaign,
            status: 'sent',
            sentAt: new Date()
          }
        });
        
        results.push({ phoneNumber, name, status: 'success' });
        console.log(`Template sent to ${phoneNumber} (${name}) - Campaign: ${campaign}`);
      } catch (error) {
        results.push({ phoneNumber, name, status: 'failed', error: error.message });
        console.error(`Failed to send to ${phoneNumber}:`, error.message);
      }
    }
    
    res.json({ 
      message: 'Templates processed', 
      results,
      config: config.configName,
      campaign 
    });
  } catch (error) {
    console.error('Error sending templates:', error.response?.data || error.message);
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

const bulkUploadCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required' });
    }
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    const customers = data.map(row => {
      const keys = Object.keys(row);
      const nameKey = keys.find(k => k.trim().toLowerCase() === 'name');
      const phoneKey = keys.find(k => k.trim().toLowerCase() === 'phone');
      
      const phoneNumber = normalizePhoneNumber(String(row[phoneKey] || ''));
      const name = String(row[nameKey] || '').trim();
      return { phoneNumber, name };
    }).filter(c => c.phoneNumber && c.name);
    
    fs.unlinkSync(req.file.path);
    
    res.json({ customers, count: customers.length });
  } catch (error) {
    console.error('Error parsing Excel:', error);
    res.status(500).json({ error: 'Failed to parse Excel file' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { campaign: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);
    
    res.json({
      customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendConfiguredTemplate, getAvailableConfigs, bulkUploadCustomers, getCustomers };
