const fs = require('fs');
const path = require('path');

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (configured) {
  // eslint-disable-next-line global-require
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function uploadImage(file) {
  if (configured && cloudinary) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'homeopathy-clinic/reports',
      resource_type: 'image',
    });
    fs.unlink(file.path, () => {});
    return { url: result.secure_url, publicId: result.public_id };
  }

  return { url: `/uploads/${file.filename}`, publicId: null };
}

module.exports = { uploadImage, isCloudinaryConfigured: () => configured };
