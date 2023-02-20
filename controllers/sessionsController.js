import { isSessionExists, createSession, getSession, deleteSession, getAllSessions } from './../whatsapp.js'
import response from './../response.js'

const find = (req, res) => {
    response(res, 200, true, 'Session found.')
}

const status = (req, res) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']

    const session = getSession(res.locals.sessionId)
    let state = states[session.ws.readyState]

    state =
        state === 'connected' && typeof (session.isLegacy ? session.state.legacy.user : session.user) !== 'undefined'
            ? 'authenticated'
            : state

    response(res, 200, true, '', { status: state })
}

const getAll = (req, res) => {
    const sessions = getAllSessions()
    response(res, 200, true, '', sessions)
}


// @req.body {id:deviceId, isLegacy:false}
const add = (req, res) => {
    const deviceId = req.device.id || req.body.id
    const {isLegacy} = req.body

    console.log(deviceId, isLegacy)

    if (isSessionExists(deviceId)) {
        return response(res, 409, false, 'Session already exists')
    }

    createSession(deviceId, isLegacy, res)
}

const del = async (req, res) => {
    const deviceId = req.device.id
    const session = getSession(deviceId)

    try {
        await session.logout()
    } catch {
    } finally {
        deleteSession(deviceId, session.isLegacy)
    }

    response(res, 200, true, 'The session has been successfully deleted.')
}

export { find, status, add, del, getAll }
