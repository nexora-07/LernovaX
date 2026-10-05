const multer = require("multer");
const path = require("path");
const DataUri = require("datauri/parser");

// const storage = multer.diskStorage({
//     destination: function(req, file, cb){
//         cb(null, "uploads/");
//     },

//     filename: (req, file, cb)=>{
//         cb(null, file.filename + "-" + Date.now() + path.extname(file.originalname).toLowerCase());
//     },

// });

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, //5mb
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supoorts the following filetypes" + fileTypes);
  },
}).fields([
  { name: "profile_image", maxCount: 1 },
  { name: "product_image", maxCount: 3 },
]);

const imageUploads = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err);

    const profileImage = req.files?.profile_image?.[0];
    const productImage = req.files?.product_image?.[0];
    req.file = profileImage || productImage;

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

module.exports = { dataUri, imageUploads };
