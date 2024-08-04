const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let LocalBankAccountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    account_number: {
        type: String,
        required: true,
    },
    account_name: {
        type: String,
        required: true,
    },
    bank_name: {
        type: String,
        required: true,
    },
    branch_name: {
        type: String,
        required: true,
    }
});
LocalBankAccountSchema.plugin(mongoosePaginate);
let LocalBankAccount = mongoose.model('LocalBankAccount', LocalBankAccountSchema);

module.exports = LocalBankAccount;