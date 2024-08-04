const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2");
let LevelSchema = new mongoose.Schema({
    level_name: {
        type: String,
    },
    cryptocurrency: {
      type: mongoose.Types.ObjectId,
      ref: 'Cryptocurrency',
    },
    stars: {
        type: Number,
        default: 0
    },
    min_score: {
        type: Number,
    },
    referral_enabled:{
        type: Boolean,
        default: false
    },
    priorities: [
        {
            description: {
                type: String
            }
        }
    ]
});
LevelSchema.plugin(mongoosePaginate);
let Level = mongoose.model('Level', LevelSchema);

module.exports = Level;