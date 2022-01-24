const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

require('dotenv').config();

global.mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT
});

const app = express();
app.use(cors());

app.listen(parseInt(process.env.SERVER_PORT), () => {
    console.log(`Server running on port: ${process.env.SERVER_PORT}`);
});