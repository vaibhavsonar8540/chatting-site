const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate requests between same pair of users
requestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
