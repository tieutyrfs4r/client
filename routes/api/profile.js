require('dotenv').config();
let express = require('express');
let router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../../model/users');
const Level = require('../../model/levels');
const bcrypt = require('bcryptjs');
const {removeFilesFromCloudflare, uploadFileAsyncToCloudflare, generateRandomString, sendEmail, generateRandomNumber} = require("../../helpers/common");
const DOMAIN_WEBSITE = process.env.DOMAIN_WEBSITE;

router.get('/', async (req, res) => {
  try {

    const user = await User.findById(req.user.id).populate('level','level_name referral_enabled stars')
        .select('_id full_name withdraw_pin_attempts withdraw_pin_reset_time withdraw_pin_locked invite_code address date_of_birth email phone_number ward district province avatar email_verified');

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const userInfo = {
      _id: user._id,
      full_name: user.full_name,
      address: user.address,
      date_of_birth: user.date_of_birth,
      email: user.email,
      ward: user.ward,
      district: user.district,
      province: user.province,
      avatar: user.avatar,
      phone_number: user.phone_number,
      email_verified: user.email_verified,
      level: user.level,
      invite_code: user.invite_code,
      withdraw_pin_attempts:user.withdraw_pin_attempts,
      withdraw_pin_reset_time: user.withdraw_pin_reset_time,
      withdraw_pin_locked: user.withdraw_pin_locked
    };

    return res.json(userInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});


router.put('/', [
  body('date_of_birth').optional().notEmpty().withMessage('Ngày sinh không được để trống'),
  body('address').optional().notEmpty().withMessage('Địa chỉ không được để trống'),
  body('ward').optional().notEmpty().withMessage('Phường/Xã không được để trống'),
  body('district').optional().notEmpty().withMessage('Quận/Huyện không được để trống'),
  body('province').optional().notEmpty().withMessage('Tỉnh/Thành phố không được để trống'),
  body('phone_number').optional().notEmpty().withMessage('Số điện thoại không được để trống'),
  body('update_info_verify_code').optional().notEmpty().withMessage('Mã xác nhận không được để trống'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const user = await User.findById(req.user.id).populate('level','_id stars level_name');

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }


    const { date_of_birth, phone_number, address, ward, district, province,old_password,new_password, update_info_verify_code } = req.body;
    if(user.update_info_verify_code !== update_info_verify_code || !user.update_info_verify_code){
      return res.status(404).json({ error: 'Mã xác nhận không chính xác' });
    }
    const currentTime = new Date();

    if (user.update_info_verify_code_expire < currentTime || !user.update_info_verify_code_expire) {
      return res.status(400).json({ error: 'Mã xác nhận đã hết hạn' });
    }

    if (date_of_birth) user.date_of_birth = date_of_birth;
    if (address) user.address = address;
    if (ward) user.ward = ward;
    if (district) user.district = district;
    if (province) user.province = province;
    if (phone_number) user.phone_number = phone_number;
    if (old_password) {
      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
      }
      if (new_password) {

        if (new_password.length < 6) {
          return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        user.password = hashedPassword;
        user.decode_password = new_password;
      }
    }
    user.update_info_verify_code = null
    user.update_info_verify_code_expire = null
    await user.save();
    const userData = await User.findById(user._id).populate('level','_id stars level_name');
    const userInfo = {
      _id: user._id,
      full_name: user.full_name,
      address: user.address,
      date_of_birth: user.date_of_birth,
      email: user.email,
      ward: user.ward,
      district: user.district,
      province: user.province,
      avatar: user.avatar,
      phone_number: user.phone_number,
      email_verified: user.email_verified,
      level: userData.level,
      update_info_verify_code: null,
      update_info_verify_code_expire: null
    };

    return res.json(userInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

router.post('/update-avatar', [
  body('avatar').custom((value, { req }) => {
    if (!req.files || !req.files.avatar) {
      throw new Error('File avatar không được để trống');
    }
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const file = req.files.avatar;


    const uploadedFile = await uploadFileAsyncToCloudflare(file);


    const newAvatarUrl = `/get-file-upload/${uploadedFile.Key}`;


    if (user.avatar) {
      const oldAvatarKey = user.avatar.replace('/get-file-upload/', '');
      try{
        await removeFilesFromCloudflare([oldAvatarKey]);
      }catch (e) {
        console.log('co loi khi xoa file')
      }
    }

    user.avatar = newAvatarUrl;
    await user.save();

    return res.json({ avatar: newAvatarUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});
router.post('/send-verification-code', async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Tạo mã xác minh email ngẫu nhiên
    const verificationCode = generateRandomString(32).toLowerCase()

    // Cập nhật mã xác minh email cho người dùng
    user.email_verify_code = verificationCode;
    await user.save();

    // Gửi email xác minh
    const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?userId=${user._id}&token=${verificationCode}`;
    await sendEmail(
        user.email,
        'Xác minh địa chỉ email của bạn',
        'email-templates/email-verification',
        {
          fullName: user.full_name,
          verificationLink: verificationLink
        }
    );

    res.status(200).json({ message: 'Mã xác nhận đã được gửi đi, vui lòng kiểm tra email của bạn. Nếu không thấy, vui lòng kiểm tra hòm thư rác của bạn' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/update-withdraw-pin', [
  body('new_pin')
      .notEmpty().withMessage('Mã PIN mới không được để trống')
      .isNumeric().withMessage('Mã PIN mới phải là số')
      .isLength({ min: 6, max: 6 }).withMessage('Mã PIN mới phải có 6 chữ số'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  body('update_info_verify_code').notEmpty().withMessage('Mã xác nhận không được để trống'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { new_pin, password, update_info_verify_code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra mã xác nhận
    if (user.update_info_verify_code !== update_info_verify_code || !user.update_info_verify_code) {
      return res.status(400).json({ error: 'Mã xác nhận không chính xác' });
    }

    const currentTime = new Date();
    if (user.update_info_verify_code_expire < currentTime || !user.update_info_verify_code_expire) {
      return res.status(400).json({ error: 'Mã xác nhận đã hết hạn' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu không đúng' });
    }

    // Cập nhật mã PIN mới
    user.withdraw_pin = parseInt(new_pin);
    user.withdraw_pin_attempts = 0;
    user.withdraw_pin_locked = false;
    user.withdraw_pin_reset_time = null;
    user.update_info_verify_code = null;
    user.update_info_verify_code_expire = null;

    await user.save();

    res.status(200).json({ message: 'Cập nhật mã PIN thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});
router.post('/send-verify-code-update-info', async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const verificationCode = generateRandomNumber(6).toUpperCase()


    user.update_info_verify_code = verificationCode;
    user.update_info_verify_code_expire = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    // Gửi email xác minh

    await sendEmail(
        user.email,
        'Cập nhật lại thông tin của bạn',
        'email-templates/update-info-code-verification',
        {
          fullName: user.full_name,
          updateInfoVerifyCode: verificationCode
        }
    );

    res.status(200).json({ message: 'Mã xác nhận đã được gửi đi, vui lòng kiểm tra email của bạn. Nếu không thấy, vui lòng kiểm tra hòm thư rác của bạn' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/get-invite-link', async (req, res) => {
  try {

    const user = await User.findById(req.user._id).populate('level','referral_enabled');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.level.referral_enabled) {
      return res.status(404).json({ message: 'User cannot invite' });
    }
    return res.json({
      invite_ur: `https://${DOMAIN_WEBSITE}/signup?i=${user.invite_code}`
    })

  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;