const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/save-game/:appId', auth, admin, async (req, res) => {
    try {
        const appId = String(req.params.appId || '');

        if (!/^\d+$/.test(appId)) {
            return res.status(400).json({
                error: 'Некорректный Steam App ID',
                details: 'Получено: ' + appId
            });
        }

        const steamAppId = parseInt(appId, 10);

        console.log('========================================');
        console.log('Добавление игры из Steam');
        console.log('Steam App ID:', steamAppId);
        console.log('========================================');

        const steamUrl =
            'https://store.steampowered.com/api/appdetails' +
            '?appids=' + encodeURIComponent(appId) +
            '&l=russian' +
            '&cc=ru' +
            '&cb=' + Date.now();

        console.log('Steam URL:', steamUrl);

        const response = await axios.get(steamUrl, {
            timeout: 20000,
            responseType: 'json',
            proxy: false,
            headers: {
                Accept: 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        let steamResponse = response.data;

        console.log('HTTP status Steam:', response.status);
        console.log('Тип ответа Steam:', typeof steamResponse);

        if (typeof steamResponse === 'string') {
            try {
                steamResponse = JSON.parse(
                    steamResponse.replace(/^\uFEFF/, '').trim()
                );
            } catch (parseError) {
                console.error(
                    'Ошибка разбора JSON Steam:',
                    parseError.message
                );

                return res.status(502).json({
                    error: 'Steam вернул некорректный JSON',
                    details: parseError.message
                });
            }
        }

        if (
            !steamResponse ||
            typeof steamResponse !== 'object' ||
            Array.isArray(steamResponse)
        ) {
            return res.status(502).json({
                error: 'Steam вернул неожиданный формат данных'
            });
        }

        const responseKeys = Object.keys(steamResponse);

        console.log(
            'Ключи ответа Steam:',
            responseKeys
        );

        let steamData = null;

        if (
            steamResponse[appId] &&
            typeof steamResponse[appId] === 'object'
        ) {
            const candidate = steamResponse[appId];

            if (
                candidate.data &&
                Number(candidate.data.steam_appid) === steamAppId
            ) {
                steamData = candidate;
            }

            if (
                !steamData &&
                candidate.success === true &&
                candidate.data
            ) {
                const nestedAppId =
                    Number(candidate.data.steam_appid);

                if (
                    Number.isFinite(nestedAppId) &&
                    nestedAppId === steamAppId
                ) {
                    steamData = candidate;
                }
            }
        }

        if (!steamData) {
            for (const key of responseKeys) {
                const candidate = steamResponse[key];

                if (
                    !candidate ||
                    typeof candidate !== 'object'
                ) {
                    continue;
                }

                if (
                    candidate.data &&
                    typeof candidate.data === 'object' &&
                    Number(candidate.data.steam_appid) === steamAppId
                ) {
                    steamData = candidate;
                    break;
                }
            }
        }

        if (!steamData) {
            if (
                steamResponse.success === true &&
                steamResponse.data &&
                Number(steamResponse.data.steam_appid) === steamAppId
            ) {
                steamData = steamResponse;
            }
        }

        if (!steamData) {
            console.error(
                'Не удалось найти данные нужной игры в ответе Steam'
            );

            console.error(
                'Запрошенный App ID:',
                steamAppId
            );

            console.error(
                'Ключи ответа:',
                responseKeys
            );

            return res.status(502).json({
                error: 'Steam вернул данные не для этой игры',
                details: {
                    requestedAppId: steamAppId,
                    responseKeys: responseKeys
                }
            });
        }

        if (steamData.success !== true) {
            return res.status(404).json({
                error: 'Игра не найдена в Steam',
                details: {
                    appId: steamAppId,
                    success: steamData.success
                }
            });
        }

        if (
            !steamData.data ||
            typeof steamData.data !== 'object'
        ) {
            return res.status(502).json({
                error: 'Steam не вернул данные игры',
                details: {
                    appId: steamAppId
                }
            });
        }

        const game = steamData.data;

        if (
            Number(game.steam_appid) !== steamAppId
        ) {
            return res.status(502).json({
                error: 'Steam вернул другую игру',
                details: {
                    requestedAppId: steamAppId,
                    receivedAppId: game.steam_appid
                }
            });
        }

        if (!game.name) {
            return res.status(502).json({
                error: 'Steam вернул игру без названия',
                details: {
                    appId: steamAppId
                }
            });
        }

        console.log(
            'Найдена игра:',
            game.name
        );

        console.log(
            'Внутренний steam_appid:',
            game.steam_appid
        );

        const isFree =
            game.is_free === true ||
            !game.price_overview ||
            game.price_overview.final === undefined ||
            game.price_overview.final === null;

        let dynamicPrices;

        if (isFree) {
            dynamicPrices = [0, 0, 0, 0];
        } else {
            const finalPrice =
                Number(game.price_overview.final);

            if (
                !Number.isFinite(finalPrice) ||
                finalPrice < 0
            ) {
                return res.status(502).json({
                    error: 'Steam вернул некорректную цену',
                    details: {
                        appId: steamAppId,
                        final: game.price_overview.final
                    }
                });
            }

            const basePrice =
                finalPrice / 100;

            dynamicPrices = [
                Math.round(basePrice * 1.1),
                Math.round(basePrice * 1.2),
                Math.round(basePrice * 1.3),
                Math.round(basePrice * 1.4)
            ];
        }

        const genres =
            Array.isArray(game.genres)
                ? game.genres
                    .map(function (item) {
                        return item && item.description
                            ? item.description
                            : null;
                    })
                    .filter(Boolean)
                : [];

        const screenshots =
            Array.isArray(game.screenshots)
                ? game.screenshots
                    .slice(0, 5)
                    .map(function (item) {
                        return item && item.path_thumbnail
                            ? item.path_thumbnail
                            : null;
                    })
                    .filter(Boolean)
                : [];

        const gameData = {
            name:
                game.name || null,

            img:
                game.header_image || null,

            img_card:
                game.capsule_image || null,

            about_the_game:
                game.about_the_game || null,

            supported_languages:
                game.supported_languages || null,

            min_requirements:
                game.pc_requirements &&
                game.pc_requirements.minimum
                    ? game.pc_requirements.minimum
                    : null,

            rec_requirements:
                game.pc_requirements &&
                game.pc_requirements.recommended
                    ? game.pc_requirements.recommended
                    : null,

            genres:
                JSON.stringify(genres),

            screenshots:
                JSON.stringify(screenshots),

            countries:
                JSON.stringify([
                    'Россия',
                    'Армения',
                    'Азербайджан',
                    'Беларусь'
                ]),

            prices:
                JSON.stringify(dynamicPrices),

            steam_appid:
                steamAppId,

            steam_price:
                game.price_overview &&
                game.price_overview.final_formatted
                    ? game.price_overview.final_formatted
                    : 'Бесплатно'
        };

        console.log(
            'Название:',
            gameData.name
        );

        console.log(
            'Steam App ID:',
            gameData.steam_appid
        );

        console.log(
            'Steam цена:',
            gameData.steam_price
        );

        const existingResult = await db.query(
            'SELECT id FROM games WHERE steam_appid = ? LIMIT 1',
            [steamAppId]
        );

        const existingGames = existingResult[0];

        if (
            existingGames &&
            existingGames.length > 0
        ) {
            return res.status(409).json({
                error: 'Игра уже существует в базе данных',
                gameId: existingGames[0].id,
                steam_appid: steamAppId
            });
        }

        const insertResult = await db.query(
            'INSERT INTO games (' +
                'name, ' +
                'img, ' +
                'img_card, ' +
                'about_the_game, ' +
                'supported_languages, ' +
                'min_requirements, ' +
                'rec_requirements, ' +
                'genres, ' +
                'screenshots, ' +
                'countries, ' +
                'prices, ' +
                'steam_appid, ' +
                'steam_price' +
            ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

        const result = insertResult[0];

        if (
            !result ||
            result.affectedRows !== 1
        ) {
            console.error(
                'MySQL INSERT result:',
                result
            );

            return res.status(500).json({
                error: 'Игра не была сохранена в базу данных'
            });
        }

        console.log('========================================');
        console.log('ИГРА УСПЕШНО СОХРАНЕНА');
        console.log('Название:', game.name);
        console.log('Steam App ID:', steamAppId);
        console.log('Database ID:', result.insertId);
        console.log('========================================');

        return res.status(201).json({
            message: 'Игра успешно сохранена в базу данных',
            gameId: result.insertId,
            gameName: game.name,
            steam_appid: steamAppId
        });

    } catch (error) {
        console.error('========================================');
        console.error('ОШИБКА ПРИ СОХРАНЕНИИ ИГРЫ');
        console.error(error);
        console.error('========================================');

        if (error.response) {
            console.error(
                'HTTP status:',
                error.response.status
            );

            console.error(
                'Steam response:',
                error.response.data
            );
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Steam не ответил вовремя'
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Игра уже существует в базе данных'
            });
        }

        return res.status(500).json({
            error: 'Ошибка при сохранении игры',
            details: error.message
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const queryResult = await db.query(
            'SELECT ' +
                'id, ' +
                'img, ' +
                'img_card, ' +
                'name AS title, ' +
                'screenshots, ' +
                'prices, ' +
                'countries, ' +
                'genres, ' +
                'steam_appid, ' +
                'steam_price ' +
            'FROM games ' +
            'ORDER BY id DESC'
        );

        const rows = queryResult[0];

        const games = rows.map(function (game) {
            const screenshots =
                safeJsonParse(game.screenshots);

            const prices =
                safeJsonParse(game.prices);

            const genres =
                safeJsonParse(game.genres);

            const countries =
                safeJsonParse(game.countries);

            return {
                id:
                    game.id,

                img:
                    game.img || null,

                img_card:
                    game.img_card || null,

                title:
                    game.title || '',

                priceNew:
                    prices.length > 0
                        ? prices[0]
                        : '0',

                priceOld:
                    null,

                genres:
                    genres,

                screenshots:
                    screenshots,

                countries:
                    countries,

                steam_appid:
                    game.steam_appid,

                steam_price:
                    game.steam_price || 'Бесплатно'
            };
        });

        return res.json(games);

    } catch (error) {
        console.error(
            'Ошибка при получении списка игр:',
            error
        );

        return res.status(500).json({
            error: 'Ошибка при получении списка игр',
            details: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id =
            String(req.params.id || '');

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                error: 'Некорректный ID игры'
            });
        }

        const queryResult = await db.query(
            'SELECT * FROM games WHERE id = ?',
            [id]
        );

        const rows = queryResult[0];

        if (
            !rows ||
            rows.length === 0
        ) {
            return res.status(404).json({
                error: 'Игра не найдена'
            });
        }

        const game = rows[0];

        return res.json({
            id:
                game.id,

            img:
                game.img || null,

            img_card:
                game.img_card || null,

            name:
                game.name || '',

            about_the_game:
                game.about_the_game || null,

            supported_languages:
                game.supported_languages || null,

            min_requirements:
                game.min_requirements || null,

            rec_requirements:
                game.rec_requirements || null,

            genres:
                safeJsonParse(game.genres),

            screenshots:
                safeJsonParse(game.screenshots),

            countries:
                safeJsonParse(game.countries),

            prices:
                safeJsonParse(game.prices),

            steam_appid:
                game.steam_appid,

            steam_price:
                game.steam_price || 'Бесплатно'
        });

    } catch (error) {
        console.error(
            'Ошибка при получении игры:',
            error
        );

        return res.status(500).json({
            error: 'Ошибка при получении данных игры',
            details: error.message
        });
    }
});

router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const id =
            String(req.params.id || '');

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                error: 'Некорректный ID игры'
            });
        }

        const queryResult = await db.execute(
            'DELETE FROM games WHERE id = ?',
            [id]
        );

        const result = queryResult[0];

        if (
            !result ||
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                error: 'Игра не найдена'
            });
        }

        return res.json({
            message: 'Игра успешно удалена'
        });

    } catch (error) {
        console.error(
            'Ошибка удаления игры:',
            error
        );

        return res.status(500).json({
            error: 'SERVER ERROR',
            details: error.message
        });
    }
});

function safeJsonParse(value) {
    try {
        if (Array.isArray(value)) {
            return value;
        }

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return [];
        }

        const parsed =
            JSON.parse(String(value));

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {
        return [];
    }
}

module.exports = router;