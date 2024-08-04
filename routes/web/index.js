let express = require('express');
let router = express.Router();
let authRouter = require('./auth')
let dashboardRouter = require('./dashboard')
let marketRouter = require('./market')
let transactionRouter = require('./transactions')
let walletRouter = require('./wallet')
let depositRouter = require('./deposit')
let profileRouter = require('./profile')
let identificationRouter = require('./identification')
let localBankAccountRouter = require('./local-bank-account')
let walletAddressRouter = require('./user-wallet-address')
let withDrawRouter = require('./with-draw')
const {authClientsMiddleware, refreshTokenMiddleware} = require("./middleware/clients-middleware");
router.get('/',(req,res) => {
    res.render('resources/index', {
        originalUrl: 'index',
    });
})
router.get('/terms',(req,res) => {
    res.render('resources/terms', {
        originalUrl: 'terms',
    });
})
router.get('/risk',(req,res) => {
    res.render('resources/risk', {
        originalUrl: 'risk',
    });
})
router.use(authRouter)
router.use('/dashboard',authClientsMiddleware,refreshTokenMiddleware,dashboardRouter);
router.use('/market',authClientsMiddleware,refreshTokenMiddleware,marketRouter);
router.use('/transactions',authClientsMiddleware,refreshTokenMiddleware,transactionRouter);
router.use('/wallet',authClientsMiddleware,refreshTokenMiddleware,walletRouter);
router.use('/deposit',authClientsMiddleware,refreshTokenMiddleware,depositRouter);
router.use('/profile',authClientsMiddleware,refreshTokenMiddleware,profileRouter);
router.use('/identification',authClientsMiddleware,refreshTokenMiddleware,identificationRouter);
router.use('/with-draw',authClientsMiddleware,refreshTokenMiddleware,withDrawRouter);
router.use('/local-bank-accounts',authClientsMiddleware,refreshTokenMiddleware,localBankAccountRouter);
router.use('/wallet-address',authClientsMiddleware,refreshTokenMiddleware,walletAddressRouter);

module.exports = router;

