import { rmSync, readdir } from 'fs'
import { join } from 'path'
import pino from 'pino'
import makeWASocket, {
    makeWALegacySocket,
    useMultiFileAuthState,
    useSingleFileLegacyAuthState,
    makeInMemoryStore,
    Browsers,
    DisconnectReason,
    delay,
} from '@adiwajshing/baileys'
import { toDataURL } from 'qrcode'
import __dirname from '../dirname.js'
import response from './response.js'
import Device from '../models/Device.js'
import cron from 'node-cron'
import Message from '../models/Message.js'

const sessions = new Map()
const retries = new Map()

const sessionsDir = (sessionId = '') => {
    return join(__dirname, './sessions', sessionId ? sessionId : '')
}

const isSessionExists = (sessionId) => {
    return sessions.has(sessionId)
}

const shouldReconnect = (sessionId) => {
    let maxRetries = parseInt(process.env.MAX_RETRIES ?? 0)
    let attempts = retries.get(sessionId) ?? 0

    maxRetries = maxRetries < 1 ? 1 : maxRetries

    if (attempts < maxRetries) {
        ++attempts

        console.log('Reconnecting...', { attempts, sessionId })
        retries.set(sessionId, attempts)

        return true
    }

    return false
}

let ctask = {}

const createSession = async ({sessionId, isLegacy = false, res = null, cronTask = ctask, io}) => {
    console.log('crontask create ' + cronTask)
    
    const sessionFile = (isLegacy ? 'legacy_' : 'md_') + sessionId + (isLegacy ? '.json' : '')

    const logger = pino({ level: 'warn' })
    const store = makeInMemoryStore({ logger })

    let state, saveState

    if (isLegacy) {
        ;({ state, saveState } = useSingleFileLegacyAuthState(sessionsDir(sessionFile)))
    } else {
        ;({ state, saveCreds: saveState } = await useMultiFileAuthState(sessionsDir(sessionFile)))
    }

    /**
     * @type {import('@adiwajshing/baileys').CommonSocketConfig}
     */
    const waConfig = {
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: Browsers.ubuntu('Chrome'),
    }

    /**
     * @type {import('@adiwajshing/baileys').AnyWASocket}
     */
    const wa = isLegacy ? makeWALegacySocket(waConfig) : makeWASocket.default(waConfig)

    if (!isLegacy) {
        store.readFromFile(sessionsDir(`${sessionId}_store.json`))
        store.bind(wa.ev)
    }

    sessions.set(sessionId, { ...wa, store, isLegacy })

    wa.ev.on('creds.update', saveState)

    wa.ev.on('chats.set', ({ chats }) => {
        if (isLegacy) {
            store.chats.insertIfAbsent(...chats)
        }
    })

    wa.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        const statusCode = lastDisconnect?.error?.output?.statusCode

        if (connection === 'open') {
            retries.delete(sessionId)

            // UPDATE DATABASE
            await Device.findByIdAndUpdate( sessionId, {
                $set: { connectionStatus: 'connected'}
            })

            // CRON START HERE
            cronTask[sessionId] = cron.schedule('*/20 * * * * *', async () => {
                const response = await Message.findOne({
                    deviceId: sessionId,
                    status: '1'
                }).sort({
                    priority: -1,
                    time: 1
                })
                
                if (!response) {
                    console.log('no task left')
                    console.log('cron idle ' + sessionId)
                    await Device.findByIdAndUpdate(
                        sessionId,
                        { $set: { cronIdle: true } }
                    )
                    cronTask[sessionId].stop()
                    return
                }
    
                try {
                    const session = getSession(sessionId)
                    const receiver = formatPhone(response.to)
                    const message = response.message

                    try {
                        const exists = await isExists(session, receiver)
                        if (!exists) {
                            console.log('invalid whatsapp number')
                            // return response(res, 400, false, 'The receiver number is not exists.')
                        }
                
                        await sendMessage(session, receiver, message, 0)
                        console.log('message sent')
                        // response(res, 200, true, 'The message has been successfully sent.')
                    } catch (error) {
                        console.log('error sending message')
                        // console.log(error)
                        // response(res, 500, false, 'Failed to send the message.')
                    }
                } catch (error) {
                    console.log(error)
                    return
                }
    
    
                const updating = await Message.findByIdAndUpdate(
                    response._id, {
                        $set: {
                            status: '2'
                        }
                    }, {
                        new: true
                    }
                )
    
                if (!updating) {
                    console.log('updating status error')
                    return
                }
    
                console.log('send message ' + response.message)
            })
    
            cronTask[sessionId].start()

        }

        if (connection === 'close') {
            console.log('connection closed')
            if (statusCode === DisconnectReason.loggedOut || !shouldReconnect(sessionId)) {
                console.log('reason logout')
                if (res && !res.headersSent) {
                    response(res, 500, false, 'Unable to create session.')
                }
                // socket.emit('statusConnection', 'unable to create session')
                console.log('delete session')
                return deleteSession(sessionId, isLegacy)
            }

            setTimeout(
                () => {
                    console.log('check here')
                    createSession({sessionId, isLegacy, res, cronTask, io})
                },
                statusCode === DisconnectReason.restartRequired ? 0 : parseInt(process.env.RECONNECT_INTERVAL ?? 0)
            )

            
        }

        if (update.qr) {
            console.log('update qr')
            if (res && !res.headersSent) {
                try {
                    const qr = await toDataURL(update.qr)
                    response(res, 200, true, 'QR code received, please scan the QR code.', { qr })

                    return
                } catch {
                    response(res, 500, false, 'Unable to create QR code.')
                }
            }

            try {
                await wa.logout()
            } catch {
            } finally {
                deleteSession(sessionId, isLegacy)
            }
        }
    })

}

/**
 * @returns {(import('@adiwajshing/baileys').AnyWASocket|null)}
 */
const getSession = (sessionId) => {
    return sessions.get(sessionId) ?? null
}

const getAllSessions = () => {
    const sessionList = []
    sessions.forEach((session, sessionId) => {
        sessionList.push(sessionId)
    })
    return sessionList ?? null
}

const deleteSession = async (sessionId, isLegacy = false) => {
    const sessionFile = (isLegacy ? 'legacy_' : 'md_') + sessionId + (isLegacy ? '.json' : '')
    const storeFile = `${sessionId}_store.json`
    const rmOptions = { force: true, recursive: true }

    rmSync(sessionsDir(sessionFile), rmOptions)
    rmSync(sessionsDir(storeFile), rmOptions)

    sessions.delete(sessionId)
    retries.delete(sessionId)

    // UPDATE DATABASE
    await Device.findByIdAndUpdate( sessionId, {
        $set: { connectionStatus: 'disconnected'}
    })
}

const getChatList = (sessionId, isGroup = false) => {
    const filter = isGroup ? '@g.us' : '@s.whatsapp.net'

    return getSession(sessionId).store.chats.filter((chat) => {
        return chat.id.endsWith(filter)
    })
}

/**
 * @param {import('@adiwajshing/baileys').AnyWASocket} session
 */
const isExists = async (session, jid, isGroup = false) => {
    try {
        let result

        if (isGroup) {
            result = await session.groupMetadata(jid)

            return Boolean(result.id)
        }

        if (session.isLegacy) {
            result = await session.onWhatsApp(jid)
        } else {
            ;[result] = await session.onWhatsApp(jid)
        }

        return result.exists
    } catch {
        return false
    }
}

/**
 * @param {import('@adiwajshing/baileys').AnyWASocket} session
 */
const sendMessage = async (session, receiver, message, delayMs = 1000) => {
    try {
        await delay(parseInt(delayMs))

        return session.sendMessage(receiver, message)
    } catch {
        return Promise.reject(null) // eslint-disable-line prefer-promise-reject-errors
    }
}

const formatPhone = (phone) => {
    if (phone.endsWith('@s.whatsapp.net')) {
        return phone
    }

    let formatted = phone.replace(/\D/g, '')

    return (formatted += '@s.whatsapp.net')
}

const formatGroup = (group) => {
    if (group.endsWith('@g.us')) {
        return group
    }

    let formatted = group.replace(/[^\d-]/g, '')

    return (formatted += '@g.us')
}

const cleanup = () => {
    console.log('Running cleanup before exit.')

    sessions.forEach((session, sessionId) => {
        if (!session.isLegacy) {
            session.store.writeToFile(sessionsDir(`${sessionId}_store.json`))
        }
    })
}

const init = ({io, cronTask}) => {
    ctask = cronTask

    readdir(sessionsDir(), (err, files) => {
        if (err) {
            throw err
        }

        for (const file of files) {
            if ((!file.startsWith('md_') && !file.startsWith('legacy_')) || file.endsWith('_store')) {
                continue
            }

            const filename = file.replace('.json', '')
            const isLegacy = filename.split('_', 1)[0] !== 'md'
            const sessionId = filename.substring(isLegacy ? 7 : 3)
            
            createSession({sessionId, isLegacy, cronTask : ctask, io})
        }
    })
}

export {
    isSessionExists,
    createSession,
    getSession,
    getAllSessions,
    deleteSession,
    getChatList,
    isExists,
    sendMessage,
    formatPhone,
    formatGroup,
    cleanup,
    init,
}
