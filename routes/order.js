const express = require('express');
const router = express.Router();
const db = require('../db')
const mail = require('../config/mail.js')
const emailService = require('../services/email')

router.get('/', async (req, res) => {
    try {
        const [orders] = await db.execute('SELECT * FROM orders');
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, email, login, price, type, idProduct } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        const [result] = await db.execute(
            'INSERT INTO orders (email, login, type, price, idProduct) VALUES (?, ?, ?, ?, ?)',
            [email, login, type, price, idProduct]
        );

        const orderId = result.insertId;

        emailService.sendOrderConfirmation({
            orderId,
            email,
            price,
            title
        }).catch(err => {
            console.error('Ошибка при отправке письма для заказа', orderId, ':', err.message)
        })

        res.json({ success: true, id: result.insertId });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Ошибка при создании заказа' });
    }
});
module.exports = router;

// ДОБАВИТЬ ЛОГИКУ ПРОВЕРКИ ЗАПРОСА В АДМИНКЕ, ДОБАВИТЬ НА ФРОНТЕ API КЛЮЧ В ОПИСАНИЕ HEADER ЗАПРОСА
