const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
router.post('/', auth, admin, async (req, res) => {
    try {
        const {
            img,
            title,
            priceNew,
            time,
            need_vpn,
            is_official,
            instant_delivery,
            no_account_transfer
        } = req.body;
        const [result] = await db.execute(
            `INSERT INTO subs (img, title, priceNew, time, need_vpn, is_official, instant_delivery, no_account_transfer) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [img, title, priceNew, time, need_vpn, is_official, instant_delivery, no_account_transfer]
        );
        const [newSub] = await db.execute('SELECT * FROM subs WHERE id = ?', [result.insertId]);
        res.json(newSub[0]);
    } catch (err) {
        console.error("ERROR ON CREATE SUB: ", err);
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});
// тут вытягиваем все подписки с бд
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM subs')
        res.json(rows)
    } catch (err) {
        console.error("ERROR ON GET DATA: ", err)
        res.status(500).json({ message: 'SERVER ERROR' })
    }
})
// тут дергаем 1 сабку которую хотим открыть на странице sub.jsx
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const [rows] = await db.query('SELECT * FROM subs WHERE id = ?', [id])
        if (rows.length === 0) {
            return res.json(null)
        }
        res.json(rows[0])
    } catch (err) {
        console.error("ERROR ON GET SUB DATA: ", err)
        res.status(500).json({ message: 'SERVER ERROR' })
    }
})
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM subs WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Подписка не найдена' });
        }
        res.json({ message: 'Подписка успешно удалена' });
    } catch (err) {
        console.error("ERROR ON DELETE SUB: ", err);
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});
module.exports = router
