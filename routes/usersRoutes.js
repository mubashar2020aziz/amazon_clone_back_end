// include library

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
// const { route } = require('express/lib/application');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const Users = require('../models/Users');

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
    check('username').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape(),

    //   checkEmail
    check('email').isEmail().normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    //  check errors is not empty
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: errors.array(),
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
                error: error,
              });
            });
        }
      })
      .catch((error) => {
        return res.status(502).json({
          status: false,
          error: error,
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
//  Access:public
// http://localhost:8000/api/user/uploadprofilepic
//method: POST

router.post('/uploadProfilePic', (req, res) => {
  //  storage and getProfilePicUpload take from storage filder
  let upload = storage.getProfilePicUpload();
  upload(req, res, (error) => {
    console.log(req.file);
    if (error) {
      return res.status(400).json({
        status: false,
        error: error,
        message: 'file upload fail',
      });
    } else {
      return res.status(200).json({
        status: true,
        message: 'file upload success',
      });
    }
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
    check('password').not().isEmpty().trim().escape(),
    check('email').not().isEmpty().normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    // check errors are not empty
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
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
          message: 'database error',
        });
      });
  }
);
module.exports = router;
