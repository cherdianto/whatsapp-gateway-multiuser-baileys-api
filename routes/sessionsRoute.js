import { Router } from 'express'
import { body } from 'express-validator'
import requestValidator from '../middlewares/requestValidator.js'
import sessionValidator from '../middlewares/sessionValidator.js'
import * as controller from '../controllers/sessionsController.js'
import verifyToken from '../middlewares/verifyToken.js'
import verifyApiKey from '../middlewares/verifyApiKey.js'

const router = Router()

router.get('/find', verifyApiKey, sessionValidator, controller.find)

router.get('/all', verifyToken, controller.getAll)

router.get('/status', verifyApiKey, sessionValidator, controller.status)

router.post('/add', body('isLegacy').notEmpty(), verifyApiKey, requestValidator, controller.add)

router.delete('/delete', verifyToken, verifyApiKey, sessionValidator, controller.del)

export default router
