const multer = require('multer');
const randomstring = require('randomstring');
// path library already include in Node.js
const path = require('path');

// validate image type
function checkFileType(file, cb) {
  // allow file extion
  const allowedType = /jpeg|png|gif|jpg/;

  // match file extion
  const isMatchExt = allowedType.test(
    path.extname(file.originalname).toLowerCase()
  );

  // match mime type
  const isMIMEMatch = allowedType.test(file.mimetype);

  if (isMatchExt && isMIMEMatch) {
    cb(null, true);
  } else {
    cb('Error: file type not supported');
  }
}

// return profile pic upload object function
function getProfilePicUpload() {
  let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/profile_pic');
    },
    filename: function (req, file, cb) {
      let p1 = randomstring.generate(5);
      let p2 = randomstring.generate(5);
      let ext = path.extname(file.originalname).toLowerCase();

      cb(null, p1 + '_' + p2 + ext);
    },
  });

  return multer({
    //   taking storage of let storge
    storage: storage,
    limits: {
      fileSize: 1000000,
    },
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    },
  }).single('profile_pic');
}

module.exports = {
  getProfilePicUpload,
};
