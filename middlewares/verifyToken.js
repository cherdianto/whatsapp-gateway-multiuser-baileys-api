import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import User from '../models/User.js'
import asyncHandler from 'express-async-handler'

const env = dotenv.config().parsed

const verifyToken = asyncHandler(async (req, res, next) => {
    let userId = ''

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        res.status(401)
        throw new Error('TOKEN_REQUIRED')
    }

    jwt.verify(token, env.ACCESS_SECRET_KEY, (error, decoded) => {
        if (error) {
            // errors = invalid signature, jwt malformed, jwt must be provided, invalid token, jwt expired
            res.status(401)
            throw new Error("INVALID_TOKEN")
        } else {
            userId = decoded.id
        }
    })

    const user = await User.findById(userId).select('-password')

    if (!user) {
        res.status(400)
        throw new Error('NO_USER_FOUND')
    }
    // req.jwt = decoded
    req.user = user

    next()
})

export default verifyToken