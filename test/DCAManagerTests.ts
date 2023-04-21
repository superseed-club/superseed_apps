import { expect } from "chai";
import { ethers }  from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";


describe("DCAManager", function () {

    async function deployDCAManagerFixture() {
         // deploy a DCAMananger contract
        const DCAManager = await ethers.getContractFactory("DCAManager");
        const dcaManager = await DCAManager.deploy("0x1111111254EEB25477B68fb85Ed929f73A960582", "0x1111111254fb6c44bac0bed2854e76f90643097d");
        return dcaManager;
    };

    async function deployMintableERC20Fixture(){
         // deploy a MintableERC20 contract
         const MintableERC20 = await ethers.getContractFactory("MintableERC20");
         const mintableERC20 = await MintableERC20.deploy("token", "tok"); 
         return mintableERC20; 
    }
    

    it("Should have 0 dcaItems", async function () {
      const dcaManager = await loadFixture(deployDCAManagerFixture);
      expect(await dcaManager.getTotalDCAItems()).to.equal(0);
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.getDCAItem(0)).to.be.revertedWith("that item does not exist yet");
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.getDCASwapInfo(0)).to.be.revertedWith("that item does not exist yet");
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.getDCAItemStatus(0)).to.be.revertedWith("that item does not exist yet");
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.performDCA(0,0,'0x')).to.be.revertedWith("that item does not exist yet");
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.resumeDCA(0)).to.be.revertedWith("that item does not exist yet");
    });

    it("Should revert with the right error if the item does not exist", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        await expect(dcaManager.pauseDCA(0)).to.be.revertedWith("that item does not exist yet");
    });

    it("Should have 0 balance when first minted", async function () {
        const [owner] = await ethers.getSigners();

        const token = await loadFixture(deployMintableERC20Fixture);
        expect(await token.balanceOf(owner.address)).to.equal(0);
    });

    it("Should have the correct balance when mint operation is called on the mintable token", async function () {
        const [owner] = await ethers.getSigners();
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await token.mint(owner.address, mintAmount)
        expect(await token.balanceOf(owner.address)).to.equal(mintAmount);
    });

    it("Should have the correct number of dca items", async function () {
        const [owner, otherAccount] = await ethers.getSigners();
        const mintAmount = 1;
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount)
        expect(await dcaManager.getTotalDCAItems()).to.equal(1);
    });

    it("Should have the correct status", async function () {
        const [owner, otherAccount] = await ethers.getSigners();
        const mintAmount = 1;
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount)
        expect(await dcaManager.getDCAItemStatus(0)).to.equal(await dcaManager.getInProgressStatusNum());
    });

    it("Should have the correct status", async function () {
        const mintAmount = 1;
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount)
        expect(await dcaManager.getDCAItemStatus(0)).to.equal(await dcaManager.getInProgressStatusNum());
    });

    it("Should revert with the right error if the balance is not enough to DCA", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount);
        await expect(dcaManager.performDCA(0,0,'0x')).to.be.revertedWith("Not enough balance to DCA");
    });

    it("Should show the paused status if DCA item has been paused", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount);
        await dcaManager.pauseDCA(0);
        expect(await dcaManager.getDCAItemStatus(0)).to.equal(await dcaManager.getPausedStatusNum());
    });

    it("Should show the in progress status if DCA item has been paused and then unpaused", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount);
        await dcaManager.pauseDCA(0);
        await dcaManager.resumeDCA(0);
        expect(await dcaManager.getDCAItemStatus(0)).to.equal(await dcaManager.getInProgressStatusNum());
    });

    it("Should show the in progress status if DCA item hasjust been created", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount);
        expect(await dcaManager.dcaItemInProgress(0)).to.equal(true);
    });

    it("Should revert if DCA item has been paused", async function () {
        const dcaManager = await loadFixture(deployDCAManagerFixture);
        const mintAmount = 1;
        const token = await loadFixture(deployMintableERC20Fixture);
        await dcaManager.createDCA(token.address, mintAmount, token.address, 60, mintAmount);
        await dcaManager.pauseDCA(0);
        const [owner] = await ethers.getSigners();
        await token.mint(owner.address, mintAmount);
        await expect( dcaManager.performDCA(0,0,'0x')).to.be.revertedWith("The DCA Item is not in progress it was either paused or there is not enough balance");
    });
    
    
    
  });