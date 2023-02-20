import express from 'express'
import { addDevice, showDevices, updateDevice, deleteDevice, createApiKey } from '../controllers/deviceController.js'
import verifyApiKey from '../middlewares/verifyApiKey.js'
import verifyToken from '../middlewares/verifyToken.js'
const router = express.Router()

// @url : {{domain}}/device/update/{{deviceId}}
router.post('/add', verifyToken, addDevice)

// @url : {{domain}}/device/update/{{deviceId}}
router.put('/update/:deviceid', verifyToken, updateDevice)

// @url : {{domain}}/device/delete/{{deviceId}}
router.delete('/delete/:deviceid', verifyToken, deleteDevice)

// @url : {{domain}}/device/show-devices
router.get('/all', verifyToken, showDevices) 

// @url : {{domain}}/device/new-api-key/{{deviceId}}
router.get('/new-api-key/:deviceid', verifyToken, createApiKey) 



export default router