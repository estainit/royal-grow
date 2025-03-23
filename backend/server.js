const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg"); // Import the Postgres client

const app = express();
const port = 3100;

const feApiRouter = require('./app/routes/fe-api');

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization'); // Allowed headers (adjust as needed)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed methods
  next();
});

// Body parser middleware
app.use(bodyParser.json());

app.use('/api', feApiRouter);



app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
