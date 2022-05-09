const jwt = require('jsonwebtoken');
const token_key = process.env.TOKEN_KEY;
const User = require('./../models/Users');

const verifyToken = (req, res, next) => {
  //read jwt token from http header
  const token = req.headers['x-access-token'];

  // check token empty
  if (!token) {
    return res.status(404).json({
      status: false,
      messsage: 'json web token not found',
    });
  }

  jwt.verify(token, token_key, function (error, decoded) {
    //check error
    if (error) {
      return res.status(401).json({
        status: false,
        message: 'token not decoded',
        error: error,
      });
    }
    // check user exist or not in database
    User.findById(decoded.id, {
      password: 0,
      createdAt: 0,
      updatedAt: 0,
      profile_pic: 0,
    })
      .then((user) => {
        //   check user empty
        if (!user) {
          return res.status(404).json({
            status: false,
            message: 'user dont exist...',
          });
        }
        // set user object in req object
        req.user = {
          id: user._id,
          email: user.email,
          username: user.username,
        };
        return next();
        //    database error
      })
      .catch((error) => {
        return res.status(502).json({
          status: false,
          message: 'database error',
        });
      });
  });
};

module.exports = verifyToken;
