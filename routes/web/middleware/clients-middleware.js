const jwt = require("jsonwebtoken");
const User = require("../../../model/users");
const VerifyUser = require("../../../model/verifies_user");
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const handleInternalServerError = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { page_name: '500' });
}

const handleNotFound = (req, res, next) => {
    try {
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`DIA CHI IP: ${userIP}`);
        const userAgent = req.headers['user-agent'];
        console.log(`TRINH DUYET: ${userAgent}`);
    } catch (e) {
        console.log(e);
    }
    res.status(404).render('404', { page_name: '404 | Not Found' });
}
const authClientsMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ cookie
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.id, secretKey: decoded.secretKey });

        if (!user) {
            return res.redirect('/login');
        }

        req.user = user;

        if(req.user.status === 'pending'){
            return res.redirect('/login');
        }

        const verifies_user_count = await VerifyUser.count({ user: user._id, allow_appeal: true });

        req.app.set('verifies_user_count', verifies_user_count);
        req.app.set('user', user);
        // req.app.set('first_name', user.first_name);
        // req.app.set('last_name', user.last_name);
        // req.app.set('avatar_url', user.avatar);
        // req.app.set('balances', balances);

        next();
    } catch (err) {
        console.error(err);
        return res.redirect('/login');
    }
};
const refreshTokenMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, TOKEN_SECRET);
            const { id, secretKey } = decoded;

            const newToken = jwt.sign(
                { id, secretKey },
                TOKEN_SECRET,
                { expiresIn: '30m' }
            );

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 60 * 1000, // 30 minutes
            });
        } catch (err) {
            console.error(err);
        }
    }

    next();
};
module.exports = {
    refreshTokenMiddleware,
    handleInternalServerError,
    handleNotFound,
    authClientsMiddleware
}
