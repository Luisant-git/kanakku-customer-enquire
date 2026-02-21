const express = require('express');
const upload = require('../config/multer');
const { uploadFile } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

module.exports = router;
