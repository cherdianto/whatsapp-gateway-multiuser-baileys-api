import Message from '../models/Message.js'
import asyncHandler from 'express-async-handler'
// import mongoose from 'mongoose'
// import shortid from 'shortid'
// import duplicateNumber from '../libraries/duplicateNumber'
// import { response } from 'express'
// import User from '../models/User'
import Device from '../models/Device.js'
// import activeDeviceId from '../libraries/activeDeviceId'

// @usage: external API
// @required params : apiKey, message, to
const addMessage = asyncHandler(async(req, res) => {
    // const to = req.body.to || req.query.to
    // const message = req.body.message || req.query.message
    const device = req.device
    const user = req.user
    const cronTask = req.cronTask

    const {
        to = req.query.to,
        message = req.query.message,
        isGroup = req.query.isGroup,
        ref_id = req.query.ref_id,
        retry = req.query.retry,
        priority = req.query.priority,
    } = req.body

    console.log('isGroup : ' + isGroup)

    if(!to) {
        res.status(400)
        throw new Error("TO_REQUIRED")
    }

    if(!message) {
        res.status(400)
        throw new Error("MESSAGE_REQUIRED")
    }

    // const isDeviceIdActive = await activeDeviceId(req.body.deviceId, user)
    // console.log(isDeviceIdActive)
    if(!device.status === true){
        res.status(400)
        throw new Error("INACTIVE_DEVICE")
    }

    const sendMsg = await Message.create(
        {   
            userId: user._id,
            deviceId: device._id,
            message,
            to,
            isGroup,
            retry,
            priority,
            ref_id
        }
    )
    
    if(!sendMsg){
        res.status(500)
        throw new Error("CREATE_MESSAGE_TASK_FAILED")
    }

    await Device.findByIdAndUpdate(
        {_id: device._id},
        { $set: { cronIdle: false } }
    )
    
    console.log('cron start ' + device._id)
    console.log(cronTask)
    cronTask[device.id].start()

    res.status(200).json({
        status: true,
        message: "CREATE_MESSAGE_TASK_SUCCESS",
        sendMsg
    })
    
})

const queuMessage = asyncHandler( async(req, res) => {
    const response = await Message.findOne({deviceId: '63bca4007c1f09c55dc35df1', status: '1'}).sort({priority: -1, time: 1})
    if(!response){
        res.status(400)
        throw new Error('queu error')
    }

    const updating = await Message.findByIdAndUpdate(
        response._id,
        { $set: { status: '2'}},
        { new: true }
    )

    if(!updating){
        res.status(500)
        throw new Error("updating error")
    }

    res.status(200).json({
        status: true,
        message: "queu success",
        updating
    })
})

const getMessages = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const message = await Message.find({userId}).populate('deviceId')

    res.status(200).json({
        status: true,
        message: "GET_USER_DEVICE_SUCCESS",
        messages: message
    })
})

export {
    addMessage,
    queuMessage,
    getMessages
}