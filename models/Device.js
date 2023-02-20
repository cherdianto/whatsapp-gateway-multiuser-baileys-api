import mongoose from 'mongoose'
import User from './User.js'

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deviceName: {
        type: String
    },
    number: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    connectionStatus: {
        type: String,
        default: 'disconnected'
    },
    apiKey: {
        type: String
    },
    cronIdle: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Number
    },
    updatedAt: {
        type: Number
    }
}, {
    timestamps: {currentTime: () => Math.floor(Date.now() / 1000)}
})

export default mongoose.model('Device', Schema)