const multer = require("multer");
const path = require("path");
const DataUri = require("datauri/parser");


const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, //10mb
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".pdf",
      ".mp3",
      ".wav",
      ".ogg",
      ".oga",
      ".m4a",
      ".aac",
      ".flac",
      ".mp4",
      ".webm",
      ".mov",
      ".avi",
      ".mkv",
      ".mpeg",
      ".mpg",
      ".m4v",
    ]);
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType =
      /^(image\/(jpeg|png)|application\/pdf|audio\/|video\/)/i.test(
        file.mimetype,
      );
    const extname = allowedExtensions.has(extension);

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "File upload only supports JPG, JPEG, PNG, PDF, audio, and video files",
      ),
    );
  },
}).fields([
  { name: "profile_image", maxCount: 1 },
  { name: "material_file", maxCount: 3 },
]);

const fileUploads = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err);

    const profileImage = req.files?.profile_image?.[0];
    const materialFile = req.files?.material_file?.[0];
    req.file = profileImage || materialFile;

    next();
  });
};

const dUri = new DataUri();

const dataUri = (req) => {
  if (!req?.file) return null;

  return dUri.format(
    path.extname(req.file.originalname).toString(),
    req.file.buffer,
  );
};

module.exports = { dataUri, fileUploads };
