const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Port
const PORT = process.env.PORT || '8000';

// Express app
app = express();

// Mongoose/mongoDB
mongoose
	.connect(process.env.DB_CONNECTION)
	.then((result) => app.listen(PORT))
	.catch((err) => console.log(err));

// Import Routes
const coinsRoute = require('./routes/coins');
const FrontendRoute = require('./routes/frontend'); 
const { Console } = require('console');

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./frontend/index.html'));
});

app.use('/coins', coinsRoute);