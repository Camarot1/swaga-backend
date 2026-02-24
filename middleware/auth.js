module.exports = function(req, res, next) {
    const apiKey = req.headers['x-api-key']

    const validKey = process.env.AUTH_KEY

    if (!apiKey || apiKey !== validKey){
        return res.status(403).json({
            error: 'Доступ запрещен'
        })
    }
     
    next()
}