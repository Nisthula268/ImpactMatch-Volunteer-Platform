const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Ensure upload directories exist ───────────────────────────────────────────
const UPLOAD_BASE    = path.join(__dirname, '../../uploads');
const AVATAR_DIR     = path.join(UPLOAD_BASE, 'avatars');
const CERT_DIR       = path.join(UPLOAD_BASE, 'certificates');

[UPLOAD_BASE, AVATAR_DIR, CERT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Storage: profile pictures ─────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    // userId_timestamp.ext — deterministic so re-upload replaces old file
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

// ── File filter: images only ──────────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
};

// ── Multer instances ──────────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}).single('profilePicture');

// ── Promisified wrapper so controllers can use async/await ────────────────────
const handleAvatarUpload = (req, res) =>
  new Promise((resolve, reject) => {
    uploadAvatar(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(Object.assign(new Error('File too large — maximum 5 MB'), { status: 400 }));
        }
        return reject(Object.assign(new Error(err.message), { status: 400 }));
      }
      if (err) return reject(Object.assign(new Error(err.message), { status: 400 }));
      resolve();
    });
  });

module.exports = { handleAvatarUpload, AVATAR_DIR, CERT_DIR };
