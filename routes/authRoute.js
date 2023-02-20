import express from 'express'
import { register, login, logout, refreshToken, changePassword, getUser, resetPassword, validateResetLink } from '../controllers/authController.js'
import verifyToken from '../middlewares/verifyToken.js'
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/change-password', verifyToken, changePassword)
router.get('/user', verifyToken, getUser)
router.get('/logout', logout)
router.post('/change-password', verifyToken, changePassword)
router.get('/reset-password', resetPassword)
router.get('/rst', validateResetLink)
router.get('/refresh-token', refreshToken)

export default router