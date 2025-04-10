const mongoose = require('mongoose');

const storeItemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
},{
    versionKey: false
});

const StoreItem = mongoose.model('StoreItem', storeItemSchema);

module.exports = StoreItem;