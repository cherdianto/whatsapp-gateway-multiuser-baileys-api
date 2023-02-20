import mongoose from "mongoose"
import dotenv from 'dotenv'

const env = dotenv.config().parsed

function dbConnection(){
        mongoose.connect(env.LOCAL_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

    const db = mongoose.connection
    db.on('error', () => console.log(error))
    db.once('open', () => console.log('database connected'))
}

export default dbConnection