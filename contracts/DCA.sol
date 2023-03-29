//SPDX-License-Identifier: Unlicense
//https://github.com/superfluid-finance/super-examples/tree/main/examples/money-streaming-intro

pragma solidity ^0.8.14;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DCAManager{
    struct DCAItem{
        address dcaOwner;
        address assetIn;
        uint amountIn;
        address assetOut;
        uint frequency;
        uint dcaAmount;
        uint timecreated;
        uint totalDcaed;
        uint lastDcaTimestamp;
    }
    
    struct SwapDescriptionV4 {
        ERC20 srcToken;
        ERC20 dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
        bytes permit;
    }

    struct SwapDescriptionV5 {
        IERC20 srcToken;
        IERC20 dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    address immutable AGGREGATION_ROUTER_V5;
    address immutable AGGREGATION_ROUTER_V4;


    DCAItem [] dcaItems;
    uint numDcaItems = 0;

      constructor(address routerV5, address routerV4) {
        AGGREGATION_ROUTER_V5 = routerV5; //0x1111111254EEB25477B68fb85Ed929f73A960582
        AGGREGATION_ROUTER_V4 = routerV4; //0x1111111254fb6c44bac0bed2854e76f90643097d

    }

    function  createDCA(
        address assetIn,
        uint amountIn,
        address assetOut,
        uint frequency,
        uint dcaAmount
    ) 
    public
    returns (uint) 
    {

        DCAItem memory newDcaItem = DCAItem(
            msg.sender,
            assetIn,
            amountIn,
            assetOut,
            frequency,
            dcaAmount,
            block.timestamp,
            0,
            0
        );

        dcaItems.push(newDcaItem);
        numDcaItems++;
        return numDcaItems;
    }

    function getDCAItem(uint itemID)
    public
    view
    returns (DCAItem memory dcaItem){
        return dcaItems[itemID];
    }

    function getDCASwapInfo(uint itemID) 
    public 
    view 
    returns (
        address owner,
        address fromAddress, 
        address toAddress, 
        uint amount,
        uint frequency
        )
    {

        DCAItem memory dcaItem = dcaItems[itemID];
        

        return (dcaItem.dcaOwner, dcaItem.assetIn, dcaItem.assetOut, dcaItem.dcaAmount, dcaItem.frequency);
    }

    function performDCA(uint itemID, uint minOut, bytes calldata _data) 
    public 
    returns (uint totalDcaed){

        DCAItem memory dcaItem = dcaItems[itemID];

        require(dcaItem.totalDcaed < dcaItem.amountIn, "There is nore more to DCA");
        require(dcaItem.frequency+dcaItem.lastDcaTimestamp < block.timestamp, "That's too fast for the DCA frequency");

        this.swapV5(minOut, _data);

        dcaItem.totalDcaed = dcaItem.totalDcaed + dcaItem.dcaAmount;
        dcaItem.lastDcaTimestamp = block.timestamp;
        dcaItems[itemID] = dcaItem;

        return dcaItem.totalDcaed + dcaItem.dcaAmount;
    }

    function performDCAFake(uint itemID) public returns(uint totalDcaed){
        DCAItem memory dcaItem = dcaItems[itemID];

        require(dcaItem.totalDcaed < dcaItem.amountIn, "There is nore more to DCA");
        require(dcaItem.frequency+dcaItem.lastDcaTimestamp < block.timestamp, "That's too fast for the DCA frequency");


        dcaItem.totalDcaed = dcaItem.totalDcaed + dcaItem.dcaAmount;
        dcaItem.lastDcaTimestamp = block.timestamp;
        dcaItems[itemID] = dcaItem;

        return dcaItem.totalDcaed + dcaItem.dcaAmount;

    }



    

    function swapV4(uint minOut, bytes calldata _data) external {
        //get the function selection, the SwapDescription and other data so that we can get the source token
        (address _c, SwapDescriptionV4 memory desc, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV4, bytes)); 
        
        //once we have the source token, we can transfer if from the account that called the swap method and send it to this smart contract
        IERC20(desc.srcToken).transferFrom(msg.sender, address(this), desc.amount);

        //this smart contract then approves that the aggregation router (1inch) smart contract can perform the swap on the assets
        IERC20(desc.srcToken).approve(AGGREGATION_ROUTER_V4, desc.amount);

        (bool succ, bytes memory _data) = address(AGGREGATION_ROUTER_V4).call(_data);
        if (succ) {
            (uint returnAmount, uint gasLeft) = abi.decode(_data, (uint, uint));
            require(returnAmount >= minOut);
        } else {
            revert();
        }
    }

    function swapV5(uint minOut, bytes calldata _data) external {
        (address _c, SwapDescriptionV5 memory desc, bytes memory permit, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV5, bytes, bytes));

        IERC20(desc.srcToken).transferFrom(msg.sender, address(this), desc.amount);
        IERC20(desc.srcToken).approve(AGGREGATION_ROUTER_V5, desc.amount);

        (bool succ, bytes memory _data) = address(AGGREGATION_ROUTER_V5).call(_data);
        if (succ) {
            (uint returnAmount, uint gasLeft) = abi.decode(_data, (uint, uint));
            require(returnAmount >= minOut);
        } else {
            revert();
        }
    }

    /* the implementation on Ethereum returns spentAmount when the swap completes*/
    function swapV5ETH(uint minOut, bytes calldata _data) external {
        (address _c, SwapDescriptionV5 memory desc, bytes memory permit, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV5, bytes, bytes));

        IERC20(desc.srcToken).transferFrom(msg.sender, address(this), desc.amount);
        IERC20(desc.srcToken).approve(AGGREGATION_ROUTER_V5, desc.amount);

        (bool succ, bytes memory _data) = address(AGGREGATION_ROUTER_V5).call(_data);
        if (succ) {
            (uint returnAmount, uint spentAmount, uint gasLeft) = abi.decode(_data, (uint, uint, uint));
            require(returnAmount >= minOut);
        } else {
            revert();
        }
    }

    //these decode functions were used for debugging data received from the swap API for diff versions of the 1inch API
     function decodeV5(uint minOut, bytes calldata _data) external 
     view
     returns (
        address,
        SwapDescriptionV5 memory,
        bytes memory,
        bytes memory
        )
         {
        (address _c, SwapDescriptionV5 memory desc, bytes memory permit, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV5, bytes, bytes));

        return (_c, desc, permit, _d);
    }

    function decodeV4(uint minOut, bytes calldata _data) external 
     view
     returns (
         address,
          SwapDescriptionV4 memory,
         bytes memory)
         {
        (address _c, SwapDescriptionV4 memory desc, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV4, bytes));

        return (_c, desc, _d);
    }

    
}