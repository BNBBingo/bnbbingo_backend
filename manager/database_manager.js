const CONST = require('../common/const');

async function connect() {
    return new Promise((resolve, reject) => {
        mysqlPool
            .getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

async function startTransactions(connection) {
    const query = 'START TRANSACTION';
    await connection.query(query);
}

async function commitTransaction(connection) {
    const query = 'COMMIT';
    await connection.query(query);
}

async function rollbackTransaction(connection) {
    const query = 'ROLLBACK';
    await connection.query(query);
}

async function onConnectionErr(connection, err, isRollBack = false) {
    if (connection == null) return;
    if (err.errono === CONST.MYSQL_ERR_NO.CONNECTION_ERROR) return;
    if (isRollBack) await rollbackTransaction(connection);
    connection.release();
}

async function mysqlExecute(connection, query, params = []) {
    // let stringify_params = [];
    // for (let i = 0; i < params.length; i++) {
    //     stringify_params.push(params[i].toString());
    // }

    return await connection.query(query, params);
}

async function getTickets(address, offset, limit) {
    let connection = null;
    try {
        connection = await connect();
        const query = 'SELECT * from tbl_tickets WHERE address = ? LIMIT ?, ?';
        let [rows] = await mysqlExecute(connection, query, [address, offset, limit]);
        connection.release();
        return rows;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err);
        return [];
    }
}

async function getTicketCount(address) {
    let connection = null;
    try {
        connection = await connect();
        const query = 'SELECT COUNT(id) as total from tbl_tickets WHERE address = ?';
        let [rows] = await mysqlExecute(connection, query, [address]);
        connection.release();
        return rows[0].total;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err);
        return 0;
    }
}

module.exports = {
    getTickets,
    getTicketCount
}