import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deviceId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Device'
    },
    to: {
        type: String,
        required: true
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true
    },
    ref_id: {
        type: String
    },
    retry: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['1','2', '3', '4'],
        default: '1'
        // pending: 1, sent: 2, read:3, failed: 4
    },
    time: {
        type: String,
        required: true,
        default: Math.floor(Date.now() / 1000)
    },
    createdAt: {
        type: Number
    },
    updatedAt: {
        type: Number
    }
}, {
    timestamps: {currentTime: () => Math.floor(Date.now() / 1000)}
    // strict: false
})

export default mongoose.model('Message', Schema)