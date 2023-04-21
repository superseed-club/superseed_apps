//SPDX-License-Identifier: Unlicense
//https://github.com/superfluid-finance/super-examples/tree/main/examples/money-streaming-intro

pragma solidity ^0.8.14;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
TODO
- check item balance and there is no more balance for the dca change the status

*/
contract DCAManager is Ownable{
    enum Status{ IN_PROGRESS, PAUSED, NOT_ENOUGH_BALANCE, COMPLETED }

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
        uint itemID;
        Status status;
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

    address immutable public AGGREGATION_ROUTER_V5;
    address immutable public AGGREGATION_ROUTER_V4;


    DCAItem [] dcaItems;
    uint public numDcaItems = 0;

      constructor(address routerV5, address routerV4) {
        AGGREGATION_ROUTER_V5 = routerV5; //0x1111111254EEB25477B68fb85Ed929f73A960582 polygon mainnet
        AGGREGATION_ROUTER_V4 = routerV4; //0x1111111254fb6c44bac0bed2854e76f90643097d polygon mainnet

    }

    function withdrawToken(address _tokenContract, uint256 _amount) external onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);

        // needs to execute `approve()` on the token contract to allow itself the transfer
        tokenContract.approve(address(this), _amount);

        tokenContract.transferFrom(address(this), owner(), _amount);
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
            0,
            numDcaItems,
            Status.IN_PROGRESS
        );

        dcaItems.push(newDcaItem);
        numDcaItems++;
        return numDcaItems;
    }

    function getDCAItem(uint itemID)
    public
    view
    returns (DCAItem memory dcaItem){
        require(itemID<numDcaItems, "that item does not exist yet");
        return dcaItems[itemID];
    }

    function getTotalDCAItems()
    public
    view
    returns (uint totalDCAItems){
        return numDcaItems;
    }

    function getDCASwapInfo(uint itemID) 
    public 
    view 
    returns (
        address owner,
        address fromAddress, 
        address toAddress, 
        uint amount,
        uint frequency,
        uint lastDcaTimestamp
        )
    {
        require(itemID<numDcaItems, "that item does not exist yet");
        DCAItem memory dcaItem = dcaItems[itemID];
        

        return (dcaItem.dcaOwner, dcaItem.assetIn, dcaItem.assetOut, dcaItem.dcaAmount, dcaItem.frequency, lastDcaTimestamp);
    }

    function getDCAItemStatus(uint itemID) 
    public 
    view 
    returns (
        Status status
        )
    {
        require(itemID<numDcaItems, "that item does not exist yet");
        DCAItem memory dcaItem = dcaItems[itemID];
        return dcaItem.status;
    }

    function getInProgressStatusNum() 
    public 
    pure 
    returns (
        Status status
    )
    {
        return Status.IN_PROGRESS;
    }

    function getPausedStatusNum() 
    public 
    pure 
    returns (
        Status status
        )
    {
        return Status.PAUSED;
    }

    function getNotEnoughBalanceStatus() 
    public 
    pure 
    returns (
        Status status
        )
    {
        return Status.NOT_ENOUGH_BALANCE;
    }

    function getCompletedStatusNum() 
    public 
    pure 
    returns (
        Status status
        )
    {
        return Status.COMPLETED;
    }


    function performDCA(uint itemID, uint minOut, bytes calldata _data) 
    public 
    returns (uint totalDcaed){

        require(itemID<numDcaItems, "that item does not exist yet");

        DCAItem memory dcaItem = dcaItems[itemID];

        require(dcaItem.status!=Status.COMPLETED, "The DCA Item is completed.");

        uint amountRemainingToDCA = dcaItem.amountIn-dcaItem.totalDcaed;
        uint tokenBalance = ERC20(dcaItem.assetIn).balanceOf(dcaItem.dcaOwner);
        if(tokenBalance<amountRemainingToDCA){
            dcaItem.status = Status.NOT_ENOUGH_BALANCE;
            dcaItems[itemID] = dcaItem;
        }
        require(tokenBalance>=amountRemainingToDCA, "Not enough balance to DCA");

        require(dcaItem.status==Status.IN_PROGRESS, "The DCA Item is not in progress it was either paused or there is not enough balance");
        
        require(dcaItem.totalDcaed < dcaItem.amountIn, "There is no more to DCA");
        require(dcaItem.frequency+dcaItem.lastDcaTimestamp < block.timestamp, "That's too fast for the DCA frequency");

        this.swapV5(minOut, _data, dcaItem.dcaOwner); //send the owner of the dca item

        dcaItem.totalDcaed = dcaItem.totalDcaed + dcaItem.dcaAmount;
        dcaItem.lastDcaTimestamp = block.timestamp;
        if(dcaItem.totalDcaed == dcaItem.amountIn){
            dcaItem.status = Status.COMPLETED;
        }
        dcaItems[itemID] = dcaItem;

        return dcaItem.totalDcaed + dcaItem.dcaAmount;
    }
    

    function performDCAFake(uint itemID, address sender) public returns(uint totalDcaed){

        require(itemID<numDcaItems, "that item does not exist yet");

        DCAItem memory dcaItem = dcaItems[itemID];

        require(dcaItem.status!=Status.COMPLETED, "The DCA Item is completed.");

        uint amountRemainingToDCA = dcaItem.amountIn-dcaItem.totalDcaed;
        uint tokenBalance = ERC20(dcaItem.assetIn).balanceOf(dcaItem.dcaOwner);
        if(tokenBalance<amountRemainingToDCA){
            dcaItem.status = Status.NOT_ENOUGH_BALANCE;
            dcaItems[itemID] = dcaItem;
        }
        require(tokenBalance>=amountRemainingToDCA, "Not enough balance to DCA");

        require(dcaItem.status==Status.IN_PROGRESS, "The DCA Item is not in progress it was either paused or there is not enough balance");
        
        require(dcaItem.totalDcaed < dcaItem.amountIn, "There is no more to DCA");
        require(dcaItem.frequency+dcaItem.lastDcaTimestamp < block.timestamp, "That's too fast for the DCA frequency");


        dcaItem.totalDcaed = dcaItem.totalDcaed + dcaItem.dcaAmount;
        dcaItem.lastDcaTimestamp = block.timestamp;
        if(dcaItem.totalDcaed == dcaItem.amountIn){
            dcaItem.status = Status.COMPLETED;
        }
        dcaItems[itemID] = dcaItem;

        return dcaItem.totalDcaed + dcaItem.dcaAmount;

    }

    function pauseDCA(uint itemID)
    public
    returns (Status status)
    {
        require(itemID<numDcaItems, "that item does not exist yet");
        DCAItem memory dcaItem = dcaItems[itemID];
        require(dcaItem.dcaOwner==tx.origin, "you are not the owner of this DCA Item");

        dcaItem.status = Status.PAUSED;
        dcaItems[itemID] = dcaItem;
        return dcaItems[itemID].status;
    }

    function resumeDCA(uint itemID)
    public
    returns (Status status)
    {
        require(itemID<numDcaItems, "that item does not exist yet");
        DCAItem memory dcaItem = dcaItems[itemID];
        require(dcaItem.dcaOwner == tx.origin, "you cannot start another wallet's DCA");

        dcaItem.status = Status.IN_PROGRESS;
        dcaItems[itemID] = dcaItem;
        return dcaItems[itemID].status;
    }

    function dcaItemInProgress(uint itemID)
    public
    view
    returns (bool IN_PROGRESS){
        return (dcaItems[itemID].status==Status.IN_PROGRESS);
    }


function dcaItemInProgress2(uint itemID)
    public
    view
    returns (bool IN_PROGRESS){
        return uint(dcaItems[itemID].status)==uint(Status.IN_PROGRESS);
    }

    

    function swapV4(uint minOut, bytes calldata _data, address _sender) external {
        //get the function selection, the SwapDescription and other data so that we can get the source token
        (address _c, SwapDescriptionV4 memory desc, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV4, bytes)); 
        
        //once we have the source token, we can transfer if from the account that called the swap method and send it to this smart contract
        IERC20(desc.srcToken).transferFrom(_sender, address(this), desc.amount);

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

    

    function swapV5(uint minOut, bytes calldata _data, address _sender) external {
        (address _c, SwapDescriptionV5 memory desc, bytes memory permit, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV5, bytes, bytes));

        IERC20(desc.srcToken).transferFrom(_sender, address(this), desc.amount);
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
    function swapV5ETH(uint minOut, bytes calldata _data, address _sender) external {
        (address _c, SwapDescriptionV5 memory desc, bytes memory permit, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescriptionV5, bytes, bytes));

        IERC20(desc.srcToken).transferFrom(_sender, address(this), desc.amount);
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