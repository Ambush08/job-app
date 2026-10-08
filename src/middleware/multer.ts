import fs from 'fs';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const uploadDir = path.join(process.cwd(), "uploads");

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err, '');
      const fileExt = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${raw.toString("hex")}${fileExt}`);
    });
  },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
    }
  }
});

export default upload;