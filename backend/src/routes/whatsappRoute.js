const express = require('express');
const { webhookVerify, webhookPost } = require('../controllers/whatsappController');

const router = express.Router();

router.get('/webhook', webhookVerify);
router.post('/webhook', webhookPost);

module.exports = router;
