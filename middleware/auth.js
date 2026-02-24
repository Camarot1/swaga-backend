module.export = (req, res, next) => {
    const apiKey = req.headers['x-api-key']

    const validKey = process.env.ADMIN_KEY

    if (!apiKey || apiKey !== validKey){
        return res.status(403).json({
            error: 'Доступ запрещен'
        })
    }
     
    next()
}