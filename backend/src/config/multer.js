const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|avi|mov|mkv|h264|264|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/') || 
                   file.mimetype.startsWith('video/') || 
                   file.mimetype === 'application/pdf' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.mimetype === 'application/octet-stream';
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, videos, and Excel files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 16 * 1024 * 1024 }
});

module.exports = upload;
