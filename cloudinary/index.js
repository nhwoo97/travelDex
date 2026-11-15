const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const storage = {
  _handleFile(req, file, callback) {
    const upload = cloudinary.uploader.upload_stream({
      folder: "TravelDex",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    }, (error, result) => {
      if (error) return callback(error);
      callback(null, { path: result.secure_url, filename: result.public_id, size: result.bytes, width: result.width, height: result.height, format: result.format });
    });
    file.stream.pipe(upload);
  },
  _removeFile(req, file, callback) {
    cloudinary.uploader.destroy(file.filename, { resource_type: "image" }).then(() => callback(null)).catch(callback);
  },
};
module.exports = { cloudinary, storage };
