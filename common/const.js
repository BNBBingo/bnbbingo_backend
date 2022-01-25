const MYSQL_ERR_NO = {
    CONNECTION_ERROR: -4078,
};

const MANAGEMENT_COMMAND = {
    START_ROUND: "start",
    STOP_ROUND: "stop",
    CLAIM_ROUND: "claim"
};

const STATUS_KEY = {
    SYNC_EVENT_BLOCK_NUMBER: 'sync_evnet_block_number',
    CURRENT_ROUND: 'current_round',
    SYNC_TX_BLOCK_NUMBER: 'sync_tx_block_number',
};

const BNBBINGO_EVENT_NAME = {
    BUY_TICKET: '0x514b117786819ebe4d5d23d26f80ddce47a01a6723c47a747164c2810caf57cb',
    START_ROUND: '0x33a701182892fd888ed152ca2ac23771a32e814469b7cd255965471e1af3a659',
    ROUND_CLAIMED: '0x703b7a9250a9f8209deaec67053addb42393f07bc81e7d1dd8fec68a65ef19f6',
    CLAIM_TICKET: '0x41c019db6162b55d71f92baae2f1bb495022ca3fb83c8fb59e62f3cbb21f638c'
};

const TICKET_STATUS = {
    PURCHASED: 0,
    CLAIMABLE: 1,
    CLAIMED: 2,
    NO_PRIZE: 3
};

module.exports = {
    MYSQL_ERR_NO,
    MANAGEMENT_COMMAND,
    STATUS_KEY,
    BNBBINGO_EVENT_NAME,
    TICKET_STATUS
};