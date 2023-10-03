#!/usr/bin/node

const express = require('express');
const indexRoute = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Use the router as middleware
app.use('/', indexRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
