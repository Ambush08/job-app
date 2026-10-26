import fs from "fs";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const uploadDir = '/tmp/uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err, "");
      const fileExt = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${raw.toString("hex")}${fileExt}`);
    });
  },
});

const createUpload = (allowed: string[], errorMessage: string) =>
  multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error(errorMessage));
    },
  });

const upload = createUpload(
  ["image/jpeg", "image/png", "image/webp"],
  "Only JPEG, PNG, or WebP images are allowed",
);

export const uploadDocs = createUpload(
  [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  "Only PDF and Word documents are allowed",
);

export default upload;
