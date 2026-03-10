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
        const { email, login, price, type } = req.body;
        
        // Логируем полученные данные
        console.log('Received data:', { email, login, price, type });
        console.log('Type value:', type, 'Type type:', typeof type);

        // Проверка обязательных полей
        if (!email || !price || !type) {
            console.log('Missing fields:', { email: !!email, price: !!price, type: !!type });
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }

        const [result] = await db.execute(
            'INSERT INTO orders (email, login, type, price) VALUES (?, ?, ?, ?)',
            [email, login, type, parseFloat(price)] // Принудительно преобразуем price в число
        );

        console.log('Insert result:', result);
        res.json({ success: true, id: result.insertId });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Ошибка при создании заказа' });
    }
});

module.exports = router;

// ДОБАВИТЬ ЛОГИКУ ПРОВЕРКИ ЗАПРОСА В АДМИНКЕ, ДОБАВИТЬ НА ФРОНТЕ API КЛЮЧ В ОПИСАНИЕ HEADER ЗАПРОСА