const prisma = require('../config/prisma');

const createConfig = async (req, res) => {
  try {
    const { configName, templateName, templateLanguage, phoneNumberId, accessToken, verifyToken, headerMedia, headerMediaType, isDefault } = req.body;
    
    if (isDefault) {
      await prisma.templateConfig.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    
    const config = await prisma.templateConfig.create({
      data: { configName, templateName, templateLanguage, phoneNumberId, accessToken, verifyToken, headerMedia, headerMediaType, isDefault }
    });
    
    res.status(201).json({ message: 'Configuration created successfully', config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllConfigs = async (req, res) => {
  try {
    const configs = await prisma.templateConfig.findMany({ where: { isActive: true } });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConfigById = async (req, res) => {
  try {
    const config = await prisma.templateConfig.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!config) return res.status(404).json({ error: 'Configuration not found' });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { configName, templateName, templateLanguage, phoneNumberId, accessToken, verifyToken, headerMedia, headerMediaType, isDefault } = req.body;
    
    if (isDefault) {
      await prisma.templateConfig.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    
    const config = await prisma.templateConfig.update({
      where: { id: parseInt(req.params.id) },
      data: { configName, templateName, templateLanguage, phoneNumberId, accessToken, verifyToken, headerMedia, headerMediaType, isDefault }
    });
    
    res.json({ message: 'Configuration updated successfully', config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteConfig = async (req, res) => {
  try {
    await prisma.templateConfig.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createConfig, getAllConfigs, getConfigById, updateConfig, deleteConfig };
