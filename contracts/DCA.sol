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
    }
    
    struct SwapDescription {
        ERC20 srcToken;
        ERC20 dstToken;
        address srcReceiver;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
        bytes permit;
    }

    address immutable AGGREGATION_ROUTER_V5;

    DCAItem [] dcaItems;
    uint numDcaItems = 0;

      constructor(address router) {
        AGGREGATION_ROUTER_V5 = router; //0x1111111254EEB25477B68fb85Ed929f73A960582
    }

    function  createDCA(
        address dcaOwner,
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
            dcaOwner,
            assetIn,
            amountIn,
            assetOut,
            frequency,
            dcaAmount,
        block.timestamp);

        dcaItems.push(newDcaItem);
        numDcaItems++;
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
        uint frequency
        )
    {

        DCAItem memory dcaItem = dcaItems[itemID];
        return (dcaItem.dcaOwner, dcaItem.assetIn, dcaItem.assetOut, dcaItem.dcaAmount, dcaItem.frequency);
    }

    

    function swap(uint minOut, bytes calldata _data) external {
        (address _c, SwapDescription memory desc, bytes memory _d) = abi.decode(_data[4:], (address, SwapDescription, bytes));

        ERC20(desc.srcToken).transferFrom(msg.sender, address(this), desc.amount);
        ERC20(desc.srcToken).approve(AGGREGATION_ROUTER_V5, desc.amount);

        (bool succ, bytes memory _data) = address(AGGREGATION_ROUTER_V5).call(_data);
        if (succ) {
            (uint returnAmount, uint gasLeft) = abi.decode(_data, (uint, uint));
            require(returnAmount >= minOut);
        } else {
            revert();
        }
    }

    
}