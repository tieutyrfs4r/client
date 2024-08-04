const express = require('express');
const router = express.Router();
const Wallet = require('../../model/wallets');
const User = require('../../model/users');
const WalletAddress = require('../../model/wallet_addresses');
const Network = require('../../model/networks');
const TransactionHistory = require('../../model/transaction_histories');
const mongoose = require("mongoose");
const axios = require("axios");

router.get('/', async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User Not Found' });
    }
    try {
        const wallets = await Wallet.find({ user: userId }).select('balance_amount total_number_deposit total_number_withdraw cryptocurrency withdraw_min_amount exchange_min_amount temporarily_withheld total_withdraw total_deposit deposit_address deposit_network deposit_default_address_enabled').populate({
            path: 'cryptocurrency',
            select: '_id cryptocurrency_name default_deposit_enabled default_withdraw_enabled default_exchange_enabled'
        });

        if (wallets.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ví cho người dùng này' });
        }

        const transactionHistories = await TransactionHistory.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    transaction_status: 'pending',
                    transaction_type: 'withdraw'
                }
            },
            {
                $group: {
                    _id: "$cryptocurrency",
                    total_amount: { $sum: '$transaction_amount' }
                }
            }
        ]);



        const exchange_min_amount = user.exchange_min
        const exchange_max_amount = user.exchange_max

        const walletsJson = wallets.map(item => {

            const walletJson = item.toJSON();
            delete walletJson.__v;

            const cryptoData = transactionHistories.find(i =>{
                return i._id.toString() === walletJson.cryptocurrency._id.toString()
            })

            walletJson.total_deposit = item.total_deposit || 0

            walletJson.total_withdraw = item.total_withdraw || 0

            walletJson.total_await_disbursement = cryptoData? cryptoData.total_amount || 0 : 0;

            if(walletJson.exchange_min_amount){
                walletJson.exchange_min_amount = walletJson.exchange_min_amount < exchange_min_amount ? exchange_min_amount : walletJson.exchange_min_amount;
            }else{
                walletJson.exchange_min_amount = exchange_min_amount;
            }

            if(walletJson.exchange_max_amount){
                walletJson.exchange_max_amount = walletJson.exchange_max_amount < exchange_max_amount ? exchange_max_amount : walletJson.exchange_max_amount;
            }else{
                walletJson.exchange_max_amount = exchange_max_amount
            }

            return walletJson;
        });




        res.json({ wallets: walletsJson });
    } catch (err) {
        console.error('Đã xảy ra lỗi khi lấy thông tin ví:', err);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin ví' });
    }
});
router.get('/wallet-address-receive/:cryptocurrencyId/:networkId', async (req, res) => {
    try {
        const cryptocurrencyId = req.params.cryptocurrencyId;
        const networkId = req.params.networkId;
        const walletAddress = await WalletAddress.aggregate([
            { $match: { cryptocurrency: new mongoose.Types.ObjectId(cryptocurrencyId), network: new mongoose.Types.ObjectId(networkId), use_enabled: true } },
            { $sample: { size: 1 } }
        ]);

        if (walletAddress.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy địa chỉ ví đang được sử dụng cho loại tiền điện tử và mạng lưới này' });
        }

        const populatedWalletAddress = await WalletAddress.findById(walletAddress[0]._id)
            .populate('cryptocurrency', '_id cryptocurrency_name img_url')
            .populate('network', '_id name short_name');

        const formattedWalletAddress = {
            id: populatedWalletAddress._id,
            address: populatedWalletAddress.address,
            description: populatedWalletAddress.description,
            use_enabled: populatedWalletAddress.use_enabled,
            cryptocurrency: {
                id: populatedWalletAddress.cryptocurrency._id,
                cryptocurrency_name: populatedWalletAddress.cryptocurrency.cryptocurrency_name,
                img_url: populatedWalletAddress.cryptocurrency.img_url,
            },
            network: {
                id: populatedWalletAddress.network._id,
                name: populatedWalletAddress.network.name,
                short_name: populatedWalletAddress.network.short_name,
            },
        };

        res.json(formattedWalletAddress);
    } catch (err) {
        console.error('Đã xảy ra lỗi khi lấy ngẫu nhiên địa chỉ ví:', err);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy ngẫu nhiên địa chỉ ví' });
    }
});

router.get('/networks', async (req, res) => {
    try {
        const networks = await Network.find();
        res.json(networks.map((item) => ({
            id: item._id,
            name: item.name,
            short_name: item.short_name
        })));
    } catch (err) {
        console.error('Đã xảy ra lỗi khi lấy danh sách mạng lưới:', err);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách mạng lưới' });
    }
});
router.get('/overview-usdt', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const wallets = await Wallet.find({ user: userId }).populate('cryptocurrency','_id cryptocurrency_name img_url');
        const usdt = wallets.find(item => {
            return item.cryptocurrency.cryptocurrency_name === 'USDT'
        })
        const usdc = wallets.find(item => {
            return item.cryptocurrency.cryptocurrency_name === 'USDC'
        })
        let totalUsdtAmount = 0;
        if(usdt){
            totalUsdtAmount = usdt.balance_amount;
        }
        let totalUsdcAmount = 0;
        if(usdc){
            totalUsdcAmount = usdc.balance_amount;
        }

        // for (const wallet of wallets) {
        //     const { balance_amount, cryptocurrency } = wallet;
        //     const { usdt_price_diff_type, usdt_price_diff } = cryptocurrency;
        //
        //     let usdtPrice = 1;
        //
        //     if (cryptocurrency.cryptocurrency_name !== 'USDT') {
        //         const response = await axios.get(cryptocurrency.api_url);
        //         const data = response.data;
        //         usdtPrice = parseFloat(data.lastPrice);
        //     }
        //
        //     let adjustedUsdtPrice = usdtPrice;
        //
        //     if (usdt_price_diff_type === 'percentage') {
        //         adjustedUsdtPrice = usdtPrice * (1 + usdt_price_diff / 100);
        //     } else if (usdt_price_diff_type === 'value') {
        //         adjustedUsdtPrice = usdtPrice + usdt_price_diff;
        //     }
        //
        //     const usdtAmount = balance_amount * adjustedUsdtPrice;
        //     totalUsdtAmount += usdtAmount;
        // }
        //
        // const currencyResponse = await axios.get('https://www.binance.com/bapi/asset/v1/public/asset-service/product/currency');
        // const currencyData = currencyResponse.data.data;
        //
        // let vndUsdRate = currencyData.find(item => item.pair === 'VND_USD').rate;
        //
        // if (user.usdt_vnd_exchange_diff_enabled) {
        //     if (user.usdt_vnd_exchange_diff_type === 'percentage') {
        //         vndUsdRate = vndUsdRate * (1 + user.usdt_vnd_exchange_diff / 100);
        //     } else if (user.usdt_vnd_exchange_diff_type === 'value') {
        //         vndUsdRate = vndUsdRate + user.usdt_vnd_exchange_diff;
        //     } else if (user.usdt_vnd_exchange_diff_type === 'default') {
        //         vndUsdRate = user.usdt_vnd_exchange_diff;
        //     }
        // }
        //
        // const totalVndAmount = totalUsdtAmount * vndUsdRate + user.vnd_wallet;

        res.json({
            total_usdt_amount: totalUsdtAmount,
            total_vnd_amount: user.vnd_wallet,
            total_usdc_amount: totalUsdcAmount
        });
    } catch (error) {
        console.error('Failed to fetch overview data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;