const express = require('express');
const { sendConfiguredTemplate, getAvailableConfigs, bulkUploadCustomers, getCustomers } = require('../controllers/sendTemplateController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

router.post('/send-configured-template', authMiddleware, sendConfiguredTemplate);
router.post('/bulk-upload-customers', authMiddleware, upload.single('file'), bulkUploadCustomers);
router.get('/available-configs', authMiddleware, getAvailableConfigs);
router.get('/campaign-customers', authMiddleware, getCustomers);

module.exports = router;
