import Message from '../models/Message.js'
import asyncHandler from 'express-async-handler'
import Device from '../models/Device.js' 

const imeaGreeting = asyncHandler(async(req, res) => {
    const device = req.device
    const user = req.user
    const cronTask = req.cronTask
    let text = ''

    const {
        to = req.query.to,
        // message = req.query.message,
        isGroup = req.query.isGroup,
        ref_id = req.query.ref_id,
        retry = req.query.retry,
        priority = req.query.priority,
        nama= req.query.nama,
        gender= req.query.gender
    } = req.body


    if(gender.toLowerCase() === 'perempuan'){
        text = `Assalamu'alaikum Kak *${nama.toUpperCase()}*\n\nPerkenalkan saya Candra dari IMEA. Atas nama pengurus IMEA, kami mengucapkan terimakasih atas partisipasi Kakak dalam sensus IMEA 2023. Data Kakak sudah kami simpan.\n\nSelanjutnya, kami mengharapkan keikutsertaan Kakak di group-group whatsapp IMEA di bawah ini ya: \n\nIMEA Putri\nhttps://chat.whatsapp.com/6JlLTas1sCzKASvRL1QtJg\n\nIMEA Gabungan\nhttps://chat.whatsapp.com/HKByy4nonFd8WcJWuBwg2d\n\nMelalui group-group tersebut, kami biasanya menginfokan jadwal kegiatan IMEA, info buka puasa bersama, info berkah ramadhan (ta'jil gratis), dan acara-acara lainnya. \n\nSo, pastikan join group ya, agar tidak ketinggalan.\n\nJazakillaha khairan wa barakallahu fiik\n\nSemoga Allah memudahkan semua urusan kita dimanapun kita berada\n\nWassalamu'alaikum warahmatullah`
    } else {
        text = `Assalamu'alaikum Kak *${nama.toUpperCase()}*\n\nPerkenalkan saya Candra dari IMEA. Atas nama pengurus IMEA, kami mengucapkan terimakasih atas partisipasi Kakak dalam sensus IMEA 2023. Data Kakak sudah kami simpan.\n\nSelanjutnya, kami mengharapkan keikutsertaan Kakak di group-group whatsapp IMEA di bawah ini ya: \n\nIMEA Putra\nhttps://chat.whatsapp.com/Di4QvRhzGWyJN49yREQo4X\n\nIMEA Gabungan\nhttps://chat.whatsapp.com/HKByy4nonFd8WcJWuBwg2d\n\nMelalui group-group tersebut, kami biasanya menginfokan jadwal kegiatan IMEA, info buka puasa bersama, info berkah ramadhan (ta'jil gratis), dan acara-acara lainnya. \n\nSo, pastikan join group ya, agar tidak ketinggalan.\n\nJazakallahu khairan wa barakallahu fiik\n\nSemoga Allah memudahkan semua urusan kita dimanapun kita berada\n\nWassalamu'alaikum warahmatullah`
    }
    if(!to) {
        res.status(400)
        throw new Error("TO_REQUIRED")
    }

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