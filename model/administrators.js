const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate-v2');
let AdministratorSchema = new mongoose.Schema({
    
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now
    },
    secretKey: {
        type: String,
    },
    recovery_password_token: {
        type: String
    },
    recovery_password_token_expire: {
        type: Date
    },
    status: {
        type: Boolean,
        default: false
    },
    referral_code: {
        type: String,
        required: true,
    },
    invite_code:{
        type: String,
        unique: true,
        isNull: true
    },
    reset_token_at: {
        type:Date
    },
   
});

AdministratorSchema.plugin(mongoosePaginate);
AdministratorSchema.statics.authenticate = function (email, password, callback) {
    
}
AdministratorSchema.statics.authenticateApi = function(token,callback){
    
}
let Administrator = mongoose.model('Administrator', AdministratorSchema);

module.exports = Administrator;
