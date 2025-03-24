const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg"); // Import the Postgres client

const app = express();
const port = 3100;

const feApiRouter = require('./app/routes/fe-api');

// CORS configuration
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://cryptafe.com');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parser middleware
app.use(bodyParser.json());

app.use('/api', feApiRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
