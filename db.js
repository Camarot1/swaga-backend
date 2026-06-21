const mysql = require('mysql2')

const pool = mysql.createPool({
    host: 'localhost',
    user:'root',
    password: '21ASD0707',
    database: 'swaga'
})

module.exports = pool.promise()
// const mysql = require('mysql2')

// const pool = mysql.createPool({
//    host: 'localhost',
//    user:'root',
//    password: '',
//    database: 'swaga'
// })

// module.exports = pool.promise()
