require('dotenv').config()
const axios = require('axios')
const Web3 = require('web3')

//WEB3 Config
//const RPC_URL='https://bsc-dataseed1.ninicoin.io'
const web3 = new Web3(process.env.RPC_URL)
const wallet = web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY_DEV).address
const defaultAccount = '0x9437Fe6385F3551850FD892D471FFbc818CF3116'
const URL_BASE = 'https://api.1inch.io/v5.0/137/'
const slippage = 0.1
const dcaABI = require('../contracts/ABI/DCA.abi.json');


const dcaContractAddress = "0x8576761561f97db184451d381451b3ff97b151a0"


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

async function getDCAItem(itemID){
    dcaContract = new web3.eth.Contract(dcaABI, dcaContractAddress);

    const result = await dcaContract.methods
      .getDCAItem(itemID)
      .call({ from: defaultAccount })
    return result
}

async function performDCA(itemID, minOut, swapData){
    console.log("perform dca")
    dcaContract = new web3.eth.Contract(dcaABI, dcaContractAddress);

    // const gasLimit = await dcaContract.methods
    // .performDCA(itemID, minOut, swapData)
    // .estimateGas({ from: defaultAccount })
    // console.log(gasLimit)

    gasPrice = await web3.eth.getGasPrice()
    console.log(`gas prie ${gasPrice}`)

    console.log(minOut)
    console.log(swapData)

    // const result = await dcaContract.methods
    //   .performDCA(itemID, minOut, swapData)
    //   .send({ 
    //     from: defaultAccount,
    //     gas: 500000,
    //     gasPrice: gasPrice
    //    })
    // console.log(result)
    return result
}

async function createDCAItem(
    assetIn, 
    amountIn,
    assetOut,
    frequency,
    dcaAmount){
    dcaContract = new web3.eth.Contract(dcaABI, dcaContractAddress);

    const gasLimit = await dcaContract.methods
      .createDCA( 
        assetIn, 
        amountIn,
        assetOut,
        frequency,
        dcaAmount)
      .estimateGas({ from: defaultAccount })
      console.log(gasLimit)

      gasPrice = await web3.eth.getGasPrice()
      console.log(`gas prie ${gasPrice}`)

    const result = await dcaContract.methods
      .createDCA( 
        assetIn, 
        amountIn,
        assetOut,
        frequency,
        dcaAmount)
      .send({ 
        from: defaultAccount,
        gas: gasLimit,
        gasPrice: gasPrice
    
        })
      console.log(result)
    return result
}

async function main(){
    // token1 = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" //wmatic
    token1 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    token2 = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" //usdc
    amount = "100000000000000000"

    // swapData = await getExpectedReturn(token1, token2, amount, onBehalfOf);
    // console.log(swapData)

    // const result = await createDCAItem(
    //     token1,
    //     amount,
    //     token2,
    //     86400,
    //     "100000000000000000"
    // )
    // console.log(result)
    // console.log(wallet)
    dcaItem = await getDCAItem(0);
    console.log(dcaItem)

    swapData = await getExpectedReturn(token1, token2, amount, defaultAccount);
    console.log(swapData)

    console.log(0, swapData.toTokenAmount, swapData.tx.data);
    result = await performDCA(0, swapData.toTokenAmount, swapData.tx.data);
    // console.log(result)
}

main();


