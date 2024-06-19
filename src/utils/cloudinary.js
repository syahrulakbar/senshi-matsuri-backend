var cloudinary = require("cloudinary");

function getPublicIdFromUrl(url) {
  const urlParts = url.split("/");
  const fileName = urlParts[urlParts.length - 1];
  const publicId = fileName.substring(0, fileName.lastIndexOf("."));
  return publicId;
}

function destroyImage(public_id) {
  return new Promise(async (resolve, reject) => {
    await cloudinary.v2.uploader.destroy(getPublicIdFromUrl(public_id), (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = {
  destroyImage,
};
