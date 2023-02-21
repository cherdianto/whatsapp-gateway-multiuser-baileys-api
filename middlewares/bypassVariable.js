const bypassVariable = ({cronTask}) => {
    console.log('bypass mid')
    console.log(cronTask)
    const bypass = (req, res, next) => {
        
        req.cronTask = cronTask
        res.locals.cronTask = cronTask
        next()
    }

    return bypass
}

export default bypassVariable