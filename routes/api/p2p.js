let express = require('express');
let router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const User = require("../../model/users");

router.post(
    '/data',
    [
        body('page').isInt({ min: 1 }).withMessage('Page phải là một số nguyên lớn hơn 0'),
        body('rows').isInt({ min: 1 }).withMessage('Rows phải là một số nguyên lớn hơn 0'),
        body('type').isIn(['Sell', 'Buy']).withMessage('Type chỉ có thể là Sell hoặc Buy'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { page, rows, type } = req.body;

        try {
            const response = await axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
                fiat: 'VND',
                page: page,
                rows: rows,
                tradeType: type,
                asset: 'USDT',
                countries: [],
                proMerchantAds: false,
                shieldMerchantAds: false,
                filterType: 'all',
                additionalKycVerifyFilter: 0,
                publisherType: 'merchant',
                payTypes: [],
                classifies: ['mass', 'profession'],
            });

            return res.json(response.data);
        } catch (error) {
            next(error);
        }
    }
);
router.post('/buy-usdt',  async (req, res) => {
    try {

        const userId = req.user._id

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if(user.status === 'lock'){
            return res.status(400).json({ error: "Trạng thái tài khoản của bạn không được phép sử dụng chức năng này" });
        }
        return res.status(400).json({ error: "Vui lòng nâng cấp tài khoản để sử dụng tính năng này. Chi tiết vui lòng liên hệ CSKH." });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message });
    }
});
router.post('/sell-usdt',  async (req, res) => {
    try {

        const userId = req.user._id

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if(user.status === 'lock'){
            return res.status(400).json({ error: "Trạng thái tài khoản của bạn không được phép sử dụng chức năng này" });
        }
        return res.status(400).json({ error: "Tải khoản của quý khách chưa đủ điều kiện để sử dụng tính năng này. Chi tiết vui lòng liên hệ CSKH." });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message });
    }
});
module.exports = router;