const express = require('express');
const router = express.Router()
const db = require('../db')
router.get('/', async (req, res) => {
    try {
        const [reviews] = await db.execute('SELECT * FROM reviews')
        res.json(reviews)
    } catch (error) {
        console.error('ERROR fetcjing orders:', error);
        res.status(500).json({ error: 'Ошибка при получении заказов' })
    }
});
router.post('/', async (req, res) => {
    try {
        const { login, reviewsText, reviewsPoint } = req.body;

        const [result] = await db.execute(
            'INSERT INTO rewiews (login, reviewsText, reviewsPoint) VALUES (?,?,?)', [login, reviewsText, reviewsPoint]
        )

        res.json({ success: true, id: result.insertId})
    } catch (error){
        console.error('Error creating reviews:', error)
        res.status(500).json({ error: 'Ошибка при создании отзыва'})
    }
})
module.exports = router;