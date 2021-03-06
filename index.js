// include library
// require('dotenv').config();
// const express = require('express');
// const app = express();

// const cors = require('cors');
// const morgan = require('morgan');
// const PORT = process.env.PORT;

// middleware

// app.use(cors());
// app.use(morgan('dev'));

// route

// app.get('/', (req, res) => {
//   return res.status(200).json({
//     status: true,
//     message: 'Amazon clone rest api home page',
//   });
// });

// start server

// app.listen(PORT, () => {
//   console.log('start server :' + PORT);
// });

require('dotenv').config();

const express = require('express');
const app = express();
const database = require('./database');
const cors = require('cors');
const morgan = require('morgan');
const PORT = process.env.PORT;

//  userRoutes
const userRoutes = require('./routes/usersRoutes');

//  middleware
app.use(cors());
app.use(morgan('dev'));
app.use('/api/user', userRoutes);
// public is a folder
app.use(express.static('public'));

app.get('/', (req, res) => {
  return res.status(200).json({
    status: true,
    message: 'amazon clone',
  });
});

app.listen(PORT, () => {
  console.log('start server:' + PORT);
});
