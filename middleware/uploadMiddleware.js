const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  const isAllowedMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isAllowedExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!isAllowedMimeType || !isAllowedExtension) {
    return cb(new Error('Only jpg, jpeg, and png images are allowed'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Image size must be 5 MB or less'
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || 'Invalid image upload'
  });
};

module.exports = {
  upload,
  handleUploadError
};
