const axios = require('axios');
const bnbBingoDecoder = require('abi-decoder');
const Web3 = require('web3');
const databaseManager = require('./manager/database_manager');
const CONST = require('./common/const');
const BNBBingoABI = require('./contract/BNBBingo.json');
const { text } = require('express');

bnbBingoDecoder.addABI(BNBBingoABI);

async function syncBNBBingo() {
    console.log('Synchronizing BNBBingo started');

    const blockNumber = await databaseManager.getStatusValue(
        CONST.STATUS_KEY.SYNC_BLOCK_NUMBER
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
        console.log('Synchronizing BNBBingo completed');
        return;
    }

    const events = eventData.data.result;

    try {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            const web3 = new Web3(process.env.PROVIDER_URL);
            const tx = await web3.eth.getTransaction(event.transactionHash);

            let result = true;

            switch (event.topics[0]) {
                case CONST.BNBBINGO_EVENT_NAME.START_ROUND:
                    if (!(await databaseManager.updateCurrentRoundID(parseInt(event.topics[1].slice(2)), tx.blockNumber))) {
                        result = false;
                    }
                    roundID = parseInt(event.topics[1].slice(2));
                    break;
                case CONST.BNBBINGO_EVENT_NAME.BUY_TICKET:
                    const ticketID = parseInt(event.topics[2].slice(2));
                    const address = `0x${event.topics[1].slice(26)}`;
                    const decodeData = bnbBingoDecoder.decodeMethod(tx.input);
                    const ticketNums = decodeData.params[0].value;

                    if (!await databaseManager.addTicket(ticketID, roundID, address, JSON.stringify(ticketNums), tx.blockNumber)) {
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
    } catch (ex) {
        console.log(ex);
    }

    console.log('Synchronizing BNBBingo completed');
}

async function syncService() {
    await syncBNBBingo();

    setTimeout(syncService, parseInt(process.env.SYNC_DELAY));
}

module.exports = { syncService }