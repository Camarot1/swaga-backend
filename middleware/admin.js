module.exports = function(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Не авторизован' });
    }
    if (req.user.isAdmin !== 1) {
        return res.status(403).json({ message: 'Доступ запрещён. Требуются права администратора.' });
    }
    next();
};