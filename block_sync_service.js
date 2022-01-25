const axios = require('axios');
const bnbBingoDecoder = require('abi-decoder');
const Web3 = require('web3');
const databaseManager = require('./manager/database_manager');
const helpers = require('./common/helper');
const CONST = require('./common/const');
const BNBBingoABI = require('./contract/BNBBingo.json');
const { text } = require('express');

bnbBingoDecoder.addABI(BNBBingoABI);

async function syncBNBBingoEvents() {
    console.log('Synchronizing BNBBingo Events started');

    const blockNumber = await databaseManager.getStatusValue(
        CONST.STATUS_KEY.SYNC_EVENT_BLOCK_NUMBER
    );

    let roundID = await databaseManager.getStatusValue(
        CONST.STATUS_KEY.CURRENT_ROUND
    );

    let eventURL = process.env.EVENT_URL;
    eventURL = eventURL.replace('CONTRACT_ADDRESS', process.env.BNBBINGO_CONTRACT_ADDRESS);
    eventURL = eventURL.replace('START_BLOCK', `${blockNumber + 1}`);

    let eventData = null;
    try {
        eventData = await axios.get(eventURL);
    } catch (err) {
        console.log(err);
        return;
    }

    if (eventData.data.status !== '1') {
        console.log('Synchronizing BNBBingo Events completed');
        return;
    }

    const events = eventData.data.result;

    try {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            const web3 = new Web3(process.env.PROVIDER_URL);
            const tx = await web3.eth.getTransaction(event.transactionHash);

            let result = true;
            let ticketID = 0;

            switch (event.topics[0]) {
                case CONST.BNBBINGO_EVENT_NAME.START_ROUND:
                    roundID = parseInt(event.topics[1], 16);
                    if (!(await databaseManager.updateCurrentRoundID(roundID, tx.blockNumber))) {
                        result = false;
                    }
                    
                    break;
                case CONST.BNBBINGO_EVENT_NAME.BUY_TICKET:
                    ticketID = parseInt(event.topics[2], 16);
                    const address = `0x${event.topics[1].slice(26)}`;
                    const decodeData = bnbBingoDecoder.decodeMethod(tx.input);
                    const ticketNums = decodeData.params[0].value;

                    if (!await databaseManager.addTicket(ticketID, roundID, address, JSON.stringify(ticketNums), tx.blockNumber)) {
                        result = false;
                    }
                    break;
                case CONST.BNBBINGO_EVENT_NAME.CLAIM_TICKET:
                    ticketID = parseInt(event.topics[1], 16);
                    if (!await databaseManager.claimTicket(ticketID, CONST.TICKET_STATUS.CLAIMED, tx.blockNumber)) {
                        result = false;
                    }
                    break;
                case CONST.BNBBINGO_EVENT_NAME.ROUND_CLAIMED:
                    roundID = parseInt(event.topics[1], 16);

                    let tickets = await databaseManager.getTicketsByRound(roundID);
                    for (let j = 0; j < tickets.length; j++) {
                        try {
                            const ticketPrize = await helpers.getPrizeByTicket(tickets[j].ticket_id);

                            if (ticketPrize === null) {
                                result = false;
                            }

                            tickets[j].prize = ticketPrize;
                            if (ticketPrize === '0') {
                                tickets[j].status = CONST.TICKET_STATUS.NO_PRIZE;
                            } else {
                                tickets[j].status = CONST.TICKET_STATUS.CLAIMABLE;
                            }
                        } catch (err) {
                            console.log(err);
                            result = false;
                            break;
                        }
                    }

                    if (!await databaseManager.claimRoundTickets(tickets, tx.blockNumber)) {
                        result = false;
                    }
                    break;
                default:
                    if (
                        !(await databaseManager.updateSyncBlocNumber(
                            tx.blockNumber
                        ))
                    ) {
                        result = false;
                    }
            }

            if (result === false) {
                throw new Error(
                    `Synchronizing failed. TxHash: ${event.transactionHash}`
                );
            }
        }
    } catch (err) {
        console.log(err);
    }

    console.log('Synchronizing BNBBingo Events completed');
}

async function syncService() {
    await syncBNBBingoEvents();

    setTimeout(syncService, parseInt(process.env.SYNC_DELAY));
}

module.exports = { syncService }