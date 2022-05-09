// include library

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');

const jwt = require('jsonwebtoken');
const moment = require('moment');

const Users = require('../models/Users');
const verifyToken = require('./../middleware/verify_token');
const token_key = process.env.TOKEN_KEY;
const storage = require('./storage');

//   middleware setup

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

//  default router
//http:localhost:8000/api/users/
// method : GET
router.get('/', (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'user default route',
  });
});

//  user register route
//  Access:public
// http://localhost:8000/api/user/register
//method: POST

router.post(
  '/register',
  [
    //   express validator use
    check('username')
      .not()
      .isEmpty()
      .withMessage('validation.username_empty')
      .trim()
      .escape(),
    check('password')
      .not()
      .isEmpty()
      .withMessage('validation.password_empty')
      .trim()
      .escape(),
    check('password2')
      .not()
      .isEmpty()
      .withMessage('validation.password2_empty')
      .trim()
      .escape(),

    //   checkEmail
    check('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('validation.invalid_email'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    //  check errors is not empty
    if (!errors.isEmpty()) {
      let error = {};
      for (index = 0; index < errors.array().length; index++) {
        error = {
          ...error,
          [errors.array()[index].param]: errors.array()[index].msg,
        };
      }
      return res.status(400).json({
        status: false,
        error: error,
        message: 'form validation error',
      });
    }

    // check password1 = to retype password2

    if (req.body.password != req.body.password2) {
      return res.status(400).json({
        status: false,
        error: { password2: 'validation.password2_not _same ' },
        message: 'form validation error',
      });
    }

    // hashing password start
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    // hashed password end
    // users registerd start already in or not
    //  use model Users only already import from model
    Users.findOne({ email: req.body.email })
      .then((user) => {
        // check user email exist or not
        if (user) {
          return res.status(409).json({
            status: false,
            error: { email: 'validation.exict_email' },
            message: 'user email already exist',
          });
        } else {
          //  use model Users
          //  create user object from Users Model
          const newUser = new Users({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
          });
          //  insert new user
          newUser
            .save()
            .then((result) => {
              return res.status(200).json({
                status: true,
                user: result,
              });
            })
            .catch((error) => {
              return res.status(502).json({
                status: false,
                error: { db_error: 'validation.db_error' },
              });
            });
        }
      })
      .catch((error) => {
        return res.status(502).json({
          status: false,
          error: { db_error: 'validation.db_error' },
        });
      });

    //  users registerd end
    // return res.status(200).json({
    //   status: true,
    //   data: req.body,
    //   hashedPassword: hashedPassword,
    // });
  }
);

//  user profile pic upload  route
//  Access:private
// http://localhost:8000/api/user/uploadprofilepic
//method: POST

router.post('/uploadProfilePic', verifyToken, (req, res) => {
  //  storage and getProfilePicUpload take from storage filder
  let upload = storage.getProfilePicUpload();
  upload(req, res, (error) => {
    //if profile pic not upload
    if (!req.file) {
      return res.status(404).json({
        status: false,
        error: { profile_pic: 'validation.profile_pic_empty' },
        message: 'plz upload profile pic',
      });
    }
    // if profile pic upload error
    if (error) {
      return res.status(400).json({
        status: false,
        error: error,
        message: 'file upload fail',
      });
    }
    //store new profile pic name to user document
    //  use User model
    let temp = {
      profile_pic: req.file.fieldname,
      updatedAt:
        moment().format('DD/MM/YYYY') + ';' + moment().format('hh:mm:ss'),
    };
    Users.findOneAndUpdate({ _id: req.user.id }, { $set: temp })
      .then((user) => {
        return res.status(200).json({
          status: true,
          message: 'file upload success',
          profile_pic: 'http://localhost:8000/profile_pic/' + req.file.filename,
        });
      })
      .catch((error) => {
        return res.status(502).json({
          status: false,
          error: { db_error: 'validation.db_error' },
          message: 'database error',
        });
      });
  });
});

//  user login route
//  Access:public
// http://localhost:8000/api/user/login
//method: POST

router.post(
  '/login',
  [
    // check empty fields
    //use express validator
    check('password')
      .not()
      .isEmpty()
      .withMessage('validation.password_empty')
      .trim()
      .escape(),
    check('email')
      .not()
      .isEmpty()
      .normalizeEmail()
      .withMessage('validation.invalid_email'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    // check errors are not empty
    if (!errors.isEmpty()) {
      let error = {};
      for (index = 0; index < errors.array().length; index++) {
        error = {
          ...error,
          [errors.array()[index].param]: errors.array()[index].msg,
        };
      }
      return res.status(400).json({
        status: false,
        error: error,
        message: 'form validation error',
      });
    }
    // use model Users
    Users.findOne({ email: req.body.email })
      .then((user) => {
        //if user dont exist then run this code
        if (!user) {
          return res.status(404).json({
            status: false,
            error: 'validation.email_not_exist',
            message: 'user dont exist',
          });
        } else {
          // check password match code
          let isPasswordMatch = bcrypt.compareSync(
            req.body.password,
            user.password
          );

          //  check password not match
          if (!isPasswordMatch) {
            return res.status(401).json({
              status: false,
              password: 'validation.password_not_match',
              message: 'password dont match',
            });
          }

          //json web token generate
          const token = jwt.sign(
            {
              id: user._id,
              email: user.email,
            },
            token_key,
            {
              expiresIn: 3600,
            }
          );

          //json web token code end

          //  if login  match
          return res.status(200).json({
            status: true,
            message: 'user login success...',
            token: token,
            user: user,
          });
        }
      })
      .catch((error) => {
        return res.status(502).json({
          status: false,
          db_error: validation.db_error,
          message: 'database error',
        });
      });
  }
);

module.exports = router;
