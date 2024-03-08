const express = require('express');
const { env } = require('process');
const routes = require('./routes');

const app = express();
const port = env.PORT ? env.PORT : 5000;

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server Running on port: ${port}`);
});
