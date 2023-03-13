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

const formBerkah = asyncHandler(async(req, res) => {
    const device = req.device
    const user = req.user
    const cronTask = req.cronTask

    const {
        to = req.query.to,
        // message = req.query.message,
        isGroup = req.query.isGroup,
        ref_id = req.query.ref_id,
        retry = req.query.retry,
        priority = req.query.priority,
        nama= req.query.nama,
        porsi= req.query.porsi
    } = req.body



    const text = `Bismillah\n\nKak *${nama.toUpperCase()}*\n${porsi}\n\nTerimakasih telah mengisi form keikutsertaan acara IMEA Gabungan edisi *Ngabuburit Bersama IMEA* 25 Maret 2023
        Data Kakak sudah kami simpan.\n\nKami tunggu kehadiran Kakak (beserta keluarga) di acara tsb
        \nHari/Tanggal : Sabtu, 25 Maret 2023\nJam : 16.30 - 18.30 CET\nTempat : Ruang De Globe, ITC International Hotel\nAlamat : Boulevard 1945-4, 7511AE Enschede\n(https://goo.gl/maps/sxwnE4dkPQDq7kzz8)\nSusunan Acara :\n- 16.30 Pembukaan\n- 16.45 Tausiyah\n- 17.30 Sambut warga baru & sosialisasi program IMEA 2023\n- 18.15 Pembagian Berkah Ramadhan (Ta'jil)\n- 18.30 Penutup\n\nCatatan :\n~ Mohon untuk datang tepat waktu ya.\n~ Bagi yg memiliki gejala flu, dipersilakan untuk beristirahat di rumah\n~ Parkir sepeda di parkiran MST (https://maps.app.goo.gl/AJo4nJuRDzL2GTLK9)\n\nTerimakasih\n\n*INFO DONASI UNTUK BUKA PUASA*\n\nIMEA membuka donasi khusus untuk program berkah ramadhan ini. InsyaAllah semua donasi yang masuk akan dibagikan ke warga IMEA dalam bentuk ta'jil (makanan buka puasa). 
        Donasi bisa di transfer melalui link Tikkie di bawah ini\n
        https://tikkie.me/pay/77up48vdideuomij4eaf\n\n
        Jika menghendaki untuk menyumbang dalam bentuk *makanan*, silakan hubungi Kak Fella\n
        https://wa.me/+3548551240\n\n
        Jika menghendaki untuk berkontribusi dalam bentuk lain, silakan membalas pesan ini\n\n
        Semoga Allah Azza wa Jalla menerima amal kita dan membalas dengan pahala yang berlipat. Aamiin\n\n
        *“Barang siapa memberi makanan untuk berbuka kepada orang yang berpuasa, maka ia akan mendapatkan pahala orang yang berpuasa itu tanpa dikurangi sedikitpun.”* (HR. Ahmad, Nasa’i dan dishahihkan oleh Al Albani)`

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
    imeaGreeting,
    formBerkah
}