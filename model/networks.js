const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");

const NetWorkSchema = new mongoose.Schema({
    name: {
        type: String
    },
    short_name: {
        type: String,

    },
    description: {
        type: String,
    },
});
NetWorkSchema.plugin(mongoosePaginate);
const NetWorkData = mongoose.model('Network', NetWorkSchema);

module.exports = NetWorkData;