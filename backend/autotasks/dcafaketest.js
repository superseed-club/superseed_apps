const { DefenderRelayProvider } = require('defender-relay-client/lib/web3');
const Web3 = require('web3');

exports.handler = async function(event) {
  const provider = new DefenderRelayProvider(event, { speed: 'fast' });
  const web3 = new Web3(provider);
  // Use web3 instance for querying or sending txs, for example...
  const ABI = [{"inputs":[{"internalType":"address","name":"routerV5","type":"address"},{"internalType":"address","name":"routerV4","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"assetIn","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address","name":"assetOut","type":"address"},{"internalType":"uint256","name":"frequency","type":"uint256"},{"internalType":"uint256","name":"dcaAmount","type":"uint256"}],"name":"createDCA","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"decodeV4","outputs":[{"internalType":"address","name":"","type":"address"},{"components":[{"internalType":"contract ERC20","name":"srcToken","type":"address"},{"internalType":"contract ERC20","name":"dstToken","type":"address"},{"internalType":"address","name":"srcReceiver","type":"address"},{"internalType":"address","name":"dstReceiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"minReturnAmount","type":"uint256"},{"internalType":"uint256","name":"flags","type":"uint256"},{"internalType":"bytes","name":"permit","type":"bytes"}],"internalType":"struct DCAManager.SwapDescriptionV4","name":"","type":"tuple"},{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"decodeV5","outputs":[{"internalType":"address","name":"","type":"address"},{"components":[{"internalType":"contract IERC20","name":"srcToken","type":"address"},{"internalType":"contract IERC20","name":"dstToken","type":"address"},{"internalType":"address payable","name":"srcReceiver","type":"address"},{"internalType":"address payable","name":"dstReceiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"minReturnAmount","type":"uint256"},{"internalType":"uint256","name":"flags","type":"uint256"}],"internalType":"struct DCAManager.SwapDescriptionV5","name":"","type":"tuple"},{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"getDCAItem","outputs":[{"components":[{"internalType":"address","name":"dcaOwner","type":"address"},{"internalType":"address","name":"assetIn","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address","name":"assetOut","type":"address"},{"internalType":"uint256","name":"frequency","type":"uint256"},{"internalType":"uint256","name":"dcaAmount","type":"uint256"},{"internalType":"uint256","name":"timecreated","type":"uint256"},{"internalType":"uint256","name":"totalDcaed","type":"uint256"},{"internalType":"uint256","name":"lastDcaTimestamp","type":"uint256"}],"internalType":"struct DCAManager.DCAItem","name":"dcaItem","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"}],"name":"getDCASwapInfo","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"fromAddress","type":"address"},{"internalType":"address","name":"toAddress","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"frequency","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"},{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"performDCA","outputs":[{"internalType":"uint256","name":"totalDcaed","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"itemID","type":"uint256"},{"internalType":"address","name":"sender","type":"address"}],"name":"performDCAFake","outputs":[{"internalType":"uint256","name":"totalDcaed","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"swapV4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"swapV5","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minOut","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"swapV5ETH","outputs":[],"stateMutability":"nonpayable","type":"function"}];

	const ADDRESS = '0xB77CDf3f68a5dBFB6512D7231bbaF933871165b1'

  const [from] = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(ABI, ADDRESS, { from });
  await contract.methods.performDCAFake(0, '0x1111111254EEB25477B68fb85Ed929f73A960582').send();
}