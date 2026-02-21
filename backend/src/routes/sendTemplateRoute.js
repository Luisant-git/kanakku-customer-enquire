const express = require('express');
const { sendConfiguredTemplate, getAvailableConfigs } = require('../controllers/sendTemplateController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/send-configured-template', authMiddleware, sendConfiguredTemplate);
router.get('/available-configs', authMiddleware, getAvailableConfigs);

module.exports = router;
