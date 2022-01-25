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

async function getStatusValue(key) {
    let connection = null;
    try {
        connection = await connect();
        const query = 'SELECT value from tbl_status WHERE name = ?';
        let [rows] = await mysqlExecute(connection, query, [key]);
        connection.release();
        return rows[0].value;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err);
        return 0;
    }
}

async function _updateStatusValue(connection, key, value) {
    let ret = false;
    try {
        const query =
            'UPDATE tbl_status SET value = ? WHERE name = ?';
        const [rows] = await mysqlExecute(connection, query, [
            value,
            key,
        ]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }
    return ret;
}

async function updateSyncBlocNumber(value) {
    let ret = false;
    let connection = null;

    try {
        connection = await connect();
        ret = await _updateStatusValue(connection, CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER, value);
        connection.release();
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err);
    }
    return ret;
}

async function updateCurrentRoundID(value, blockNumber) {
    let ret = false;
    let connection = null;

    try {
        connection = await connect();

        await startTransactions(connection);
        if (!await _updateStatusValue(connection, CONST.STATUS_KEY.CURRENT_ROUND, value)) {
            throw new Error('Updating current round id failed.');
        }

        if (!await _updateStatusValue(connection, CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER, blockNumber)) {
            throw new Error('Updating synchronized block number failed.');
        }

        await commitTransaction(connection);
        connection.release();
        ret = true;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err, true);
    }
    return ret;
}

async function addTicket(ticketID, roundID, address, ticketNums, blockNumber) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();
        await startTransactions(connection);

        if (!await _addTicket(connection, ticketID, roundID, address, ticketNums)) {
            throw new Error('Adding ticket failed.');
        }

        if (!await _updateStatusValue(connection, CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER, blockNumber)) {
            throw new Error('Updating sync block number failed.');
        }

        await commitTransaction(connection);
        connection.release();
        ret = true;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, ex, true);
    }
    return ret;
}

async function _addTicket(connection, ticketID, roundID, address, ticketNums) {
    let ret = false;
    try {
        const query = "INSERT INTO tbl_tickets (ticket_id, round, ticket_nums, address) VALUE(?, ?, ?, ?)";
        const [rows] = await mysqlExecute(connection, query, [ticketID, roundID, ticketNums, address]);
        ret = rows.insertId > 0;
    } catch (err) {
        console.log(err);
    }
    return ret;
}

async function _updateTicketStatus(connection, ticketID, status) {
    let ret = false;
    try {
        const query = "UPDATE tbl_tickets SET status = ? WHERE ticket_id = ?";
        const [rows] = await mysqlExecute(connection, query, [status, ticketID]);
        ret = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }
    return ret;
}

async function claimTicket(ticketID, status, blockNumber) {
    let ret = false;
    let connection = false;
    try {
        connection = await connect();
        await startTransactions(connection);

        if (!await _updateTicketStatus(connection, ticketID, status)) {
            throw new Error('Updating ticket status failed.');
        }

        if (!await _updateStatusValue(connection, CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER, blockNumber)) {
            throw new Error('Updating sync block number failed.');
        }
        await commitTransaction(connection);
        connection.release();
        ret = true;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err, true);
    }
    return ret;
}

async function getTicketsByRound(roundID) {
    let connection = null;
    let res = null;

    try {
        connection = await connect();
        const query = "SELECT * FROM tbl_tickets WHERE round = ?";
        const [rows] = await mysqlExecute(connection, query, [roundID]);
        connection.release();
        res = rows;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err);
    }
    return res;
}

async function _updateTicket(connection, ticket) {
    let res = false;
    try {
        const query = "UPDATE tbl_tickets SET prize = ?, status = ? WHERE ticket_id = ?";

        const [rows] = await mysqlExecute(connection, query, [ticket.prize, ticket.status, ticket.ticket_id]);
        res = rows.affectedRows > 0;
    } catch (err) {
        console.log(err);
    }
    return res;
}

async function claimRoundTickets(tickets, blockNumber) {
    let connection = null;
    let res = null;

    try {
        connection = await connect();
        await startTransactions(connection);

        for (let i in tickets) {
            const ticket = tickets[i];
            if (!await _updateTicket(connection, ticket)) {
                throw new Error('Updating ticket failed.');
            }
        }

        if (!await _updateStatusValue(connection, CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER, blockNumber)) {
            throw new Error()
        }

        await commitTransaction(connection);
        connection.release();
        res = true;
    } catch (err) {
        console.log(err);
        onConnectionErr(connection, err, true);
    }
    return res;
}

module.exports = {
    getTickets,
    getTicketCount,
    getStatusValue,
    updateSyncBlocNumber,
    updateCurrentRoundID,
    addTicket,
    claimTicket,
    getTicketsByRound,
    claimRoundTickets
}