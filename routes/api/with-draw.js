const express = require('express');
const router = express.Router();
const Wallet = require('../../model/wallets');
const User = require('../../model/users');
// Route để lấy thông tin ví của người dùng
router.get('/',async (req, res) => {
    const userId = req.user.id; // Lấy id của người dùng hiện tại từ session hoặc token
    const user = await User.findById(userId);
    if(!user){
        return res.status(404).json({error: 'User Not Found'});
    }
    try {
      const wallets = await Wallet.find({ user: userId }).select('balance_amount cryptocurrency withdraw_min_amount exchange_min_amount temporarily_withheld').populate({
        path: 'cryptocurrency',
        select: 'cryptocurrency_name'
      })
  
      if (wallets.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy ví cho người dùng này' });
      }
      const walletsJson = wallets.map(item => {
        const walletJson = item.toJSON();
        delete walletJson.__v;
        return walletJson;
      });

      // Trả về thông tin ví của người dùng
      res.json({  wallets: walletsJson, vnd_wallet : user.vnd_wallet });
    } catch (err) {
      console.error('Đã xảy ra lỗi khi lấy thông tin ví:', err);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin ví' });
    }
});


module.exports = router;