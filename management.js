const Web3 = require('web3');
const BNBBingoABI = require('./contract/BNBBingo.json');
const CONST = require('./common/const');
const Tx = require('ethereumjs-tx');

require('dotenv').config();

const argv = process.argv.slice(2);

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL));
const contract = new web3.eth.Contract(BNBBingoABI, process.env.BNBBINGO_CONTRACT_ADDRESS);

let bytesCode = null;
switch(argv[0]) {
    case CONST.MANAGEMENT_COMMAND.START_ROUND:
        bytesCode = contract.methods.startRound().encodeABI();
        break;
    case CONST.MANAGEMENT_COMMAND.STOP_ROUND:
        bytesCode = contract.methods.stopRound().encodeABI();
        break;
    case CONST.MANAGEMENT_COMMAND.CLAIM_ROUND:
        bytesCode = contract.methods.drawClaimableRound().encodeABI();
        break;
    default:
        console.log('Not Registered Command!!!');
        return;
}

if (bytesCode === null) {
    console.log('Data is not ready.');
    return;
}

const gasLimit = 2100000;

var privKey = Buffer.from(process.env.PRIVATE_KEY, 'hex');
const account = web3.eth.accounts.privateKeyToAccount(toHexString(privKey));
web3.eth.getTransactionCount(account.address, 'pending', (err, count) => {
    web3.eth.getGasPrice((err, gasPrice) => {
        if (err) {
            console.log(`Getting GasPrice failed: ${err}`);
            return;
        }
        else {        
            let rawTransaction = {
                "from": account.address,
                "nonce": web3.utils.toHex(count),
                "to": process.env.BNBBINGO_CONTRACT_ADDRESS,
                "gasLimit": web3.utils.toHex(gasLimit),
                "gasPrice": web3.utils.toHex(gasPrice),
                "value": "0x0",
                "data": bytesCode,
                "chainId": parseInt(process.env.CHAIN_ID),		// EIP 155 chainId - mainnet: 56, testnet: 97
            };
    
            const transaction = new Tx(rawTransaction);
            transaction.sign(Buffer.from(account.privateKey.substr(2), 'hex'));
    
            var serializedTransaction = transaction.serialize();
            if (serializedTransaction != null)
            {
                web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
                .on('receipt', function(receipt){
                    console.log(`Receipt: ${receipt.transactionHash}`);
                    return;
                })
                .catch((err) => {
                    console.log(`Sending Signed Transaction failed: ${err.toString()}`);
                    return;
                });
            } else {
                console.log("Serialization failed");
                return;
            }
        }
    });
});

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}