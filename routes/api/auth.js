const bcrypt = require('bcryptjs');
let express = require('express');
let router = express.Router();
let User = require('../../model/users')
let Administrator = require('../../model/administrators')
let Cryptocurrency = require('../../model/cryptocurrencies')
let Wallet = require('../../model/wallets')
const jwt = require('jsonwebtoken');
const { body,validationResult  } = require('express-validator');
const { has } = require('lodash');
const TOKEN_SECRET = process.env.TOKEN_SECRET
const {generateRandomString, sendEmail,getGroupId, sendMessageToTelegramGroup, generateRandomNumber} = require('../../helpers/common')

const geoip = require('geoip-lite');
router.post('/login', async (req, res, next) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json( {
        error: 'Email hoặc mật khẩu không đúng',
        code: 'notFound'
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json( {
        error: 'Email hoặc mật khẩu không đúng',
        code: 'notMatch'
      });
    }
    // if (user.status === 'locked') {
    //   return res.status(400).json({
    //     error: user.lock_message,
    //     code: 'locked'
    //   });
    // }
    if (!user.email_verified) {
      return res.status(400).json({
        error: 'Vui lòng xác nhận email của bạn trước khi đăng nhập. Đường dẫn xác nhận đã được gửi về email của bạn.',
        code: 'email_verified'
      });
    }
    if (user.status === 'pending') {
      return res.status(400).json({
        error: 'Tài khoản của quý khách đang đợi phê duyệt!',
        code: 'status'
      });
    }

    const newSecretKey = generateRandomString();
    user.secretKey = newSecretKey;



    await user.save();

    // Tạo payload và token
    const payload = { id: user._id, email: user.email, secretKey: newSecretKey };
    const expiresIn = '30m';
    const token = jwt.sign(payload, TOKEN_SECRET, {expiresIn });
    res.user = user
    // Lưu token vào cookie
    res.cookie('token', token, {
      maxAge: 30 * 60 * 1000, // Thời gian sống của cookie là 24 giờ
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    try{
      const loginTime = new Date();
      const formattedDate = loginTime.toLocaleDateString('vi-VN');
      const formattedTime = loginTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const message = `Tên người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Đăng nhập\nThời gian: ${formattedTime} ${formattedDate}`;

      const TELEGRAM_GROUP_LOGIN_ID = getGroupId('login');
      await sendMessageToTelegramGroup(TELEGRAM_GROUP_LOGIN_ID, message);

    }catch (e){
      console.log('lỗi khi gửi thông tin đến telegram')
      console.log(e)
    }

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      expiresIn
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Không có token được cung cấp' });
    }

    const decoded = jwt.verify(token, TOKEN_SECRET);

    const user = await User.findOne({ _id: decoded.id, email: decoded.email, secretKey: decoded.secretKey });

    if (!user) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    user.secretKey = null;
    await user.save();

    res.clearCookie('token');

    return res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

router.post('/register',
    body('email').notEmpty().isEmail().custom(value => {
      return User.findOne({ email: value },'_id').then(user => {
        if (user) {
          return Promise.reject('Email đã tồn tại');
        }
      })
    }),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc hợp lệ').isLength({ min: 6 }).withMessage('Mật khẩu ít nhất là 6 ký tự'),
    body('referral_code').notEmpty().withMessage('Vui lòng điền mã giới thiệu').custom(async (value, { req }) => {
      try {
        const admin = await Administrator.findOne({ invite_code: { $regex: new RegExp('^' + value + '$', 'i') } }, '_id');
        if (admin) {
          return true;
        }

        const user = await User.findOne({ invite_code: { $regex: new RegExp('^' + value + '$', 'i') } }).populate('level');
        if (user) {
          if (user.level && user.level.referral_enabled) {
            return true;
          } else {
            throw new Error('Mã giới thiệu không tồn tại');
          }
        }

        throw new Error('Mã giới thiệu không tồn tại');
      } catch (error) {
        return Promise.reject(error.message);
      }
    }),
    body('full_name').notEmpty().withMessage('Họ và tên là bắt buộc'),
    body('address').notEmpty().withMessage('Địa chỉ là bắt buộc'),
    body('ward').notEmpty().withMessage('Phường/Xã là bắt buộc'),
    body('district').notEmpty().withMessage('Quận/Huyện là bắt buộc'),
    body('province').notEmpty().withMessage('Tỉnh/Thành phố là bắt buộc'),
    body('phone_number').notEmpty().withMessage('Số điện thoại là bắt buộc'),
    body('date_of_birth').notEmpty().withMessage('Ngày sinh là bắt buộc').isISO8601().toDate(),
    async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      let {full_name, email, password,  referral_code, address, ward, district, province,phone_number, date_of_birth} = req.body
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(password, salt);
      let user = new User()
      user.full_name = full_name
      user.email = email
      user.password = hash
      user.decode_password = password;
      user.referral_code = referral_code
      user.address = address
      user.ward = ward
      user.district = district
      user.phone_number = phone_number
      user.created_at = Date.now()
      user.province = province
      user.date_of_birth = date_of_birth
      user.avatar = '/assets/images/profile_av.svg'
      user.invite_code = generateRandomString(6).toUpperCase()
      try {
        await user.save();

        const verificationCode = generateRandomString(32).toLowerCase()

        user.email_verify_code = verificationCode;
        await user.save();
        const cryptocurrencies = await Cryptocurrency.find({ default_use_enabled: true });
        const wallets = cryptocurrencies.map(crypto => ({
          user: user._id,
          cryptocurrency: crypto._id,
          balance_amount: 0,
        }));
        await Wallet.insertMany(wallets);

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

        res.json({
          message: 'Đăng ký thành công'
        });
        try {
          const loginTime = new Date();
          const formattedTime = loginTime.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });

          let referral_admin = await Administrator.findOne({ invite_code: { $regex: new RegExp('^' + referral_code + '$', 'i') } });
          let referral_user;
          if (!referral_admin) {
            referral_user = await User.findOne({ invite_code: { $regex: new RegExp('^' + referral_code + '$', 'i') } }).populate('level');
          }

          let referralText = referral_admin
              ? 'ADMIN'
              : (referral_user ? `${referral_user.full_name} - ${referral_user.email}` : 'Không có');

          const message = `Người dùng: ${user.full_name}\nEmail: ${user.email}\nThao tác: Đăng ký tài khoản\nMã GT: ${referral_code}\nNgười giới thiệu: ${referralText}\nNgày tháng: ${formattedTime}`;

          const TELEGRAM_GROUP_EXCHANGE_ID = getGroupId('exchange');
          await sendMessageToTelegramGroup(TELEGRAM_GROUP_EXCHANGE_ID, message);
        } catch (e) {
          console.log('Lỗi khi gửi thông tin đến Telegram');
          console.log(e);
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          error: 'Lỗi máy chủ nội bộ'
        });
      }
    }
);

router.post('/send-reset-password-code',
    body('email').notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ')
    ,async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const {email} = req.body

    const user = await User.findOne({
      email: email
    });

    if (!user) {
      return res.json({ message: 'code reset-password sent', error: 1 });
    }



    const verificationCode = generateRandomNumber(6).toUpperCase()


    user.recovery_password_token = verificationCode;
    user.recovery_password_token_expire = Date.now() + 3600000; // 1 hour expiry
    await user.save();


    const verificationLink = `${req.protocol}://${req.get('host')}/reset-password?email=${email}&step=reset_password&token=${verificationCode}`;
    await sendEmail(
        user.email,
        'Xác minh địa chỉ email của bạn',
        'email-templates/reset-password',
        {
          fullName: user.full_name,
          verificationLink: verificationLink,
          verificationCode: verificationCode
        }
    );

    res.status(200).json({ message: 'code reset-password sent' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.post('/reset-password',
    body('email').notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ'),
    body('new_password').notEmpty().withMessage('Mật khẩu mới là bắt buộc').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('reset_code').notEmpty().withMessage('Mã đặt lại mật khẩu là bắt buộc'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { new_password, reset_code,email } = req.body;

        const user = await User.findOne({email: email, recovery_password_token: reset_code });

        if (!user) {
          return res.status(400).json({ error: 'Mã đặt lại mật khẩu không hợp lệ' });
        }

        const currentTime = new Date();
        if (user.recovery_password_token_expire < currentTime) {
          return res.status(400).json({ error: 'Mã đặt lại mật khẩu đã hết hạn' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(new_password, salt);

        user.password = hash;
        user.recovery_password_token = null;
        user.recovery_password_token_expire = null;

        await user.save();

        return res.json({ message: 'Đặt lại mật khẩu thành công' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
      }
    }
);
router.post('/resend-verification-code', [    body('email').notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ')],async (req, res) => {
  try {

    const user = await User.findOne({email: req.body.email});

    if (!user) {
      return res.json({ message: 'Mã xác nhận đã được gửi đi.',error: 1 });
    }


    const verificationCode = generateRandomString(32).toLowerCase()


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

    res.status(200).json({ message: 'Mã xác nhận đã được gửi đi.',error: 0 });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;