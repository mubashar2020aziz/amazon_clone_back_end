// include library

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const Users = require('./../models/Users');

const token_key = process.env.TOKEN_KEY;

//   middleware setup

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

//  default router

router.get('/', (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'user default route',
  });
});

module.exports = router;
