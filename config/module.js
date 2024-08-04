let modules = {};
modules.init = app => {
    const fileUpload = require('express-fileupload');
    const path = require('path');
    const cookieParser = require('cookie-parser');
    const logger = require('morgan');
    const bodyParser = require('body-parser');
    const express = require('express');
    const methodOverride = require('method-override')
    const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
    const cors = require('cors')
    // app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));
    app.use(cors())
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');
    app.use(bodyParser.json({ limit: '25mb' }));
    app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(methodOverride('_method'))
    app.use(fileUpload());
 
};

module.exports = modules;
