const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
    Worker_ID: {
        type: Number,
        required: true,
        unique: true,
    },
    Name: {
        type: String,
        required: true,
    },
    Trade: {
        type: String,
        required: true,
    },
    Status: {
        type: String,
        enum: ['Active', 'Inactive', 'Emergency Leave', 'Annual Leave'],
        default: 'Active',
    },
    Working_Status:{
        type: String,
        enum: ['Present', 'Absent', 'Sick Leave','Emergency Leave', 'Annual Leave'],
        default: 'Present',
    },
    Shift: {
        type: String,
        enum: ['DAY', 'NIGHT'],
        required: true,
    },
    Mobile: {
        type: String,
        default: '',
    },
    Remark: {
        type: String,
        default: '',
    },
},{
    versionKey: false
});

const Labour = mongoose.model('Labour', labourSchema);

module.exports = Labour;
