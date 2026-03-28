const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/save-game/:appId', auth, admin, async (req, res) => {
    try {
        const { appId } = req.params;

        const response = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${appId}&l=russian&cc=ru`
        );

        const steamData = response.data[appId];

        if (!steamData.success) {
            return res.status(404).json({ error: 'Игра не найдена в Steam' });
        }

        const game = steamData.data;

        const gameData = {
            name: game.name,
            img: game.header_image,
            img_card: game.capsule_image,
            about_the_game: game.about_the_game,
            supported_languages: game.supported_languages,
            min_requirements: game.pc_requirements?.minimum || null,
            rec_requirements: game.pc_requirements?.recommended || null,
            genres: JSON.stringify(game.genres?.map(genre => genre.description) || []),
            screenshots: JSON.stringify(
                game.screenshots?.slice(0, 5).map(screenshot => screenshot.path_thumbnail) || []
            ),
            countries: JSON.stringify(["Россия", "Армения", "Азербайджан", "Беларусь"]),
            prices: JSON.stringify(["1000", "1100", "1200", "1300"]),
            steam_appid: parseInt(appId),
            steam_price: game.price_overview?.final_formatted
        };
        console.log('First log:', game.price_overview);
        console.log('Second:', game.price_overview?.final_formatted);

        const [result] = await db.query(
            `INSERT INTO games 
             (name, img, img_card, about_the_game, supported_languages, min_requirements, rec_requirements, genres, screenshots, countries, prices, steam_appid, steam_price) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?)`,
            [
                gameData.name,
                gameData.img,
                gameData.img_card,
                gameData.about_the_game,
                gameData.supported_languages,
                gameData.min_requirements,
                gameData.rec_requirements,
                gameData.genres,
                gameData.screenshots,
                gameData.countries,
                gameData.prices,
                gameData.steam_appid,
                gameData.steam_price
            ]
        );

        res.json({
            message: 'Игра успешно сохранена в базу данных',
            gameId: result.insertId,
            gameName: game.name
        });

    } catch (error) {
        console.error('Ошибка при сохранении игры:', error);
        res.status(500).json({
            error: 'Ошибка при сохранении игры',
            details: error.message
        });
    }
});

// получить все игры для каталога
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                img_card,
                name as title,
                screenshots,
                prices,
                countries,
                genres,
                steam_appid,
                steam_price
            FROM games 
            ORDER BY id DESC
        `);

        const games = rows.map(game => {
            try {
                const screenshots = safeJsonParse(game.screenshots);
                const prices = safeJsonParse(game.prices);
                const genres = safeJsonParse(game.genres);

                return {
                    id: game.id,
                    img: Array.isArray(screenshots) && screenshots.length > 0 ? screenshots[0] : null,
                    img_card: Array.isArray(screenshots) && screenshots.length > 0 ? game.img_card : null,
                    title: game.title,
                    priceNew: Array.isArray(prices) && prices.length > 0 ? prices[0] : "0",
                    priceOld: null,
                    genres: Array.isArray(genres) ? genres : [],
                    steam_appid: game.steam_appid,
                    steam_price: game.steam_price ?? 'Бесплатно'
                };
            } catch (error) {
                console.error(`Ошибка обработки игры ID ${game.id}:`, error);
                return {
                    id: game.id,
                    img: null,
                    img_card:null,
                    title: game.title,
                    priceNew: "0",
                    priceOld: null,
                    genres: [],
                    steam_price: "0" 
                };
            }
        });

        res.json(games);

    } catch (error) {
        console.error('Ошибка при получении списка игр:', error);
        res.status(500).json({
            error: 'Ошибка при получении списка игр',
            details: error.message
        });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query('SELECT * FROM games WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Игра не найдена' });
        }

        const game = rows[0];

        const formattedGame = {
            id: game.id,
            img: game.img,
            img_card: game.img_card,
            name: game.name,
            about_the_game: game.about_the_game,
            supported_languages: game.supported_languages,
            min_requirements: game.min_requirements,
            rec_requirements: game.rec_requirements,
            genres: safeJsonParse(game.genres),
            screenshots: safeJsonParse(game.screenshots),
            countries: safeJsonParse(game.countries),
            prices: safeJsonParse(game.prices),
            steam_appid: game.steam_appid,
            steam_price: game.steam_price
        };

        res.json(formattedGame);

    } catch (error) {
        console.error('Ошибка при получении игры:', error);
        res.status(500).json({
            error: 'Ошибка при получении данных игры',
            details: error.message
        });
    }
});

// функция для безопасного парсинга JSON
function safeJsonParse(str) {
    try {
        if (typeof str === 'object') return str;

        if (!str || str === 'null') return [];

        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Ошибка парсинга JSON:', error, 'Строка:', str);
        return [];
    }
}
router.delete('/:id',  auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM games WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Игра не найдена' });
        }

        res.json({ message: 'Игра успешно удалена' });
    } catch (err) {
        console.error("ERROR ON DELETE GAME: ", err);
        res.status(500).json({ error: 'SERVER ERROR' });
    }
});
module.exports = router;
/*
CREATE TABLE `games` (
  `id` int NOT NULL AUTO_INCREMENT,
  `img` varchar(255) NOT NULL,
  `img_card` varchar(255) NOT NULL,
  `name` varchar(500) NOT NULL,
  `about_the_game` text,
  `supported_languages` text,
  `min_requirements` text,
  `rec_requirements` text,
  `genres` json DEFAULT NULL,
  `screenshots` json DEFAULT NULL,
  `countries` json DEFAULT NULL,
  `prices` json DEFAULT NULL,
  `steam_appid` int DEFAULT NULL,
  `steam_price` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `steam_appid` (`steam_appid`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
*/
