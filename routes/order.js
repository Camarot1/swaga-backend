const express = require('express');
const router = express.Router();
const db = require('../db')
const auth = require('../middleware/auth')
const emailService = require('../services/email')


router.get('/', auth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Нет прав' });
    }

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

        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                userLogin = decoded.login || userLogin;
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
            console.error('Ошибка email:', err.message)
        })

        res.json({ success: true, id: orderId });

    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании заказа' });
    }
});

module.exports = router;