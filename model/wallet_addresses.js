const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");

const WalletAddressSchema = new mongoose.Schema({
    cryptocurrency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cryptocurrency',
        required: true
    },
    address: {
        type: String,
        required: true,
    },
    use_enabled: {
        type: Boolean,
        default: false
    },
    network: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Network',
    },
    description: {
        type: String,
        default: ''
    }
});
WalletAddressSchema.plugin(mongoosePaginate);
const WalletAddress = mongoose.model('WalletAddress', WalletAddressSchema);

module.exports = WalletAddress;