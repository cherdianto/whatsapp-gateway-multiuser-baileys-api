import User from '../models/User.js'
import Device from '../models/Device.js'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import shortid from 'shortid'
// import duplicateNumber from '../libraries/duplicateNumber'
// import activeDeviceId from '../libraries/activeDeviceId'
// import libsession from '../session'
import crypto from 'crypto'
import { isSessionExists, createSession, getSession, deleteSession, getAllSessions } from './../whatsapp.js'

// import session from '../session'
// import activeSession from '../middlewares/activeSession'

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
    // @usage: internal api
    // note: will only be used for front end to edit the device detail from the device table

    console.log('update device')
    const deviceId = req.params.deviceid
    console.log(deviceId)

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
        console.log(response)
        throw new Error("UPDATE_DEVICE_FAILED")
    }
    res.status(200).json({
        status: true,
        message: "UPDATE_DEVICE_SUCCESS",
        response
    })
})

// @usage: internal api
// note: will only be used for front end to edit the device detail from the device table
export const deleteDevice = asyncHandler(async (req, res) => {
    const deviceId = req.params.deviceid
    const device = await Device.findById(deviceId)

    if (!device) {
        res.status(400)
        throw new Error("DEVICE_NOT_FOUND")
    }

    const session = getSession(deviceId)
    console.log(session)

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

    // if(!response){
    //     res.status(500)
    //     throw new Error("DELETE_DEVICE_FAILED")
    // }

    res.status(200).json({
        status: true,
        message: "DELETE_DEVICE_SUCCESS"
        // response
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

// const scanQrcode = asyncHandler(async (req, res) => {
//     // const jwtId = req.jwt.id 
//     // console.log(req.sessions)
//     let sessions = req.sessions
//     let io = req.io
//     // const jwtId = req.params.userid
//     const id = req.device._id
//     const cronTask = req.cronTask

//     console.log(sessions)
//     // const user = await User.findById(jwtId)
//     // if (!user) {
//     //     res.status(400)
//     //     throw new Error("NO_USER_FOUND")
//     // }


//     // const isDeviceIdActive = await activeDeviceId(id, user)
//     // if (!isDeviceIdActive) {
//     //     res.status(400)
//     //     throw new Error("ACTIVE_DEVICE_NOT_FOUND")
//     // }
//     // const hasActiveSession = await activeSession(sessions, id)
//     // if(hasActiveSession){
//     //     console.log('logout existing, rescan')
//     //     // await sessions[id].destroy()
//     //     // await sessions[id].logout()
//     // } else {
//     //     console.log('no session')
//     // }

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         res.status(400)
//         throw new Error("INVALID_ID")
//     }

//     const device = await Device.findById(id)

//     if (!device) {
//         res.status(400)
//         throw new Error("DEVICE_NOT_FOUND")
//     }

//     if (device.status === false) {
//         res.status(400)
//         throw new Error("DEVICE_NOT_ACTIVE")
//     }

//     console.log('scan ' + id)

//     try {
//         await libsession({
//             io,
//             id,
//             sessions,
//             cronTask
//         })
//         res.render('index')
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             msg: 'scan error ' + id
//         })
//     }
// })

// const destroy = asyncHandler(async (req, res) => {
//     const id = req.device._id
//     // console.log('destroy ' + id)
//     const sessions = req.sessions

//     // if(id != req.device._id){
//     //     res.status(400)
//     //     throw new Error("DEVICE_ID_MISMATCH")
//     // }

//     // CHECK WHETHER DEVICE ACTIVE OR NOT (HAS SESSION OR NOT)
//     const hasActiveSession = await activeSession(sessions, id)
//     if (!hasActiveSession) {
//         res.status(400)
//         throw new Error("DEVICE_NOT_ACTIVE")
//     }

//     try {
//         const response = sessions[id].destroy()

//         if (response) {
//             await Device.findByIdAndUpdate(
//                 id, {
//                     $set: {
//                         connectionStatus: 'disconnected'
//                     }
//                 }
//             )
//         }

//         res.status(200).json({
//             status: true,
//             message: "DESTROY_SUCCESS",
//             id
//         })
//     } catch (error) {
//         console.log('destroy failed ' + id)
//         res.status(500)
//         throw new Error("DESTROY_FAILED")
//     }
// })

// const logout = asyncHandler(async (req, res) => {
//     const id = req.device._id
//     console.log('logout ' + id)
//     const sessions = req.sessions

//     // if(id != req.device._id){
//     //     res.status(400)
//     //     throw new Error("DEVICE_ID_MISMATCH")
//     // }

//     // CHECK WHETHER DEVICE ACTIVE OR NOT (HAS SESSION OR NOT)
//     const hasActiveSession = await activeSession(sessions, id)
//     if (!hasActiveSession) {
//         res.status(400)
//         throw new Error("DEVICE_NOT_ACTIVE")
//     }

//     // console.log(sessions)

//     // if(!sessions.hasOwnProperty(id)){
//     //     res.status(400)
//     //     throw new Error("DEVICE_NOT_ACTIVE")
//     // }

//     try {
//         await sessions[id].logout()
//         // console.log(dropConnection)
//     } catch (error) {
//         console.log(error)
//         // console.log('logout failed ' + id)
//         res.status(500)
//         throw new Error("LOGOUT_FAILED")
//     }

//     res.status(200).json({
//         status: true,
//         message: "LOGOUT_SUCCESS",
//         id
//     })
// })

// const getState = asyncHandler(async (req, res) => {
//     const id = req.device._id
//     const sessions = req.sessions

//     // if(id != req.device._id){
//     //     res.status(400)
//     //     throw new Error("DEVICE_ID_MISMATCH")
//     // }

//     // CHECK WHETHER DEVICE ACTIVE OR NOT (HAS SESSION OR NOT)
//     const hasActiveSession = await activeSession(sessions, id)
//     if (!hasActiveSession) {
//         res.status(400)
//         throw new Error("DEVICE_NOT_ACTIVE")
//     }

//     try {
//         const response = sessions[id].getState()

//         res.status(200).json({
//             status: true,
//             message: "GET_STATE_SUCCESS",
//             state: response
//         })
//     } catch (error) {
//         // console.log('getState failed ' + id)
//         // console.log(error)
//         res.status(500)
//         throw new Error("GET_STATE_FAILED")
//     }
// })

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