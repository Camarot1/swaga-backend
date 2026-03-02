const express = require('express')
const router = express.Router()
const db = require('../db')




router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Логин и пароль обязательны' 
        }); 
    }

    try {
        const [users] = await db.execute(
            'SELECT * FROM users WHERE login = ? AND password = ?',
            [login, password]
        );

        if (users.length === 0) {
            return res.json({ 
                success: false, 
                message: 'Неверные учетные данные' 
            });
        }

        const userFromDB = users[0];
        
        const user = {
            id: userFromDB.id,
            login: userFromDB.login,
            isAdmin: userFromDB.isAdmin,
            password: userFromDB.password
        };
        
        console.log('User data:', user);
        
        res.json({
            success: true,
            user: user,
            redirectTo: user.isAdmin ? '/admin' : '/profile'
        });

    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера' 
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, login, password, isAdmin FROM users');
        res.json(rows);
    } catch (err) {
        console.error("ERROR ON GET USERS: ", err);
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        res.json({ message: 'Пользователь успешно удален' });
    } catch (err) {
        console.error("ERROR ON DELETE USER: ", err);
        res.status(500).json({ message: 'SERVER ERROR' });
    }
});
router.post('/register', async (req, res) => {
    const { login, password, confirmPassword } = req.body;

    if (!login || !password || !confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'Все поля обязательны для заполнения' 
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'Пароли не совпадают' 
        });
    }

    if (password.length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'Пароль должен содержать минимум 3 символа' 
        });
    }

    try {
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE login = ?',
            [login]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Пользователь с таким логином уже существует' 
            });
        }

        const [result] = await db.execute(
            'INSERT INTO users (login, password, isAdmin) VALUES (?, ?, ?)',
            [login, password, 0]
        );

        // Возвращаем данные нового пользователя
        const [newUser] = await db.execute(
            'SELECT id, login, isAdmin FROM users WHERE id = ?',
            [result.insertId]
        );

        res.json({
            success: true,
            message: 'Регистрация прошла успешно',
            user: newUser[0]
        });

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера' 
        });
    }
});

module.exports = router