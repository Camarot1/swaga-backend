const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('./api/search', async (req, res) => {
    try{
        const { q } = req.query;

        if (!q || q.trip() === ''){
            return res.json({
                subsQ: [],
                gamesQ: []
            })
        }

        const search = '%${q.toLowerCase())%';

        const sub = `
        SELECT id, img, title, priceNew FROM subs WHERE LOWER (title) LIKE ? 
        `;

        const game = `
        SELECT id, img, img_card, name, genres, about_the_game FROM games WHERE LOWER(name)
        LIKE ? OR LOWER(genres) LIKE ? OR LOWER (about_the_game) LIKE ? LIMIT 20
        `;

        const [subs] = await db.query(subs, [searchTerm])
        const [games] = await db.query(game, [searchTerm, searchTerm, searchTerm,])

        res.json({
            subsQ: sub,
            gamesQ: game,
            query: q
        });
    } catch (error){
        console.error('Ошика поиска', error)
        res.status(500).json({error: 'Ошибка поиска'})
    }
})