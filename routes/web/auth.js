const bcrypt = require('bcryptjs');
let express = require('express');
let router = express.Router();
let User = require('../../model/users')
const jwt = require('jsonwebtoken');
const { validationResult, check} = require('express-validator');
const TOKEN_SECRET = process.env.TOKEN_SECRET;

router.get('/login', async (req, res, next) => {
  try {

    const token = req.cookies.token;

    if (token) {
      try {

        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.id, email: decoded.email, secretKey: decoded.secretKey });
        if (user.status === 'pending') {
          res.clearCookie('token');
          return res.render('resources/login/index', {
            message: 'Tài khoản của bạn đang đợi xác nhận. Vui lòng đợi quản trị viên xác nhận tài khoản của bạn.',
            status: 1
          });
        }
        if (user) {
          req.user = user
          return res.redirect('/dashboard');
        }
      } catch (err) {
        res.clearCookie('token');
      }
    }
    res.render('resources/login/index');
  } catch (error) {
    next(error);
  }
});
router.get('/signup', async (req, res, next) => {
  try {

    const token = req.cookies.token;

    if (token) {
      try {

        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.id, email: decoded.email, secretKey: decoded.secretKey });



        if (user) {
          req.user = user
          return res.redirect('/dashboard');
        }
      } catch (err) {
        res.clearCookie('token');
      }
    }
    res.render('resources/signup/index');
  } catch (error) {
    next(error);
  }
});



router.get('/logout', async (req, res,next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      try {

        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.id, email: decoded.email, secretKey: decoded.secretKey });

        if (user) {
          user.secretKey = null
        }
      } catch (err) {
        console.log(err)
      }
    }
    res.clearCookie('token');
    return res.redirect('/login');
  } catch (error) {
    next(error);
  }


});
router.get('/reset-password', async (req, res,next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      try {

        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.id, email: decoded.email, secretKey: decoded.secretKey });

        if (user) {
          req.user = user
          return res.redirect('/dashboard');
        }
      } catch (err) {
        res.clearCookie('token');
      }
    }
    res.render('resources/reset-password/index');
  } catch (error) {
    next(error);
  }
});
router.get('/privacy-policy', async (req, res,next) => {
  try {
    res.render('resources/privacy-policy');
  } catch (error) {
    next(error);
  }
});
router.post('/questions', async (req, res,next) => {
  try {
    res.render('resources/question');
  } catch (error) {
    next(error);
  }
});
router.get('/verify-email', [
  check('userId').isMongoId().withMessage('Invalid user ID'),
  check('token').isLength({ min: 6 }).withMessage('Invalid verification token'),
], async (req, res) => {
  try {


    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).redirect('/404');
    }

    const { userId, token } = req.query;

    // Tìm người dùng theo userId
    const user = await User.findOne({
      _id: userId,
      email_verify_code: token
    });

    // Kiểm tra người dùng và mã xác minh email
    if (!user || user.email_verify_code !== token) {
      return res.status(404).redirect('/404');
    }

    // Xác minh email
    user.email_verified = true;
    user.email_verify_code = undefined;
    await user.save();

    // Chuyển hướng hoặc trả về thông báo thành công
    res.render('resources/email-verified');
  } catch (err) {
    console.error('Error verifying email:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;


