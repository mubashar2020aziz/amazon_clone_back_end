// include library

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const Users = require('../models/Users');

const token_key = process.env.TOKEN_KEY;

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
// http://localhost:8000/api/users/register
//method: POST
router.post(
  '/register',
  [
    //   express validator use
    check('username').not().isEmpty().trim().escape(),
    check('password1').not().isEmpty().trim().escape(),

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
      });
    }

    // hashing password start
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password1, salt);
    // hashed password end
    return res.status(200).json({
      status: true,
      data: req.body,
      hashedPassword: hashedPassword,
    });
  }
);

module.exports = router;
