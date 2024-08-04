const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate-v2');
const {removeFilesFromCloudflare} = require("../helpers/common");


let VerifyUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    update_at: {
        type: Date
    },
    subject: {
        type: String,
        required: true,
    },
    requested: {
        type: String,
        required: true,
    },
    submitted_information: [
        {
            file_url: {
                type: String
            },
            file_name: {
                type: String
            }
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'failed', 'success'],
        default: 'pending'
    },
    fail_reason: {
        type: String
    },
    allow_appeal: {
        type: Boolean
    },
    enable_payment_request:{
        type: Boolean,
        default: false,
    },
    payment_request_cryptocurrency: {
        type: mongoose.Types.ObjectId,
        ref: 'Cryptocurrency',
        required: function() { return this.enable_payment_request === true }
    },
    payment_request_amount: {
        type: Number,
        min: 0,
        required: function() { return this.enable_payment_request === true }
    },

    payment_request_counted: {
        type: Boolean,
        default: false,
        required: function() { return this.enable_payment_request === true }
    },

    payment_request_receiver_wallet_address: {
        type: String,
        required: function() { return this.enable_payment_request === true }
    },
    payment_request_transaction_network: {
        type: String,
        required: function() { return this.enable_payment_request === true }
    },
});

VerifyUserSchema.plugin(mongoosePaginate);
async function deleteVerifyUserFiles(verifyUserIds) {
    try {
        const verifyUsers = await VerifyUser.find({ _id: { $in: verifyUserIds } });
        const fileUrls = verifyUsers.flatMap(verifyUser => verifyUser.submitted_information.map(item => item.file_url));
        const fileKeys = fileUrls.map(url => url.replace('/get-file-upload/', ''));
        await removeFilesFromCloudflare(fileKeys);
    } catch (error) {
        throw error;
    }
}

VerifyUserSchema.pre('remove', async function (next) {
    try {
        await deleteVerifyUserFiles([this._id]);
        next();
    } catch (error) {
        next(error);
    }
});

VerifyUserSchema.pre('deleteOne', async function (next) {
    try {
        const verifyUser = await this.model.findOne(this.getQuery());
        if (verifyUser) {
            await deleteVerifyUserFiles([verifyUser._id]);
        }
        next();
    } catch (error) {
        next(error);
    }
});
VerifyUserSchema.pre('findOneAndDelete', async function (next) {
    try {
        const verifyUser = await this.model.findOne(this.getQuery());
        if (verifyUser) {
            await deleteVerifyUserFiles([verifyUser._id]);
        }
        next();
    } catch (error) {
        next(error);
    }
});

VerifyUserSchema.pre('deleteMany', async function (next) {
    try {
        const verifyUserIds = await this.model.distinct('_id', this.getQuery());
        await deleteVerifyUserFiles(verifyUserIds);
        next();
    } catch (error) {
        next(error);
    }
});

let VerifyUser = mongoose.model('VerifyUser', VerifyUserSchema);


module.exports = VerifyUser;