const { DefenderRelayProvider } = require('defender-relay-client/lib/web3');
const Web3 = require('web3');
const axios = require('axios');

const URL_BASE = 'https://api.1inch.io/v5.0/137/'
const token1 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" //matic
const token2 = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" //usdc
const amount = "100000000000000000"
const slippage = 0.1

async function getExpectedReturn(fromToken, toToken, amount, fromAddress) {

    const oneInchResponse = await axios.get(
        URL_BASE + `swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)//&protocols=${SWAP_SOURCES}`)
    //console.log(URL_BASE+`swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)
    if (oneInchResponse.data) {
        return oneInchResponse.data
    }
    else {
        console.warn(`no data returned from getExpectedReturnFunction`)
        console.warn(`swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)
    }
}


async function getTotalDCAItems(contract, from) {
    const numItems = await contract.methods
        .getTotalDCAItems()
        .call({ from: from });
    return numItems;
}

async function getValidDCAItems(web3, numItems, contract, from) {
    items = []
    for (let i = 0; i < numItems; i++) {
        let dcaItem = await contract.methods.getDCAItem(i).call({ from: from });
        // console.log(dcaItem);
        let owner = dcaItem.dcaOwner;
        let frequency = dcaItem.frequency;
        let lastDcaTimestamp = dcaItem.lastDcaTimestamp;
        let blockNumber = await web3.eth.getBlockNumber();
        let blockTimestamp = (await web3.eth.getBlock(blockNumber)).timestamp;
        let currentTimeSeconds = Math.floor(Date.now() / 1000);
        let nextRunTime = Number(frequency) + Number(lastDcaTimestamp);
        dcaItem.itemID = i;
        // console.log(dcaItem)
        if (nextRunTime) items.push({ "itemID": i, "owner": owner });
        // console.log(owner, frequency, lastDcaTimestamp, nextRunTime, blockTimestamp, nextRunTime<=Number(blockTimestamp));
    }
    console.log(items)
    return items;
}



exports.handler = async function (event) {
    const provider = new DefenderRelayProvider(event, { speed: 'fast' });
    const web3 = new Web3(provider);
    // Use web3 instance for querying or sending txs, for example...
    const ABI = [{ "inputs": [{ "internalType": "address", "name": "routerV5", "type": "address" }, { "internalType": "address", "name": "routerV4", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "AGGREGATION_ROUTER_V4", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "AGGREGATION_ROUTER_V5", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "assetIn", "type": "address" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "address", "name": "assetOut", "type": "address" }, { "internalType": "uint256", "name": "frequency", "type": "uint256" }, { "internalType": "uint256", "name": "dcaAmount", "type": "uint256" }], "name": "createDCA", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "decodeV4", "outputs": [{ "internalType": "address", "name": "", "type": "address" }, { "components": [{ "internalType": "contract ERC20", "name": "srcToken", "type": "address" }, { "internalType": "contract ERC20", "name": "dstToken", "type": "address" }, { "internalType": "address", "name": "srcReceiver", "type": "address" }, { "internalType": "address", "name": "dstReceiver", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "minReturnAmount", "type": "uint256" }, { "internalType": "uint256", "name": "flags", "type": "uint256" }, { "internalType": "bytes", "name": "permit", "type": "bytes" }], "internalType": "struct DCAManager.SwapDescriptionV4", "name": "", "type": "tuple" }, { "internalType": "bytes", "name": "", "type": "bytes" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "decodeV5", "outputs": [{ "internalType": "address", "name": "", "type": "address" }, { "components": [{ "internalType": "contract IERC20", "name": "srcToken", "type": "address" }, { "internalType": "contract IERC20", "name": "dstToken", "type": "address" }, { "internalType": "address payable", "name": "srcReceiver", "type": "address" }, { "internalType": "address payable", "name": "dstReceiver", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "minReturnAmount", "type": "uint256" }, { "internalType": "uint256", "name": "flags", "type": "uint256" }], "internalType": "struct DCAManager.SwapDescriptionV5", "name": "", "type": "tuple" }, { "internalType": "bytes", "name": "", "type": "bytes" }, { "internalType": "bytes", "name": "", "type": "bytes" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "itemID", "type": "uint256" }], "name": "getDCAItem", "outputs": [{ "components": [{ "internalType": "address", "name": "dcaOwner", "type": "address" }, { "internalType": "address", "name": "assetIn", "type": "address" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "address", "name": "assetOut", "type": "address" }, { "internalType": "uint256", "name": "frequency", "type": "uint256" }, { "internalType": "uint256", "name": "dcaAmount", "type": "uint256" }, { "internalType": "uint256", "name": "timecreated", "type": "uint256" }, { "internalType": "uint256", "name": "totalDcaed", "type": "uint256" }, { "internalType": "uint256", "name": "lastDcaTimestamp", "type": "uint256" }], "internalType": "struct DCAManager.DCAItem", "name": "dcaItem", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "itemID", "type": "uint256" }], "name": "getDCASwapInfo", "outputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "fromAddress", "type": "address" }, { "internalType": "address", "name": "toAddress", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "frequency", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getTotalDCAItems", "outputs": [{ "internalType": "uint256", "name": "totalDCAItems", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "numDcaItems", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "itemID", "type": "uint256" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "performDCA", "outputs": [{ "internalType": "uint256", "name": "totalDcaed", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "itemID", "type": "uint256" }, { "internalType": "address", "name": "sender", "type": "address" }], "name": "performDCAFake", "outputs": [{ "internalType": "uint256", "name": "totalDcaed", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }, { "internalType": "address", "name": "_sender", "type": "address" }], "name": "swapV4", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }, { "internalType": "address", "name": "_sender", "type": "address" }], "name": "swapV5", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }, { "internalType": "address", "name": "_sender", "type": "address" }], "name": "swapV5ETH", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
    const ADDRESS = '0xb6Dc084b3a9513FeFC47d4aFd96B2a51c8e4F869'

    const [from] = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(ABI, ADDRESS, { from });


    //   const swapData = await getExpectedReturn(token1, token2, amount, from);
    //   console.log(swapData)
    let txs = []
    const numDcaItems = await getTotalDCAItems(contract, from);
    let validItems = await getValidDCAItems(web3, numDcaItems, contract, from);
    for (i in validItems) {
        let id = validItems[i].itemID;
        let owner = validItems[i].owner;
        let tx = await contract.methods.performDCAFake(id, owner).send();
        txs.push(tx);
    }
    //TODO 
    // try{
    //     const numDcaItems = await getTotalDCAItems(contract, from);
    //     let validItems = await getValidDCAItems(web3, numDcaItems, contract, from);
    //     for(i in validItems){
    //         let id = validItems[i].itemID;
    //         let owner = validItems[i].owner;
    //         let tx = await contract.methods.performDCAFake(id, owner).send();
    //         txs.push(tx);
    //     }

    // }catch(e){
    //     console.log('method did not execute successfully')
    //     console.log(e)
    //     return e
    // }



    return txs;
}
