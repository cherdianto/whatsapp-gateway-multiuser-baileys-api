import User from '../models/User.js'
import Device from '../models/Device.js'
import asyncHandler from 'express-async-handler'
import shortid from 'shortid'
import crypto from 'crypto'
import { isSessionExists, createSession, getSession, deleteSession, getAllSessions } from '../utils/whatsapp.js'

function generateApiKey() {
    const buffer = crypto.randomBytes(32);
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

export const addDevice = asyncHandler(async (req, res) => {
    // const userId = req.user._id
    const number = req.body.number

    if (!number) {
        res.status(400)
        throw new Error("UNAUTHORIZED")
    }

    const isDuplicateNumber = await Device.findOne({
        number: number
    })
    if (isDuplicateNumber) {
        res.status(400)
        throw new Error("NUMBER_ALREADY_EXIST")
    }

    const newDevice = new Device({
        userId: req.user._id,
        deviceName: req.body.deviceName || shortid.generate(),
        apiKey: generateApiKey(),
        number
    })

    newDevice.save(async (error, device) => {
        if (error) {
            res.status(500)
            throw new Error("ADD_DEVICE_FAILED")
        }

        const user = await User.findByIdAndUpdate(req.user._id, {
            $push: {
                devices: newDevice._id
            }
        })

        if (!user) {
            res.status(500)
            throw new Error("ADD_DEVICE_FAILED")
        }
    })

    res.status(200).json({
        status: true,
        message: "ADD_DEVICE_SUCCESS",
        device: newDevice
    })
})

export const updateDevice = asyncHandler(async (req, res) => {
    const deviceId = req.params.deviceid

    if(req.user.role === 'Regular' ){
         delete req.body.status
    }

    const response = await Device.findOneAndUpdate({
        _id: deviceId
    }, {
        $set: req.body
    }, {
        new: true
    })

    if (!response) {
        res.status(500)
        throw new Error("UPDATE_DEVICE_FAILED")
    }
    res.status(200).json({
        status: true,
        message: "UPDATE_DEVICE_SUCCESS",
        response
    })
})

export const deleteDevice = asyncHandler(async (req, res) => {
    const deviceId = req.params.deviceid
    const device = await Device.findById(deviceId)

    if (!device) {
        res.status(400)
        throw new Error("DEVICE_NOT_FOUND")
    }

    const session = getSession(deviceId)

    if(session){
        try {
            await session.logout()
        } catch {
        } finally {
            deleteSession(deviceId, session.isLegacy)
        }
    }


    Device.findByIdAndDelete(
        deviceId,
        async (error, deletedDevice) => {
            if (error) {
                res.status(500)
                throw new Error("DELETE_DEVICE_FAILED")
            }

            const user = await User.findByIdAndUpdate(
                req.user._id, {
                    $pull: {
                        devices: deletedDevice._id
                    }
                }, {
                    new: true
                }
            )

            if (!user) {
                res.status(500)
                throw new Error("DELETE_DEVICE_FAILED")
            }
        }
    )


    res.status(200).json({
        status: true,
        message: "DELETE_DEVICE_SUCCESS"
    })
})

export const showDevices = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const device = await Device.find({
        userId
    })

    res.status(200).json({
        status: true,
        message: "GET_USER_DEVICE_SUCCESS",
        device
    })
})

export const createApiKey = asyncHandler(async (req, res) => {
    // const userId = req.user._id
    const deviceId = req.params.deviceid || req.query.deviceId
    const newApiKey = generateApiKey()

    // update user device apikey
    const device = await Device.findByIdAndUpdate(
        deviceId, {
            $set: {
                apiKey: newApiKey
            }
        }, {
            new: true
        }
    )

    if (!device) {
        res.status(400)
        throw new Error("NEW_API_KEY_FAILED")
    }

    res.status(200).json({
        status: true,
        message: "NEW_API_KEY_SUCCESS",
        apiKey: device.apiKey
    })
})