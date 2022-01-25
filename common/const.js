const MYSQL_ERR_NO = {
    CONNECTION_ERROR: -4078,
};

const MANAGEMENT_COMMAND = {
    START_ROUND: "start",
    STOP_ROUND: "stop",
    CLAIM_ROUND: "claim"
};

const STATUS_KEY = {
    SYNC_BLOCK_NUMBER: 'sync_block_number',
    CURRENT_ROUND: 'current_round'
};

const BNBBINGO_FUNC_NAME = {
    BUY_TICKET: 'buyTicket',
    START_ROUND: 'startRound'
}

const BNBBINGO_EVENT_NAME = {
    BUY_TICKET: '0x514b117786819ebe4d5d23d26f80ddce47a01a6723c47a747164c2810caf57cb',
    START_ROUND: '0x33a701182892fd888ed152ca2ac23771a32e814469b7cd255965471e1af3a659'
};

module.exports = {
    MYSQL_ERR_NO,
    MANAGEMENT_COMMAND,
    STATUS_KEY,
    BNBBINGO_FUNC_NAME,
    BNBBINGO_EVENT_NAME
};