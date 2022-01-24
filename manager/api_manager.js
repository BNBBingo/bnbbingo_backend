const databaseManager = require('./database_manager');

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function responseInvalid(res, logIndex) {
    const ret = {
        result: false,
        msg: 'validation failed!',
    };
    response(ret, res, logIndex);
}

function registerAPIs(app) {
    app.post('/tickets', async (req, res) => {
        const { address, limit, offset } = req.fields;

        if (!address || limit === undefined || offset === undefined) {
            responseInvalid();
            return;
        }

        let ret = {
            data: [],
            total: 0
        }

        try {
            const tickets = await databaseManager.getTickets(address, parseInt(offset), parseInt(limit));
            const total = await databaseManager.getTicketCount(address);

            ret = {
                data: tickets,
                total: total
            };
        } catch (err) {
            console.log(err);
        }
        
        response(ret, res);
    });
}

module.exports = registerAPIs;