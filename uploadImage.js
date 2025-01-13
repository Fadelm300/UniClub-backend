const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const opts = {
  overwrite: true,
  resource_type: "auto", // Allow any type of file (images, documents, etc.)
  invalidate: true,
};

module.exports = (file) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file, opts, (error, result) => {
      if (result && result.secure_url) {
        return resolve(result.secure_url);
      }
      return reject({ message: error.message });
    });
  });
};