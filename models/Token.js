import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    token: {
        type: String,
    },
    expiryAt: {
        type: Number
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

export default mongoose.model('Token', Schema)