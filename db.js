const {Pool} = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'novamind',
    user: 'postgres',
    password: '1234'
})



module.exports = pool