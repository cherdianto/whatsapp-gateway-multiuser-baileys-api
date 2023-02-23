const bypassVariable = ({io, cronTask}) => {
    const bypass = (req, res, next) => {
        req.io = io
        req.cronTask = cronTask
        // res.locals.cronTask = cronTask
        next()
    }

    return bypass
}

export default bypassVariable