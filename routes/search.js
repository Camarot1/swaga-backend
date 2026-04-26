const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/api/search', async (req, res) => {
    try{
        const { q } = req.query;

        if (!q || q.trim() === ''){
            return res.json({
                subsQ: [],
                gamesQ: []
            })
        }

        const search = `%${q.toLowerCase()}%`;

        const sub = `
        SELECT id, img, title, priceNew FROM subs WHERE LOWER (title) LIKE ? 
        `;

        const game = `
        SELECT id, img, img_card, name, genres, about_the_game FROM games WHERE LOWER(name)
        LIKE ? OR LOWER(genres) LIKE ? OR LOWER (about_the_game) LIKE ? LIMIT 20
        `;

        const [subs] = await db.query(sub, [search])
        const [games] = await db.query(game, [search, search, search])

        res.json({
            subsQ: subs,
            gamesQ: games,
            query: q
        });
    } catch (error){
        console.error('Ошибка поиска', error)
        res.status(500).json({error: 'Ошибка поиска'})
    }
})