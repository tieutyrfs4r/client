const createError = require('http-errors');
const config = require('./config/index');
const db = require('./config/db');
const serverConfig = require('./config/server');
const modules = require('./config/module');
const app = serverConfig.app;
const clientsApiRoute = require('./routes/api')
const cron = require('node-cron');
const webClientsRoute = require('./routes/web')
const User = require('./model/users')
const Cryptocurrency = require('./model/cryptocurrencies')
const TIDIO_URL = process.env.TIDIO_URL;
const WEBSITE_NAME = process.env.WEBSITE_NAME;

async function resetCounts() {
    try {
        const users = await User.find({});
        for (const user of users) {
            try {
                user.withdraw_remaining_count = user.withdraw_limit_count;
                user.exchange_remaining_count = user.exchange_limit_count;
                await user.save();
                console.log(`Exchange and withdraw counts reset successfully for user ${user._id}`);
            } catch (error) {
                console.error(`Error resetting exchange and withdraw counts for user ${user._id}:`, error);
            }
        }
        console.log('Exchange and withdraw counts reset completed');
    } catch (error) {
        console.error('Error getting users:', error);
    }
}
cron.schedule('0 0 * * *', resetCounts, {
    timezone: 'Asia/Ho_Chi_Minh'
});

async function makeRandomPriceCrypto() {
    await Cryptocurrency.updateMany(
        { usdt_price_diff_type: 'default', usdt_price_diff_round: { $ne: 0 } },
        [
            {
                $set: {
                    usdt_price_diff_round_value: {
                        $subtract: [
                            { $multiply: [Math.random(), { $multiply: ['$usdt_price_diff_round', 2] }] },
                            '$usdt_price_diff_round'
                        ]
                    }
                }
            }
        ]
    );
}
async function makeRandomPriceVND() {
    await User.updateMany(
        { usdt_vnd_exchange_diff_enabled: true, usdt_vnd_exchange_diff_type: 'default', usdt_vnd_exchange_diff_round: { $ne: 0 } },
        [
            {
                $set: {
                    usdt_vnd_exchange_diff_round_value: {
                        $subtract: [
                            { $multiply: [Math.random(), { $multiply: ['$usdt_vnd_exchange_diff_round', 2] }] },
                            '$usdt_vnd_exchange_diff_round'
                        ]
                    }
                }
            }
        ]
    );
}
cron.schedule('*/5 * * * * *', makeRandomPriceCrypto);
cron.schedule('*/5 * * * * *', makeRandomPriceVND);

const {getFileFromCloudflare} = require("./helpers/common");
//

modules.init(app);
db.init(config);
console.log(`server listion on ${process.env.PORT || config.app.port}`)
app.set('TIDIO_URL',TIDIO_URL)
app.set('WEBSITE_NAME',WEBSITE_NAME)

app.use('/',webClientsRoute);
app.use('/api',clientsApiRoute);

app.get('/get-file-upload/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const fileInfo = await getFileFromCloudflare(key);
        if (!fileInfo) {
            return res.status(404).json({ error: 'File not found' });
        }
        const fileUrl = fileInfo.variants[0];
        res.redirect(fileUrl);
    } catch (e) {

        return res.status(500).json({ error: 'Internal server error' });
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  return res.status(404).render('404')
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.error = {};
    console.log(err.stack);
  // render the error page
  res.status(err.status || 500);
  res.render('500');
});
module.exports = app;
