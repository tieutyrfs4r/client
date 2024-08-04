const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate-v2');
const Wallet = require('./wallets');
const TransactionHistory = require('./transaction_histories');
const { removeFilesFromCloudflare } = require('../helpers/common');
let CryptocurrencySchema = new mongoose.Schema({
    cryptocurrency_name: {
        type: String,
        required: true
    },
    usdt_price_diff_type: {
        type: String,
        enum: ['percentage', 'value','default']
    },
    usdt_price_diff: {
        type: Number
    },
    usdt_price_diff_round: {
        type: Number,
        default: 0.001
    },
    usdt_price_diff_round_value: {
        type: Number,
        default: 0
    },
    img_url: {
        type: String
    },
    api_url: {
        type: String
    },
    default_use_enabled: {
        type: Boolean,
        default: false
    },
    default_withdraw_enabled: {
        type: Boolean,
        default: false
    },
    default_deposit_enabled: {
        type: Boolean,
        default: false
    },
    default_exchange_enabled: {
        type: Boolean,
        default: false
    },
});

CryptocurrencySchema.plugin(mongoosePaginate);
async function deleteRelatedData(cryptocurrencyId) {
    try {
        const cryptocurrency = await Cryptocurrency.findById(cryptocurrencyId);
        if (cryptocurrency && cryptocurrency.img_url) {
            await removeFilesFromCloudflare([cryptocurrency.img_url.replace('/get-file-upload/', '')]);
        }
        await Wallet.deleteMany({ cryptocurrency: cryptocurrencyId });
        await TransactionHistory.deleteMany({ cryptocurrency: cryptocurrencyId });
    } catch (error) {
        throw error;
    }
}

CryptocurrencySchema.pre('remove', async function (next) {
    try {
        await deleteRelatedData(this._id);
        next();
    } catch (error) {
        next(error);
    }
});
CryptocurrencySchema.pre('findOneAndDelete', async function (next) {
    try {
        const cryptocurrency = await this.model.findOne(this.getQuery());
        if (cryptocurrency) {
            await deleteRelatedData(cryptocurrency._id);
        }
        next();
    } catch (error) {
        next(error);
    }
});
CryptocurrencySchema.pre('deleteOne', async function (next) {
    try {
        const cryptocurrency = await this.model.findOne(this.getQuery());
        if (cryptocurrency) {
            await deleteRelatedData(cryptocurrency._id);
        }
        next();
    } catch (error) {
        next(error);
    }
});

CryptocurrencySchema.pre('deleteMany', async function (next) {
    try {
        const cryptocurrencyIds = await this.model.distinct('_id', this.getQuery());
        await Promise.all(cryptocurrencyIds.map(deleteRelatedData));
        next();
    } catch (error) {
        next(error);
    }
});
let Cryptocurrency = mongoose.model('Cryptocurrency', CryptocurrencySchema);

module.exports = Cryptocurrency;