const { DefenderRelayProvider } = require('defender-relay-client/lib/web3');
const Web3 = require('web3');
const axios = require('axios');

const URL_BASE = 'https://api.1inch.io/v5.0/137/'
const token1 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" //matic
const token2 = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" //usdc
const amount = "100000000000000000"
const slippage = 0.1

async function getExpectedReturn(fromToken, toToken, amount, fromAddress){
    
    const oneInchResponse = await axios.get(
        URL_BASE+`swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)//&protocols=${SWAP_SOURCES}`)
        //console.log(URL_BASE+`swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)
    if (oneInchResponse.data){
        return oneInchResponse.data
    }
    else{
        console.warn(`no data returned from getExpectedReturnFunction`)
        console.warn(`swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&allowPartialFill=false`)
    }
}


async function getTotalDCAItems(contract, from){
    const numItems = await contract.methods
    .getTotalDCAItems()
    .call({ from: from });
    return numItems;
}

async function getTokenBalance(web3, from, tokenAddress, holderAddress){
    const erc20ABI = [{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
    const contract = new web3.eth.Contract(erc20ABI, tokenAddress, { from });
    try{
        const balance = await contract.methods.balanceOf(holderAddress).call({from: from});
        return balance;
    }catch(e){
        console.error(e.error);
        return 0;
    }
}

async function getValidDCAItems(web3, numItems, contract, from){
    items = []
    for (let i = 0; i < numItems; i++) {
        let dcaItem = await contract.methods.getDCAItem(i).call({from: from});
        let tokenBalance = await getTokenBalance(web3, from, dcaItem.assetIn, dcaItem.dcaOwner)
        let owner = dcaItem.dcaOwner;
        let frequency = dcaItem.frequency;
        let lastDcaTimestamp = dcaItem.lastDcaTimestamp;
        let blockNumber = await web3.eth.getBlockNumber();
        let blockTimestamp = (await web3.eth.getBlock(blockNumber)).timestamp;
        let currentTimeSeconds = Math.floor(Date.now()/1000);
        let nextValidRunTime = Number(frequency)+Number(lastDcaTimestamp);
        let amountRemaining = dcaItem.amountIn - dcaItem.totalDcaed;
        
        dcaItem.itemID = i;
        //the the item is ready to be DCAed, the status is in progress (0) & the user has enough balance to dca item
        if(
            currentTimeSeconds>=nextValidRunTime 
            && dcaItem.status==0 
            && tokenBalance >= amountRemaining){
                items.push({"itemID":i, "owner":owner});
            }
    }
    console.log(items)
    return items;
}




exports.handler = async function(event) {
  const provider = new DefenderRelayProvider(event, { speed: 'fast' });
  const web3 = new Web3(provider);
  // Use web3 instance for querying or sending txs, for example...
  const ABI = [{"inputs":[{"internalType":"address","name":"routerV5","type":"address"},{"internalType":"address","name":"routerV4","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AGGREGATION_ROUTER_V4","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"AGGREGATION_ROUTER_V5","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"assetIn","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address","name":"assetOut","type":"address"},{"internalType":"uint256","name":"frequency","type":"uint256"},{"internalType":"uint256","name":"dcaAmount","type":"uint256"}],"name":"createDCA","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"dcaItemInProgress","outputs":[{"internalType":"bool","name":"IN_PROGRESS","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"dcaItemInProgress2","outputs":[{"internalType":"bool","name":"IN_PROGRESS","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"decodeV4","outputs":[{"internalType":"address","name":"","type":"address"},{"components":[{"internalType":"contract ERC20","name":"srcToken","type":"address"},{"internalType":"contract ERC20","name":"dstToken","type":"address"},{"internalType":"address","name":"srcReceiver","type":"address"},{"internalType":"address","name":"dstReceiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"minReturnAmount","type":"uint256"},{"internalType":"uint256","name":"flags","type":"uint256"},{"internalType":"bytes","name":"permit","type":"bytes"}],"internalType":"struct DCAManager.SwapDescriptionV4","name":"","type":"tuple"},{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"decodeV5","outputs":[{"internalType":"address","name":"","type":"address"},{"components":[{"internalType":"contract IERC20","name":"srcToken","type":"address"},{"internalType":"contract IERC20","name":"dstToken","type":"address"},{"internalType":"address payable","name":"srcReceiver","type":"address"},{"internalType":"address payable","name":"dstReceiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"minReturnAmount","type":"uint256"},{"internalType":"uint256","name":"flags","type":"uint256"}],"internalType":"struct DCAManager.SwapDescriptionV5","name":"","type":"tuple"},{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCompletedStatusNum","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"getDCAItem","outputs":[{"components":[{"internalType":"address","name":"dcaOwner","type":"address"},{"internalType":"address","name":"assetIn","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address","name":"assetOut","type":"address"},{"internalType":"uint256","name":"frequency","type":"uint256"},{"internalType":"uint256","name":"dcaAmount","type":"uint256"},{"internalType":"uint256","name":"timecreated","type":"uint256"},{"internalType":"uint256","name":"totalDcaed","type":"uint256"},{"internalType":"uint256","name":"lastDcaTimestamp","type":"uint256"},{"internalType":"uint256","name":"itemID","type":"uint256"},{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"internalType":"struct DCAManager.DCAItem","name":"dcaItem","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"getDCAItemStatus","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"getDCASwapInfo","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"fromAddress","type":"address"},{"internalType":"address","name":"toAddress","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"frequency","type":"uint256"},{"internalType":"uint256","name":"lastDcaTimestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getInProgressStatusNum","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getNotEnoughBalanceStatus","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getPausedStatusNum","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getTotalDCAItems","outputs":[{"internalType":"uint256","name":"totalDCAItems","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"numDcaItems","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"pauseDCA","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"},{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"performDCA","outputs":[{"internalType":"uint256","name":"totalDcaed","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"},{"internalType":"address","name":"sender","type":"address"}],"name":"performDCAFake","outputs":[{"internalType":"uint256","name":"totalDcaed","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"resumeDCA","outputs":[{"internalType":"enum DCAManager.Status","name":"status","type":"uint8"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"},{"internalType":"address","name":"_sender","type":"address"}],"name":"swapV4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"},{"internalType":"address","name":"_sender","type":"address"}],"name":"swapV5","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"},{"internalType":"address","name":"_sender","type":"address"}],"name":"swapV5ETH","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  const ADDRESS = '0xf2718665a5c9BCAAB72198465c3037b792134807'
    
  const [from] = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(ABI, ADDRESS, { from });


//   const swapData = await getExpectedReturn(token1, token2, amount, from);
//   console.log(swapData)
    let txs = []
    const numDcaItems = await getTotalDCAItems(contract, from);
    let validItems = await getValidDCAItems(web3, numDcaItems, contract, from);

    for(i in validItems){
        let id = validItems[i].itemID;
        let owner = validItems[i].owner;
        let tx = await contract.methods.performDCAFake(id, owner).send();
        txs.push(tx);
    }
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