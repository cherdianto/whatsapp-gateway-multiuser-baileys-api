import 'dotenv/config'
import express from 'express'
import nodeCleanup from 'node-cleanup'
import routes from './api/routes.js'
import { init, cleanup } from './whatsapp.js'
import cors from 'cors'
import morgan from 'morgan'
import dbConnection from './libraries/dbConnect.js'
import errorHandler from './middlewares/errorMiddleware.js'

const app = express()

const host = process.env.HOST || undefined
const port = parseInt(process.env.PORT ?? 8000)

dbConnection()

app.use(cors())
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/api', routes)

const listenerCallback = () => {
    init()
    console.log(`Server is listening on http://${host ? host : 'localhost'}:${port}`)
}

if (host) {
    app.listen(port, host, listenerCallback)
} else {
    app.listen(port, listenerCallback)
}

app.use(errorHandler)

nodeCleanup(cleanup)

export default app
