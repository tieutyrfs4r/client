const config = require('./index');
const express = require('express');
const msecs = 240000
const app = express();
const server = require('http').Server(app);
server.listen(process.env.PORT || config.app.port);

server.setTimeout(msecs)
module.exports.app = app;
module.exports.server = server;