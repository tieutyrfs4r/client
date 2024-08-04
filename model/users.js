const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate-v2');
const Wallet = require('./wallets');
const Cryptocurrency = require('./cryptocurrencies');
const TransactionHistory = require('./transaction_histories');
const VerifiesUser = require('./verifies_user');
const {removeFilesFromCloudflare} = require("../helpers/common");

let UserSchema = new mongoose.Schema({
    full_name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true,
    },
    decode_password: {
        type: String
    },
    avatar: {
        type: String,
    },
    address: {
        type: String,
    },
    ward: {
        type: String,
    },
    district: {
        type: String,
    },
    province: {
        type: String,
    },
    date_of_birth: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    email_verify_code: {
        type: String
    },
    recovery_password_token: {
        type: String
    },
    recovery_password_token_expire: {
        type: Date
    },
    update_info_verify_code: {
        type: String
    },
    update_info_verify_code_expire: {
        type: Date
    },
    withdraw_verify_code: {
        type: String
    },
    withdraw_verify_code_expire: {
        type: Date
    },
    withdraw_pin: {
        type: Number,
        min: 100000,  // Ensure at least 6 digits
        max: 999999,  // Ensure at most 6 digits
    },
    withdraw_pin_attempts: {
        type: Number,
        default: 0,
    },
    withdraw_pin_locked: {
        type: Boolean,
        default: false,
    },
    withdraw_pin_reset_time: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'locked'],
        default: 'pending'
    },
    show_lock_message: {
        type: Boolean,
        default: false
    },
    lock_message: {
        type: String
    },

    show_notify_message: {
        type: Boolean,
        default: false
    },
    lock_message_limit_time: {
        type: Number,
        default: 5
    },
    notify_type: {
        type: String,
        enum: ['success', 'warning', 'danger'],
    },
    notify_message: {
        type: String
    },

    level: {
        type: mongoose.Types.ObjectId,
        ref: 'Level'
    },
    secretKey: {
        type: String,
    },
    usdt_vnd_exchange_diff_type: {
        type: String,
        enum: ['default','percentage', 'value'],
        default: 'value'
    },
    usdt_vnd_exchange_diff: {
        type: Number
    },
    usdt_vnd_exchange_diff_round: {
        type: Number,
        default: 0.001
    },
    usdt_vnd_exchange_diff_round_value: {
        type: Number,
        default: 0
    },
    usdt_vnd_exchange_diff_enabled: {
        type: Boolean,
        default: false
    },
    vnd_wallet: {
        type: Number,
        default: 0
    },
    phone_number: {
        type: String,
    },
    phone_verified: {
        type: Boolean,
        default: false
    },
    withdraw_limit_count: {
        type: Number,
        default: 1
    },
    withdraw_remaining_count: {
        type: Number,
        default: 1
    },
    exchange_limit_count: {
        type: Number,
        default: 1
    },
    exchange_remaining_count: {
        type: Number,
        default: 1
    },
    exchange_min: {
        type: Number,
        default: 0
    },
    exchange_max: {
        type: Number,
        default: 500000
    },
    withdraw_enabled: {
        type: Boolean,
        default: true
    },
    exchange_enabled: {
        type: Boolean,
        default: true
    },
    referral_code: {
        type: String,
        required: true,
    },
    invite_code: {
        type: String,
        unique: true,
        isNull: true,
        sparse: true
    },
    reset_token_at: {
        type: Date
    }
});

UserSchema.plugin(mongoosePaginate);


async function deleteUserData(userId) {
    try {

        const user = await User.findById(userId);
        const imageUrls = [
            user.avatar
        ];
        const imageKeys = imageUrls
            .filter(url => url)
            .map(url => url.replace('/get-file-upload/', ''));

        await removeFilesFromCloudflare(imageKeys);

        await TransactionHistory.deleteMany({ user: userId });
        await VerifiesUser.deleteMany({ user: userId });
        await Wallet.deleteMany({ user: userId });
    } catch (error) {
        throw error;
    }
}

UserSchema.pre('remove', async function (next) {
    try {
        await deleteUserData(this._id);
        next();
    } catch (error) {
        next(error);
    }
});
UserSchema.pre('findOneAndDelete', async function (next) {
    try {
        const user = await this.model.findOne(this.getQuery());
        if (user) {
            await deleteUserData(user._id);
        }
        next();
    } catch (error) {
        next(error);
    }
});
UserSchema.pre('deleteOne', async function (next) {
    try {
        const user = await this.model.findOne(this.getQuery());
        if (user) {
            await deleteUserData(user._id);
        }
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.pre('deleteMany', async function (next) {
    try {
        const userIds = this.getQuery()._id;
        if (userIds) {
            if (Array.isArray(userIds)) {
                await Promise.all(userIds.map(userId => deleteUserData(userId)));
            } else {
                await deleteUserData(userIds);
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});
let User = mongoose.model('User', UserSchema);




module.exports = User;