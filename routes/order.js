const express = require('express');
const router = express.Router();
const db = require('../db')

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
        const { email, login, price } = req.body;

        const [result] = await db.execute(
            'INSERT INTO orders (email, login, price) VALUES (?, ?, ?)',
            [email, login, price]
        );

        res.json({ success: true, id: result.insertId });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Ошибка при создании заказа' });
    }
});

module.exports = router;