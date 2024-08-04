let express = require('express');
let router = express.Router();
require('dotenv').config();
const { body, validationResult } = require('express-validator');
const Wallet = require('../../model/wallets');

const Cryptocurrency = require('../../model/cryptocurrencies');
const User = require('../../model/users');
const moment = require('moment')
const TransactionHistory = require('../../model/transaction_histories');
const UserWalletAddress = require('../../model/user_wallet_addresses');
const Network = require('../../model/networks');
const axios = require("axios");
const {uploadFileAsyncToCloudflare, sendMessageToTelegramGroup, sendMessageWithImagesToTelegramGroup,
  getUsdtExchangeRate, generateRandomNumber, sendEmail, getGroupId
} = require("../../helpers/common");

const LocalBankAccount = require("../../model/local_bank_account");
const mongoose = require("mongoose");

router.get('/get', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { transaction_type, transaction_status } = req.query;

    const query = { user: userId };

    if (transaction_type) {
      query.transaction_type = transaction_type;
    }

    if (transaction_status) {
      query.transaction_status = transaction_status;
    }

    const options = {
      page,
      limit,
      sort: { created_at: -1 },
      populate: [
        { path: 'cryptocurrency', select: '_id cryptocurrency_name img_url' },
      ],
    };

    const transactions = await TransactionHistory.paginate(query, options);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/deposit', [
  body('cryptocurrency').notEmpty().withMessage('Vui lòng chọn một loại tiền!'),
  body('transaction_amount').isNumeric().withMessage('Số tiền phải là một số!'),
  body('transaction_images').custom((value, { req }) => {
    if (!req.files || !req.files.transaction_images) {
      throw new Error('Hình ảnh xác nhận giao dịch là bắt buộc phải tải lên!');
    }
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const user = req.user._id;
    const {
      cryptocurrency, receiver_wallet_address, transaction_network, transaction_amount
    } = req.body;
    const network = await Network.findById(transaction_network)
    if(!network){
      return res.status(400).json({
        error:'Không tìm thấy mạng lưới'
      })
    }
    const cryptocurrencyData = await Cryptocurrency.findOne({
      _id: new mongoose.Types.ObjectId(cryptocurrency),
      default_deposit_enabled: true
    })
    if(!cryptocurrencyData){
      return res.status(400).json({
        error:'Không tìm tiền số này hoặc tiền số này không được phép nạp'
      })
    }
    const transactionImages = [];
    const urlImages = []
    let imageFiles = []
    if (req.files && req.files.transaction_images) {
      imageFiles = Array.isArray(req.files.transaction_images) ? req.files.transaction_images : [req.files.transaction_images];

      for (const imageFile of imageFiles) {
        const uploadResult = await uploadFileAsyncToCloudflare(imageFile);
        const imageUrl = `/get-file-upload/${uploadResult.Key}`;
        urlImages.push(uploadResult.variants[0])
        transactionImages.push({ image_url: imageUrl });
      }
    }

    const transactionHistory = new TransactionHistory({
      user,
      transaction_type: 'deposit',
      cryptocurrency,
      receiver_wallet_address,
      transaction_network,
      transaction_amount,
      transaction_images: transactionImages
    });

    await transactionHistory.save();
    const userData = await User.findById(user);

    const message = `Người dùng: ${userData.full_name}\nMã được giới thiệu: ${userData.referral_code} \nEmail: ${userData.email}\nThao tác: Nạp tiền\nLoại tiền: ${cryptocurrencyData.cryptocurrency_name}\nSố tiền: ${parseFloat(transaction_amount).toLocaleString('en-US', {maximumFractionDigits: 8})} ${cryptocurrencyData.cryptocurrency_name}\nVí nhận: ${receiver_wallet_address}\nMạng lưới: ${network.name} (${network.short_name})`;
    const TELEGRAM_GROUP_EXCHANGE_ID =  getGroupId('exchange')
    try{
      await sendMessageWithImagesToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message, urlImages);
    }catch (e){
      await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);
    }
    res.status(201).json({ message: 'Bạn đã nạp tiền thành công, vui lòng đợi hệ thống xác nhận!' });
  } catch (error) {
    console.error('Error creating transaction history:', error);
    res.status(500).json({ error: 'Đã có lỗi trong quá trình nạp tiền, vui lòng thử lại sau.' });
  }
});

router.post('/buy-cryptocurrency', async (req, res) => {
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
router.post('/sell-vnd', [
    body('cryptocurrencyId').notEmpty().withMessage('Không tìm thấy loại tiền!'),
    body('amount').isFloat({ gt: 0 }).withMessage('Vui lòng điền ít nhất 1 số lớn hơn 0!'),
  ], async (req, res) => {
    try {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }


      const { cryptocurrencyId, amount } = req.body;
      const userId = req.user._id


      const user = await User.findById(userId);
      if(!user){
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
      let exchange_min = user.exchange_min
      let exchange_max = user.exchange_max

      if(!user.exchange_enabled){
        return res.status(400).json({ error: "Tài khoản của bạn không đủ điều kiện để thực hiện bán, vui lòng liên hệ hỗ trợ để được tư vấn." });
      }
      if(user.exchange_remaining_count < 1){
        return res.status(400).json({ error: "SỐ LƯỢT BÁN TRONG NGÀY CỦA BẠN ĐÃ ĐẠT ĐẾN GIỚI HẠN." });
      }

      let  wallet = await Wallet.findOne({ user: userId, cryptocurrency: cryptocurrencyId }).populate('cryptocurrency','_id cryptocurrency_name');

      if(wallet.exchange_min_amount){
        exchange_min = exchange_min > wallet.exchange_min_amount ? exchange_min: wallet.exchange_min_amount
      }
      if(wallet.exchange_max_amount){
        exchange_max = exchange_max > wallet.exchange_max ? exchange_max: wallet.exchange_max_amount
      }
      let balance_before_transaction = null
      if (!wallet) {
       return res.status(404).json({ error: 'Không tìm thấy ví.' });
      } else if(!wallet.exchange_enabled){
        return res.status(403).json({ error: `Trạng thái ví ${wallet.cryptocurrency.cryptocurrency_name} của bạn không cho phép thực hiện thao tác, vui lòng liên hệ hỗ trợ!` });
      }
      else if(exchange_min > amount){
        return res.status(403).json({ error: `Chỉ có thể bán với đơn hàng tối thiểu là ${exchange_min.toLocaleString('en-US', {maximumFractionDigits: 8})} ${wallet.cryptocurrency.cryptocurrency_name}.` });
      }
      else if(exchange_max < amount){
        return res.status(403).json({ error: `Chỉ có thể bán với đơn hàng tối đa là ${exchange_max.toLocaleString('en-US', {maximumFractionDigits: 8})} ${wallet.cryptocurrency.cryptocurrency_name}.` });
      }
      else {
        if(amount > wallet.balance_amount) {
          return res.status(400).json({ error: "Số tiền phải nhỏ hơn số tiền có trong ví" });
        }
        balance_before_transaction = wallet.balance_amount
        wallet.balance_amount -= amount;
      }

      await wallet.save();


      const cryptocurrency = await Cryptocurrency.findById(cryptocurrencyId);

      if (!cryptocurrency) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin tiền mã hóa' });
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
          vndUsdRate = vndUsdRate * (1 + (user.usdt_vnd_exchange_diff) / 100);
        } else  if (user.usdt_vnd_exchange_diff_type === 'value') {
          vndUsdRate = vndUsdRate + user.usdt_vnd_exchange_diff;
        } else  if (user.usdt_vnd_exchange_diff_type === 'default') {
          vndUsdRate = user.usdt_vnd_exchange_diff;
        }
      }
      const vndExchangeRate = usdtExchangeRate * vndUsdRate;
      const roundedAmount = Math.round((vndExchangeRate * amount) * 100) / 100;

      user.vnd_wallet += roundedAmount;
      user.exchange_remaining_count -= 1;
      await user.save()

      const transaction = new TransactionHistory({
        user: userId,
        cryptocurrency: cryptocurrencyId,
        transaction_type: 'sell',
        transaction_rate: vndExchangeRate,
        transaction_amount: amount,
        balance_before_transaction: balance_before_transaction,
        balance_after_transaction: wallet.balance_amount,
        transaction_status: 'success',
        counted: true,
        created_at: new Date(),
      });

      await transaction.save();

      const message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Chuyển đổi từ ${cryptocurrency.cryptocurrency_name} sang VNĐ\nLoại tiền: ${cryptocurrency.cryptocurrency_name}\nSố tiền: ${parseFloat(amount).toLocaleString('en-US', {maximumFractionDigits: 8})} ${cryptocurrency.cryptocurrency_name}\nTỉ giá: ${vndExchangeRate.toLocaleString('en-US', {maximumFractionDigits: 8})}\nSố tiền VNĐ: ${(vndExchangeRate * amount).toLocaleString('en-US', {maximumFractionDigits: 8})} VNĐ`;
      const TELEGRAM_GROUP_EXCHANGE_ID =  getGroupId('exchange')
      await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);

      return res.status(200).json({ message: 'Thực hiện bán thành công!', totalReceived:roundedAmount.toLocaleString('en-US', {maximumFractionDigits: 8}) });

    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: error.message });
    }
  });

router.post('/convert-cryptocurrency', [
  body('fromCryptocurrencyId').notEmpty().withMessage('Vui lòng chọn loại tiền gốc.'),
  body('toCryptocurrencyId').notEmpty().withMessage('Vui lòng chọn loại tiền đích.'),
  body('amount').isFloat({ gt: 0 }).withMessage('Vui lòng nhập số lượng hợp lệ để chuyển đổi.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { fromCryptocurrencyId, toCryptocurrencyId, amount } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }
    if(!user.exchange_enabled){
      return res.status(400).json({ error: "Tài khoản của bạn không đủ điều kiện để thực hiện thao tác này, vui lòng liên hệ hỗ trợ để được tư vấn." });
    }
    if(user.exchange_remaining_count < 1){
      return res.status(400).json({ error: "SỐ LƯỢT CHUYỂN ĐỔI TRONG NGÀY CỦA BẠN ĐÃ ĐẠT ĐẾN GIỚI HẠN." });
    }
    const fromWallet = await Wallet.findOne({ user: userId, cryptocurrency: fromCryptocurrencyId }).populate('cryptocurrency', '_id cryptocurrency_name default_exchange_enabled default_withdraw_enabled');
    const toWallet = await Wallet.findOne({ user: userId, cryptocurrency: toCryptocurrencyId }).populate('cryptocurrency', '_id cryptocurrency_name default_exchange_enabled default_withdraw_enabled');

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ error: 'Không tìm thấy ví.' });
    }

    if(!fromWallet.cryptocurrency.default_exchange_enabled || !toWallet.cryptocurrency.default_withdraw_enabled){
      return res.status(400).json({ error: 'Vui lòng nâng cấp tài khoản để sử dụng tính năng.',type: 'cryptocurrency' });
    }
    if (!fromWallet.exchange_enabled || !toWallet.withdraw_enabled) {
      return res.status(400).json({ error: 'Trạng thái ví không cho phép thực hiện thao tác.' });
    }
    let exchange_min_amount = fromWallet.exchange_min_amount
    if(user.exchange_min > exchange_min_amount){
      exchange_min_amount = user.exchange_min
    }
    if (amount < exchange_min_amount) {
      return res.status(400).json({ error: `Số lượng tối thiểu để chuyển đổi là ${exchange_min_amount.toLocaleString('en-US', {maximumFractionDigits: 8})} ${fromWallet.cryptocurrency.cryptocurrency_name}.` });
    }
    let exchange_max_amount_from = fromWallet.exchange_max_amount

    if(user.exchange_max < exchange_max_amount_from){
      exchange_max_amount_from = user.exchange_max
    }

    if (amount > exchange_max_amount_from) {
      return res.status(400).json({ error: `Số lượng tối đa để chuyển đổi là ${exchange_max_amount_from.toLocaleString('en-US', {maximumFractionDigits: 8})} ${fromWallet.cryptocurrency.cryptocurrency_name}.` });
    }

    if (amount > fromWallet.balance_amount) {
      return res.status(400).json({ error: 'Số dư không đủ để thực hiện chuyển đổi.' });
    }

    const fromCryptocurrency = await Cryptocurrency.findById(fromCryptocurrencyId);
    const toCryptocurrency = await Cryptocurrency.findById(toCryptocurrencyId);

    if (!fromCryptocurrency || !toCryptocurrency) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tiền mã hóa.' });
    }

    const fromUsdtExchangeRate = await getUsdtExchangeRate(fromCryptocurrency,user);
    const toUsdtExchangeRate = await getUsdtExchangeRate(toCryptocurrency,user);

    const exchangeRate = fromUsdtExchangeRate / toUsdtExchangeRate;
    const toAmount = parseFloat((amount * exchangeRate).toFixed(2));

    fromWallet.balance_amount -= amount;
    toWallet.balance_amount += toAmount;
    fromWallet.balance_amount = parseFloat(fromWallet.balance_amount.toFixed(2))
    toWallet.balance_amount = parseFloat(toWallet.balance_amount.toFixed(2))
    await fromWallet.save();
    await toWallet.save();
    user.exchange_remaining_count -= 1
    await user.save()
    const transaction = new TransactionHistory({
      user: userId,
      cryptocurrency: fromCryptocurrencyId,
      cryptocurrency_exchange: toCryptocurrencyId,
      transaction_type: 'exchange',
      transaction_rate: exchangeRate,
      transaction_amount: parseFloat(amount.toFixed(2)),
      balance_before_transaction: fromWallet.balance_amount + amount,
      balance_after_transaction: fromWallet.balance_amount,
      transaction_status: 'success',
      counted: true,
      created_at: new Date(),
    });

    await transaction.save();
    // const message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Chuyển đổi từ ${fromWallet.cryptocurrency.cryptocurrency_name} sang ${toWallet.cryptocurrency.cryptocurrency_name}\nSố tiền chuyển: ${parseFloat(amount).toLocaleString('en-US', {maximumFractionDigits: 8})} ${fromWallet.cryptocurrency.cryptocurrency_name}\nTỉ giá: ${exchangeRate.toLocaleString('en-US', {maximumFractionDigits: 8})}\nSố tiền nhận: ${(toAmount).toLocaleString('en-US', {maximumFractionDigits: 8})} ${toWallet.cryptocurrency.cryptocurrency_name}`;
    // const TELEGRAM_GROUP_EXCHANGE_ID =  getGroupId('exchange')
    // await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);

    res.status(200).json({
      message: 'Chuyển đổi thành công.',
      fromAmount: amount,
      toAmount: toAmount,
    });
  } catch (error) {
    console.error('Failed to convert cryptocurrency:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi chuyển đổi.' });
  }
});

router.post('/withdraw-vnd',
    [
      body('transaction_amount')
          .notEmpty()
          .withMessage('Số tiền giao dịch không được bỏ trống')
          .isNumeric()
          .withMessage('Số tiền giao dịch phải là số'),

      body('local_bank_info.bank_name')
          .notEmpty()
          .withMessage('Tên ngân hàng không được bỏ trống'),
      body('local_bank_info.account_number')
          .notEmpty()
          .withMessage('Số tài khoản ngân hàng không được bỏ trống'),
      body('local_bank_info.account_name')
          .notEmpty()
          .withMessage('Tên người nhận không được bỏ trống')
    ]
    , async (req, res) => {
      const { transaction_amount, local_bank_info, saveBank } = req.body;
      const user_id = req.user._id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      if(transaction_amount <= 0){
        return res.status(400).json({error: 'Số tiền phải lớn hơn 0'})
      }
      try {
        const user = await User.findById(user_id);
        if (user.vnd_wallet < transaction_amount) {
          return res.status(400).json({ error: 'Số dư trong ví VND không đủ' });
        }

        if (user.status === 'locked' || !user.withdraw_enabled) {


          return res.status(400).json({
            error: !user.show_lock_message ? (user.lock_message !== '' ? user.lock_message :  'Hiện tại tài khoản của bạn không được phép thực hiện chức năng này, vui lòng liên hệ CSKH để biết thêm chi tiết.') : 'Hiện tại tài khoản của bạn không được phép thực hiện chức năng này, vui lòng liên hệ CSKH để biết thêm chi tiết.',
            error_limit_time: user.lock_message_limit_time ?? 5
          });
        }
        if(saveBank){
          const newLocalBankAccount = new LocalBankAccount({
            user: user._id,
            name: local_bank_info.name ?? `Tài khoản ${local_bank_info.bank_name}`,
            ...local_bank_info
          });
          await newLocalBankAccount.save();
        }
        const newTransaction = new TransactionHistory({
          user: user_id,
          transaction_amount,
          balance_before_transaction: user.vnd_wallet,
          balance_after_transaction: user.vnd_wallet - transaction_amount,
          transaction_type: 'withdraw-vnd',
          transaction_status: 'pending',
          created_at: new Date(),
          local_bank_info
        });

        await newTransaction.save();



        await User.findByIdAndUpdate({_id: user_id}, { $inc: { vnd_wallet: -transaction_amount } });
        const message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Rút VNĐ về tài khoản ngân hàng địa phương\nSố tiền: ${parseFloat(transaction_amount).toLocaleString('en-US', {maximumFractionDigits: 8})} VNĐ\nTên người hưởng thụ: ${local_bank_info.account_name}\nNgân hàng:${local_bank_info.bank_name}\nSố tài khoản:${local_bank_info.account_number}`;
        const TELEGRAM_GROUP_EXCHANGE_ID =  getGroupId('exchange')
        await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);

        res.status(201).json({ message: 'Thực hiện rút tiền thành công, vui lòng đợi hệ thống phê duyệt.' });
      } catch (error) {
        console.error('Đã xảy ra lỗi khi tạo giao dịch rút VND:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo giao dịch rút VND' });
      }
    });

router.post('/withdraw-crypto/:wallet_id',
    [
      body('transaction_amount')
          .notEmpty()
          .withMessage('Số tiền giao dịch không được bỏ trống')
          .isNumeric()
          .withMessage('Số tiền giao dịch phải là số'),

      body('user_wallet_address.address')
          .notEmpty()
          .withMessage('Địa chỉ ví không được bỏ trống'),
      body('user_wallet_address.network')
          .notEmpty()
          .withMessage('Mạng lưới không được bỏ trống'),

      body('withdraw_pin')
          .notEmpty()
          .withMessage('Mã PIN không được bỏ trống')
          .isNumeric()
          .withMessage('Mã PIN phải là số và có 6 chữ số')
          .isLength({ min: 6, max: 6 })
          .withMessage('Mã PIN phải có 6 chữ số')
    ]
    , async (req, res) => {
      const { transaction_amount, user_wallet_address, saveAddress, withdraw_pin } = req.body;
      const {wallet_id} = req.params
      const user_id = req.user._id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      if(transaction_amount <= 0){
        return res.status(400).json({error: 'Số tiền phải lớn hơn 0'})
      }
      try {
        const user = await User.findById(user_id);

        // Kiểm tra và xử lý mã PIN
        const now = new Date();
        if (now > user.withdraw_pin_reset_time) {
          user.withdraw_pin_attempts = 0;
          user.withdraw_pin_locked = false;
        }

        if (user.withdraw_pin_locked) {
          return res.status(400).json({
            error: 'Bạn đã nhập sai quá nhiều lần, vui lòng đợi trong 24 giờ hoặc đặt lại mã PIN của bạn để được rút tiền.',
            locked_until: user.withdraw_pin_reset_time
          });
        }

        if (user.withdraw_pin !== parseInt(withdraw_pin)) {
          user.withdraw_pin_attempts += 1;

          if (user.withdraw_pin_attempts === 1) {
            user.withdraw_pin_reset_time = new Date(now.getTime() + 30 * 60000); // 30 minutes
          }

          if (user.withdraw_pin_attempts >= 5) {
            user.withdraw_pin_locked = true;
            user.withdraw_pin_reset_time = new Date(now.getTime() + 24 * 60 * 60000); // 24 hours
            await user.save();
            return res.status(400).json({
              error: 'Bạn đã nhập sai quá nhiều lần, vui lòng đợi trong 24 giờ hoặc đặt lại mã PIN của bạn để được rút tiền.',
              locked_until: user.withdraw_pin_reset_time
            });
          }

          await user.save();
          return res.status(400).json({
            error: `Mã PIN không chính xác, bạn còn ${5-user.withdraw_pin_attempts} lần nhập.`,
            attempts: user.withdraw_pin_attempts
          });
        }

        const wallet = await Wallet.findOne({ user: user_id, _id:wallet_id }).populate('cryptocurrency','cryptocurrency_name');
        if (!wallet || wallet.balance_amount < transaction_amount) {
          return res.status(400).json({ error: 'Số dư trong ví không đủ' });
        }

        if (wallet.withdraw_min_amount && wallet.withdraw_min_amount > transaction_amount) {
          return res.status(400).json({ error: `Số tiền rút của bạn phải lớn hơn hoặc bằng ${wallet.withdraw_min_amount.toLocaleString('en-US', {maximumFractionDigits: 8})} ${wallet.cryptocurrency.cryptocurrency_name}` });
        }

        if (user.status === 'locked' || !wallet.withdraw_enabled) {
          return res.status(400).json({
            error: !user.show_lock_message ? (user.lock_message !== '' ? user.lock_message : 'Hiện tại tài khoản của bạn không được phép thực hiện chức năng này, vui lòng liên hệ CSKH để biết thêm chi tiết.') : 'Hiện tại tài khoản của bạn không được phép thực hiện chức năng này, vui lòng liên hệ CSKH để biết thêm chi tiết.',
            error_limit_time: user.lock_message_limit_time ?? 5
          });
        }

        const network = await Network.findById(user_wallet_address.network)
        if (!network) {
          return res.status(400).json({ error: 'Không tìm thấy mạng lưới' });
        }
        if(saveAddress){
          const newUserWalletAddress = new UserWalletAddress({
            user: user._id,
            name: user_wallet_address.name,
            address: user_wallet_address.address,
            network: user_wallet_address.network,
            cryptocurrency: wallet.cryptocurrency._id
          });
          await newUserWalletAddress.save();
        }

        const newTransaction = new TransactionHistory({
          user: user_id,
          transaction_amount,
          balance_before_transaction: wallet.balance_amount,
          balance_after_transaction: wallet.balance_amount - transaction_amount,
          transaction_type: 'withdraw',
          transaction_status: 'pending',
          cryptocurrency: wallet.cryptocurrency._id,
          created_at: new Date(),
          receiver_wallet_address:user_wallet_address.address,
          transaction_network:network.short_name,
        });

        await newTransaction.save();

        await Wallet.findByIdAndUpdate(wallet._id, { $inc: { balance_amount: -transaction_amount } });
        user.withdraw_verify_code = null
        user.withdraw_verify_code_expiry = null
        await user.save()

        const message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Rút ${wallet.cryptocurrency.cryptocurrency_name} về ví ngoài\nSố tiền: ${parseFloat(transaction_amount).toLocaleString('en-US', {maximumFractionDigits: 8})} ${wallet.cryptocurrency.cryptocurrency_name}\nĐịa chỉ ví: ${user_wallet_address.address}\nMạng lưới: ${network.short_name}`;
        const TELEGRAM_GROUP_EXCHANGE_ID =  getGroupId('exchange')
        await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);


        const withdrawalCoinName = wallet.cryptocurrency.cryptocurrency_name
        const withdrawalAmount = parseFloat(transaction_amount).toLocaleString('en-US', {maximumFractionDigits: 8})

        await sendEmail(
            user.email,
            'Xác nhận rút tiền thành công',
            'email-templates/with-draw-email-template',
            {
              withdrawalCoinName: withdrawalCoinName,
              withdrawalAmount: withdrawalAmount,
              fullName: user.full_name
            }
        );

        res.status(201).json({ message: 'Thực hiện rút tiền thành công, vui lòng đợi hệ thống phê duyệt.' });
      } catch (error) {
        console.error('Đã xảy ra lỗi khi tạo giao dịch rút crypto:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo giao dịch rút crypto' });
      }
    });
router.post('/send-verify-code-withdraw', async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const verificationCode = generateRandomNumber(6).toUpperCase()


    user.withdraw_verify_code = verificationCode;
    user.withdraw_verify_code_expiry = Date.now() + 900000; // 15 minutes expiry
    await user.save();

    // Gửi email xác minh

    await sendEmail(
        user.email,
        'Mã xác nhận rút tiền của bạn',
        'email-templates/with-draw-code-verification',
        {
          fullName: user.full_name,
          withdrawVerificationCode: verificationCode
        }
    );

    res.status(200).json({ message: 'Mã xác nhận đã được gửi đi, vui lòng kiểm tra email của bạn. Nếu không thấy, vui lòng kiểm tra hòm thư rác của bạn' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;

