import { Router } from 'express'
import sessionsRoute from '../routes/sessionsRoute.js'
import chatsRoute from '../routes/chatsRoute.js'
import authRoute from '../routes/authRoute.js'
import deviceRoute from '../routes/deviceRoute.js'
import messageRoute from '../routes/messageRoute.js'
import groupsRoute from '../routes/groupsRoute.js'
import response from '../response.js'

const router = Router()

router.use('/auth', authRoute)
router.use('/sessions', sessionsRoute)
router.use('/chats', chatsRoute)
router.use('/device', deviceRoute)
router.use('/message', messageRoute)
// router.use('/groups', groupsRoute)

router.all('*', (req, res) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

export default router
