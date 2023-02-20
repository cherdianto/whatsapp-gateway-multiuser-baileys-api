// const jwt = require('jsonwebtoken')
import User from '../models/User.js'
import Device from '../models/Device.js'
import dotenv from 'dotenv'
import asyncHandler from 'express-async-handler'

const env = dotenv.config().parsed

// @return = req.user, req.device
const verifyApiKey = asyncHandler(async (req, res, next) => {
    // let userId = ''

    const apiKey = req.query.key || req.body.key
    console.log(req.body)

    if (!apiKey) {
        res.status(401)
        throw new Error('API_KEY_REQUIRED')
    }

    const device = await Device.findOne({ apiKey })
    console.log("midware-api-key-device ===" + device)
    if (!device) {
        res.status(401)
        throw new Error('DEVICE_NOT_FOUND')
    }

    const user = await User.findById(device.userId).select('-password')

    console.log(user)
    if (!user) {
        res.status(400)
        throw new Error('NO_USER_FOUND')
    }
    // req.jwt = decoded
    req.device = device
    req.user = user

    next()
})

export default verifyApiKey