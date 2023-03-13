import express from 'express'
import { addMessage, queuMessage, getMessages } from '../controllers/messageController.js'
import { formBerkah, imeaGreeting } from '../controllers/imeaController.js'
import verifyApiKey from '../middlewares/verifyApiKey.js'
import verifyToken from '../middlewares/verifyToken.js'
// const verifyToken = require('../middlewares/verifyToken')
const router = express.Router()

router.post('/add', verifyApiKey, addMessage)
router.get('/all', verifyToken, getMessages)
router.get('/queu', verifyApiKey, queuMessage)
router.post('/imea-greeting', verifyApiKey, imeaGreeting)
router.post('/form-berkah', verifyApiKey, formBerkah)

export default router