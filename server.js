const path = require('path')
const dotenv = require('dotenv')
require('dotenv').config()
require('dotenv').config({path: '.env.local'})
const express = require('express')
const app = express()
const cors = require('cors')

const port = 4000
app.use(cors())
app.use(express.json())

const apiMiddleware = require('./middleware/auth')

const usersRouter = require('./routes/users')
app.use('/users',usersRouter)


const subsRouter = require('./routes/subs')
app.use('/subs' , subsRouter)

const gamesRouter = require('./routes/games')
app.use('/games', gamesRouter)

const orderRouter = require('./routes/order')
app.use('/order', orderRouter)

const reviewsPage = require('./routes/reviews')
app.use('/reviews', reviewsPage)

const posterPage = require('./routes/poster.js')
app.use('/poster', posterPage)



app.get('/',(req,res) => {
    res.send('Сервер работает')
}) 

app.listen(port,'0.0.0.0', () => {
    console.log(`Сервер запущен: порт ${port}`)
})
