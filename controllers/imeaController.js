import Message from '../models/Message.js'
import asyncHandler from 'express-async-handler'
import Device from '../models/Device.js' 

const imeaGreeting = asyncHandler(async(req, res) => {
    const device = req.device
    const user = req.user
    const cronTask = req.cronTask
    let text = ''

    const {
        to = req.body.to,
        // message = req.body.message,
        isGroup = req.body.isGroup,
        ref_id = req.body.ref_id,
        retry = req.body.retry,
        priority = req.body.priority,
        nama= req.body.nama,
        gender= req.body.gender
    } = req.body

    console.log('isGroup : ' + isGroup)

    if(gender === 'perempuan'){
        text = `Assalamu'alaikum Kak *${nama.toUpperCase()}*\n\nSaya Candra, atas nama pengurus IMEA mengucapkan terimakasih atas partisipasi Kakak dalam sensus IMEA 2023. Data Kakak sudah kami simpan.\n\nYuk jangan lupa bergabung di whatsapp group-group di bawah ini ya: \nIMEA Putri\nhttps://chat.whatsapp.com/Di4QvRhzGWyJN49yREQo4X\n\nIMEA Gabungan\nhttps://chat.whatsapp.com/HKByy4nonFd8WcJWuBwg2d\n\nJazakillaha Khairan\n\nSemoga Allah memudahkan semua urusan kita\n\nWassalamu'alaikum warahmatullah`
    } else {
        text = `Assalamu'alaikum Kak *${nama.toUpperCase()}*\n\nSaya Candra, atas nama pengurus IMEA mengucapkan terimakasih atas partisipasi Kakak dalam sensus IMEA 2023. Data Kakak sudah kami simpan.\n\nYuk jangan lupa bergabung di whatsapp group-group di bawah ini ya: \nIMEA Putra\nhttps://chat.whatsapp.com/Di4QvRhzGWyJN49yREQo4X\n\nIMEA Gabungan\nhttps://chat.whatsapp.com/HKByy4nonFd8WcJWuBwg2d\n\nJazakillaha Khairan\n\nSemoga Allah memudahkan semua urusan kita\n\nWassalamu'alaikum warahmatullah`
    }
    if(!to) {
        res.status(400)
        throw new Error("TO_REQUIRED")
    }

    // if(!message) {
    //     res.status(400)
    //     throw new Error("MESSAGE_REQUIRED")
    // }

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
            message: {
                text : text
            },
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

export {
    imeaGreeting
}