let express = require('express');
let router = express.Router();
const User = require('../../model/users');
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator');

router.get('/',async (req,res) => {
  
    try {
        const userId = req.user._id;
       
        const user = await User.findById(userId).select('_id user_name email');
        
        res.json({
          _id: user._id,
          user_name: user.user_name,
          email: user.email,
        });
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: err });
      }
});

router.put('/password',
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại phải có'),
  body('newPassword').isEmail().withMessage('Mật khẩu mới phải có'),
  async (req, res) => {
  try {
    const id = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Tìm người dùng trong cơ sở dữ liệu
    const user = await User.findById(id);

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect',code: 'incorrectCurrentPassword' });
    }

    // Mã hóa mật khẩu mới
    let salt = bcrypt.genSaltSync(10);
    let hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Cập nhật mật khẩu mới cho người dùng
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/info', [
  body('user_name').notEmpty().withMessage('User name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
], async (req, res) => {
  try {
    const id = req.user._id;
    const { user_name, email, phone } = req.body;

    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });;
    }

    // Tìm người dùng trong cơ sở dữ liệu
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra email đã tồn tại hay chưa
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser._id.toString() !== id) {
      return res.status(400).json({ message: 'Email already exists',code: 'email' });
    }

    // Cập nhật thông tin người dùng
    user.user_name = user_name;
    user.email = email;

    await user.save();

    return res.json({ message: 'User information updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;

