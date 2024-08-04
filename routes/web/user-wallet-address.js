let express = require('express');
let router = express.Router();

router.get('/', async (req, res, next) => {
    try {

        res.render('resources/wallet-address/index', {
            originalUrl: 'wallet-address'
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;