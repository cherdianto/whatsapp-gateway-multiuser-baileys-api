const errorHandler = (err, req, res, next) => {
    const statusCode = req.statusCode ? req.statusCode : 500

    res.status(statusCode)

    res.json({
        status: false,
        message: err.message,
        stack: err.stack
    })
}

export default errorHandler