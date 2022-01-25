const express = require('express');
const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const mysql = require('mysql2/promise');
const registerAPIs = require('./manager/api_manager');
const { syncService } = require('./block_sync_service');

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
app.use(formidableMiddleware());

registerAPIs(app);

app.listen(parseInt(process.env.SERVER_PORT), () => {
    console.log(`Server running on port: ${process.env.SERVER_PORT}`);
});

syncService();