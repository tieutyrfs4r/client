const mongoose = require('mongoose');
const TransactionHistory = require("./transaction_histories");
let WalletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cryptocurrency: {
        type: mongoose.Types.ObjectId,
        ref: 'Cryptocurrency',
        required: true
    },
    balance_amount: {
        type: Number,
        default: 0
    },
    total_deposit: {
        type: Number,
        default: 0
    },
    total_withdraw: {
        type: Number,
        default: 0
    },
    total_number_withdraw: {
        type: Number,
        default: 0
    },
    total_number_deposit: {
        type: Number,
        default: 0
    },
    withdraw_enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    exchange_enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    withdraw_min_amount: {
        type: Number,
        default: 0
    },
    exchange_min_amount: {
        type: Number,
        default: 0
    },
    exchange_max_amount: {
        type: Number,
        default: 500000
    },
    temporarily_withheld:{
        amount: {
            type: Number,
        },
        reason: {
            type: String
        },
        start_date_withheld: {
            type: Date
        },
        end_date_withheld: {
            type: Date
        }
    },
    deposit_address: {
        type: String
    },
    deposit_network: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Network',
    },
    deposit_default_address_enabled: {
        type: Boolean,
        default: false
    }
});
async function deleteRelatedData(query) {
    try {
        await TransactionHistory.deleteMany(query);
    } catch (error) {
        throw error;
    }
}

WalletSchema.pre('remove', async function (next) {
    try {
        await deleteRelatedData({
            user: this.user,
            cryptocurrency: this.cryptocurrency,
        });
        next();
    } catch (error) {
        next(error);
    }
});
WalletSchema.pre('findOneAndDelete', async function (next) {
    try {
        const wallet = await this.model.findOne(this.getQuery());
        if (wallet) {
            await deleteRelatedData({
                user: wallet.user,
                cryptocurrency: wallet.cryptocurrency,
            });
        }
        next();
    } catch (error) {
        next(error);
    }
});
WalletSchema.pre('deleteOne', async function (next) {
    try {
        const wallet = await this.model.findOne(this.getQuery());
        if (wallet) {
            await deleteRelatedData({
                user: wallet.user,
                cryptocurrency: wallet.cryptocurrency,
            });
        }
        next();
    } catch (error) {
        next(error);
    }
});

WalletSchema.pre('deleteMany', async function (next) {
    try {
        const wallets = await this.model.find(this.getQuery());
        await Promise.all(wallets.map(wallet => deleteRelatedData({
            user: wallet.user,
            cryptocurrency: wallet.cryptocurrency,
        })));
        next();
    } catch (error) {
        next(error);
    }
});
let Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;