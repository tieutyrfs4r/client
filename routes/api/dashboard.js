let express = require('express');
let router = express.Router();
const Wallet = require('../../model/wallets');
const User = require('../../model/users');
const TransactionHistory = require('../../model/transaction_histories');

router.get('/',async (req,res) => {

    try {
        const userId = req.user._id;
    
        // Lấy thông tin người dùng
        const user = await User.findById(userId).select('user_name');
      
        // Lấy số tiền hiện có trong ví
        const wallets = await Wallet.find({ user: userId }).populate('cryptocurrency');
       
    
        const walletData = wallets.map(wallet => {
            const balanceAmount = wallet ? wallet.balance_amount : 0;
            const cryptocurrencyName = wallet ? wallet.cryptocurrency.cryptocurrency_name : '';
            const cryptocurrencyImage = wallet ? wallet.cryptocurrency.img : '';
            return {
                balanceAmount,cryptocurrencyName,cryptocurrencyImage
            }
        })
        // Lấy 5 lịch sử giao dịch
        const transactionHistoryList = await TransactionHistory.find({ user: userId })
          .sort({ created_at: -1 })
          .limit(5)
          .populate('cryptocurrency');
    
        const transactionHistoryData = transactionHistoryList.map(history => {
          return {
            transactionAmount: history.transaction_amount,
            cryptocurrencyName: history.cryptocurrency.cryptocurrency_name,
            cryptocurrencyImage: history.cryptocurrency.img,
            usdExchangeRate: history.usdt_exchange_rate,
            vndExchangeRate: history.vnd_exchange_rate,
            balanceAmount: history.balance_amount,
            transactionType: history.transaction_type,
            vndBankName: history.vnd_bank_name,
            bankAccountOwnerName: history.bank_account_owner_name,
            status: history.status,
            createdAt: history.created_at,
            expiredAt: history.expired_at
            
          };
        });
    
        res.json({
          user_name: user.user_name,
          wallets: walletData,
          transactionHistory: transactionHistoryData
        });
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: err });
      }
});


module.exports = router;

