const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ message: 'Нет токена' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (e) {
        if (e.name === 'TokenExpiredError'){
            return res.status(401).json({message:'Токен истек, перезайдите в профиль'})
        }
        return res.status(403).json({ message: 'Неверный токен' })
    }
}