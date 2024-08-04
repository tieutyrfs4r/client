let express = require('express');
let router = express.Router();
const { body, validationResult } = require('express-validator');
const Cryptocurrency = require('../../model/cryptocurrencies');
const Wallet = require("../../model/wallets");
const axios = require("axios");
const User = require("../../model/users");

router.get('/', async (req, res) => {
    try {
      const { default_use_enabled, default_withdraw_enabled, default_deposit_enabled, default_exchange_enabled } = req.query;
      
      const query = {};
      
      if (default_use_enabled !== undefined) {
        query.default_use_enabled = default_use_enabled === 'true';
      }
      
      if (default_withdraw_enabled !== undefined) {
        query.default_withdraw_enabled = default_withdraw_enabled === 'true';
      }
      
      if (default_deposit_enabled !== undefined) {
        query.default_deposit_enabled = default_deposit_enabled === 'true';
      }
      
      if (default_exchange_enabled !== undefined) {
        query.default_exchange_enabled = default_exchange_enabled === 'true';
      }
      
      const result = await Cryptocurrency.find(query);
      
      const response = result.map(it => {
        const { _id, cryptocurrency_name, img_url, default_use_enabled, default_withdraw_enabled, default_deposit_enabled, default_exchange_enabled } = it;
        return {
          _id,
          cryptocurrency_name,
          img_url,
          default_use_enabled,
          default_withdraw_enabled,
          default_deposit_enabled,
          default_exchange_enabled
        };
      });
      
      res.json(response);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.get('/fluctuations', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const cryptocurrencies = await Cryptocurrency.find().skip((page - 1) * limit).limit(limit);

        if(cryptocurrencies.length === 0){
            return res.json({
                data: [],
                currentPage: page,
                totalPages: 0,
                totalItems: 0
            })
        }

        const currencyResponse = await axios.get('https://www.binance.com/bapi/asset/v1/public/asset-service/product/currency');
        const currencyData = currencyResponse.data.data;
        let vndUsdRate = currencyData.find(item => item.pair === 'VND_USD').rate;

        if (user.usdt_vnd_exchange_diff_enabled) {
            if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                vndUsdRate = vndUsdRate * (1 + user.usdt_vnd_exchange_diff / 100);
            } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                vndUsdRate = vndUsdRate + user.usdt_vnd_exchange_diff;
            } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                vndUsdRate = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
            }
        }

        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);


        const apiUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols.map(symbol => `"${symbol}"`).join(',')}]`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        const results = cryptocurrencies.map(cryptocurrency => {
            const symbol = symbols.find(symbol => cryptocurrency.api_url.includes(symbol));
            const cryptoData = data.find(item => item.symbol === symbol);

            if (cryptoData) {
                const currentPrice = parseFloat(cryptoData.lastPrice);
                const priceChangePercent = parseFloat(cryptoData.priceChangePercent);
                const priceChange = parseFloat(cryptoData.priceChange);
                const volume = parseFloat(cryptoData.volume);

                let adjustedPrice = currentPrice;


                /// thay vi VND thi chuyen sang USDC
                if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                    if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                        adjustedPrice = currentPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                    } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                        adjustedPrice = currentPrice + user.usdt_vnd_exchange_diff;
                    } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                        adjustedPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                    }
                }else{
                    if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                        adjustedPrice = currentPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                    } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                        adjustedPrice = currentPrice + cryptocurrency.usdt_price_diff;
                    }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                        adjustedPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                    }
                }



                const currentPriceInVND = adjustedPrice * vndUsdRate;

                return {
                    _id: cryptocurrency._id,
                    name: cryptocurrency.cryptocurrency_name,
                    img_url: cryptocurrency.img_url,
                    currentPrice: adjustedPrice,
                    currentPriceInVND,
                    priceChangePercent,
                    priceChange,
                    volume
                };
            }

            return null;
        }).filter(result => result !== null);

        const walletBalances = await Wallet.find({ user: userId, cryptocurrency: { $in: results.map(result => result._id) } });

        results.forEach(result => {
            const walletBalance = walletBalances.find(wallet => wallet.cryptocurrency.toString() === result._id.toString());
            result.walletBalance = walletBalance ? walletBalance.balance_amount : 0;
        });

        const total = await Cryptocurrency.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: results,
            currentPage: page,
            totalPages: totalPages,
            totalItems: total
        });
    } catch (error) {
        console.error('Failed to fetch cryptocurrency data:', error);
        res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
    }
});
router.get('/top-gainers', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cryptocurrencies = await Cryptocurrency.find();
        if(cryptocurrencies.length === 0){
            return res.json([])
        }
        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);

        const symbolsParam = symbols.map(symbol => `"${symbol}"`).join(',');
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`);
        const data = response.data;

        const result = data.map(item => {
            const cryptocurrency = cryptocurrencies.find(crypto => crypto.api_url.includes(item.symbol));
            let adjustedPrice = parseFloat(item.lastPrice);

            /// thay vi VND thi chuyen sang USDC
            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    adjustedPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                }
            }else{
                if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + cryptocurrency.usdt_price_diff;
                }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                    adjustedPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                }
            }

            return {
                _id: cryptocurrency._id,
                name: cryptocurrency.cryptocurrency_name,
                img_url: cryptocurrency.img_url,
                symbol: item.symbol,
                lastPrice: adjustedPrice,
                priceChange: parseFloat(item.priceChange),
                priceChangePercent: parseFloat(item.priceChangePercent)
            };
        });

        const sortedResult = result.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
        const topGainers = sortedResult.slice(0, 5);

        res.json(topGainers);
    } catch (error) {
        console.error('Failed to fetch top gainers:', error);
        res.status(500).json({ error: 'Failed to fetch top gainers' });
    }
});

router.get('/top-losers', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cryptocurrencies = await Cryptocurrency.find();
        if(cryptocurrencies.length === 0){
            return res.json([])
        }
        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);

        const symbolsParam = symbols.map(symbol => `"${symbol}"`).join(',');
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`);
        const data = response.data;

        const result = data.map(item => {
            const cryptocurrency = cryptocurrencies.find(crypto => crypto.api_url.includes(item.symbol));
            let adjustedPrice = parseFloat(item.lastPrice);


            /// thay vi VND thi chuyen sang USDC
            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    adjustedPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                }
            }else{
                if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + cryptocurrency.usdt_price_diff;
                }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                    adjustedPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                }
            }

            return {
                _id: cryptocurrency._id,
                name: cryptocurrency.cryptocurrency_name,
                img_url: cryptocurrency.img_url,
                symbol: item.symbol,
                lastPrice: adjustedPrice,
                priceChange: parseFloat(item.priceChange),
                priceChangePercent: parseFloat(item.priceChangePercent)
            };
        });

        const sortedResult = result.sort((a, b) => a.priceChangePercent - b.priceChangePercent);
        const topLosers = sortedResult.slice(0, 5);

        res.json(topLosers);
    } catch (error) {
        console.error('Failed to fetch top losers:', error);
        res.status(500).json({ error: 'Failed to fetch top losers' });
    }
});

router.get('/top-volume', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cryptocurrencies = await Cryptocurrency.find();
        if(cryptocurrencies.length === 0){
            return res.json([])
        }
        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);

        const symbolsParam = symbols.map(symbol => `"${symbol}"`).join(',');
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`);
        const data = response.data;

        const result = data.map(item => {
            const cryptocurrency = cryptocurrencies.find(crypto => crypto.api_url.includes(item.symbol));
            let adjustedPrice = parseFloat(item.lastPrice);

            /// thay vi VND thi chuyen sang USDC
            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    adjustedPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                }
            }else{
                if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                    adjustedPrice = adjustedPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                    adjustedPrice = adjustedPrice + cryptocurrency.usdt_price_diff;
                }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                    adjustedPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                }
            }

            return {
                _id: cryptocurrency._id,
                name: cryptocurrency.cryptocurrency_name,
                img_url: cryptocurrency.img_url,
                symbol: item.symbol,
                lastPrice: adjustedPrice,
                priceChange: parseFloat(item.priceChange),
                priceChangePercent: parseFloat(item.priceChangePercent),
                volume: parseFloat(item.volume)
            };
        });

        const sortedResult = result.sort((a, b) => b.volume - a.volume);
        const topVolume = sortedResult.slice(0, 5);

        res.json(topVolume);
    } catch (error) {
        console.error('Failed to fetch top volume cryptocurrencies:', error);
        res.status(500).json({ error: 'Failed to fetch top volume cryptocurrencies' });
    }
});

router.get('/extremes', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cryptocurrencies = await Cryptocurrency.find();
        if(cryptocurrencies.length === 0){
            return res.json([])
        }
        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);

        const symbolsParam = symbols.map(symbol => `"${symbol}"`).join(',');
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`);
        const data = response.data;

        const adjustedData = data.map(item => {
            const cryptocurrency = cryptocurrencies.find(crypto => crypto.api_url.includes(item.symbol));

            let currentPrice = parseFloat(item.lastPrice);
            let priceChange = parseFloat(item.priceChange);
            let volume = parseFloat(item.volume);


            /// thay vi VND thi chuyen sang USDC
            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    currentPrice = currentPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    currentPrice = currentPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    currentPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                }
            }else{
                if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                    currentPrice = currentPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                    priceChange = priceChange * (1 + cryptocurrency.usdt_price_diff / 100);
                    volume = volume * currentPrice;
                } else if (cryptocurrency.usdt_price_diff_type === 'value') {

                    currentPrice = currentPrice + cryptocurrency.usdt_price_diff;
                    priceChange = priceChange + cryptocurrency.usdt_price_diff;
                    volume = volume * currentPrice;


                }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                    currentPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                    priceChange = priceChange + cryptocurrency.usdt_price_diff_round_value;
                    volume = volume * currentPrice;
                }


            }
            return {
                _id: cryptocurrency._id,
                name: cryptocurrency.cryptocurrency_name,
                img_url: cryptocurrency.img_url,
                symbol: item.symbol,
                currentPrice: currentPrice,
                priceChange: priceChange,
                priceChangePercent: parseFloat(item.priceChangePercent),
                volume: volume,
            };
        });

        const maxPriceChange = adjustedData.reduce((max, current) => (current.priceChange > max.priceChange ? current : max));
        const minPriceChange = adjustedData.reduce((min, current) => (current.priceChange < min.priceChange ? current : min));
        const maxVolume = adjustedData.reduce((max, current) => (current.volume > max.volume ? current : max));
        const minVolume = adjustedData.reduce((min, current) => (current.volume < min.volume ? current : min));

        res.json({
            maxPriceChange: maxPriceChange,
            minPriceChange: minPriceChange,
            maxVolume: maxVolume,
            minVolume: minVolume,
        });
    } catch (error) {
        console.error('Failed to fetch cryptocurrency extremes:', error);
        res.status(500).json({ error: 'Failed to fetch cryptocurrency extremes' });
    }
});

router.get('/data', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cryptocurrencies = await Cryptocurrency.find().skip(skip).limit(limit);
        if(cryptocurrencies.length === 0){
            return res.json([])
        }
        const symbols = cryptocurrencies.map(cryptocurrency => {
            const symbolRegex = /symbol=(\w+)/;
            const match = cryptocurrency.api_url.match(symbolRegex);
            return match && cryptocurrency.cryptocurrency_name !== 'USDT' ? match[1] : null;
        }).filter(symbol => symbol !== null);


        const apiUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols.map(symbol => `"${symbol}"`).join(',')}]`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        const result = data.map(item => {
            const cryptocurrency = cryptocurrencies.find(crypto => crypto.api_url.includes(item.symbol));

            let currentPrice = parseFloat(item.lastPrice);
            let priceChange = parseFloat(item.priceChange);
            let marketCap = parseFloat(item.volume) * currentPrice;


            /// thay vi VND thi chuyen sang USDC
            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    currentPrice = currentPrice * (1 + user.usdt_vnd_exchange_diff / 100);
                    priceChange = priceChange * (1 + user.usdt_vnd_exchange_diff / 100);
                    marketCap = marketCap * (1 + user.usdt_vnd_exchange_diff / 100);

                } else if (user.usdt_vnd_exchange_diff_type === 'value') {

                    currentPrice = currentPrice + user.usdt_vnd_exchange_diff;
                    priceChange = priceChange + user.usdt_vnd_exchange_diff;
                    marketCap = marketCap + user.usdt_vnd_exchange_diff * parseFloat(item.volume);


                } else if (user.usdt_vnd_exchange_diff_type === 'default') {

                    currentPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;
                    priceChange = priceChange + user.usdt_vnd_exchange_diff_round_value;
                    marketCap = marketCap + currentPrice * parseFloat(item.volume);
                }
            }else{
                if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                    currentPrice = currentPrice * (1 + cryptocurrency.usdt_price_diff / 100);
                    priceChange = priceChange * (1 + cryptocurrency.usdt_price_diff / 100);
                    marketCap = marketCap * (1 + cryptocurrency.usdt_price_diff / 100);
                } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                    currentPrice = currentPrice + cryptocurrency.usdt_price_diff;
                    priceChange = priceChange + cryptocurrency.usdt_price_diff;
                    marketCap = marketCap + cryptocurrency.usdt_price_diff * parseFloat(item.volume);
                }else if (cryptocurrency.usdt_price_diff_type === 'default') {

                    currentPrice = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
                    priceChange = priceChange + + cryptocurrency.usdt_price_diff_round_value;
                    marketCap = marketCap + currentPrice * parseFloat(item.volume);
                }
            }




            return {
                _id: cryptocurrency._id,
                name: cryptocurrency.cryptocurrency_name,
                img_url: cryptocurrency.img_url,
                symbol: item.symbol,
                currentPrice: currentPrice,
                priceChange: priceChange,
                priceChangePercent: parseFloat(item.priceChangePercent),
                volume: parseFloat(item.volume),
                marketCap: marketCap,
            };
        });

        const total = await Cryptocurrency.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: result,
            currentPage: page,
            totalPages: totalPages,
            totalItems: total,
        });
    } catch (error) {
        console.error('Failed to fetch cryptocurrency data:', error);
        res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
    }
});


router.get('/rate-usdt/:cryptocurrency_id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({error: 'User not found'})
        }
        const cryptocurrencyId = req.params.cryptocurrency_id;

        const cryptocurrency = await Cryptocurrency.findById(cryptocurrencyId);

        if (!cryptocurrency) {
            return res.status(404).json({ error: 'Cryptocurrency not found' });
        }

        if (cryptocurrency.cryptocurrency_name === 'USDT') {
            return res.json({ usdt_exchange_rate: 1 });
        }

        const response = await axios.get(cryptocurrency.api_url);
        const data = response.data;

        const lastPrice = parseFloat(data.lastPrice);
        let usdtExchangeRate;


        if(user.usdt_vnd_exchange_diff_enabled && cryptocurrency.cryptocurrency_name === 'USDC'){
            if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                usdtExchangeRate = lastPrice * (1 + (user.usdt_vnd_exchange_diff / 100));

            } else if (user.usdt_vnd_exchange_diff_type === 'value') {

                usdtExchangeRate = lastPrice + user.usdt_vnd_exchange_diff;

            } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                currentPrice = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;

            }
        }else{
            if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                usdtExchangeRate = lastPrice * (1 + (cryptocurrency.usdt_price_diff / 100));
            } else if (cryptocurrency.usdt_price_diff_type === 'value') {
                usdtExchangeRate = lastPrice + cryptocurrency.usdt_price_diff;
            }else if (cryptocurrency.usdt_price_diff_type === 'default') {
                usdtExchangeRate = cryptocurrency.usdt_price_diff + cryptocurrency.usdt_price_diff_round_value;
            }
        }



        res.json({ usdt_exchange_rate: usdtExchangeRate });

    } catch (error) {
        console.error('Failed to fetch USDT exchange rate:', error);
        res.status(500).json({ error: 'Failed to fetch USDT exchange rate' });
    }
});
router.get('/rate-vnd/:cryptocurrency_id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({error: 'User not found'})
        }
        const cryptocurrencyId = req.params.cryptocurrency_id;

        const cryptocurrency = await Cryptocurrency.findById(cryptocurrencyId);

        if (!cryptocurrency) {
            return res.status(404).json({ error: 'Cryptocurrency not found' });
        }
        let usdtExchangeRate;
        if(cryptocurrency.cryptocurrency_name === 'USDT'){
            usdtExchangeRate = 1
        }else{

            const response = await axios.get(cryptocurrency.api_url);
            const data = response.data;

            const lastPrice = parseFloat(data.lastPrice);


            if (cryptocurrency.usdt_price_diff_type === 'percentage') {
                usdtExchangeRate = lastPrice * (1 + (cryptocurrency.usdt_price_diff / 100));
            } else {
                usdtExchangeRate = lastPrice + cryptocurrency.usdt_price_diff;
            }
        }


        const currencyResponse = await axios.get('https://www.binance.com/bapi/asset/v1/public/asset-service/product/currency');
        const currencyData = currencyResponse.data.data;

        let vndUsdRate = currencyData.find(item => item.pair === 'VND_USD').rate;

        if(user.usdt_vnd_exchange_diff_enabled){
            if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                vndUsdRate = vndUsdRate * (1 + (user.usdt_vnd_exchange_diff / 100));
            } else  if (user.usdt_vnd_exchange_diff_type === 'value') {
                vndUsdRate = vndUsdRate + user.usdt_vnd_exchange_diff;
            } else  if (user.usdt_vnd_exchange_diff_type === 'default') {
                const x = user.usdt_vnd_exchange_diff_round || 50
                const randomNumber = Math.random() * (2 * x) - x;
                vndUsdRate = user.usdt_vnd_exchange_diff + randomNumber;
            }
        }

        const vndExchangeRate = usdtExchangeRate * vndUsdRate;

        res.json({ vnd_exchange_rate: vndExchangeRate });

    } catch (error) {
        console.error('Failed to fetch VND exchange rate:', error);
        res.status(500).json({ error: 'Failed to fetch VND exchange rate' });
    }
});
router.get('/rate-cryptocurrency/:cryptocurrency_id_from/:cryptocurrency_id_to', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({error: 'User not found'})
        }
        const cryptocurrencyIdFrom = req.params.cryptocurrency_id_from;
        const cryptocurrencyIdTo = req.params.cryptocurrency_id_to;

        const cryptocurrencyFrom = await Cryptocurrency.findById(cryptocurrencyIdFrom);
        const cryptocurrencyTo = await Cryptocurrency.findById(cryptocurrencyIdTo);

        if (!cryptocurrencyFrom || !cryptocurrencyTo) {
            return res.status(404).json({ error: `Cryptocurrency not found` });
        }

        //from
        let usdtExchangeRateFrom;
        if(cryptocurrencyFrom.cryptocurrency_name === 'USDT'){
            usdtExchangeRateFrom = 1
        }else{

            const responseFrom = await axios.get(cryptocurrencyFrom.api_url);
            const data = responseFrom.data;

            const lastPrice = parseFloat(data.lastPrice);


            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrencyFrom.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    usdtExchangeRateFrom = lastPrice * (1 + (user.usdt_vnd_exchange_diff / 100));
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    usdtExchangeRateFrom = lastPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    usdtExchangeRateFrom = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;

                }
            }else{
                if (cryptocurrencyFrom.usdt_price_diff_type === 'percentage') {
                    usdtExchangeRateFrom = lastPrice * (1 + (cryptocurrencyFrom.usdt_price_diff / 100));
                } else  if (cryptocurrencyFrom.usdt_price_diff_type === 'value') {
                    usdtExchangeRateFrom = lastPrice + cryptocurrencyFrom.usdt_price_diff;
                }else  if (cryptocurrencyFrom.usdt_price_diff_type === 'default') {
                    usdtExchangeRateFrom = cryptocurrencyFrom.usdt_price_diff + cryptocurrencyFrom.usdt_price_diff_round_value;
                }
            }


        }
        let usdtExchangeRateTo;
        if(cryptocurrencyTo.cryptocurrency_name === 'USDT'){
            usdtExchangeRateTo = 1
        }else{

            const responseFrom = await axios.get(cryptocurrencyTo.api_url);
            const data = responseFrom.data;

            const lastPrice = parseFloat(data.lastPrice);


            if(user.usdt_vnd_exchange_diff_enabled && cryptocurrencyTo.cryptocurrency_name === 'USDC'){
                if (user.usdt_vnd_exchange_diff_type === 'percentage') {
                    usdtExchangeRateTo = lastPrice * (1 + (user.usdt_vnd_exchange_diff / 100));
                } else if (user.usdt_vnd_exchange_diff_type === 'value') {
                    usdtExchangeRateTo = lastPrice + user.usdt_vnd_exchange_diff;
                } else if (user.usdt_vnd_exchange_diff_type === 'default') {
                    usdtExchangeRateTo = user.usdt_vnd_exchange_diff + user.usdt_vnd_exchange_diff_round_value;

                }
            }else{
                if (cryptocurrencyTo.usdt_price_diff_type === 'percentage') {
                    usdtExchangeRateTo = lastPrice * (1 + (cryptocurrencyTo.usdt_price_diff / 100));
                } else  if (cryptocurrencyTo.usdt_price_diff_type === 'value') {
                    usdtExchangeRateTo = lastPrice + cryptocurrencyTo.usdt_price_diff;
                }else  if (cryptocurrencyTo.usdt_price_diff_type === 'default') {
                    usdtExchangeRateTo = cryptocurrencyTo.usdt_price_diff + cryptocurrencyTo.usdt_price_diff_round_value;
                }
            }


        }

        const exchange_rate = usdtExchangeRateFrom / usdtExchangeRateTo;

        res.json({ exchange_rate: exchange_rate });

    } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
});

module.exports = router;

