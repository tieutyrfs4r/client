const { default: mongoose } = require('mongoose');
const User = require('../../../model/users');
const jwt = require('jsonwebtoken');
const TOKEN_SECRET = process.env.TOKEN_SECRET;

const clientAuthenticateToken = async (req, res, next) => {
    const token = req.cookies.token;

    try {

        if (!token) {
            return res.sendStatus(403);
        }
       try{
           const decoded = jwt.verify(token, TOKEN_SECRET);
           const { id, secretKey, exp } = decoded;

           if (Date.now() >= exp * 1000) {
               return res.sendStatus(401);
           }
           const user = await User.findOne({ _id: id });

           if(user.secretKey !== secretKey){
               return res.sendStatus(403);
           }

           if (!user) {
               return res.sendStatus(404);
           }
           req.user = user;
           next();

       }catch (error){
           return res.sendStatus(403);
       }
    } catch (err) {
        console.error(err);
        return res.sendStatus(400);
    }
};

module.exports = {
    clientAuthenticateToken
};