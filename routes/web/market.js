let express = require('express');
let router = express.Router();
const User = require('../../model/users');
const Wallet = require('../../model/wallets');
const TransactionHistory = require('../../model/transaction_histories');
const Cryptocurrency = require('../../model/cryptocurrencies');
const axios = require('axios');
router.get('/', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('level');

        const cryptocurrencies = await Cryptocurrency.find({});

        const currencyData = await Promise.all(cryptocurrencies.map(async (currency) => {
            try {
                if (currency.cryptocurrency_name !== 'USDT') {
                    const response = await axios.get(currency.api_url);
                    const data = response.data;

                    let lastPrice = parseFloat(data.lastPrice);

                    if (currency.usdt_price_diff_type === 'percentage') {
                        lastPrice = lastPrice * (1 + currency.usdt_price_diff / 100);
                    } else if (currency.usdt_price_diff_type === 'value') {
                        lastPrice = lastPrice + currency.usdt_price_diff;
                    }

                    return {
                        ...currency.toObject(),
                        lastPrice: lastPrice,
                        priceChange: parseFloat(data.priceChange),
                        priceChangePercent: parseFloat(data.priceChangePercent),
                        volume24h: parseFloat(data.quoteVolume),
                    };
                } else {
                    return {
                        ...currency.toObject(),
                        lastPrice: 0,
                        priceChange: 0,
                        priceChangePercent: 0,
                        volume24h: 0,
                    };
                }
            } catch (e) {
                return {
                    ...currency.toObject(),
                    lastPrice: 0,
                    priceChange: 0,
                    priceChangePercent: 0,
                    volume24h: 0,
                };
            }
        }));

        const filteredCurrencyData = currencyData.filter(item => item.cryptocurrency_name !== 'USDT');

        const maxPriceIncrease = filteredCurrencyData.reduce((max, curr) => curr.priceChange > max.priceChange ? curr : max, filteredCurrencyData[0]);
        const maxPriceDecrease = filteredCurrencyData.reduce((min, curr) => curr.priceChange < min.priceChange ? curr : min, filteredCurrencyData[0]);
        const maxTradeVolume = filteredCurrencyData.reduce((max, curr) => curr.volume24h > max.volume24h ? curr : max, filteredCurrencyData[0]);
        const minTradeVolume = filteredCurrencyData.reduce((min, curr) => curr.volume24h < min.volume24h ? curr : min, filteredCurrencyData[0]);

        res.render('resources/market/index', {
            originalUrl: 'market',
            cryptocurrencies: filteredCurrencyData,
            maxPriceIncrease,
            maxPriceDecrease,
            maxTradeVolume,
            minTradeVolume
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;