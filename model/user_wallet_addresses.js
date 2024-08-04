const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");

const UserWalletAddressSchema = new mongoose.Schema({
    cryptocurrency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cryptocurrency',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    network: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Network',
        required: true
    }
});
UserWalletAddressSchema.plugin(mongoosePaginate);
const WalletAddress = mongoose.model('UserWalletAddress', UserWalletAddressSchema);

module.exports = WalletAddress;