let express = require('express');
let router = express.Router();
const User = require('../../model/users');
const Wallet = require('../../model/wallets');
const TransactionHistory = require('../../model/transaction_histories');
const Cryptocurrency = require('../../model/cryptocurrencies');
const axios = require('axios');
router.get('/', async (req, res, next) => {
    try {

        res.render('resources/identification/index', {
            originalUrl: 'identification',

        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;