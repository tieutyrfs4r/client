const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate-v2');
const {removeFilesFromCloudflare} = require("../helpers/common");

let TransactionHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transaction_type: {
        type: String,
        enum: ['deposit', 'withdraw', 'sell', 'buy', 'exchange', 'withdraw-vnd'],
        required: true
    },
    cryptocurrency: {
        type: mongoose.Types.ObjectId,
        ref: 'Cryptocurrency',
        required: function() { return ['deposit', 'withdraw', 'sell', 'buy', 'exchange'].includes(this.transaction_type); }
    },
    cryptocurrency_exchange: {
        type: mongoose.Types.ObjectId,
        ref: 'Cryptocurrency',
    },
    counted: {
        type: Boolean,
        default: false
    },
    transaction_rate: {
        type: Number,
        required: function() { return ['withdraw-vnd', 'sell'].includes(this.transaction_type); }
    },
    receiver_wallet_address: {
        type: String,
        required: function() { return this.transaction_type === 'deposit'; }
    },
    transaction_network: {
        type: String,
        required: function() { return this.transaction_type === 'deposit'; }
    },
    local_bank_info: {
        account_number: {
            type: String,
            required: function() { return this.transaction_type === 'withdraw-vnd'; }
        },
        account_name: {
            type: String,
            required: function() { return this.transaction_type === 'withdraw-vnd'; }
        },
        bank_name: {
            type: String,
            required: function() { return this.transaction_type === 'withdraw-vnd'; }
        },
        branch_name: {
            type: String
        }
    },
    transaction_amount: {
        type: Number,
        required: true
    },
    balance_before_transaction: {
        type: Number,
    },
    balance_after_transaction: {
        type: Number,
    },
    transaction_status: {
        type: String,
        enum: ['pending', 'success', 'failed','cancelled'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    },
    transaction_images: [
        {
            image_url: {
                type: String,
                required: true
            }
        }
    ],
    admin_notes: {
        type: String
    },
    failure_reason: {
        type: String
    }
});

TransactionHistorySchema.plugin(mongoosePaginate);
async function deleteTransactionImages(transactionIds) {
    try {
        const transactions = await TransactionHistory.find({ _id: { $in: transactionIds } });
        const imageUrls = transactions.flatMap(transaction => transaction.transaction_images.map(item => item.image_url));
        const imageKeys = imageUrls.map(url => url.replace('/get-file-upload/', ''));
        await removeFilesFromCloudflare(imageKeys);
    } catch (error) {
        throw error;
    }
}

TransactionHistorySchema.pre('remove', async function (next) {
    try {
        await deleteTransactionImages([this._id]);
        next();
    } catch (error) {
        next(error);
    }
});
TransactionHistorySchema.pre('findOneAndDelete', async function (next) {
    try {
        const transactionHistory = await this.model.findOne(this.getQuery());
        if (transactionHistory) {
            await deleteTransactionImages(transactionHistory._id);
        }
        next();
    } catch (error) {
        next(error);
    }
});
TransactionHistorySchema.pre('deleteOne', async function (next) {
    try {
        const transaction = await this.model.findOne(this.getQuery());
        if (transaction) {
            await deleteTransactionImages([transaction._id]);
        }
        next();
    } catch (error) {
        next(error);
    }
});

TransactionHistorySchema.pre('deleteMany', async function (next) {
    try {
        const transactionIds = await this.model.distinct('_id', this.getQuery());
        await deleteTransactionImages(transactionIds);
        next();
    } catch (error) {
        next(error);
    }
});

let TransactionHistory = mongoose.model('TransactionHistory', TransactionHistorySchema);

module.exports = TransactionHistory;