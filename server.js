const express = require('express');
// const indexRoute = require('./routes/index');

const app = express();
const port = process.env.PORT;

const indexRoute = require('./routes/index');

// Use the router as middleware
app.use('/', indexRoute);

app.listen('5000', () => {
  console.log('server is running on port 5000');
});
