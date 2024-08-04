let express = require('express');
let router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        res.render('resources/dashboard/index', {
            originalUrl: 'dashboard',
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = router;