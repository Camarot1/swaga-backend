const express = require('express')
const router = express.Router()
const db = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/register', async (req, res) => {
    const { login, password, confirmPassword } = req.body;
    if (!login || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Пароли не совпадают' });
    }
    try {
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE login = ?',
            [login]
        );
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (login, password, isAdmin) VALUES (?, ?, ?)',
            [login, hashedPassword, 0]
        );
        res.json({
            success: true,
            message: 'Регистрация успешна'
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
})
router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE login = ?',
            [login]
        );
        if (users.length === 0) {
            return res.status(401).json({ message: 'Неверные данные' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверные данные' });
        }
        const token = jwt.sign(
            { id: user.id, login: user.login, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                login: user.login,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
})
router.get('/', auth, admin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, login, isAdmin FROM users'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});
router.delete('/:id', auth, admin, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Нет прав' });
    }
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json({ message: 'Удалено' });
    } catch (err) {
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});
router.get('/check-admin', auth, (req, res) => {
    res.json({ isAdmin: req.user.isAdmin === 1 });
});

module.exports = router