const express = require('express');
const router = express.Router();
const db = require('../db')
const emailService = require('../services/email')
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
router.get('/', auth, admin, auth, async (req, res) => {
    try {
        const [orders] = await db.execute('SELECT * FROM orders');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { title, email, login, price, type, idProduct } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }
        let userLogin = login || null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // если в токен добавлен login, используем его, если нет - останется переданный login или null
                userLogin = userLogin;
            } catch (e) {
            }
        }
        const [result] = await db.execute(
            'INSERT INTO orders (email, login, type, price, idProduct) VALUES (?, ?, ?, ?, ?)',
            [email, userLogin, type, price, idProduct]
        );
        const orderId = result.insertId;
        emailService.sendOrderConfirmation({
            orderId,
            email,
            price,
            title
        }).catch(err => {
            console.error('Ошибка email:', err.message);
        });
        res.json({ success: true, id: orderId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании заказа' });
    }
});
module.exports = router;