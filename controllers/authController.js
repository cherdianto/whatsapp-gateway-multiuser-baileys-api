import User from "../models/User.js"
import Token from "../models/Token.js"
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import crypto from 'crypto'
import bcrypt from "bcrypt"

const env = dotenv.config().parsed

const accessSecretKey = env.ACCESS_SECRET_KEY
const refreshSecretKey = env.REFRESH_SECRET_KEY
const accessExpiry = env.ACCESS_EXPIRY
const refreshExpiry = env.REFRESH_EXPIRY

function generateToken() {
    const buffer = crypto.randomBytes(32);
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

const generateAccessToken = (payload) => {
    return jwt.sign(payload, accessSecretKey, {
        expiresIn: accessExpiry
    })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, refreshSecretKey, {
        expiresIn: refreshExpiry
    })
}


export const register = asyncHandler(async (req, res) => {
    const {
        fullname,
        email,
        password
    } = req.body

    // FULLNAME CHECK
    if (!fullname) {
        res.status(400)
        throw new Error('FULLNAME_REQUIRED')
    }

    // EMAIL CHECK
    if (!email) {
        res.status(400)
        throw new Error('EMAIL_REQUIRED')
    }

    // PASSWORD CHECK
    if (!password) {
        res.status(400)
        throw new Error('PASSWORD_REQUIRED')
    }

    // EMAIL DUPLICATE CHECK
    const isEmailExist = await User.findOne({
        email: email
    })

    if (isEmailExist) {
        res.status(400)
        throw new Error('DUPLICATE_EMAIL')
    }

    // MAKE SALT
    let salt = await bcrypt.genSalt(12)
    // HASH THE PASSWORD
    let hashedPassword = await bcrypt.hash(password, salt)

    // STORE USER TO DB
    try {
        const newUser = await User.create({
            fullname,
            email,
            password: hashedPassword,
            role: email === 'webcreatia@gmail.com' ? 'Superadmin' : 'Regular'
        })

        res.status(200).json({
            status: true,
            message: 'USER_REGISTER_SUCCESS',
            // newUser
        })

    } catch (error) {
        res.status(500)
        throw new Error('USER_REGISTER_FAILED')
    }
})

export const login = asyncHandler(async (req, res) => {
    const {
        email,
        password
    } = req.body

    // EMAIL CHECK
    if (!email) {
        res.status(400)
        throw new Error('EMAIL_REQUIRED')
    }

    // PASSWORD CHECK
    if (!password) {
        res.status(400)
        throw new Error('PASSWORD_REQUIRED')
    }

    // USER EXIST BASED ON EMAIL
    const user = await User.findOne({
        email
    })

    if (!user) {
        res.status(400)
        throw new Error("USER_NOT_FOUND")
    }

    // PASSWORD CHECK
    const isMatch = bcrypt.compareSync(password, user.password)
    if (!isMatch) {
        res.status(400)
        throw new Error("WRONG_PASSWORD")
    }

    // GENERATE TOKENS
    const accessToken = generateAccessToken({
        id: user._id
    })

    const refreshToken = generateRefreshToken({
        id: user._id
    })

    // SAVE REFRESH TOKEN IN DB
    const updatedUserDb = await User.findOneAndUpdate({
        _id: user._id
    }, {
        $set: {
            refreshToken,
            accessToken
        }
    }).select('-password -refreshToken').populate('devices')

    if (!updatedUserDb) {
        res.status(500)
        throw new Error("ERROR_UPDATE_DB")
    }

    // SET COOKIES
    if (env.ENV === 'dev') {
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
    } else {
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            domain: env.COOKIE_OPTION_PROD_URL,
            path: '/'
        })
    }

    res.status(200).json({
        status: true,
        message: "LOGIN_SUCCESS",
        user: updatedUserDb
    })
})

export const logout = asyncHandler(async (req, res) => {
    const userRefreshToken = req.cookies?.refreshToken

    if (!userRefreshToken) {
        res.status(204)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            domain: env.COOKIE_OPTION_PROD_URL,
            path: '/'
        })
        // throw new Error("NO_REFRESH_TOKEN")
        return res.status(200).json({
            status: true,
            message: "LOGGED_OUT_SUCCESS_1"
        })
    }

    const decoded = jwt.verify(userRefreshToken, refreshSecretKey)

    if (env.ENV === 'dev') {
        res.clearCookie('refreshToken')
    } else {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            domain: env.COOKIE_OPTION_PROD_URL,
            path: '/'
        })
    }

    if (!decoded) {
        res.status(401)
        throw new Error("INVALID_REFRESH_TOKEN")
    }

    const user = await User.findById(decoded.id)

    if (!user) {
        res.status(401)
        return Promise.reject("USER_NOT_FOUND")
    }

    const updateDb = await User.updateOne({
        _id: user._id
    }, {
        $set: {
            refreshToken: '',
            accessToken: ''
        }
    })

    if (!updateDb) {
        res.status(500)
        throw new Error("LOG_OUT_FAILED")
    }

    return res.status(200).json({
        status: true,
        message: "LOGGED_OUT_SUCCESS"
    })
})

export const changePassword = asyncHandler(async (req, res) => {
    // form : email, oldpassword, newpassword

    const {
        oldPassword,
        newPassword,
        confirmNewPassword
    } = req.body

    const user = req.user

    if (!newPassword || newPassword == '') {
        res.status(400)
        throw new Error("NEW_PASSWORD_REQUIRED")
    }

    if (newPassword !== confirmNewPassword ) {
        res.status(400)
        throw new Error("NEW PASSWORD MISMATCH")
    }

    if (newPassword.trim().length === 0 || newPassword.includes(" ")) {
        res.status(400)
        throw new Error("PASSWORD_CONTAIN_SPACE")
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password)
    if (!isMatch) {
        res.status(400)
        throw new Error("WRONG_PASSWORD")
    }

    // make salt
    let salt = await bcrypt.genSalt(12)
    // hash the password
    let hashedPassword = await bcrypt.hash(newPassword, salt)

    // update db
    const updateDb = await User.updateOne({
        _id: user._id
    }, {
        $set: {
            password: hashedPassword
        }
    })

    if (!updateDb) {
        res.status(500)
        throw new Error("PASSWORD_CHANGE_FAILED")
    }

    res.status(200).json({
        status: true,
        message: "PASSWORD_CHANGE_SUCCESS"
    })
})

export const refreshToken = asyncHandler(async (req, res) => {
    const userRefreshToken = req.cookies.refreshToken

    if (!userRefreshToken) {
        res.status(401)
        throw new Error("REFRESH_TOKEN_NOT_FOUND")
    }

    const decoded = jwt.verify(userRefreshToken, refreshSecretKey)

    if (!decoded) {
        res.status(401)
        throw new Error("INVALID_REFRESH_TOKEN")
    }

    const user = await User.findById(decoded.id)

    if (!user) {
        res.status(401)
        throw new Error("USER_NOT_FOUND")
    }

    const accessToken = generateAccessToken({
        id: user._id
    })

    res.status(200).json({
        status: true,
        accessToken
    })
})

export const getUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).populate('devices').select('-password -refreshToken')

    res.status(200).json({
        status: true,
        message: "GET_USER_SUCCESS",
        user
    })
})

export const resetPassword = asyncHandler(async (req, res) => {
    // form : email, oldpassword, newpassword

    const email = req.query.email

    if (!email) {
        res.status(400)
        throw new Error("EMAIL_REQUIRED")
    }

    const user = await User.findOne({
        email
    })
    if (!user) {
        res.status(400)
        throw new Error("USER_NOT_FOUND")
    }

    let expiryAt = new Date()
    // expiryAt.setHours(expiryAt.getHours() + 24)
    expiryAt.setMinutes(expiryAt.getMinutes() + 15)

    const newToken = await Token.create({
        email,
        token: generateToken(),
        expiryAt
    })

    if(!newToken){
        res.status(400)
        throw new Error("RESET_LINK_FAILED")
    }

    res.status(200).json({
        status: true,
        message: "RESET_LINK_SUCCESS",
        token: newToken
    })
})

export const validateResetLink = asyncHandler(async (req, res) => {
    const token = req.query.token

    const isValid = await Token.findOne({token})

    if(!isValid){
        res.status(400)
        throw new Error("INVALID_TOKEN")
    }

    if(new Date(isValid.expiryAt) < Date.now()){
        res.status(400)
        throw new Error("EXPIRED")
    }

    // res.status(200)
    res.render('inputPassword', {
        token,
        apiUrl: env.ENV === 'dev' ? env.API_URL_DEV : env.API_URL_PROD
    })
})

export const newPasswordFromReset = asyncHandler(async (req, res) => {

    const {
        token,
        new_password,
        confirm_new_password
    } = req.body

    if (!token || token == '') {
        res.status(400)
        // throw new Error("TOKEN_REQUIRED")
        return res.render('failedResetPassword')
    }

    if (!new_password || new_password == '') {
        res.status(400)
        // throw new Error("NEW_PASSWORD_REQUIRED")
        return res.render('failedResetPassword')
    }

    if (!confirm_new_password || confirm_new_password == '') {
        res.status(400)
        // throw new Error("NEW_PASSWORD_REQUIRED")
        return res.render('failedResetPassword')
    }

    if (new_password !== confirm_new_password) {
        res.status(400)
        // throw new Error("PASSWORDS_NOT_MATCH")
        return res.render('failedResetPassword')
    }

    if (new_password.trim().length === 0 || new_password.includes(" ")) {
        res.status(400)
        // throw new Error("PASSWORD_CONTAIN_SPACE")
        return res.render('failedResetPassword')
    }

    const isTokenValid = await Token.findOne({
        token
    })

    if (!isTokenValid) {
        res.status(400)
        // throw new Error("INVALID_TOKEN")
        return res.render('tokenExpired')
    }

    if (new Date(isTokenValid.expiryAt) < Date.now()) {
        res.status(400)
        // throw new Error("EXPIRED")
        return res.render('tokenExpired')
    }

    const user = await User.findOne({
        email: isTokenValid.email
    })

    if (!user) {
        res.status(400)
        // throw new Error("INVALID_TOKEN")
        return res.render('tokenExpired')
    }

    // make salt
    let salt = await bcrypt.genSalt(12)
    // hash the password
    let hashedPassword = await bcrypt.hash(new_password, salt)

    // update db
    const updateDb = await User.updateOne({
        _id: user._id
    }, {
        $set: {
            password: hashedPassword
        }
    })

    if (!updateDb) {
        res.status(500)
        // throw new Error("PASSWORD_CHANGE_FAILED")
        return res.render('failedResetPassword')

    }

    const deleteTokenDb = await Token.findOneAndDelete({
        token
    })

    if (!deleteTokenDb) {
        console.log('delete token failed')
        // res.status(500)
        // throw new Error("DELETE_TOKEN_FAILED")
    }

    res.render('passwordSuccess')
})