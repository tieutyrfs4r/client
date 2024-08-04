let express = require('express');
let router = express.Router();
let authRouter = require('./auth')
let dashboardRouter = require('./dashboard')
let transactionRouter = require('./transactions')
let accountSettingRouter = require('./account-settings')
let walletRouter = require('./wallets')
let profileRouter = require('./profile')
let identificationRouter = require('./identification')
let marketRouter = require('./market')
let cryptocurrencyRouter = require('./cryptocurrencies')
let p2pRouter = require('./p2p')
let localBankAccountRouter = require('./local-bank-account')
let walletAddressRouter = require('./user-wallet-addreses')
const { clientAuthenticateToken}= require('./middleware/clients_auth')

router.use(authRouter)

router.use('/dashboard',clientAuthenticateToken,dashboardRouter);
router.use('/transactions',clientAuthenticateToken,transactionRouter);
router.use('/market',clientAuthenticateToken,marketRouter);
router.use('/identification',clientAuthenticateToken,identificationRouter);
router.use('/p2p',clientAuthenticateToken,p2pRouter);
router.use('/local-bank-accounts',clientAuthenticateToken,localBankAccountRouter);
router.use('/wallet-addresses',clientAuthenticateToken,walletAddressRouter);

router.use('/account-settings',clientAuthenticateToken,accountSettingRouter);
router.use('/wallets',clientAuthenticateToken,walletRouter);
router.use('/profile',clientAuthenticateToken,profileRouter);
router.use('/cryptocurrencies',clientAuthenticateToken,cryptocurrencyRouter);


module.exports = router;

