const Web3 = require('web3');
const BNBBingoABI = require('../contract/BNBBingo.json');

async function getPrizeByTicket(ticketID) {
    let ret = null;
    try {

        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL));
        const contract = new web3.eth.Contract(BNBBingoABI, process.env.BNBBINGO_CONTRACT_ADDRESS);

        ret = await contract.methods.getPrize(ticketID).call();
        ret = web3.utils.fromWei(ret, 'ether');
    } catch (err) {
        console.log(err);
    }
    return ret;
}

module.exports = {
    getPrizeByTicket
}