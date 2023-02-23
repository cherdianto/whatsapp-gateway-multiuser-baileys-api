import { isSessionExists } from '../utils/whatsapp.js'
import response from '../utils/response.js'

const validate = (req, res, next) => {
    const sessionId = req.device.id
    // console.log(sessionId)

    if (!isSessionExists(sessionId)) {
        return response(res, 404, false, 'Session not found.')
    }

    res.locals.sessionId = sessionId
    next()
}

export default validate
