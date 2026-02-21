const express = require('express');
const { createConfig, getAllConfigs, getConfigById, updateConfig, deleteConfig } = require('../controllers/templateController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/template-config', authMiddleware, createConfig);
router.get('/template-config', authMiddleware, getAllConfigs);
router.get('/template-config/:id', authMiddleware, getConfigById);
router.put('/template-config/:id', authMiddleware, updateConfig);
router.delete('/template-config/:id', authMiddleware, deleteConfig);

module.exports = router;
