const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async ( req, res) => {
    try{
        const [poster] = await db.execute('SELECT * FROM poster')
        res.json(poster)
    } catch (error) {
        console.error('Error fetching poster', error)
        res.status(500).json({error: 'Ошибка при получении постеров'})
    }
})

module.exports = router;                                                                                                                              